import {
  CONNECTOR_BINDING_MAX_RESPONSE_BYTES,
  parseConnectorBindingBootstrapRequestV1,
  parseConnectorBindingBootstrapResponseV1,
  type BindingBootstrapProfileContract
} from '../../src';

const encoder = new TextEncoder();
type FixturePayload = Readonly<{ bootstrapCode: string }>;

const profile: BindingBootstrapProfileContract<'fixture-bootstrap-v1', FixturePayload> = {
  profileKey: 'fixture-bootstrap-v1',
  maxProviderPayloadBytes: 128,
  parseProviderPayload(value: unknown) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return { ok: false, code: 'CONNECTOR_REQUEST_INVALID' };
    const entries = Object.entries(value);
    if (entries.length !== 1 || entries[0]?.[0] !== 'bootstrapCode' || typeof entries[0][1] !== 'string') {
      return { ok: false, code: 'CONNECTOR_REQUEST_INVALID' };
    }
    return { ok: true, value: Object.freeze({ bootstrapCode: entries[0][1] }) };
  }
};

function request(overrides: object = {}): Uint8Array {
  return encoder.encode(JSON.stringify({
    version: '1',
    requestId: '76439084-9a9e-4981-9cd7-2e71e822fe28',
    bootstrapProfileKey: 'fixture-bootstrap-v1',
    trustedContext: {
      customerId: 'customer-b',
      integrationId: 'inventory-b',
      hostApp: 'customer-b-inventory',
      connectorInstanceId: 'customer-b-inventory-connector-1',
      organizationId: 'org-1',
      actorId: 'actor-1'
    },
    providerPayload: { bootstrapCode: 'opaque-input' },
    ...overrides
  }));
}

describe('Connector binding bootstrap V1 wire contract', () => {
  const requestId = '76439084-9a9e-4981-9cd7-2e71e822fe28';
  it('dispatches the bounded provider payload only through the expected profile', () => {
    const parsed = parseConnectorBindingBootstrapRequestV1(request(), profile);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.bootstrapProfileKey).toBe('fixture-bootstrap-v1');
    expect(parsed.value.providerPayload).toEqual({ bootstrapCode: 'opaque-input' });
    expect(Object.isFrozen(parsed.value)).toBe(true);
  });

  it('rejects cross-profile requests before provider dispatch', () => {
    let calls = 0;
    const guardedProfile = { ...profile, parseProviderPayload(value: unknown) { calls += 1; return profile.parseProviderPayload(value); } };
    expect(parseConnectorBindingBootstrapRequestV1(request({ bootstrapProfileKey: 'other-profile' }), guardedProfile).ok).toBe(false);
    expect(calls).toBe(0);
  });

  it.each([
    ['central proof', { centralServiceProof: 'jwt' }],
    ['Feature 007 user token', { userToken: 'jwt' }],
    ['native credential field', { nativeAccessToken: 'secret' }],
    ['destination', { url: 'https://attacker.invalid' }]
  ])('rejects %s in the generic envelope', (_label, field) => {
    expect(parseConnectorBindingBootstrapRequestV1(request(field), profile).ok).toBe(false);
  });

  it('enforces the exact provider payload schema and configured byte bound', () => {
    expect(parseConnectorBindingBootstrapRequestV1(request({ providerPayload: { wrong: true } }), profile).ok).toBe(false);
    expect(parseConnectorBindingBootstrapRequestV1(request({ providerPayload: { bootstrapCode: 'x'.repeat(200) } }), profile).ok).toBe(false);
  });

  it('accepts only an opaque bounded reference response or code-only failure', () => {
    const success = encoder.encode(JSON.stringify({
      version: '1', requestId: '76439084-9a9e-4981-9cd7-2e71e822fe28', connectorContextRef: 'ccr_abcdefghijklmnopqrstuvwxyz012345', expiresIn: 120
    }));
    const failure = encoder.encode(JSON.stringify({
      version: '1', requestId: '76439084-9a9e-4981-9cd7-2e71e822fe28', status: 'failed', error: { code: 'CONNECTOR_AUTH_FAILED' }
    }));
    expect(parseConnectorBindingBootstrapResponseV1(success, requestId).ok).toBe(true);
    expect(parseConnectorBindingBootstrapResponseV1(failure, requestId).ok).toBe(true);
    expect(parseConnectorBindingBootstrapResponseV1(success, 'different-request').ok).toBe(false);
    expect(parseConnectorBindingBootstrapResponseV1(encoder.encode(JSON.stringify({
      version: '1', requestId: '76439084-9a9e-4981-9cd7-2e71e822fe28', connectorContextRef: 'secret', expiresIn: 120
    })), requestId).ok).toBe(false);
    expect(parseConnectorBindingBootstrapResponseV1(new Uint8Array(CONNECTOR_BINDING_MAX_RESPONSE_BYTES + 1), requestId).ok).toBe(false);
  });
});
