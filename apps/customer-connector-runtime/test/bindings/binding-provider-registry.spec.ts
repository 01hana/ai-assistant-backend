import { ConnectorRuntimeConfigService } from '../../src/config/runtime-configuration';
import { BindingBootstrapProviderRegistry } from '../../src/bindings/binding-bootstrap-provider.registry';
import { opaqueCredentialHandle, type BindingBootstrapProvider } from '../../src/bindings/binding-bootstrap-provider';
import { validRuntimeEnvironment } from '../fixtures/runtime-environment';

describe('binding bootstrap provider registration', () => {
  it('requires one exact provider for every configured bootstrap profile', () => {
    const config = new ConnectorRuntimeConfigService(validRuntimeEnvironment()).configuration;
    const reference = provider('reference-bridge-bootstrap-v1', 'reference-provider-v1');
    const customerB = provider('customer-b-bootstrap-v1', 'customer-b-fixture-provider-v1');
    const complete = new BindingBootstrapProviderRegistry(config, [reference, customerB]);

    expect(complete.isValid).toBe(true);
    expect(complete.resolve(reference.serviceProfileKey, reference.bootstrapProviderKey)).toBe(reference);
    expect(new BindingBootstrapProviderRegistry(config, [reference]).isValid).toBe(false);
    expect(new BindingBootstrapProviderRegistry(config, [reference, reference, customerB]).isValid).toBe(false);
  });

  it('rejects cross-profile registration and provider identity reuse', () => {
    const config = new ConnectorRuntimeConfigService(validRuntimeEnvironment()).configuration;
    const reference = provider('reference-bridge-bootstrap-v1', 'reference-provider-v1');
    const wrongProfile = provider('customer-b-bootstrap-v1', 'reference-provider-v1');
    const wrongContract = {
      ...provider('customer-b-bootstrap-v1', 'customer-b-fixture-provider-v1'),
      contract: provider('reference-bridge-bootstrap-v1', 'unused-provider').contract
    } as BindingBootstrapProvider;

    expect(new BindingBootstrapProviderRegistry(config, [reference, wrongProfile]).isValid).toBe(false);
    expect(new BindingBootstrapProviderRegistry(config, [reference, wrongContract]).isValid).toBe(false);
  });
});

function provider(serviceProfileKey: string, bootstrapProviderKey: string): BindingBootstrapProvider {
  return {
    serviceProfileKey, bootstrapProviderKey,
    contract: {
      profileKey: serviceProfileKey,
      maxProviderPayloadBytes: 128,
      parseProviderPayload: () => ({ ok: true, value: Object.freeze({ code: 'fixture' }) })
    },
    async create() {
      return {
        credentialProviderKey: 'credential-provider', opaqueCredentialHandle: opaqueCredentialHandle('opaque-handle')!,
        credentialGeneration: 'credential-generation', providerMetadata: {}
      };
    },
    async revoke() {}
  };
}
