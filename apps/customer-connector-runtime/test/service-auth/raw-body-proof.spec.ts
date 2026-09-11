import { parseConnectorBindingBootstrapRequestV1 } from '@internal-ai-assistant/connector-runtime-contract';
import { ExactRawBodyAuthenticator } from '../../src/service-auth/exact-raw-body.authenticator';
import { ReplayProtectionService } from '../../src/replay/replay-protection.service';
import { RuntimeServiceProfileRegistry } from '../../src/service-auth/service-profile.registry';
import { ConnectorServiceProofVerifier } from '../../src/service-auth/service-proof.verifier';
import { bodyDigest, rawBody, serviceProofFixtureSet, signServiceProof } from '../fixtures/service-proof-fixtures';

describe('exact raw-body service authentication', () => {
  const now = () => 1_800_000_010;

  it('accepts exact signed bytes for central and bootstrap route classes', async () => {
    const profiles = serviceProofFixtureSet();
    const authenticator = createAuthenticator(profiles);
    const centralBody = rawBody({ version: '1', requestId: 'central-request' });
    const bootstrapBody = rawBody({ version: '1', requestId: 'bootstrap-request' });

    await expect(authenticator.authenticate(input(
      'central-invocation', centralBody,
      await signServiceProof(profiles.central, { body_sha256: bodyDigest(centralBody) })
    ))).resolves.toMatchObject({ ok: true, value: { proof: { profileKey: profiles.central.config.profileKey } } });
    await expect(authenticator.authenticate(input(
      'binding-bootstrap', bootstrapBody,
      await signServiceProof(profiles.bridge, {
        body_sha256: bodyDigest(bootstrapBody),
        jti: '31ac1822-0827-4d6b-a5d8-cabb379a892a'
      }),
      profiles.bridge.config.profileKey
    ))).resolves.toMatchObject({ ok: true, value: { proof: { profileKey: profiles.bridge.config.profileKey } } });
  });

  it('rejects one-byte changes, digest mismatch, and semantically equal reserialization', async () => {
    const profiles = serviceProofFixtureSet();
    const authenticator = createAuthenticator(profiles);
    const signed = Buffer.from('{"a":1,"b":2}', 'utf8');
    const token = await signServiceProof(profiles.central, { body_sha256: bodyDigest(signed) });

    await expect(authenticator.authenticate(input('central-invocation', Buffer.from('{"a":1,"b":3}'), token))).resolves.toEqual({ ok: false, code: 'CONNECTOR_AUTH_FAILED' });
    await expect(authenticator.authenticate(input('central-invocation', Buffer.from('{ "a": 1, "b": 2 }'), token))).resolves.toEqual({ ok: false, code: 'CONNECTOR_AUTH_FAILED' });
    await expect(authenticator.authenticate(input('central-invocation', Buffer.from('{"b":2,"a":1}'), token))).resolves.toEqual({ ok: false, code: 'CONNECTOR_AUTH_FAILED' });
    await expect(authenticator.authenticate(input('central-invocation', signed,
      await signServiceProof(profiles.central, { body_sha256: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' })
    ))).resolves.toEqual({ ok: false, code: 'CONNECTOR_AUTH_FAILED' });
  });

  it.each([
    ['missing content type', { contentType: undefined }],
    ['invalid content type', { contentType: 'text/plain' }],
    ['content type parameters', { contentType: 'application/json; charset=utf-8' }],
    ['content encoding', { contentEncoding: 'identity' }],
    ['wrong method', { method: 'GET' }]
  ])('rejects %s before accepting a proof', async (_label, override) => {
    const profiles = serviceProofFixtureSet();
    const body = rawBody();
    const result = await createAuthenticator(profiles).authenticate({
      ...input('central-invocation', body, await signServiceProof(profiles.central, { body_sha256: bodyDigest(body) })),
      ...override
    });
    expect(result).toEqual({ ok: false, code: 'CONNECTOR_REQUEST_INVALID' });
  });

  it('rejects oversized bytes before invoking the proof verifier and never parses JSON', async () => {
    const verifier = { verifySignature: jest.fn(), isFresh: jest.fn(), validateProfileAndContext: jest.fn() };
    const replay = { claim: jest.fn() };
    const authenticator = new ExactRawBodyAuthenticator(verifier as never, replay as never);
    const oversized = Buffer.alloc(16_385, 0x7b);

    await expect(authenticator.authenticate(input('central-invocation', oversized, 'secret-proof'))).resolves.toEqual({ ok: false, code: 'CONNECTOR_REQUEST_INVALID' });
    expect(verifier.verifySignature).not.toHaveBeenCalled();
    expect(replay.claim).not.toHaveBeenCalled();
  });

  it('orders signature, exact digest, freshness, replay, then signed context validation', async () => {
    const calls: string[] = [];
    const body = rawBody();
    const signature = {
      claims: {
        body_sha256: bodyDigest(body), nbf: 1_800_000_000, exp: 1_800_000_030,
        jti: '21ac1822-0827-4d6b-a5d8-cabb379a892a'
      }
    };
    const verifier = {
      verifySignature: jest.fn(async () => { calls.push('signature'); return { ok: true, value: signature }; }),
      isFresh: jest.fn(() => { calls.push('freshness'); return true; }),
      validateProfileAndContext: jest.fn(() => { calls.push('context'); return { ok: true, value: { profileKey: 'central-v1' } }; })
    };
    const replay = { claim: jest.fn(() => { calls.push('replay'); return { ok: true }; }) };
    const authenticator = new ExactRawBodyAuthenticator(verifier as never, replay as never);

    await expect(authenticator.authenticate(input('central-invocation', body, 'a.b.c'))).resolves.toMatchObject({ ok: true });
    expect(calls).toEqual(['signature', 'freshness', 'replay', 'context']);

    calls.length = 0;
    signature.claims.body_sha256 = bodyDigest(Buffer.from('different'));
    await expect(authenticator.authenticate(input('central-invocation', body, 'a.b.c'))).resolves.toEqual({ ok: false, code: 'CONNECTOR_AUTH_FAILED' });
    expect(calls).toEqual(['signature']);
  });

  it('claims one authenticated jti exactly once and never releases it', async () => {
    const profiles = serviceProofFixtureSet();
    const authenticator = createAuthenticator(profiles);
    const body = rawBody();
    const request = input('central-invocation', body,
      await signServiceProof(profiles.central, { body_sha256: bodyDigest(body) }));

    await expect(authenticator.authenticate(request)).resolves.toMatchObject({ ok: true });
    await expect(authenticator.authenticate(request)).resolves.toEqual({ ok: false, code: 'CONNECTOR_REPLAY_REJECTED' });
  });

  it('enforces the selected bootstrap profile payload bound only after exact proof succeeds', async () => {
    const profiles = serviceProofFixtureSet();
    const body = rawBody({
      version: '1', requestId: '5a8271fb-1127-421c-83eb-3dc6b512db50',
      bootstrapProfileKey: profiles.bridge.config.profileKey,
      trustedContext: profiles.bridge.config.trustedContext,
      providerPayload: { opaque: 'payload-that-exceeds-the-selected-profile-bound' }
    });
    const authenticated = await createAuthenticator(profiles).authenticate(input(
      'binding-bootstrap', body,
      await signServiceProof(profiles.bridge, { body_sha256: bodyDigest(body) }),
      profiles.bridge.config.profileKey
    ));
    expect(authenticated.ok).toBe(true);
    const parsed = parseConnectorBindingBootstrapRequestV1(body, {
      profileKey: 'reference-bridge-bootstrap-v1',
      maxProviderPayloadBytes: 16,
      parseProviderPayload: () => ({ ok: true, value: { opaque: 'validated' } })
    });
    expect(parsed).toEqual({ ok: false, code: 'CONNECTOR_REQUEST_INVALID' });
  });
});

function createAuthenticator(profiles: ReturnType<typeof serviceProofFixtureSet>) {
  return new ExactRawBodyAuthenticator(new ConnectorServiceProofVerifier(
    new RuntimeServiceProfileRegistry([profiles.central.config, profiles.bridge.config, profiles.customerB.config]),
    () => 1_800_000_010
  ), new ReplayProtectionService(64, () => 1_800_000_010));
}

function input(routeClass: 'central-invocation' | 'binding-bootstrap', body: Buffer, token: string, expectedProfileKey?: string) {
  return {
    routeClass, method: 'POST', contentType: 'application/json', contentEncoding: undefined,
    authorization: `Bearer ${token}`, rawBody: body, expectedProfileKey
  } as const;
}
