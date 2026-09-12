import { chmodSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ManifestFileLoader } from '../../src/manifest/manifest-file.loader';
import { createCustomerConnectorRuntimeApplication } from '../../src/main';
import { RuntimeReadinessRegistry } from '../../src/health/readiness.service';
import { validRuntimeEnvironment } from '../fixtures/runtime-environment';
import { credentialFixtures, profileConfigurations } from '../fixtures/phase5-credentials';
import { customerBOperation } from '../fixtures/phase5-manifests';

const emptySchema = { type: 'object', properties: {}, required: [], additionalProperties: false };
const responseSchema = {
  type: 'object', properties: { value: { type: 'integer', minimum: 0 } }, required: ['value'], additionalProperties: false
};
const limits = {
  maxRequestBytes: 4_096, maxResponseBytes: 262_144, maxDepth: 8,
  maxItems: 100, maxStringLength: 1_024, timeoutMs: 3_500
};

function operation(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    operationKey: 'metrics.current', contractVersion: '1.0.0', inputSchema: emptySchema,
    upstreamServiceRef: 'metrics-api',
    request: { profile: 'GET_QUERY_V1', path: '/metrics/current', fixedQuery: {}, argumentMappings: [] },
    credentialProfileRef: 'metrics-credential-v1', readOnly: true,
    response: {
      acceptedHttpStatuses: [200], acceptedApplicationCodes: [200], contentType: 'application/json',
      schema: responseSchema,
      extraction: [{ sourcePointer: '/value', targetField: 'value', conversion: 'non_negative_integer' }]
    },
    limits, errorMap: {}, readinessDependency: 'metrics-api', ...overrides
  };
}

function manifest(operations: readonly Record<string, unknown>[] = [operation()]): Record<string, unknown> {
  return { version: '1', connectorKey: 'metrics', operations };
}

function fileFor(value: unknown, mode = 0o444): string {
  const directory = mkdtempSync(join(tmpdir(), 'connector-manifest-'));
  const path = join(directory, 'connector-manifest.v1.json');
  writeFileSync(path, JSON.stringify(value), { mode: 0o600 });
  chmodSync(path, mode);
  return path;
}

describe('ManifestFileLoader', () => {
  it('loads a regular read-only absolute manifest and deeply freezes the complete registry input', () => {
    const loaded = new ManifestFileLoader().load([fileFor(manifest())]);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.value).toHaveLength(1);
    expect(Object.isFrozen(loaded.value)).toBe(true);
    expect(Object.isFrozen(loaded.value[0]?.operations[0]?.request)).toBe(true);
  });

  it('rejects non-absolute, writable, symlink, missing, malformed, and partially valid sources atomically', () => {
    const valid = fileFor(manifest());
    const malformed = fileFor('{not-json');
    const writable = fileFor(manifest(), 0o644);
    const link = join(mkdtempSync(join(tmpdir(), 'connector-manifest-link-')), 'manifest.json');
    symlinkSync(valid, link);
    const loader = new ManifestFileLoader();
    for (const paths of [['relative.json'], [writable], [link], ['/missing/connector-manifest.json'], [malformed], [valid, malformed]]) {
      expect(loader.load(paths)).toEqual({ ok: false, code: 'CONNECTOR_UNAVAILABLE' });
    }
  });

  it('rejects duplicate connector/operation/version identities across files', () => {
    expect(new ManifestFileLoader().load([fileFor(manifest()), fileFor(manifest())])).toEqual({
      ok: false, code: 'CONNECTOR_UNAVAILABLE'
    });
  });

  it('loads configured manifests and credential registrations during Nest startup while business readiness stays false', async () => {
    const path = fileFor({ version: '1', connectorKey: 'inventory', operations: [customerBOperation()] });
    const environment = {
      ...validRuntimeEnvironment(),
      CONNECTOR_MANIFEST_FILES: JSON.stringify([path]),
      CONNECTOR_CREDENTIAL_PROFILES_JSON: JSON.stringify(profileConfigurations)
    };
    const fixtures = credentialFixtures();
    const app = await createCustomerConnectorRuntimeApplication(environment, [], {
      credentialProviders: [fixtures.bearerProvider, fixtures.apiKeyProvider],
      credentialStrategies: [fixtures.bearerStrategy, fixtures.apiKeyStrategy]
    });
    await app.init();
    try {
      expect(app.get(RuntimeReadinessRegistry).snapshot()).toMatchObject({
        manifest: true, credentialProfiles: true, requestProfiles: true,
        upstream: false, invocationRoute: false
      });
    } finally {
      await app.close();
    }
  });

  it.each([
    ['duplicate operation', manifest([operation(), operation()])],
    ['unknown field', { ...manifest(), unexpected: true }],
    ['wildcard operation', manifest([operation({ operationKey: '*' })])],
    ['callback', manifest([operation({ callback: 'run' })])],
    ['template', manifest([operation({ template: '${input}' })])],
    ['script', manifest([operation({ script: 'fetch(url)' })])],
    ['SQL', manifest([operation({ sql: 'select *' })])],
    ['shell', manifest([operation({ shell: 'echo unsafe' })])],
    ['command', manifest([operation({ command: 'run' })])],
    ['dynamic URL', manifest([operation({ request: { profile: 'GET_QUERY_V1', path: 'https://unsafe.invalid', fixedQuery: {}, argumentMappings: [] } })])],
    ['dynamic method', manifest([operation({ request: { profile: 'GET_QUERY_V1', path: '/safe', fixedQuery: {}, argumentMappings: [], method: 'DELETE' } })])],
    ['dynamic path', manifest([operation({ request: { profile: 'GET_QUERY_V1', path: '/${path}', fixedQuery: {}, argumentMappings: [] } })])],
    ['unrestricted query', manifest([operation({ request: { profile: 'GET_QUERY_V1', path: '/safe', fixedQuery: {}, argumentMappings: [], query: {} } })])],
    ['header', manifest([operation({ request: { profile: 'GET_QUERY_V1', path: '/safe', fixedQuery: {}, argumentMappings: [], headers: {} } })])],
    ['body', manifest([operation({ request: { profile: 'GET_QUERY_V1', path: '/safe', fixedQuery: {}, argumentMappings: [], body: {} } })])],
    ['traversal', manifest([operation({ request: { profile: 'GET_QUERY_V1', path: '/../secret', fixedQuery: {}, argumentMappings: [] } })])],
    ['unsupported profile', manifest([operation({ request: { profile: 'GENERIC_HTTP_V1', path: '/safe', fixedQuery: {}, argumentMappings: [] } })])],
    ['write classification', manifest([operation({ readOnly: false })])],
    ['excessive limit', manifest([operation({ limits: { ...limits, maxDepth: 9 } })])]
  ])('rejects %s configuration', (_case, value) => {
    expect(new ManifestFileLoader().load([fileFor(value)])).toEqual({ ok: false, code: 'CONNECTOR_UNAVAILABLE' });
  });
});
