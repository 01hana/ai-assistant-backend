import type {
  ConnectorBindingTrustedContextV1,
  ExecutionScopedCredentialMaterial
} from '@internal-ai-assistant/connector-runtime-contract';
import type { MappedReadRequest } from '../manifest/request-profile.registry';

declare const appliedCredentialRequestBrand: unique symbol;

export type AppliedCredentialRequest = object & Readonly<{ [appliedCredentialRequestBrand]: true }>;

export interface CredentialProvider {
  readonly key: string;
  readonly credentialKind: string;
  resolve(
    handle: string,
    trustedContext: ConnectorBindingTrustedContextV1,
    credentialGeneration: string
  ): Promise<ExecutionScopedCredentialMaterial>;
}

export interface CredentialApplicationStrategy {
  readonly key: string;
  readonly credentialKind: string;
  apply(material: ExecutionScopedCredentialMaterial, request: MappedReadRequest): AppliedCredentialRequest;
}

export interface CredentialProfileConfiguration {
  readonly credentialProfileRef: string;
  readonly credentialProviderKey: string;
  readonly applicationStrategyKey: string;
  readonly credentialKind: string;
}

export function executionScopedCredentialMaterial(value: object): ExecutionScopedCredentialMaterial {
  return deepFreeze(value) as ExecutionScopedCredentialMaterial;
}

export function appliedCredentialRequest(value: object): AppliedCredentialRequest {
  return deepFreeze(value) as AppliedCredentialRequest;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as object)) deepFreeze(child);
  }
  return value;
}
