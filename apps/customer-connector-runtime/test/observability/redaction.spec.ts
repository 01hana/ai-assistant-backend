import { ExactRawBodyAuthenticator } from '../../src/service-auth/exact-raw-body.authenticator';
import { SafeConnectorTelemetry } from '../../src/observability/safe-connector.telemetry';

describe('Customer Connector Runtime safe observability', () => {
  it('records only allowlisted service-auth metadata and never sensitive request material', async () => {
    const captures: unknown[] = [];
    const telemetry = new SafeConnectorTelemetry((event) => captures.push(event));
    const verifier = {
      verifySignature: jest.fn().mockResolvedValue({ ok: false, code: 'CONNECTOR_AUTH_FAILED' }),
      isFresh: jest.fn(),
      validateProfileAndContext: jest.fn()
    };
    const replay = { claim: jest.fn() };
    const authenticator = new ExactRawBodyAuthenticator(verifier as never, replay as never, telemetry);
    const token = 'eyJhbGciOiJSUzI1NiJ9.sensitive-proof-claims.signature';
    const raw = Buffer.from('{"providerPayload":"provider-secret-sentinel","customerId":"customer-secret"}');

    await expect(authenticator.authenticate({
      routeClass: 'binding-bootstrap', expectedProfileKey: 'safe-profile', method: 'POST',
      contentType: 'application/json', contentEncoding: undefined, authorization: `Bearer ${token}`, rawBody: raw
    })).resolves.toEqual({ ok: false, code: 'CONNECTOR_AUTH_FAILED' });

    expect(captures).toEqual([{ event: 'service_auth', outcome: 'rejected', routeClass: 'binding-bootstrap' }]);
    expect(JSON.stringify(captures)).not.toMatch(/sensitive|secret|customerId|providerPayload|eyJ/i);
  });

  it('bounds duration and exposes no general-purpose logging method', () => {
    const captures: unknown[] = [];
    const telemetry = new SafeConnectorTelemetry((event) => captures.push(event));
    telemetry.recordServiceAuthentication('accepted', 'central-invocation', 15);
    telemetry.recordServiceAuthentication('rejected', 'binding-bootstrap', Number.POSITIVE_INFINITY);

    expect(captures).toEqual([
      { event: 'service_auth', outcome: 'accepted', routeClass: 'central-invocation', durationMs: 15 },
      { event: 'service_auth', outcome: 'rejected', routeClass: 'binding-bootstrap' }
    ]);
    expect((telemetry as unknown as { log?: unknown }).log).toBeUndefined();
  });
});
