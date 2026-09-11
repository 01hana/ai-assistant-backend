import {
  parseConnectorBindingBootstrapRequestV1,
  parseConnectorInvocationRequestV1,
  type BindingBootstrapProfileContract,
  type ConnectorBindingBootstrapRequestV1,
  type ConnectorInvocationRequestV1
} from '../../src';

const encoder = new TextEncoder();

describe('Generic wire structural prohibitions', () => {
  it('rejects every routing, credential, execution, and side-effect control at runtime', () => {
    const base = {
      version: '1', requestId: '5a8271fb-1127-421c-83eb-3dc6b512db50', remainingBudgetMs: 1_000,
      trustedContext: {
        customerId: 'a', integrationId: 'b', hostApp: 'c', organizationId: 'd', actorId: 'e', connectorKey: 'f', connectorInstanceId: 'g'
      },
      operation: { key: 'inventory.lookup', version: '1.0.0', arguments: {} }, connectorContextRef: 'ccr_safe'
    };
    for (const [name, value] of Object.entries({
      url: 'https://unsafe.invalid', method: 'GET', path: '/unsafe', query: {}, headers: {}, body: {}, credential: 'secret',
      callback: 'run', template: '${input}', script: 'fetch()', sql: 'select 1', shell: 'echo', command: 'run', sideEffect: true
    })) {
      expect(parseConnectorInvocationRequestV1(encoder.encode(JSON.stringify({ ...base, [name]: value }))).ok).toBe(false);
    }
  });

  it('does not expose unbounded operation arguments as an accepted invocation', () => {
    // @ts-expect-error wire arguments must be bounded and parser-produced, not directly constructed as an open JSON bag
    const unsafe: ConnectorInvocationRequestV1 = { version: '1', requestId: 'request-1', remainingBudgetMs: 1000, trustedContext: { customerId: 'a', integrationId: 'b', hostApp: 'c', organizationId: 'd', actorId: 'e', connectorKey: 'f', connectorInstanceId: 'g' }, operation: { key: 'inventory.lookup', version: '1.0.0', arguments: { url: 'https://unsafe.invalid' } }, connectorContextRef: 'ccr_safe' };
    expect(unsafe.operation.arguments).toBeDefined();
  });

  it('does not expose provider-specific credential fields as a generic accepted payload', () => {
    // @ts-expect-error accepted provider payloads are profile-validated opaque values
    const unsafe: ConnectorBindingBootstrapRequestV1<'profile-a', { nativeAccessToken: string }> = { version: '1', requestId: 'request-1', bootstrapProfileKey: 'profile-a', trustedContext: { customerId: 'a', integrationId: 'b', hostApp: 'c', connectorInstanceId: 'd' }, providerPayload: { nativeAccessToken: 'secret' } };
    expect(unsafe.providerPayload).toBeDefined();
  });

  it('keeps cross-profile dispatch closed before a provider callback', () => {
    let calls = 0;
    const profile: BindingBootstrapProfileContract<'profile-a', Readonly<{ code: string }>> = {
      profileKey: 'profile-a', maxProviderPayloadBytes: 64,
      parseProviderPayload() { calls += 1; return { ok: true, value: Object.freeze({ code: 'safe' }) }; }
    };
    const bytes = encoder.encode(JSON.stringify({
      version: '1', requestId: 'request-1', bootstrapProfileKey: 'profile-b',
      trustedContext: { customerId: 'a', integrationId: 'b', hostApp: 'c', connectorInstanceId: 'd' }, providerPayload: { code: 'safe' }
    }));
    expect(parseConnectorBindingBootstrapRequestV1(bytes, profile).ok).toBe(false);
    expect(calls).toBe(0);
  });
});
