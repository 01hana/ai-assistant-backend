import { randomUUID } from 'node:crypto';
import { SignJWT } from 'jose';
import request from 'supertest';
import { opaqueCredentialHandle, type BindingBootstrapProvider } from '../../src/bindings/binding-bootstrap-provider';
import { RuntimeReadinessRegistry } from '../../src/health/readiness.service';
import { createCustomerConnectorRuntimeApplication } from '../../src/main';
import { bodyDigest, bootstrapClaims, serviceProofFixtureSet, type TestProfile } from '../fixtures/service-proof-fixtures';

describe('POST /v1/internal/connector-bindings', () => {
  it('authenticates one registered bootstrap profile, invokes its provider once, and returns only the bounded opaque reference', async () => {
    const fixture = await startFixture();
    try {
      const body = bindingBody(fixture.profiles.bridge);
      const response = await postBinding(fixture, body, fixture.profiles.bridge);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        version: '1', requestId: body.requestId,
        connectorContextRef: expect.stringMatching(/^ccr_[A-Za-z0-9_-]{43}$/), expiresIn: 60
      });
      expect(Buffer.byteLength(JSON.stringify(response.body))).toBeLessThanOrEqual(4_096);
      expect(fixture.bridgeProvider.create).toHaveBeenCalledTimes(1);
      expect(fixture.customerBProvider.create).not.toHaveBeenCalled();
      expect(Object.keys(response.body).sort()).toEqual(['connectorContextRef', 'expiresIn', 'requestId', 'version']);
      expect(JSON.stringify(response.body)).not.toMatch(/handle|metadata|credential|provider|bootstrapCode/i);
      expect(fixture.app.get(RuntimeReadinessRegistry).snapshot()).toMatchObject({ bindingStore: true, bindingRoute: true, invocationRoute: false });
    } finally {
      await fixture.app.close();
    }
  });

  it('rejects a central proof, user token, and cross-profile body before any provider runs', async () => {
    const fixture = await startFixture();
    try {
      const bridgeBody = bindingBody(fixture.profiles.bridge);
      const central = await postBinding(fixture, bridgeBody, fixture.profiles.central);
      expect(central.status).toBe(401);
      expect(central.body).toEqual(failure('rejected-request', 'CONNECTOR_AUTH_FAILED'));

      await request(fixture.app.getHttpServer()).post('/v1/internal/connector-bindings')
        .set('Content-Type', 'application/json').set('Authorization', 'Bearer feature007.user.jwt')
        .send(JSON.stringify(bridgeBody)).expect(401, failure('rejected-request', 'CONNECTOR_AUTH_FAILED'));

      const customerBProof = await postBinding(fixture, bridgeBody, fixture.profiles.customerB);
      expect(customerBProof.status).toBe(400);
      expect(customerBProof.body).toEqual(failure(bridgeBody.requestId, 'CONNECTOR_REQUEST_INVALID'));
      expect(fixture.bridgeProvider.create).not.toHaveBeenCalled();
      expect(fixture.customerBProvider.create).not.toHaveBeenCalled();
    } finally {
      await fixture.app.close();
    }
  });

  it('fails closed on schema/context/media/replay violations and never invokes the provider early', async () => {
    const fixture = await startFixture();
    try {
      const unknown = { ...bindingBody(fixture.profiles.bridge), destination: 'https://attacker.invalid' };
      expect((await postBinding(fixture, unknown, fixture.profiles.bridge)).status).toBe(400);
      const mismatch = bindingBody(fixture.profiles.bridge, { trustedContext: { ...fixture.profiles.bridge.config.trustedContext, customerId: 'other-customer' } });
      expect((await postBinding(fixture, mismatch, fixture.profiles.bridge)).status).toBe(403);

      const valid = bindingBody(fixture.profiles.bridge);
      const token = await tokenFor(fixture.profiles.bridge, Buffer.from(JSON.stringify(valid)), valid.requestId, '3881f27d-eb74-46fd-8ab3-04bd25f68b55');
      await request(fixture.app.getHttpServer()).post('/v1/internal/connector-bindings')
        .set('Content-Type', 'application/json').set('Authorization', `Bearer ${token}`).send(encodedJson(valid)).expect(200);
      await request(fixture.app.getHttpServer()).post('/v1/internal/connector-bindings')
        .set('Content-Type', 'application/json').set('Authorization', `Bearer ${token}`).send(encodedJson(valid))
        .expect(409, failure('rejected-request', 'CONNECTOR_REPLAY_REJECTED'));

      const oversized = { ...bindingBody(fixture.profiles.bridge), providerPayload: { bootstrapCode: 'x'.repeat(16_384) } };
      expect((await postBinding(fixture, oversized, fixture.profiles.bridge)).status).toBe(400);
      const encodedBody = bindingBody(fixture.profiles.bridge);
      const encodedBytes = Buffer.from(JSON.stringify(encodedBody));
      const encodedToken = await tokenFor(fixture.profiles.bridge, encodedBytes, encodedBody.requestId, 'd56ed70e-f655-4d90-a188-4fdc203745de');
      await request(fixture.app.getHttpServer()).post('/v1/internal/connector-bindings')
        .set('Content-Type', 'application/json').set('Content-Encoding', 'identity')
        .set('Authorization', `Bearer ${encodedToken}`).send(encodedBytes.toString('utf8')).expect(400);
      expect(fixture.bridgeProvider.create).toHaveBeenCalledTimes(1);
    } finally {
      await fixture.app.close();
    }
  });

  it('normalizes provider failures without leaking request, payload, handle, or exception sentinels', async () => {
    const fixture = await startFixture({ providerThrows: true });
    try {
      const body = bindingBody(fixture.profiles.bridge, { providerPayload: { bootstrapCode: 'payload-secret-sentinel' } });
      const response = await postBinding(fixture, body, fixture.profiles.bridge);
      expect(response.status).toBe(503);
      expect(response.body).toEqual(failure(body.requestId, 'CONNECTOR_UNAVAILABLE'));
      expect(JSON.stringify(response.body)).not.toMatch(/payload-secret-sentinel|provider-exception-sentinel|opaque-handle/i);
    } finally {
      await fixture.app.close();
    }
  });
});

async function startFixture(options: { providerThrows?: boolean } = {}) {
  const profiles = serviceProofFixtureSet();
  const bridgeProvider = provider(profiles.bridge, options.providerThrows);
  const customerBProvider = provider(profiles.customerB, false);
  const app = await createCustomerConnectorRuntimeApplication(environment(profiles), [bridgeProvider, customerBProvider]);
  await app.init();
  return { app, profiles, bridgeProvider, customerBProvider };
}

function provider(profile: TestProfile, throws = false): BindingBootstrapProvider {
  return {
    bootstrapProviderKey: profile.config.providerKey!,
    serviceProfileKey: profile.config.profileKey,
    contract: {
      profileKey: profile.config.profileKey,
      maxProviderPayloadBytes: 512,
      parseProviderPayload: (value: unknown) => {
        if (!value || typeof value !== 'object' || Array.isArray(value) ||
            Object.keys(value).join(',') !== 'bootstrapCode' ||
            typeof (value as { bootstrapCode?: unknown }).bootstrapCode !== 'string' ||
            (value as { bootstrapCode: string }).bootstrapCode.length > 128) {
          return { ok: false, code: 'CONNECTOR_REQUEST_INVALID' } as const;
        }
        return { ok: true, value: Object.freeze({ bootstrapCode: (value as { bootstrapCode: string }).bootstrapCode }) } as const;
      }
    },
    create: jest.fn(async () => {
      if (throws) throw new Error('provider-exception-sentinel');
      return Object.freeze({
        credentialProviderKey: `${profile.config.providerKey}-credentials`,
        opaqueCredentialHandle: opaqueCredentialHandle('opaque-handle-sentinel')!,
        credentialGeneration: 'credential-generation-1',
        providerMetadata: Object.freeze({ fixtureClass: 'closed' })
      });
    }),
    revoke: jest.fn(async () => undefined)
  };
}

function bindingBody(profile: TestProfile, overrides: Record<string, unknown> = {}) {
  return {
    version: '1', requestId: '5a8271fb-1127-421c-83eb-3dc6b512db50',
    bootstrapProfileKey: profile.config.profileKey,
    trustedContext: profile.config.trustedContext,
    providerPayload: { bootstrapCode: 'bounded-sensitive-fixture' },
    ...overrides
  };
}

async function postBinding(fixture: Awaited<ReturnType<typeof startFixture>>, body: ReturnType<typeof bindingBody> & Record<string, unknown>, proofProfile: TestProfile) {
  const bytes = Buffer.from(JSON.stringify(body));
  const token = await tokenFor(proofProfile, bytes, body.requestId as string, randomUUID());
  return request(fixture.app.getHttpServer()).post('/v1/internal/connector-bindings')
    .set('Content-Type', 'application/json').set('Authorization', `Bearer ${token}`).send(bytes.toString('utf8'));
}

function encodedJson(value: unknown): string { return JSON.stringify(value); }

async function tokenFor(profile: TestProfile, bytes: Buffer, requestId: string, jti: string): Promise<string> {
  const now = Math.floor(Date.now() / 1_000);
  const base = profile.config.kind === 'binding-bootstrap'
    ? bootstrapClaims(profile.config, now)
    : {
        iss: profile.config.issuer, sub: profile.config.subject, aud: profile.config.audience,
        customer_id: profile.config.trustedContext.customerId, integration_id: profile.config.trustedContext.integrationId,
        host_app: profile.config.trustedContext.hostApp, connector_key: 'inventory',
        connector_instance_id: profile.config.trustedContext.connectorInstanceId,
        operation: 'inventory.stock-on-hand', operation_version: '1.0.0'
      };
  return new SignJWT({ ...base, iat: now, nbf: now, exp: now + 30, jti, proof_version: 1, request_id: requestId, body_sha256: bodyDigest(bytes) })
    .setProtectedHeader({ alg: 'RS256', kid: profile.config.keys[0]!.kid, typ: profile.config.typ })
    .sign(profile.privateKey);
}

function environment(profiles: ReturnType<typeof serviceProofFixtureSet>): Record<string, unknown> {
  return {
    CONNECTOR_RUNTIME_PROCESS_ROLE: 'single-replica', CONNECTOR_REPLAY_CACHE_MAX_ENTRIES: '64',
    CONNECTOR_BINDING_STORE_MAX_ENTRIES: '4096', CONNECTOR_BINDING_SCOPE_MAX_ENTRIES: '64', CONNECTOR_BINDING_SWEEP_BATCH_SIZE: '128',
    CONNECTOR_RUNTIME_CONTEXT_JSON: JSON.stringify([profiles.bridge.config.trustedContext, profiles.customerB.config.trustedContext]),
    CONNECTOR_CENTRAL_TRUST_KEYS_JSON: JSON.stringify([profiles.central.config]),
    CONNECTOR_BINDING_BOOTSTRAP_PROFILES_JSON: JSON.stringify([profiles.bridge.config, profiles.customerB.config])
  };
}

function failure(requestId: string, code: string) {
  return { version: '1', requestId, status: 'failed', error: { code } };
}
