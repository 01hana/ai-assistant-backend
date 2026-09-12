import type {
  CredentialApplicationStrategy,
  CredentialProfileConfiguration,
  CredentialProvider
} from './credential.types';

export interface ResolvedCredentialProfile extends CredentialProfileConfiguration {
  readonly provider: CredentialProvider;
  readonly strategy: CredentialApplicationStrategy;
}

export class CredentialProfileRegistry {
  private readonly profiles = new Map<string, ResolvedCredentialProfile>();
  readonly isValid: boolean;

  constructor(
    configurations: readonly CredentialProfileConfiguration[],
    providers: readonly CredentialProvider[],
    strategies: readonly CredentialApplicationStrategy[]
  ) {
    const providerMap = uniqueMap(providers);
    const strategyMap = uniqueMap(strategies);
    let valid = configurations.length > 0 && providerMap !== undefined && strategyMap !== undefined;
    for (const configuration of configurations) {
      const provider = providerMap?.get(configuration.credentialProviderKey);
      const strategy = strategyMap?.get(configuration.applicationStrategyKey);
      if (!validConfiguration(configuration) || this.profiles.has(configuration.credentialProfileRef) || !provider || !strategy ||
          provider.credentialKind !== configuration.credentialKind || strategy.credentialKind !== configuration.credentialKind) {
        valid = false;
        continue;
      }
      this.profiles.set(configuration.credentialProfileRef, Object.freeze({ ...configuration, provider, strategy }));
    }
    this.isValid = valid;
    if (!valid) this.profiles.clear();
  }

  resolve(credentialProfileRef: string, bindingProviderKey: string): ResolvedCredentialProfile | undefined {
    if (!this.isValid) return undefined;
    const profile = this.profiles.get(credentialProfileRef);
    return profile?.credentialProviderKey === bindingProviderKey ? profile : undefined;
  }

  has(credentialProfileRef: string): boolean { return this.isValid && this.profiles.has(credentialProfileRef); }
}

function uniqueMap<T extends Readonly<{ key: string; credentialKind: string }>>(values: readonly T[]): Map<string, T> | undefined {
  const result = new Map<string, T>();
  for (const value of values) {
    if (!identifier(value.key) || !identifier(value.credentialKind) || result.has(value.key)) return undefined;
    result.set(value.key, value);
  }
  return result;
}
function validConfiguration(value: CredentialProfileConfiguration): boolean {
  return !!value && identifier(value.credentialProfileRef) && identifier(value.credentialProviderKey) &&
    identifier(value.applicationStrategyKey) && identifier(value.credentialKind) &&
    Object.keys(value).length === 4;
}
function identifier(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value) && !value.includes('*');
}
