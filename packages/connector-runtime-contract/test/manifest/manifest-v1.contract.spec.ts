import { parseConnectorOperationManifestV1 } from '../../src';

const emptyInputSchema = {
  type: 'object', properties: {}, required: [], additionalProperties: false
};

const limits = {
  maxRequestBytes: 4_096, maxResponseBytes: 262_144, maxDepth: 8,
  maxItems: 100, maxStringLength: 1_024, timeoutMs: 3_500
};

function manifest(operations: readonly object[]) {
  return { version: '1', connectorKey: 'productized-business', operations };
}

const getOperation = {
  operationKey: 'work-orders.monthly-new-count',
  contractVersion: '1.0.0',
  inputSchema: emptyInputSchema,
  upstreamServiceRef: 'reference-api',
  request: {
    profile: 'GET_QUERY_V1',
    path: '/Dashboard/KPIStats',
    fixedQuery: { TimeRange: 'thisMonth' },
    argumentMappings: []
  },
  credentialProfileRef: 'reference-credential-v1',
  readOnly: true,
  response: {
    acceptedHttpStatuses: [200], acceptedApplicationCodes: [200], contentType: 'application/json',
    schema: {
      type: 'object', properties: { data: { type: 'object', properties: { count: { type: 'integer', minimum: 0 } }, required: ['count'], additionalProperties: false } },
      required: ['data'], additionalProperties: false
    },
    extraction: [{ sourcePointer: '/data/count', targetField: 'count', conversion: 'non_negative_integer' }]
  },
  limits,
  errorMap: { AUTH: 'CONNECTOR_UPSTREAM_AUTH_FAILED' },
  readinessDependency: 'reference-api'
};

const customerBOperation = {
  operationKey: 'inventory.stock-on-hand',
  contractVersion: '1.0.0',
  inputSchema: {
    type: 'object', properties: { sku: { type: 'string', minLength: 1, maxLength: 64 } }, required: ['sku'], additionalProperties: false
  },
  upstreamServiceRef: 'inventory-api',
  request: {
    profile: 'POST_QUERY_JSON_V1',
    path: '/inventory/stock/query',
    fixedBody: {},
    argumentMappings: [{ argument: 'sku', target: 'body', name: 'sku', scalarType: 'string' }]
  },
  credentialProfileRef: 'customer-b-inventory-api-key-v1',
  readOnly: true,
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
  limits,
  errorMap: { AUTH: 'CONNECTOR_UPSTREAM_AUTH_FAILED' },
  readinessDependency: 'inventory-api'
};

describe('Connector operation manifest V1', () => {
  it('accepts immutable GET_QUERY_V1 and POST_QUERY_JSON_V1 operations', () => {
    const parsed = parseConnectorOperationManifestV1(manifest([getOperation, customerBOperation]));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.operations.map((operation) => operation.request.profile)).toEqual(['GET_QUERY_V1', 'POST_QUERY_JSON_V1']);
    expect(Object.isFrozen(parsed.value.operations)).toBe(true);
    expect(Object.isFrozen(parsed.value.operations[1]?.request)).toBe(true);
  });

  it('represents Customer B without credential header behavior in the manifest', () => {
    const parsed = parseConnectorOperationManifestV1(manifest([customerBOperation]));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const operation = parsed.value.operations[0];
    expect(operation?.operationKey).toBe('inventory.stock-on-hand');
    expect(operation?.credentialProfileRef).toBe('customer-b-inventory-api-key-v1');
    expect(JSON.stringify(operation)).not.toMatch(/X-Inventory-Key|apiKey|authorization/i);
  });

  it.each([
    ['version', { ...customerBOperation, contractVersion: '*' }],
    ['side effects', { ...customerBOperation, readOnly: false }],
    ['arbitrary method', { ...customerBOperation, request: { ...customerBOperation.request, method: 'DELETE' } }],
    ['absolute URL', { ...customerBOperation, request: { ...customerBOperation.request, path: 'https://attacker.invalid/x' } }],
    ['path traversal', { ...customerBOperation, request: { ...customerBOperation.request, path: '/../secret' } }],
    ['header', { ...customerBOperation, request: { ...customerBOperation.request, headers: { Authorization: 'secret' } } }],
    ['unrestricted body', { ...customerBOperation, request: { ...customerBOperation.request, body: { arbitrary: true } } }],
    ['template', { ...customerBOperation, request: { ...customerBOperation.request, template: '${input}' } }],
    ['callback', { ...customerBOperation, callback: 'execute' }],
    ['script', { ...customerBOperation, script: 'fetch(url)' }],
    ['SQL', { ...customerBOperation, sql: 'select *' }],
    ['shell', { ...customerBOperation, shell: 'echo unsafe' }],
    ['command', { ...customerBOperation, command: 'run' }],
    ['credential', { ...customerBOperation, credential: 'secret' }]
  ])('rejects %s configuration', (_label, operation) => {
    expect(parseConnectorOperationManifestV1(manifest([operation])).ok).toBe(false);
  });

  it('rejects profile-invalid fields and mappings', () => {
    expect(parseConnectorOperationManifestV1(manifest([{ ...getOperation, request: { ...getOperation.request, fixedBody: {} } }])).ok).toBe(false);
    expect(parseConnectorOperationManifestV1(manifest([{ ...customerBOperation, request: { ...customerBOperation.request, fixedQuery: {} } }])).ok).toBe(false);
    expect(parseConnectorOperationManifestV1(manifest([{ ...customerBOperation, request: {
      ...customerBOperation.request, argumentMappings: [{ argument: 'sku', target: 'header', name: 'X-Key', scalarType: 'string' }]
    } }])).ok).toBe(false);
  });

  it('rejects duplicate operation/version pairs, unknown fields, unsafe schemas, and excessive limits', () => {
    expect(parseConnectorOperationManifestV1(manifest([customerBOperation, customerBOperation])).ok).toBe(false);
    expect(parseConnectorOperationManifestV1({ ...manifest([customerBOperation]), url: 'unsafe' }).ok).toBe(false);
    expect(parseConnectorOperationManifestV1(manifest([{ ...customerBOperation, inputSchema: { ...customerBOperation.inputSchema, additionalProperties: true } }])).ok).toBe(false);
    expect(parseConnectorOperationManifestV1(manifest([{ ...customerBOperation, limits: { ...limits, maxDepth: 9 } }])).ok).toBe(false);
  });
});
