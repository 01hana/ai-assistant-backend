import {
  parseBindingBootstrapServiceProofV1,
  parseCentralInvocationServiceProofV1,
  type BindingBootstrapServiceProfileV1,
  type CentralInvocationServiceProfileV1
} from '../../src';

const centralProfile: CentralInvocationServiceProfileV1 = Object.freeze({
  kind: 'central-invocation',
  profileKey: 'central-invocation-v1',
  typ: 'assistant-connector-service+jwt',
  issuer: 'urn:central:connector',
  subject: 'central-adapter',
  audience: 'urn:assistant:connector:customer-b:inventory-b:customer-b-inventory-connector-1',
  keyDomain: 'central-connector-signing',
  acceptedKids: Object.freeze(['central-key-1'])
});

const referenceBridgeProfile: BindingBootstrapServiceProfileV1 = Object.freeze({
  kind: 'binding-bootstrap', profileKey: 'reference-bridge-bootstrap-v1', providerKey: 'reference-provider-v1',
  typ: 'assistant-connector-binding+jwt', issuer: 'urn:reference:bridge', subject: 'reference-bridge',
  audience: 'urn:connector-binding:reference', keyDomain: 'reference-bridge-signing', acceptedKids: Object.freeze(['bridge-key-1'])
});

const customerBProfile: BindingBootstrapServiceProfileV1 = Object.freeze({
  kind: 'binding-bootstrap', profileKey: 'customer-b-bootstrap-v1', providerKey: 'customer-b-fixture-provider-v1',
  typ: 'customer-bootstrap+jwt', issuer: 'urn:customer-b:bootstrap', subject: 'customer-b-bootstrapper',
  audience: 'urn:connector-binding:customer-b', keyDomain: 'customer-b-bootstrap-signing', acceptedKids: Object.freeze(['customer-b-key-1'])
});

const baseClaims = {
  iat: 1_800_000_000,
  nbf: 1_800_000_000,
  exp: 1_800_000_030,
  jti: '21ac1822-0827-4d6b-a5d8-cabb379a892a',
  proof_version: 1,
  request_id: '5a8271fb-1127-421c-83eb-3dc6b512db50',
  body_sha256: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
} as const;

const contextClaims = {
  customer_id: 'customer-b', integration_id: 'inventory-b', host_app: 'customer-b-inventory',
  connector_instance_id: 'customer-b-inventory-connector-1'
} as const;

function centralProof(overrides: object = {}) {
  return {
    protectedHeader: { alg: 'RS256', kid: 'central-key-1', typ: centralProfile.typ },
    claims: {
      ...baseClaims, iss: centralProfile.issuer, sub: centralProfile.subject, aud: centralProfile.audience,
      ...contextClaims, connector_key: 'inventory', operation: 'inventory.stock-on-hand', operation_version: '1.0.0',
      ...overrides
    }
  };
}

function bootstrapProof(profile: BindingBootstrapServiceProfileV1, overrides: object = {}) {
  return {
    protectedHeader: { alg: 'RS256', kid: profile.acceptedKids[0], typ: profile.typ },
    claims: {
      ...baseClaims, iss: profile.issuer, sub: profile.subject, aud: profile.audience,
      ...contextClaims, bootstrap_profile_key: profile.profileKey, provider_key: profile.providerKey,
      ...overrides
    }
  };
}

describe('Service proof V1 contracts', () => {
  it('accepts the exact central profile and freezes the claims', () => {
    const parsed = parseCentralInvocationServiceProofV1(centralProof(), centralProfile);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(Object.isFrozen(parsed.value.claims)).toBe(true);
  });

  it('accepts two distinct registered bootstrap profiles', () => {
    expect(parseBindingBootstrapServiceProofV1(bootstrapProof(referenceBridgeProfile), referenceBridgeProfile).ok).toBe(true);
    expect(parseBindingBootstrapServiceProofV1(bootstrapProof(customerBProfile), customerBProfile).ok).toBe(true);
  });

  it('does not cross-accept central and bootstrap profiles', () => {
    expect(parseBindingBootstrapServiceProofV1(centralProof(), referenceBridgeProfile).ok).toBe(false);
    expect(parseCentralInvocationServiceProofV1(bootstrapProof(referenceBridgeProfile), centralProfile).ok).toBe(false);
  });

  it('does not cross-accept bootstrap provider, issuer, audience, typ, or kid domains', () => {
    expect(parseBindingBootstrapServiceProofV1(bootstrapProof(referenceBridgeProfile), customerBProfile).ok).toBe(false);
    expect(parseBindingBootstrapServiceProofV1(bootstrapProof(referenceBridgeProfile, { provider_key: customerBProfile.providerKey }), referenceBridgeProfile).ok).toBe(false);
    const wrongHeader = bootstrapProof(referenceBridgeProfile);
    wrongHeader.protectedHeader.kid = 'customer-b-key-1';
    expect(parseBindingBootstrapServiceProofV1(wrongHeader, referenceBridgeProfile).ok).toBe(false);
  });

  it.each([
    ['algorithm', { protectedHeader: { alg: 'HS256', kid: 'central-key-1', typ: centralProfile.typ } }],
    ['unknown header', { protectedHeader: { alg: 'RS256', kid: 'central-key-1', typ: centralProfile.typ, url: 'unsafe' } }],
    ['expiry', { claims: { ...centralProof().claims, exp: baseClaims.iat + 31 } }],
    ['digest', { claims: { ...centralProof().claims, body_sha256: 'not-a-digest' } }],
    ['jti', { claims: { ...centralProof().claims, jti: 'not-a-uuid' } }],
    ['unknown claim', { claims: { ...centralProof().claims, credential: 'secret' } }]
  ])('rejects invalid %s', (_label, replacement) => {
    const proof = centralProof();
    expect(parseCentralInvocationServiceProofV1({ ...proof, ...replacement }, centralProfile).ok).toBe(false);
  });
});
