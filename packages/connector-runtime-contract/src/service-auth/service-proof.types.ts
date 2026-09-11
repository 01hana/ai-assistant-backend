import type { ConnectorBindingTrustedContextV1 } from '../wire';

interface ServiceProfileBaseV1 {
  readonly profileKey: string;
  readonly typ: string;
  readonly issuer: string;
  readonly subject: string;
  readonly audience: string;
  readonly keyDomain: string;
  readonly acceptedKids: readonly string[];
}

export interface CentralInvocationServiceProfileV1 extends ServiceProfileBaseV1 {
  readonly kind: 'central-invocation';
}

export interface BindingBootstrapServiceProfileV1 extends ServiceProfileBaseV1 {
  readonly kind: 'binding-bootstrap';
  readonly providerKey: string;
}

export interface ServiceProofProtectedHeaderV1 {
  readonly alg: 'RS256';
  readonly kid: string;
  readonly typ: string;
}

export interface CentralInvocationServiceProofClaimsV1 {
  readonly iss: string;
  readonly sub: string;
  readonly aud: string;
  readonly iat: number;
  readonly nbf: number;
  readonly exp: number;
  readonly jti: string;
  readonly proof_version: 1;
  readonly customer_id: string;
  readonly integration_id: string;
  readonly host_app: string;
  readonly connector_key: string;
  readonly connector_instance_id: string;
  readonly operation: string;
  readonly operation_version: string;
  readonly request_id: string;
  readonly body_sha256: string;
}

export interface BindingBootstrapServiceProofClaimsV1 {
  readonly iss: string;
  readonly sub: string;
  readonly aud: string;
  readonly iat: number;
  readonly nbf: number;
  readonly exp: number;
  readonly jti: string;
  readonly proof_version: 1;
  readonly customer_id: string;
  readonly integration_id: string;
  readonly host_app: string;
  readonly connector_instance_id: string;
  readonly organization_id?: string;
  readonly actor_id?: string;
  readonly bootstrap_profile_key: string;
  readonly provider_key: string;
  readonly request_id: string;
  readonly body_sha256: string;
}

export interface ParsedCentralInvocationServiceProofV1 {
  readonly protectedHeader: ServiceProofProtectedHeaderV1;
  readonly claims: CentralInvocationServiceProofClaimsV1;
  readonly profile: CentralInvocationServiceProfileV1;
}

export interface ParsedBindingBootstrapServiceProofV1 {
  readonly protectedHeader: ServiceProofProtectedHeaderV1;
  readonly claims: BindingBootstrapServiceProofClaimsV1;
  readonly profile: BindingBootstrapServiceProfileV1;
  readonly trustedContext: ConnectorBindingTrustedContextV1;
}
