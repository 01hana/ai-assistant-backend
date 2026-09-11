import { ConnectorBindingService, type BindingHandleLifecycle } from '../../src/bindings/connector-binding.service';
import { InMemoryConnectorBindingStore } from '../../src/bindings/in-memory-connector-binding.store';

describe('connector binding lease, revocation, cleanup, and restart lifecycle', () => {
  it('permits four concurrent leases, rejects the fifth, and releases all leases in finally', async () => {
    const fixture = createFixture();
    const minted = await fixture.service.mint(bindingInput());
    expect(minted.ok).toBe(true);
    if (!minted.ok) return;
    const releases: Array<() => void> = [];
    const leases = Array.from({ length: 4 }, () => fixture.service.withLease(
      minted.value.connectorContextRef,
      expectation(),
      async () => new Promise<string>((resolve) => releases.push(() => resolve('done')))
    ));
    await waitFor(() => releases.length === 4);

    await expect(fixture.service.withLease(
      minted.value.connectorContextRef, expectation(), async () => 'fifth'
    )).resolves.toEqual({ ok: false, code: 'CONNECTOR_BINDING_BUSY' });
    releases.forEach((release) => release());
    await expect(Promise.all(leases)).resolves.toEqual(Array(4).fill({ ok: true, value: 'done' }));
    await expect(fixture.service.withLease(
      minted.value.connectorContextRef, expectation(), async () => 'after-release'
    )).resolves.toEqual({ ok: true, value: 'after-release' });
  });

  it('releases a lease when trusted work throws', async () => {
    const fixture = createFixture();
    const minted = await fixture.service.mint(bindingInput());
    if (!minted.ok) throw new Error('fixture mint failed');

    await expect(fixture.service.withLease(minted.value.connectorContextRef, expectation(), async () => {
      throw new Error('fixture downstream failure');
    })).rejects.toThrow('fixture downstream failure');
    await expect(fixture.service.withLease(
      minted.value.connectorContextRef, expectation(), async () => 'released'
    )).resolves.toEqual({ ok: true, value: 'released' });
  });

  it.each(['administrative', 'provider_rejected'] as const)('makes %s revocation immediately inaccessible, aborts leases, and awaits handle teardown', async (reason) => {
    const fixture = createFixture();
    const minted = await fixture.service.mint(bindingInput());
    if (!minted.ok) throw new Error('fixture mint failed');
    let observedSignal: AbortSignal | undefined;
    let releaseWork: (() => void) | undefined;
    const work = fixture.service.withLease(minted.value.connectorContextRef, expectation(), async (_view, signal) => {
      observedSignal = signal;
      return new Promise<void>((resolve) => { releaseWork = resolve; });
    });
    await waitFor(() => observedSignal !== undefined);

    await expect(fixture.service.revoke(minted.value.connectorContextRef, reason)).resolves.toEqual({ ok: true, value: undefined });
    expect(observedSignal?.aborted).toBe(true);
    expect(fixture.handles.revoke).toHaveBeenCalledTimes(1);
    expect(fixture.handles.revoke).toHaveBeenCalledWith(expect.objectContaining({ opaqueCredentialHandle: 'opaque-handle-a' }), reason);
    await expect(fixture.service.resolve(minted.value.connectorContextRef, expectation())).resolves.toEqual({
      ok: false, code: 'CONNECTOR_BINDING_INVALID'
    });
    releaseWork?.();
    await work;
  });

  it('sweeps only the configured batch, tears down expired handles, and rotates through the store', async () => {
    const fixture = createFixture({ sweepBatchSize: 2 });
    for (let index = 0; index < 5; index += 1) {
      const minted = await fixture.service.mint(bindingInput({
        trustedContext: { ...bindingInput().trustedContext, connectorInstanceId: `connector-${index}` },
        opaqueCredentialHandle: `opaque-handle-${index}`
      }));
      expect(minted.ok).toBe(true);
    }
    fixture.setNow(1_800_000_061);

    await expect(fixture.service.sweepExpired()).resolves.toBe(2);
    expect(fixture.handles.revoke).toHaveBeenCalledTimes(2);
    await expect(fixture.service.sweepExpired()).resolves.toBe(2);
    await expect(fixture.service.sweepExpired()).resolves.toBe(1);
    expect(fixture.handles.revoke).toHaveBeenCalledTimes(5);
  });

  it('performs bounded opportunistic expiry cleanup before enforcing mint capacity', async () => {
    const fixture = createFixture({ maxEntries: 1, scopeMaxEntries: 1, sweepBatchSize: 1 });
    const first = await fixture.service.mint(bindingInput());
    expect(first.ok).toBe(true);
    fixture.setNow(1_800_000_061);

    await expect(fixture.service.mint(bindingInput({
      trustedContext: { ...bindingInput().trustedContext, connectorInstanceId: 'connector-after-expiry' },
      opaqueCredentialHandle: 'opaque-handle-after-expiry'
    }))).resolves.toMatchObject({ ok: true });
    expect(fixture.handles.revoke).toHaveBeenCalledWith(expect.objectContaining({ opaqueCredentialHandle: 'opaque-handle-a' }), 'expired');
  });

  it('tears down the superseded provider handle while keeping only the reminted generation active', async () => {
    const fixture = createFixture();
    const first = await fixture.service.mint(bindingInput());
    const second = await fixture.service.mint(bindingInput({
      opaqueCredentialHandle: 'opaque-handle-b', credentialGeneration: 'credential-generation-b'
    }));
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;

    expect(fixture.handles.revoke).toHaveBeenCalledTimes(1);
    expect(fixture.handles.revoke).toHaveBeenCalledWith(
      expect.objectContaining({ opaqueCredentialHandle: 'opaque-handle-a', bindingGeneration: first.value.bindingGeneration }),
      'generation_replaced'
    );
    await expect(fixture.service.resolve(first.value.connectorContextRef, expectation())).resolves.toEqual({
      ok: false, code: 'CONNECTOR_BINDING_INVALID'
    });
    await expect(fixture.service.resolve(second.value.connectorContextRef, {
      ...expectation(), credentialGeneration: 'credential-generation-b', bindingGeneration: second.value.bindingGeneration
    })).resolves.toMatchObject({ ok: true, value: { opaqueCredentialHandle: 'opaque-handle-b' } });
    expect(fixture.handles.revoke).not.toHaveBeenCalledWith(
      expect.objectContaining({ opaqueCredentialHandle: 'opaque-handle-b' }), expect.anything()
    );
  });

  it('tears down every handle on shutdown and a fresh process cannot resolve an old reference', async () => {
    const fixture = createFixture();
    const first = await fixture.service.mint(bindingInput());
    const second = await fixture.service.mint(bindingInput({
      trustedContext: { ...bindingInput().trustedContext, connectorInstanceId: 'connector-b' },
      opaqueCredentialHandle: 'opaque-handle-b'
    }));
    if (!first.ok || !second.ok) throw new Error('fixture mint failed');

    await fixture.service.shutdown();
    expect(fixture.handles.revoke).toHaveBeenCalledTimes(2);
    await expect(fixture.service.resolve(first.value.connectorContextRef, expectation())).resolves.toEqual({
      ok: false, code: 'CONNECTOR_BINDING_INVALID'
    });
    const fresh = createFixture();
    await expect(fresh.service.resolve(first.value.connectorContextRef, expectation())).resolves.toEqual({
      ok: false, code: 'CONNECTOR_BINDING_INVALID'
    });
  });
});

function createFixture(overrides: Partial<{ maxEntries: number; scopeMaxEntries: number; sweepBatchSize: number }> = {}) {
  let now = 1_800_000_000;
  let fill = 0x30;
  const store = new InMemoryConnectorBindingStore(
    { maxEntries: 4_096, scopeMaxEntries: 64, sweepBatchSize: 128, ...overrides },
    { nowSeconds: () => now, randomBytes: (size) => Buffer.alloc(size, ++fill) }
  );
  const handles: BindingHandleLifecycle = { revoke: jest.fn(async () => undefined) };
  return { store, handles, service: new ConnectorBindingService(store, handles), setNow: (value: number) => { now = value; } };
}

async function waitFor(predicate: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 20 && !predicate(); attempt += 1) await Promise.resolve();
  expect(predicate()).toBe(true);
}

function expectation() {
  return {
    trustedContext: bindingInput().trustedContext,
    bootstrapProviderKey: 'bootstrap-provider-a',
    credentialProviderKey: 'credential-provider-a'
  };
}

function bindingInput(overrides: Record<string, unknown> = {}) {
  return {
    trustedContext: {
      customerId: 'customer-a', integrationId: 'integration-a', hostApp: 'host-a',
      connectorInstanceId: 'connector-a', organizationId: 'organization-a', actorId: 'actor-a'
    },
    bootstrapProviderKey: 'bootstrap-provider-a',
    credentialProviderKey: 'credential-provider-a',
    opaqueCredentialHandle: 'opaque-handle-a',
    credentialGeneration: 'credential-generation-a',
    providerMetadata: { sessionClass: 'fixture' },
    ...overrides
  };
}
