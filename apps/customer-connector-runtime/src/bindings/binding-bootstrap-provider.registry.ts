import type { ConnectorRuntimeConfiguration, RuntimeServiceProfileConfiguration } from '../config/runtime-configuration';
import type { BindingHandleLifecycle } from './connector-binding.service';
import type { BindingRevocationReason, StoredConnectorBindingRecord } from './binding.types';
import type { BindingBootstrapProvider, OpaqueCredentialHandle } from './binding-bootstrap-provider';

export class BindingBootstrapProviderRegistry implements BindingHandleLifecycle {
  private readonly providers = new Map<string, BindingBootstrapProvider>();
  readonly isValid: boolean;

  constructor(configuration: ConnectorRuntimeConfiguration | undefined, registrations: readonly BindingBootstrapProvider[]) {
    let valid = configuration !== undefined;
    const providerKeys = new Set<string>();
    for (const provider of registrations) {
      const profile = configuration?.bootstrapProfiles.find((candidate) => candidate.profileKey === provider.serviceProfileKey);
      const key = registrationKey(provider.serviceProfileKey, provider.bootstrapProviderKey);
      if (!validProvider(provider) || !profile || profile.providerKey !== provider.bootstrapProviderKey ||
          provider.contract.profileKey !== provider.serviceProfileKey || this.providers.has(key) || providerKeys.has(provider.bootstrapProviderKey)) {
        valid = false;
        continue;
      }
      this.providers.set(key, Object.freeze(provider));
      providerKeys.add(provider.bootstrapProviderKey);
    }
    if (configuration && (this.providers.size !== configuration.bootstrapProfiles.length ||
        configuration.bootstrapProfiles.some((profile) => !this.providers.has(registrationKey(profile.profileKey, profile.providerKey!))))) valid = false;
    this.isValid = valid;
  }

  resolve(serviceProfileKey: string, bootstrapProviderKey: string): BindingBootstrapProvider | undefined {
    return this.providers.get(registrationKey(serviceProfileKey, bootstrapProviderKey));
  }

  async revoke(record: Readonly<StoredConnectorBindingRecord>, reason: BindingRevocationReason): Promise<void> {
    const provider = [...this.providers.values()].find((candidate) => candidate.bootstrapProviderKey === record.bootstrapProviderKey);
    if (!provider) return;
    await provider.revoke(record.opaqueCredentialHandle as OpaqueCredentialHandle, reason);
  }
}

function validProvider(provider: BindingBootstrapProvider): boolean {
  return identifier(provider.bootstrapProviderKey) && identifier(provider.serviceProfileKey) &&
    provider.contract !== undefined && typeof provider.contract.parseProviderPayload === 'function' &&
    typeof provider.create === 'function' && typeof provider.revoke === 'function';
}

function registrationKey(profileKey: string, providerKey: string): string { return `${profileKey}\0${providerKey}`; }
function identifier(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value);
}
