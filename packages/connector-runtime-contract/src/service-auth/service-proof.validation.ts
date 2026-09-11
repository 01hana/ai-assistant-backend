import type { ConnectorContractParseResult } from '../wire';
import type {
  BindingBootstrapServiceProfileV1,
  CentralInvocationServiceProfileV1,
  ParsedBindingBootstrapServiceProofV1,
  ParsedCentralInvocationServiceProofV1,
  ServiceProofProtectedHeaderV1
} from './service-proof.types';

const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DIGEST = /^[A-Za-z0-9_-]{43}$/;
const SEMVER = /^[0-9]+\.[0-9]+\.[0-9]+$/;

export function parseCentralInvocationServiceProofV1(
  input: unknown,
  profile: CentralInvocationServiceProfileV1
): ConnectorContractParseResult<ParsedCentralInvocationServiceProofV1> {
  if (!validProfile(profile, 'central-invocation') || !isExactObject(input, ['protectedHeader', 'claims'])) return authFailure();
  const header = parseHeader(input.protectedHeader, profile);
  const claims = input.claims;
  const keys = ['iss', 'sub', 'aud', 'iat', 'nbf', 'exp', 'jti', 'proof_version', 'customer_id', 'integration_id', 'host_app',
    'connector_key', 'connector_instance_id', 'operation', 'operation_version', 'request_id', 'body_sha256'];
  if (!header || !isExactObject(claims, keys) || !validBaseClaims(claims, profile) ||
      !['customer_id', 'integration_id', 'host_app', 'connector_key', 'connector_instance_id', 'operation', 'request_id'].every((key) => isIdentifier(claims[key])) ||
      typeof claims.operation_version !== 'string' || !SEMVER.test(claims.operation_version)) return authFailure();
  return ok(deepFreeze({
    protectedHeader: header,
    claims,
    profile
  }) as unknown as ParsedCentralInvocationServiceProofV1);
}

export function parseBindingBootstrapServiceProofV1(
  input: unknown,
  profile: BindingBootstrapServiceProfileV1
): ConnectorContractParseResult<ParsedBindingBootstrapServiceProofV1> {
  if (!validProfile(profile, 'binding-bootstrap') || !isIdentifier(profile.providerKey) || !isExactObject(input, ['protectedHeader', 'claims'])) return authFailure();
  const header = parseHeader(input.protectedHeader, profile);
  const claims = input.claims;
  const required = ['iss', 'sub', 'aud', 'iat', 'nbf', 'exp', 'jti', 'proof_version', 'customer_id', 'integration_id', 'host_app',
    'connector_instance_id', 'bootstrap_profile_key', 'provider_key', 'request_id', 'body_sha256'];
  const optional = ['organization_id', 'actor_id'];
  if (!header || !isObjectWithKeys(claims, required, optional) || !validBaseClaims(claims, profile) ||
      !['customer_id', 'integration_id', 'host_app', 'connector_instance_id', 'bootstrap_profile_key', 'provider_key', 'request_id'].every((key) => isIdentifier(claims[key])) ||
      !optional.every((key) => claims[key] === undefined || isIdentifier(claims[key])) ||
      claims.bootstrap_profile_key !== profile.profileKey || claims.provider_key !== profile.providerKey) return authFailure();
  return ok(deepFreeze({
    protectedHeader: header,
    claims,
    profile,
    trustedContext: {
      customerId: claims.customer_id, integrationId: claims.integration_id, hostApp: claims.host_app,
      connectorInstanceId: claims.connector_instance_id,
      ...(claims.organization_id === undefined ? {} : { organizationId: claims.organization_id }),
      ...(claims.actor_id === undefined ? {} : { actorId: claims.actor_id })
    }
  }) as unknown as ParsedBindingBootstrapServiceProofV1);
}

function parseHeader(value: unknown, profile: CentralInvocationServiceProfileV1 | BindingBootstrapServiceProfileV1): ServiceProofProtectedHeaderV1 | undefined {
  if (!isExactObject(value, ['alg', 'kid', 'typ']) || value.alg !== 'RS256' || value.typ !== profile.typ ||
      !isIdentifier(value.kid) || !profile.acceptedKids.includes(value.kid)) return undefined;
  return deepFreeze(value) as unknown as ServiceProofProtectedHeaderV1;
}

function validBaseClaims(claims: { readonly [key: string]: unknown }, profile: CentralInvocationServiceProfileV1 | BindingBootstrapServiceProfileV1): boolean {
  return claims.iss === profile.issuer && claims.sub === profile.subject && claims.aud === profile.audience &&
    Number.isInteger(claims.iat) && claims.nbf === claims.iat && claims.exp === (claims.iat as number) + 30 &&
    typeof claims.jti === 'string' && UUID.test(claims.jti) && claims.proof_version === 1 &&
    typeof claims.body_sha256 === 'string' && DIGEST.test(claims.body_sha256);
}

function validProfile(profile: CentralInvocationServiceProfileV1 | BindingBootstrapServiceProfileV1, kind: string): boolean {
  return profile.kind === kind && [profile.profileKey, profile.subject, profile.keyDomain].every(isIdentifier) &&
    [profile.typ, profile.issuer, profile.audience].every(isBoundedProfileValue) &&
    Array.isArray(profile.acceptedKids) && profile.acceptedKids.length > 0 && new Set(profile.acceptedKids).size === profile.acceptedKids.length && profile.acceptedKids.every(isIdentifier);
}

function isIdentifier(value: unknown): value is string { return typeof value === 'string' && IDENTIFIER.test(value); }
function isBoundedProfileValue(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 256 && !/[\s\0]/.test(value);
}
function isPlainObject(value: unknown): value is { readonly [key: string]: unknown } {
  return !!value && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
}
function isExactObject(value: unknown, keys: readonly string[]): value is { readonly [key: string]: unknown } {
  return isPlainObject(value) && Object.keys(value).length === keys.length && keys.every((key) => key in value);
}
function isObjectWithKeys(value: unknown, required: readonly string[], optional: readonly string[]): value is { readonly [key: string]: unknown } {
  if (!isPlainObject(value) || !required.every((key) => key in value)) return false;
  const allowed = new Set([...required, ...optional]);
  return Object.keys(value).every((key) => allowed.has(key));
}
function authFailure(): Readonly<{ ok: false; code: 'CONNECTOR_AUTH_FAILED' }> { return Object.freeze({ ok: false, code: 'CONNECTOR_AUTH_FAILED' }); }
function ok<T>(value: T): ConnectorContractParseResult<T> { return Object.freeze({ ok: true, value }); }
function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as object)) deepFreeze(child);
  }
  return value;
}
