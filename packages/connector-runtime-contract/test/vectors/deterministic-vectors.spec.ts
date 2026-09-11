import { parseConnectorInvocationRequestV1, parseConnectorOperationManifestV1 } from '../../src';

describe('Deterministic shared contract vectors', () => {
  it('parses fixed invocation bytes to the complete expected bounded value', () => {
    const bytes = new TextEncoder().encode(JSON.stringify({
      version: '1', requestId: 'vector-request', remainingBudgetMs: 500,
      trustedContext: {
        customerId: 'customer-a', integrationId: 'integration-a', hostApp: 'host-a', organizationId: 'org-a', actorId: 'actor-a',
        connectorKey: 'inventory', connectorInstanceId: 'inventory-1'
      },
      operation: { key: 'inventory.lookup', version: '1.0.0', arguments: { sku: 'SKU-1' } }, connectorContextRef: 'ccr_vector'
    }));
    const parsed = parseConnectorInvocationRequestV1(bytes);
    expect(parsed).toEqual({
      ok: true,
      value: {
        version: '1',
        requestId: 'vector-request',
        remainingBudgetMs: 500,
        trustedContext: {
          customerId: 'customer-a',
          integrationId: 'integration-a',
          hostApp: 'host-a',
          organizationId: 'org-a',
          actorId: 'actor-a',
          connectorKey: 'inventory',
          connectorInstanceId: 'inventory-1'
        },
        operation: {
          key: 'inventory.lookup',
          version: '1.0.0',
          arguments: { sku: 'SKU-1' }
        },
        connectorContextRef: 'ccr_vector'
      }
    });
    if (!parsed.ok) return;
    expect(Object.isFrozen(parsed.value)).toBe(true);
    expect(Object.isFrozen(parsed.value.trustedContext)).toBe(true);
    expect(Object.isFrozen(parsed.value.operation)).toBe(true);
    expect(Object.isFrozen(parsed.value.operation.arguments)).toBe(true);
  });

  it('parses a fixed generic POST query manifest to the complete normalized value', () => {
    const input = {
      version: '1', connectorKey: 'inventory', operations: [{
        operationKey: 'inventory.stock-on-hand', contractVersion: '1.0.0',
        inputSchema: { type: 'object', properties: { sku: { type: 'string', minLength: 1, maxLength: 64 } }, required: ['sku'], additionalProperties: false },
        upstreamServiceRef: 'inventory-api', request: {
          profile: 'POST_QUERY_JSON_V1', path: '/inventory/stock/query', fixedBody: {},
          argumentMappings: [{ argument: 'sku', target: 'body', name: 'sku', scalarType: 'string' }]
        }, credentialProfileRef: 'inventory-credential-v1', readOnly: true,
        response: {
          acceptedHttpStatuses: [200], acceptedApplicationCodes: [200], contentType: 'application/json',
          schema: { type: 'object', properties: { quantity: { type: 'integer', minimum: 0 } }, required: ['quantity'], additionalProperties: false },
          extraction: [{ sourcePointer: '/quantity', targetField: 'quantity', conversion: 'non_negative_integer' }]
        }, limits: { maxRequestBytes: 4096, maxResponseBytes: 4096, maxDepth: 4, maxItems: 10, maxStringLength: 128, timeoutMs: 1000 },
        errorMap: {}, readinessDependency: 'inventory-api'
      }]
    };
    const parsed = parseConnectorOperationManifestV1(input);
    expect(parsed).toEqual({
      ok: true,
      value: {
        version: '1',
        connectorKey: 'inventory',
        operations: [{
          operationKey: 'inventory.stock-on-hand',
          contractVersion: '1.0.0',
          inputSchema: {
            type: 'object',
            properties: [{ name: 'sku', schema: { type: 'string', minLength: 1, maxLength: 64 } }],
            required: ['sku'],
            additionalProperties: false
          },
          upstreamServiceRef: 'inventory-api',
          request: {
            profile: 'POST_QUERY_JSON_V1',
            path: '/inventory/stock/query',
            fixedBody: [],
            argumentMappings: [{ argument: 'sku', target: 'body', name: 'sku', scalarType: 'string' }]
          },
          credentialProfileRef: 'inventory-credential-v1',
          readOnly: true,
          response: {
            acceptedHttpStatuses: [200],
            acceptedApplicationCodes: [200],
            contentType: 'application/json',
            schema: {
              type: 'object',
              properties: [{ name: 'quantity', schema: { type: 'integer', minimum: 0 } }],
              required: ['quantity'],
              additionalProperties: false
            },
            extraction: [{ sourcePointer: '/quantity', targetField: 'quantity', conversion: 'non_negative_integer' }]
          },
          limits: {
            maxRequestBytes: 4096,
            maxResponseBytes: 4096,
            maxDepth: 4,
            maxItems: 10,
            maxStringLength: 128,
            timeoutMs: 1000
          },
          errorMap: [],
          readinessDependency: 'inventory-api'
        }]
      }
    });
    if (!parsed.ok) return;
    const operation = parsed.value.operations[0];
    expect(Object.isFrozen(parsed.value)).toBe(true);
    expect(Object.isFrozen(parsed.value.operations)).toBe(true);
    expect(Object.isFrozen(operation)).toBe(true);
    expect(Object.isFrozen(operation?.inputSchema)).toBe(true);
    expect(Object.isFrozen(operation?.request)).toBe(true);
    expect(Object.isFrozen(operation?.response)).toBe(true);
    expect(Object.isFrozen(operation?.limits)).toBe(true);
    expect(Object.isFrozen(operation?.errorMap)).toBe(true);
  });
});
