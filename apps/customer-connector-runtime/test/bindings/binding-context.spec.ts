import { ConnectorBindingService } from '../../src/bindings/connector-binding.service';
import { InMemoryConnectorBindingStore } from '../../src/bindings/in-memory-connector-binding.store';

describe('connector binding exact context and generation resolution', () => {
  const now = 1_800_000_000;

  it.each([
    ['customer', { customerId: 'customer-b' }],
    ['integration', { integrationId: 'integration-b' }],
    ['host app', { hostApp: 'host-b' }],
    ['connector instance', { connectorInstanceId: 'connector-b' }],
    ['organization', { organizationId: 'organization-b' }],
    ['actor', { actorId: 'actor-b' }]
  ])('rejects a %s mismatch without revealing whether the reference exists', async (_label, contextOverride) => {
    const service = createService();
    const minted = await service.mint(bindingInput());
    expect(minted.ok).toBe(true);
    if (!minted.ok) return;

    await expect(service.resolve(minted.value.connectorContextRef, expectation({
      trustedContext: { ...bindingInput().trustedContext, ...contextOverride }
    }))).resolves.toEqual({ ok: false, code: 'CONNECTOR_BINDING_INVALID' });
  });

  it('rejects bootstrap-provider, credential-provider, binding-generation, and credential-generation mismatches', async () => {
    const service = createService();
    const minted = await service.mint(bindingInput());
    expect(minted.ok).toBe(true);
    if (!minted.ok) return;

    const mismatches = [
      expectation({ bootstrapProviderKey: 'bootstrap-provider-b' }),
      expectation({ credentialProviderKey: 'credential-provider-b' }),
      expectation({ bindingGeneration: minted.value.bindingGeneration + 1 }),
      expectation({ credentialGeneration: 'credential-generation-b' })
    ];
    for (const mismatch of mismatches) {
      await expect(service.resolve(minted.value.connectorContextRef, mismatch)).resolves.toEqual({
        ok: false, code: 'CONNECTOR_BINDING_INVALID'
      });
    }
  });

  it.each(['organizationId', 'actorId'] as const)(
    'rejects when the binding requires %s but the resolution expectation omits it',
    async (constraint) => {
      const service = createService();
      const minted = await service.mint(bindingInput());
      expect(minted.ok).toBe(true);
      if (!minted.ok) return;
      const context = { ...bindingInput().trustedContext };
      delete context[constraint];

      await expect(service.resolve(minted.value.connectorContextRef, expectation({ trustedContext: context }))).resolves.toEqual({
        ok: false, code: 'CONNECTOR_BINDING_INVALID'
      });
    }
  );

  it.each(['organizationId', 'actorId'] as const)(
    'rejects when the binding omits %s but the resolution expectation adds it',
    async (constraint) => {
      const service = createService();
      const storedContext = { ...bindingInput().trustedContext };
      delete storedContext[constraint];
      const minted = await service.mint(bindingInput({ trustedContext: storedContext }));
      expect(minted.ok).toBe(true);
      if (!minted.ok) return;

      await expect(service.resolve(minted.value.connectorContextRef, expectation())).resolves.toEqual({
        ok: false, code: 'CONNECTOR_BINDING_INVALID'
      });
    }
  );

  it('does not collide identical subordinate identifiers across Customers', async () => {
    const service = createService();
    const first = await service.mint(bindingInput());
    const second = await service.mint(bindingInput({ trustedContext: { ...bindingInput().trustedContext, customerId: 'customer-b' } }));
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;

    await expect(service.resolve(first.value.connectorContextRef, expectation())).resolves.toMatchObject({ ok: true });
    await expect(service.resolve(second.value.connectorContextRef, expectation({
      trustedContext: { ...bindingInput().trustedContext, customerId: 'customer-b' }
    }))).resolves.toMatchObject({ ok: true });
  });

  it('atomically replaces one tuple generation so the stale reference is never leasable', async () => {
    const service = createService();
    const first = await service.mint(bindingInput());
    const second = await service.mint(bindingInput({
      opaqueCredentialHandle: 'opaque-handle-b', credentialGeneration: 'credential-generation-b'
    }));
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(second.value.bindingGeneration).toBe(first.value.bindingGeneration + 1);

    await expect(service.resolve(first.value.connectorContextRef, expectation())).resolves.toEqual({
      ok: false, code: 'CONNECTOR_BINDING_INVALID'
    });
    await expect(service.resolve(second.value.connectorContextRef, expectation({
      bindingGeneration: second.value.bindingGeneration,
      credentialGeneration: 'credential-generation-b'
    }))).resolves.toMatchObject({
      ok: true,
      value: { opaqueCredentialHandle: 'opaque-handle-b', bindingGeneration: second.value.bindingGeneration }
    });
  });
});

function createService() {
  let fill = 0x40;
  const store = new InMemoryConnectorBindingStore(
    { maxEntries: 4_096, scopeMaxEntries: 64, sweepBatchSize: 128 },
    { nowSeconds: () => 1_800_000_000, randomBytes: (size) => Buffer.alloc(size, ++fill) }
  );
  return new ConnectorBindingService(store);
}

function expectation(overrides: Record<string, unknown> = {}) {
  return {
    trustedContext: bindingInput().trustedContext,
    bootstrapProviderKey: 'bootstrap-provider-a',
    credentialProviderKey: 'credential-provider-a',
    ...overrides
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
