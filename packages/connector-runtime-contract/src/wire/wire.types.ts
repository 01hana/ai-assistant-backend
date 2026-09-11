import type { ConnectorErrorCode } from '../errors';

export type ConnectorContractParseFailure = Readonly<{ ok: false; code: ConnectorErrorCode }>;
export type ConnectorContractParseResult<T> = Readonly<{ ok: true; value: T }> | ConnectorContractParseFailure;

declare const boundedOperationArguments: unique symbol;
declare const boundedBusinessResult: unique symbol;
declare const validatedProviderPayload: unique symbol;

export type BoundedOperationArguments = object & { readonly [boundedOperationArguments]: true };
export type BoundedBusinessResult = object & { readonly [boundedBusinessResult]: true };
export type ValidatedProviderPayload<TProfileKey extends string, TPayload> = TPayload & {
  readonly [validatedProviderPayload]: TProfileKey;
};

export interface ConnectorInvocationTrustedContextV1 {
  readonly customerId: string;
  readonly integrationId: string;
  readonly hostApp: string;
  readonly organizationId: string;
  readonly actorId: string;
  readonly connectorKey: string;
  readonly connectorInstanceId: string;
}

export interface ConnectorBindingTrustedContextV1 {
  readonly customerId: string;
  readonly integrationId: string;
  readonly hostApp: string;
  readonly connectorInstanceId: string;
  readonly organizationId?: string;
  readonly actorId?: string;
}

export interface ConnectorInvocationRequestV1 {
  readonly version: '1';
  readonly requestId: string;
  readonly remainingBudgetMs: number;
  readonly trustedContext: ConnectorInvocationTrustedContextV1;
  readonly operation: Readonly<{
    key: string;
    version: string;
    arguments: BoundedOperationArguments;
  }>;
  readonly connectorContextRef: string;
}

export interface ConnectorBindingBootstrapRequestV1<TProfileKey extends string, TPayload> {
  readonly version: '1';
  readonly requestId: string;
  readonly bootstrapProfileKey: TProfileKey;
  readonly trustedContext: ConnectorBindingTrustedContextV1;
  readonly providerPayload: ValidatedProviderPayload<TProfileKey, TPayload>;
}

export interface BindingBootstrapProfileContract<TProfileKey extends string, TPayload> {
  readonly profileKey: TProfileKey;
  readonly maxProviderPayloadBytes: number;
  readonly parseProviderPayload: (value: unknown) => ConnectorContractParseResult<TPayload>;
}

export interface ConnectorInvocationSuccessV1 {
  readonly version: '1';
  readonly requestId: string;
  readonly status: 'succeeded';
  readonly result: BoundedBusinessResult;
}

export interface ConnectorFailureV1 {
  readonly version: '1';
  readonly requestId: string;
  readonly status: 'failed';
  readonly error: Readonly<{ code: ConnectorErrorCode }>;
}

export type ConnectorInvocationResponseV1 = ConnectorInvocationSuccessV1 | ConnectorFailureV1;

export interface ConnectorBindingBootstrapSuccessV1 {
  readonly version: '1';
  readonly requestId: string;
  readonly connectorContextRef: string;
  readonly expiresIn: number;
}

export type ConnectorBindingBootstrapResponseV1 = ConnectorBindingBootstrapSuccessV1 | ConnectorFailureV1;
