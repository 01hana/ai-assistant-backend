export const CONNECTOR_ERROR_CODES = Object.freeze([
  'CONNECTOR_REQUEST_INVALID',
  'CONNECTOR_AUTH_FAILED',
  'CONNECTOR_REPLAY_REJECTED',
  'CONNECTOR_CONTEXT_MISMATCH',
  'CONNECTOR_BINDING_INVALID',
  'CONNECTOR_BINDING_BUSY',
  'CONNECTOR_OPERATION_UNAVAILABLE',
  'CONNECTOR_DESTINATION_REJECTED',
  'CONNECTOR_UPSTREAM_AUTH_FAILED',
  'CONNECTOR_UPSTREAM_FAILED',
  'CONNECTOR_RESPONSE_INVALID',
  'CONNECTOR_TIMEOUT',
  'CONNECTOR_UNAVAILABLE'
] as const);

export type ConnectorErrorCode = (typeof CONNECTOR_ERROR_CODES)[number];
export interface SafeConnectorFailureV1 { readonly code: ConnectorErrorCode }

const CODE_SET = new Set<string>(CONNECTOR_ERROR_CODES);

export function isConnectorErrorCode(value: unknown): value is ConnectorErrorCode {
  return typeof value === 'string' && CODE_SET.has(value);
}

export function parseConnectorFailureV1(value: unknown):
  | Readonly<{ ok: true; value: SafeConnectorFailureV1 }>
  | Readonly<{ ok: false; code: 'CONNECTOR_REQUEST_INVALID' }> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return failure();
  const entries = Object.entries(value);
  if (entries.length !== 1 || entries[0]?.[0] !== 'code' || !isConnectorErrorCode(entries[0][1])) return failure();
  return Object.freeze({ ok: true, value: Object.freeze({ code: entries[0][1] }) });
}

function failure(): Readonly<{ ok: false; code: 'CONNECTOR_REQUEST_INVALID' }> {
  return Object.freeze({ ok: false, code: 'CONNECTOR_REQUEST_INVALID' });
}
