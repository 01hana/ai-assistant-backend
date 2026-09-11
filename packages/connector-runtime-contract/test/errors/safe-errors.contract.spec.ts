import { CONNECTOR_ERROR_CODES, isConnectorErrorCode, parseConnectorFailureV1 } from '../../src';

describe('Closed safe connector errors', () => {
  it('exports exactly the accepted 13 code-only categories', () => {
    expect(CONNECTOR_ERROR_CODES).toEqual([
      'CONNECTOR_REQUEST_INVALID', 'CONNECTOR_AUTH_FAILED', 'CONNECTOR_REPLAY_REJECTED',
      'CONNECTOR_CONTEXT_MISMATCH', 'CONNECTOR_BINDING_INVALID', 'CONNECTOR_BINDING_BUSY',
      'CONNECTOR_OPERATION_UNAVAILABLE', 'CONNECTOR_DESTINATION_REJECTED',
      'CONNECTOR_UPSTREAM_AUTH_FAILED', 'CONNECTOR_UPSTREAM_FAILED', 'CONNECTOR_RESPONSE_INVALID',
      'CONNECTOR_TIMEOUT', 'CONNECTOR_UNAVAILABLE'
    ]);
    expect(CONNECTOR_ERROR_CODES).toHaveLength(13);
  });

  it('accepts only a code and rejects details, messages, endpoints, and raw failures', () => {
    expect(parseConnectorFailureV1({ code: 'CONNECTOR_TIMEOUT' })).toEqual({ ok: true, value: { code: 'CONNECTOR_TIMEOUT' } });
    expect(parseConnectorFailureV1({ code: 'CONNECTOR_TIMEOUT', message: 'secret' }).ok).toBe(false);
    expect(parseConnectorFailureV1({ code: 'OTHER' }).ok).toBe(false);
    expect(isConnectorErrorCode('CONNECTOR_UNAVAILABLE')).toBe(true);
    expect(isConnectorErrorCode('secret')).toBe(false);
  });
});
