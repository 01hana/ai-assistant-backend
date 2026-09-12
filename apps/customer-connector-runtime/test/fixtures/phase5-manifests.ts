import {
  parseConnectorInvocationRequestV1,
  parseConnectorOperationManifestV1,
  type BoundedOperationArguments,
  type ConnectorOperationManifestV1
} from '@internal-ai-assistant/connector-runtime-contract';

export const PHASE5_LIMITS = Object.freeze({
  maxRequestBytes: 4_096, maxResponseBytes: 262_144, maxDepth: 8,
  maxItems: 100, maxStringLength: 1_024, timeoutMs: 3_500
});

export function getOperation(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    operationKey: 'metrics.current', contractVersion: '1.0.0',
    inputSchema: {
      type: 'object', properties: { region: { type: 'string', minLength: 2, maxLength: 8 } },
      required: ['region'], additionalProperties: false
    },
    upstreamServiceRef: 'metrics-api',
    request: {
      profile: 'GET_QUERY_V1', path: '/metrics/current', fixedQuery: { period: 'month' },
      argumentMappings: [{ argument: 'region', target: 'query', name: 'region', scalarType: 'string' }]
    },
    credentialProfileRef: 'metrics-bearer-v1', readOnly: true,
    response: {
      acceptedHttpStatuses: [200], acceptedApplicationCodes: [200], contentType: 'application/json',
      schema: {
        type: 'object', properties: { value: { type: 'integer', minimum: 0 } }, required: ['value'], additionalProperties: false
      },
      extraction: [{ sourcePointer: '/value', targetField: 'value', conversion: 'non_negative_integer' }]
    },
    limits: PHASE5_LIMITS, errorMap: {}, readinessDependency: 'metrics-api', ...overrides
  };
}

export function customerBOperation(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    operationKey: 'inventory.stock-on-hand', contractVersion: '1.0.0',
    inputSchema: {
      type: 'object', properties: { sku: { type: 'string', minLength: 1, maxLength: 64 } },
      required: ['sku'], additionalProperties: false
    },
    upstreamServiceRef: 'inventory-api',
    request: {
      profile: 'POST_QUERY_JSON_V1', path: '/inventory/stock/query', fixedBody: { scope: 'available' },
      argumentMappings: [{ argument: 'sku', target: 'body', name: 'sku', scalarType: 'string' }]
    },
    credentialProfileRef: 'customer-b-inventory-api-key-v1', readOnly: true,
    response: {
      acceptedHttpStatuses: [200], acceptedApplicationCodes: [200], contentType: 'application/json',
      schema: {
        type: 'object', properties: { sku: { type: 'string' }, quantity: { type: 'integer', minimum: 0 } },
        required: ['sku', 'quantity'], additionalProperties: false
      },
      extraction: [
        { sourcePointer: '/sku', targetField: 'sku', conversion: 'string' },
        { sourcePointer: '/quantity', targetField: 'quantity', conversion: 'non_negative_integer' }
      ]
    },
    limits: PHASE5_LIMITS, errorMap: {}, readinessDependency: 'inventory-api', ...overrides
  };
}

export function parsedManifest(connectorKey: string, operations: readonly Record<string, unknown>[]): ConnectorOperationManifestV1 {
  const parsed = parseConnectorOperationManifestV1({ version: '1', connectorKey, operations });
  if (!parsed.ok) throw new Error('Invalid Phase 5 test manifest fixture.');
  return parsed.value;
}

export function boundedArguments(value: object): BoundedOperationArguments {
  const parsed = parseConnectorInvocationRequestV1(Buffer.from(JSON.stringify({
    version: '1', requestId: 'req-phase5-0001', remainingBudgetMs: 1_000,
    trustedContext: {
      customerId: 'customer-b', integrationId: 'inventory-b', hostApp: 'customer-b-inventory',
      organizationId: 'org-b', actorId: 'actor-b', connectorKey: 'inventory', connectorInstanceId: 'inventory-1'
    },
    operation: { key: 'inventory.stock-on-hand', version: '1.0.0', arguments: value },
    connectorContextRef: `ccr_${'A'.repeat(43)}`
  }), 'utf8'));
  if (!parsed.ok) throw new Error('Invalid bounded argument fixture.');
  return parsed.value.operation.arguments;
}
