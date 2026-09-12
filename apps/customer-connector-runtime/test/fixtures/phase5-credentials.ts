import type { ConnectorBindingTrustedContextV1 } from '@internal-ai-assistant/connector-runtime-contract';
import {
  appliedCredentialRequest,
  executionScopedCredentialMaterial,
  type CredentialApplicationStrategy,
  type CredentialProvider
} from '../../src/credentials/credential.types';

export function credentialFixtures() {
  const bearerProvider: CredentialProvider = {
    key: 'metrics-provider-v1', credentialKind: 'bearer-v1',
    async resolve(handle, _context, generation) {
      if (handle !== 'metrics-handle' || generation !== 'credential-generation-1') throw new Error('provider-rejected');
      return executionScopedCredentialMaterial({ secret: 'bearer-secret-sentinel' });
    }
  };
  const apiKeyProvider: CredentialProvider = {
    key: 'customer-b-provider-v1', credentialKind: 'fixed-api-key-v1',
    async resolve(handle, _context, generation) {
      if (handle !== 'customer-b-handle' || generation !== 'credential-generation-1') throw new Error('provider-rejected');
      return executionScopedCredentialMaterial({ secret: 'api-key-secret-sentinel' });
    }
  };
  const bearerStrategy: CredentialApplicationStrategy = {
    key: 'reference-bearer-strategy-v1', credentialKind: 'bearer-v1',
    apply(material, request) { return appliedCredentialRequest({ request, authorization: `Bearer ${(material as unknown as { secret: string }).secret}` }); }
  };
  const apiKeyStrategy: CredentialApplicationStrategy = {
    key: 'customer-b-fixed-key-strategy-v1', credentialKind: 'fixed-api-key-v1',
    apply(material, request) { return appliedCredentialRequest({ request, 'X-Inventory-Key': (material as unknown as { secret: string }).secret }); }
  };
  return Object.freeze({ bearerProvider, apiKeyProvider, bearerStrategy, apiKeyStrategy });
}

export const customerBContext: ConnectorBindingTrustedContextV1 = Object.freeze({
  customerId: 'customer-b', integrationId: 'inventory-b', hostApp: 'customer-b-inventory',
  connectorInstanceId: 'customer-b-inventory-connector-1', organizationId: 'org-b', actorId: 'actor-b'
});

export function binding(overrides: Record<string, unknown> = {}) {
  return Object.freeze({
    trustedContext: customerBContext,
    bootstrapProviderKey: 'customer-b-bootstrap-provider-v1',
    credentialProviderKey: 'customer-b-provider-v1',
    opaqueCredentialHandle: 'customer-b-handle',
    credentialGeneration: 'credential-generation-1',
    providerMetadata: Object.freeze({}), bindingGeneration: 1, expiresAt: 1_900_000_000,
    ...overrides
  });
}

export const profileConfigurations = Object.freeze([
  Object.freeze({
    credentialProfileRef: 'metrics-bearer-v1', credentialProviderKey: 'metrics-provider-v1',
    applicationStrategyKey: 'reference-bearer-strategy-v1', credentialKind: 'bearer-v1'
  }),
  Object.freeze({
    credentialProfileRef: 'customer-b-inventory-api-key-v1', credentialProviderKey: 'customer-b-provider-v1',
    applicationStrategyKey: 'customer-b-fixed-key-strategy-v1', credentialKind: 'fixed-api-key-v1'
  })
]);
