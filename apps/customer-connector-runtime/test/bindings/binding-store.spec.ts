import { createHash } from 'node:crypto';
import { InMemoryConnectorBindingStore } from '../../src/bindings/in-memory-connector-binding.store';

describe('volatile connector binding store', () => {
  const now = 1_800_000_000;

  it('returns a 256-bit ccr reference once and stores only its SHA-256 verifier', () => {
    const random = Buffer.alloc(32, 0x5a);
    const store = createStore(() => random);
    const minted = store.mint(bindingInput());

    expect(minted.ok).toBe(true);
    if (!minted.ok) return;
    expect(minted.value.connectorContextRef).toMatch(/^ccr_[A-Za-z0-9_-]{43}$/);
    expect(Buffer.from(minted.value.connectorContextRef.slice(4), 'base64url')).toHaveLength(32);

    const records = (store as unknown as { records: Map<string, unknown> }).records;
    const keys = [...records.keys()];
    expect(keys).toEqual([
      createHash('sha256').update(minted.value.connectorContextRef).digest('base64url')
    ]);
    expect(JSON.stringify([...records.entries()])).not.toContain(minted.value.connectorContextRef);
  });

  it('caps provider expiry at 120 seconds and subtracts the 15-second safety window', () => {
    const maximum = createStore().mint(bindingInput({ providerExpiresAt: now + 1_000 }));
    const providerCapped = createStore().mint(bindingInput({ providerExpiresAt: now + 75 }));

    expect(maximum).toMatchObject({ ok: true, value: { expiresAt: now + 120, expiresIn: 120 } });
    expect(providerCapped).toMatchObject({ ok: true, value: { expiresAt: now + 60, expiresIn: 60 } });
  });

  it('uses the 60-second fallback and rejects less than 15 useful seconds', () => {
    expect(createStore().mint(bindingInput())).toMatchObject({
      ok: true, value: { expiresAt: now + 60, expiresIn: 60 }
    });
    expect(createStore().mint(bindingInput({ providerExpiresAt: now + 29 }))).toEqual({
      ok: false, code: 'CONNECTOR_BINDING_INVALID'
    });
    expect(createStore().mint(bindingInput({ providerExpiresAt: now + 30 }))).toMatchObject({
      ok: true, value: { expiresIn: 15 }
    });
  });

  it('fails closed on invalid provider time, metadata, handle, or generation without parsing JWTs', () => {
    expect(createStore().mint(bindingInput({ providerExpiresAt: Number.NaN }))).toEqual({ ok: false, code: 'CONNECTOR_BINDING_INVALID' });
    expect(createStore().mint(bindingInput({ opaqueCredentialHandle: '' }))).toEqual({ ok: false, code: 'CONNECTOR_BINDING_INVALID' });
    expect(createStore().mint(bindingInput({ credentialGeneration: '' }))).toEqual({ ok: false, code: 'CONNECTOR_BINDING_INVALID' });
    expect(createStore().mint(bindingInput({ providerMetadata: { value: 'x'.repeat(4_097) } }))).toEqual({ ok: false, code: 'CONNECTOR_BINDING_INVALID' });
  });
});

function createStore(randomBytes: (size: number) => Uint8Array = (size) => Buffer.alloc(size, 0x41)) {
  return new InMemoryConnectorBindingStore(
    { maxEntries: 4_096, scopeMaxEntries: 64, sweepBatchSize: 128 },
    { nowSeconds: () => 1_800_000_000, randomBytes }
  );
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
