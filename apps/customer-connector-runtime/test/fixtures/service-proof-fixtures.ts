import { createHash, generateKeyPairSync, KeyObject } from 'node:crypto';
import { SignJWT } from 'jose';
import type { RuntimeServiceProfileConfiguration, RuntimeTrustedContextConfiguration } from '../../src/config/runtime-configuration';

export type TestProfile = Readonly<{ config: RuntimeServiceProfileConfiguration; privateKey: KeyObject }>;

export function serviceProofFixtureSet() {
  const central = testProfile('central-invocation', 'central-v1', 'assistant-connector-service+jwt', 'urn:central:connector',
    'central-adapter', 'urn:assistant:connector:customer-b:inventory-b:customer-b-inventory-connector-1',
    'central-connector-signing', customerBContext());
  const bridge = testProfile('binding-bootstrap', 'reference-bridge-bootstrap-v1', 'assistant-connector-binding+jwt',
    'urn:reference:bridge', 'reference-bridge', 'urn:connector-binding:reference', 'reference-bridge-signing',
    referenceContext(), 'reference-provider-v1');
  const customerB = testProfile('binding-bootstrap', 'customer-b-bootstrap-v1', 'customer-bootstrap+jwt',
    'urn:customer-b:bootstrap', 'customer-b-bootstrapper', 'urn:connector-binding:customer-b',
    'customer-b-bootstrap-signing', customerBContext(), 'customer-b-fixture-provider-v1');
  return Object.freeze({ central, bridge, customerB });
}

export async function signServiceProof(
  profile: TestProfile,
  overrides: Record<string, unknown> = {},
  headerOverrides: Record<string, unknown> = {}
): Promise<string> {
  const now = 1_800_000_000;
  const claims = profile.config.kind === 'central-invocation'
    ? centralClaims(profile.config, now)
    : bootstrapClaims(profile.config, now);
  return new SignJWT({ ...claims, ...overrides })
    .setProtectedHeader({ alg: 'RS256', kid: profile.config.keys[0]?.kid, typ: profile.config.typ, ...headerOverrides })
    .sign(profile.privateKey);
}

export function rawBody(value: unknown = { version: '1', requestId: '5a8271fb-1127-421c-83eb-3dc6b512db50' }): Buffer {
  return Buffer.from(JSON.stringify(value), 'utf8');
}

export function bodyDigest(body: Uint8Array): string {
  return createHash('sha256').update(body).digest('base64url');
}

export function centralClaims(profile: RuntimeServiceProfileConfiguration, now = 1_800_000_000) {
  const context = profile.trustedContext;
  return {
    iss: profile.issuer, sub: profile.subject, aud: profile.audience, iat: now, nbf: now, exp: now + 30,
    jti: '21ac1822-0827-4d6b-a5d8-cabb379a892a', proof_version: 1,
    customer_id: context.customerId, integration_id: context.integrationId, host_app: context.hostApp,
    connector_key: 'inventory', connector_instance_id: context.connectorInstanceId,
    operation: 'inventory.stock-on-hand', operation_version: '1.0.0',
    request_id: '5a8271fb-1127-421c-83eb-3dc6b512db50', body_sha256: bodyDigest(rawBody())
  };
}

export function bootstrapClaims(profile: RuntimeServiceProfileConfiguration, now = 1_800_000_000) {
  const context = profile.trustedContext;
  return {
    iss: profile.issuer, sub: profile.subject, aud: profile.audience, iat: now, nbf: now, exp: now + 30,
    jti: '21ac1822-0827-4d6b-a5d8-cabb379a892a', proof_version: 1,
    customer_id: context.customerId, integration_id: context.integrationId, host_app: context.hostApp,
    connector_instance_id: context.connectorInstanceId,
    ...(context.organizationId === undefined ? {} : { organization_id: context.organizationId }),
    ...(context.actorId === undefined ? {} : { actor_id: context.actorId }),
    bootstrap_profile_key: profile.profileKey, provider_key: profile.providerKey,
    request_id: '5a8271fb-1127-421c-83eb-3dc6b512db50', body_sha256: bodyDigest(rawBody())
  };
}

function testProfile(kind: RuntimeServiceProfileConfiguration['kind'], profileKey: string, typ: string, issuer: string,
  subject: string, audience: string, keyDomain: string, trustedContext: RuntimeTrustedContextConfiguration,
  providerKey?: string): TestProfile {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = publicKey.export({ format: 'jwk' });
  const kid = `${profileKey}-key-1`;
  return Object.freeze({
    privateKey,
    config: Object.freeze({
      kind, profileKey, typ, issuer, subject, audience, keyDomain, trustedContext: Object.freeze(trustedContext),
      keys: Object.freeze([Object.freeze({
        kid, status: 'active' as const,
        publicJwk: Object.freeze({ ...jwk, kid, alg: 'RS256', use: 'sig' })
      })]),
      ...(providerKey === undefined ? {} : { providerKey })
    })
  });
}

function referenceContext(): RuntimeTrustedContextConfiguration {
  return Object.freeze({ customerId: 'reference-customer', integrationId: 'reference-integration', hostApp: 'reference-host', connectorInstanceId: 'reference-connector-1' });
}
function customerBContext(): RuntimeTrustedContextConfiguration {
  return Object.freeze({ customerId: 'customer-b', integrationId: 'inventory-b', hostApp: 'customer-b-inventory', connectorInstanceId: 'customer-b-inventory-connector-1' });
}
