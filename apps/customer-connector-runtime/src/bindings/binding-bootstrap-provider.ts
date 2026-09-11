import type {
  BindingBootstrapProfileContract,
  ConnectorBindingTrustedContextV1,
  ValidatedProviderPayload
} from '@internal-ai-assistant/connector-runtime-contract';
import type { BindingRevocationReason } from './binding.types';

declare const opaqueCredentialHandleBrand: unique symbol;

export type OpaqueCredentialHandle = string & Readonly<{ [opaqueCredentialHandleBrand]: true }>;

export interface BindingBootstrapProviderResult {
  readonly credentialProviderKey: string;
  readonly opaqueCredentialHandle: OpaqueCredentialHandle;
  readonly credentialGeneration: string;
  readonly providerExpiresAt?: number;
  readonly providerMetadata: unknown;
}

export interface BindingBootstrapProvider<TProfileKey extends string = string, TPayload = unknown> {
  readonly bootstrapProviderKey: string;
  readonly serviceProfileKey: TProfileKey;
  readonly contract: BindingBootstrapProfileContract<TProfileKey, TPayload>;
  create(
    payload: ValidatedProviderPayload<TProfileKey, TPayload>,
    trustedContext: ConnectorBindingTrustedContextV1
  ): Promise<BindingBootstrapProviderResult>;
  revoke(handle: OpaqueCredentialHandle, reason: BindingRevocationReason): Promise<void>;
}

export function opaqueCredentialHandle(value: string): OpaqueCredentialHandle | undefined {
  return typeof value === 'string' && /^\S{1,256}$/.test(value) ? value as OpaqueCredentialHandle : undefined;
}
