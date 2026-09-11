import { createHash, timingSafeEqual } from 'node:crypto';
import { CONNECTOR_LIMITS_V1, type ConnectorErrorCode } from '@internal-ai-assistant/connector-runtime-contract';
import type { RuntimeProfileKind } from '../config/runtime-configuration';
import type { SafeConnectorTelemetry } from '../observability/safe-connector.telemetry';
import type { ReplayProtectionService } from '../replay/replay-protection.service';
import type { ConnectorServiceProofVerifier, VerifiedServiceProof } from './service-proof.verifier';

export type ExactRawBodyAuthenticationInput = Readonly<{
  routeClass: RuntimeProfileKind;
  method: string;
  contentType?: string;
  contentEncoding?: string;
  authorization?: string;
  rawBody: Uint8Array;
  expectedProfileKey?: string;
}>;

export type ExactRawBodyAuthenticationResult =
  | Readonly<{ ok: true; value: Readonly<{ proof: VerifiedServiceProof }> }>
  | Readonly<{ ok: false; code: Extract<ConnectorErrorCode, 'CONNECTOR_REQUEST_INVALID' | 'CONNECTOR_AUTH_FAILED' | 'CONNECTOR_REPLAY_REJECTED'> }>;

export class ExactRawBodyAuthenticator {
  constructor(
    private readonly verifier: Pick<ConnectorServiceProofVerifier, 'verifySignature' | 'isFresh' | 'validateProfileAndContext'>,
    private readonly replay: Pick<ReplayProtectionService, 'claim'>,
    private readonly telemetry?: Pick<SafeConnectorTelemetry, 'recordServiceAuthentication'>
  ) {}

  async authenticate(input: ExactRawBodyAuthenticationInput): Promise<ExactRawBodyAuthenticationResult> {
    if (!validTransport(input)) return this.rejected(input.routeClass, requestFailure());
    const token = bearer(input.authorization);
    if (!token) return this.rejected(input.routeClass, authFailure());
    const signature = await this.verifier.verifySignature(input.routeClass, token, input.expectedProfileKey);
    if (!signature.ok || !digestMatches(input.rawBody, signature.value.claims.body_sha256)) return this.rejected(input.routeClass, authFailure());
    if (!this.verifier.isFresh(signature.value)) return this.rejected(input.routeClass, authFailure());
    const jti = signature.value.claims.jti;
    const expiresAt = signature.value.claims.exp;
    if (typeof jti !== 'string' || !Number.isInteger(expiresAt)) return this.rejected(input.routeClass, authFailure());
    const claim = this.replay.claim(jti, (expiresAt as number) + 5);
    if (!claim.ok) return this.rejected(input.routeClass, Object.freeze({ ok: false, code: 'CONNECTOR_REPLAY_REJECTED' }));
    const verified = this.verifier.validateProfileAndContext(signature.value);
    if (!verified.ok) return this.rejected(input.routeClass, authFailure());
    this.telemetry?.recordServiceAuthentication('accepted', input.routeClass);
    return Object.freeze({ ok: true, value: Object.freeze({ proof: verified.value }) });
  }

  private rejected(routeClass: RuntimeProfileKind, result: ExactRawBodyAuthenticationResult): ExactRawBodyAuthenticationResult {
    this.telemetry?.recordServiceAuthentication('rejected', routeClass);
    return result;
  }
}

function validTransport(input: ExactRawBodyAuthenticationInput): boolean {
  return input.method === 'POST' && input.contentType === 'application/json' && input.contentEncoding === undefined &&
    input.rawBody instanceof Uint8Array && input.rawBody.byteLength > 0 &&
    input.rawBody.byteLength <= CONNECTOR_LIMITS_V1.invocationRequestBytes;
}

function bearer(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.startsWith('Bearer ') || value.length > 16_391) return undefined;
  const token = value.slice(7);
  return token && token.split('.').length === 3 && !/\s/.test(token) ? token : undefined;
}

function digestMatches(rawBody: Uint8Array, expectedBase64url: unknown): boolean {
  try {
    if (typeof expectedBase64url !== 'string') return false;
    const actual = createHash('sha256').update(rawBody).digest();
    const expected = Buffer.from(expectedBase64url, 'base64url');
    return expected.length === actual.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function requestFailure(): ExactRawBodyAuthenticationResult {
  return Object.freeze({ ok: false, code: 'CONNECTOR_REQUEST_INVALID' });
}
function authFailure(): ExactRawBodyAuthenticationResult {
  return Object.freeze({ ok: false, code: 'CONNECTOR_AUTH_FAILED' });
}
