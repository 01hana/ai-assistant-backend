import { generateKeyPairSync } from 'node:crypto';

const PUBLIC_KEYS = new Map<string, Readonly<Record<string, unknown>>>();

export function validRuntimeEnvironment(): Record<string, unknown> {
  const centralKey = publicKey('central-key-1');
  const bridgeKey = publicKey('bridge-key-1');
  const customerBKey = publicKey('customer-b-key-1');
  return {
    CONNECTOR_RUNTIME_PROCESS_ROLE: 'single-replica',
    CONNECTOR_REPLAY_CACHE_MAX_ENTRIES: '64',
    CONNECTOR_RUNTIME_CONTEXT_JSON: JSON.stringify([
      context('reference-customer', 'reference-integration', 'reference-host', 'reference-connector-1'),
      context('customer-b', 'inventory-b', 'customer-b-inventory', 'customer-b-inventory-connector-1')
    ]),
    CONNECTOR_CENTRAL_TRUST_KEYS_JSON: JSON.stringify([
      profile('central-invocation', 'central-v1', 'assistant-connector-service+jwt', 'urn:central:connector', 'central-adapter',
        'urn:assistant:connector:customer-b:inventory-b:customer-b-inventory-connector-1', 'central-connector-signing',
        context('customer-b', 'inventory-b', 'customer-b-inventory', 'customer-b-inventory-connector-1'), [centralKey])
    ]),
    CONNECTOR_BINDING_BOOTSTRAP_PROFILES_JSON: JSON.stringify([
      { ...profile('binding-bootstrap', 'reference-bridge-bootstrap-v1', 'assistant-connector-binding+jwt',
        'urn:reference:bridge', 'reference-bridge', 'urn:connector-binding:reference', 'reference-bridge-signing',
        context('reference-customer', 'reference-integration', 'reference-host', 'reference-connector-1'), [bridgeKey]),
        providerKey: 'reference-provider-v1' },
      { ...profile('binding-bootstrap', 'customer-b-bootstrap-v1', 'customer-bootstrap+jwt',
        'urn:customer-b:bootstrap', 'customer-b-bootstrapper', 'urn:connector-binding:customer-b', 'customer-b-bootstrap-signing',
        context('customer-b', 'inventory-b', 'customer-b-inventory', 'customer-b-inventory-connector-1'), [customerBKey]),
        providerKey: 'customer-b-fixture-provider-v1' }
    ])
  };
}

function context(customerId: string, integrationId: string, hostApp: string, connectorInstanceId: string) {
  return { customerId, integrationId, hostApp, connectorInstanceId };
}

function profile(kind: string, profileKey: string, typ: string, issuer: string, subject: string, audience: string,
  keyDomain: string, trustedContext: ReturnType<typeof context>, keys: readonly unknown[]) {
  return { kind, profileKey, typ, issuer, subject, audience, keyDomain, trustedContext, keys };
}

function publicKey(kid: string) {
  let jwk = PUBLIC_KEYS.get(kid);
  if (!jwk) {
    const pair = generateKeyPairSync('rsa', { modulusLength: 2048 });
    jwk = Object.freeze({ ...pair.publicKey.export({ format: 'jwk' }), kid, alg: 'RS256', use: 'sig' });
    PUBLIC_KEYS.set(kid, jwk);
  }
  return { kid, status: 'active', publicJwk: jwk };
}
