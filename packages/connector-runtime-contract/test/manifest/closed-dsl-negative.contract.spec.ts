import {
  parseConnectorOperationManifestV1,
  type GetQueryRequestProfileV1,
  type PostQueryJsonRequestProfileV1
} from '../../src';

describe('Closed manifest DSL structural prohibitions', () => {
  it('does not allow direct construction of an arbitrary GET path/query', () => {
    // @ts-expect-error accepted paths and fixed query values must be parser-produced closed values
    const unsafe: GetQueryRequestProfileV1 = { profile: 'GET_QUERY_V1', path: 'https://unsafe.invalid/anything', fixedQuery: { url: 'https://unsafe.invalid' }, argumentMappings: [] };
    expect(unsafe.profile).toBe('GET_QUERY_V1');
  });

  it('does not allow direct construction of an arbitrary POST body', () => {
    // @ts-expect-error accepted fixed bodies must be parser-produced closed values
    const unsafe: PostQueryJsonRequestProfileV1 = { profile: 'POST_QUERY_JSON_V1', path: '/anything', fixedBody: { command: 'run' }, argumentMappings: [] };
    expect(unsafe.profile).toBe('POST_QUERY_JSON_V1');
  });

  it.each(['PUT_QUERY_V1', 'DELETE_QUERY_V1', 'GENERIC_HTTP_V1', 'SQL_V1', 'COMMAND_V1'])('rejects unsupported profile %s', (profile) => {
    expect(parseConnectorOperationManifestV1({
      version: '1', connectorKey: 'generic', operations: [{
        operationKey: 'unsafe.execute', contractVersion: '1.0.0',
        inputSchema: { type: 'object', properties: {}, required: [], additionalProperties: false },
        upstreamServiceRef: 'unsafe', request: { profile, path: '/unsafe', fixedBody: {}, argumentMappings: [] },
        credentialProfileRef: 'credential-v1', readOnly: true,
        response: {
          acceptedHttpStatuses: [200], acceptedApplicationCodes: [200], contentType: 'application/json',
          schema: { type: 'object', properties: {}, required: [], additionalProperties: false },
          extraction: [{ sourcePointer: '/value', targetField: 'value', conversion: 'string' }]
        },
        limits: { maxRequestBytes: 1, maxResponseBytes: 1, maxDepth: 1, maxItems: 1, maxStringLength: 1, timeoutMs: 1 },
        errorMap: {}, readinessDependency: 'unsafe'
      }]
    }).ok).toBe(false);
  });
});
