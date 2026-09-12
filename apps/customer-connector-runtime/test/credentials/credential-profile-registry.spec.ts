import { CredentialProfileRegistry } from '../../src/credentials/credential-profile.registry';
import { credentialFixtures, profileConfigurations } from '../fixtures/phase5-credentials';

describe('CredentialProfileRegistry', () => {
  it('resolves exact compatible registered profiles without caller-selected overrides', () => {
    const fixtures = credentialFixtures();
    const registry = new CredentialProfileRegistry(profileConfigurations,
      [fixtures.bearerProvider, fixtures.apiKeyProvider], [fixtures.bearerStrategy, fixtures.apiKeyStrategy]);
    expect(registry.isValid).toBe(true);
    expect(registry.resolve('customer-b-inventory-api-key-v1', 'customer-b-provider-v1')).toEqual(expect.objectContaining({
      credentialProfileRef: 'customer-b-inventory-api-key-v1', credentialKind: 'fixed-api-key-v1'
    }));
    expect(registry.resolve('customer-b-inventory-api-key-v1', 'metrics-provider-v1')).toBeUndefined();
    expect(registry.resolve('missing', 'customer-b-provider-v1')).toBeUndefined();
  });

  it.each([
    ['duplicate profile', [profileConfigurations[0]!, profileConfigurations[0]!]],
    ['unknown provider', [{ ...profileConfigurations[0]!, credentialProviderKey: 'missing' }]],
    ['unknown strategy', [{ ...profileConfigurations[0]!, applicationStrategyKey: 'missing' }]],
    ['provider kind mismatch', [{ ...profileConfigurations[0]!, credentialProviderKey: 'customer-b-provider-v1' }]],
    ['strategy kind mismatch', [{ ...profileConfigurations[0]!, applicationStrategyKey: 'customer-b-fixed-key-strategy-v1' }]],
    ['wildcard profile', [{ ...profileConfigurations[0]!, credentialProfileRef: '*' }]]
  ])('fails closed for %s', (_case, profiles) => {
    const fixtures = credentialFixtures();
    expect(new CredentialProfileRegistry(profiles,
      [fixtures.bearerProvider, fixtures.apiKeyProvider], [fixtures.bearerStrategy, fixtures.apiKeyStrategy]).isValid).toBe(false);
  });
});
