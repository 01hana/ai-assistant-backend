import type { ConnectorErrorCode } from '@internal-ai-assistant/connector-runtime-contract';
import type { ProtectedBindingView } from '../bindings/binding.types';
import type { PreparedManifestOperation } from '../manifest/operation-manifest.registry';
import type { AppliedCredentialRequest } from './credential.types';
import type { CredentialProfileRegistry } from './credential-profile.registry';

export type CredentialExecutionResult<T> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{ ok: false; code: Extract<ConnectorErrorCode,
    'CONNECTOR_BINDING_INVALID' | 'CONNECTOR_OPERATION_UNAVAILABLE' | 'CONNECTOR_UPSTREAM_AUTH_FAILED' | 'CONNECTOR_UNAVAILABLE'> }>;

export class CredentialExecutionBoundary {
  constructor(private readonly profiles: Pick<CredentialProfileRegistry, 'resolve'>) {}

  async withAppliedCredential<T>(
    binding: ProtectedBindingView,
    operation: PreparedManifestOperation,
    consume: (request: AppliedCredentialRequest) => Promise<T>
  ): Promise<CredentialExecutionResult<T>> {
    const profile = this.profiles.resolve(operation.credentialProfileRef, binding.credentialProviderKey);
    if (!profile) return failure('CONNECTOR_BINDING_INVALID');
    let applied: AppliedCredentialRequest;
    try {
      const material = await profile.provider.resolve(
        binding.opaqueCredentialHandle,
        binding.trustedContext,
        binding.credentialGeneration
      );
      applied = profile.strategy.apply(material, operation.request);
    } catch {
      return failure('CONNECTOR_UPSTREAM_AUTH_FAILED');
    }
    return Object.freeze({ ok: true, value: await consume(applied) });
  }
}

function failure(code: 'CONNECTOR_BINDING_INVALID' | 'CONNECTOR_OPERATION_UNAVAILABLE' | 'CONNECTOR_UPSTREAM_AUTH_FAILED' | 'CONNECTOR_UNAVAILABLE') {
  return Object.freeze({ ok: false as const, code });
}
