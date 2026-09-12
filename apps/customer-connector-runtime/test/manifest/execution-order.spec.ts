import { CredentialExecutionBoundary } from '../../src/credentials/credential-execution.boundary';
import { CredentialProfileRegistry } from '../../src/credentials/credential-profile.registry';
import { OperationManifestRegistry } from '../../src/manifest/operation-manifest.registry';
import { RequestProfileRegistry } from '../../src/manifest/request-profile.registry';
import { binding, credentialFixtures, profileConfigurations } from '../fixtures/phase5-credentials';
import { boundedArguments, customerBOperation, getOperation, parsedManifest } from '../fixtures/phase5-manifests';
import { randomUUID } from 'node:crypto';
import { parseConnectorInvocationRequestV1 } from '@internal-ai-assistant/connector-runtime-contract';
import { RuntimeServiceProfileRegistry } from '../../src/service-auth/service-profile.registry';
import { ConnectorServiceProofVerifier } from '../../src/service-auth/service-proof.verifier';
import { ExactRawBodyAuthenticator } from '../../src/service-auth/exact-raw-body.authenticator';
import { ReplayProtectionService } from '../../src/replay/replay-protection.service';
import { ConnectorBindingService } from '../../src/bindings/connector-binding.service';
import { InMemoryConnectorBindingStore } from '../../src/bindings/in-memory-connector-binding.store';
import { bodyDigest, serviceProofFixtureSet, signServiceProof } from '../fixtures/service-proof-fixtures';

describe('Phase 5 credential execution order', () => {
  it.each([
    ['manifest operation', 'missing', '1.0.0', { sku: 'SKU-7' }],
    ['manifest version', 'inventory.stock-on-hand', '2.0.0', { sku: 'SKU-7' }],
    ['argument schema', 'inventory.stock-on-hand', '1.0.0', { sku: 7 }],
    ['request profile', 'inventory.stock-on-hand', '1.0.0', { sku: 'SKU-7', headers: {} }]
  ])('keeps credential providers unreachable when %s fails', async (_case, operationKey, version, args) => {
    const fixtures = credentialFixtures();
    const resolve = jest.spyOn(fixtures.apiKeyProvider, 'resolve');
    const operation = new OperationManifestRegistry([parsedManifest('inventory', [customerBOperation()])])
      .prepare('inventory', operationKey, version, boundedArguments(args));
    expect(operation).toEqual({ ok: false, code: 'CONNECTOR_OPERATION_UNAVAILABLE' });
    expect(resolve).not.toHaveBeenCalled();
  });

  it('calls the provider only after the exact manifest, argument, binding, and profile gates pass', async () => {
    const fixtures = credentialFixtures();
    const resolve = jest.spyOn(fixtures.apiKeyProvider, 'resolve');
    const profiles = new CredentialProfileRegistry(profileConfigurations,
      [fixtures.bearerProvider, fixtures.apiKeyProvider], [fixtures.bearerStrategy, fixtures.apiKeyStrategy]);
    const operation = new OperationManifestRegistry([parsedManifest('inventory', [customerBOperation()])])
      .prepare('inventory', 'inventory.stock-on-hand', '1.0.0', boundedArguments({ sku: 'SKU-7' }));
    if (!operation.ok) throw new Error('fixture');
    expect(resolve).not.toHaveBeenCalled();
    expect(await new CredentialExecutionBoundary(profiles)
      .withAppliedCredential(binding(), operation.value, async () => 'consumed')).toEqual({ ok: true, value: 'consumed' });
    expect(resolve).toHaveBeenCalledTimes(1);
  });

  it('rejects missing, unknown, and replaced binding references before provider resolution', async () => {
    const now = 1_800_000_000;
    let entropy = 1;
    const bindings = new ConnectorBindingService(new InMemoryConnectorBindingStore(
      { maxEntries: 8, scopeMaxEntries: 8, sweepBatchSize: 8 },
      { nowSeconds: () => now, randomBytes: (size) => Buffer.alloc(size, entropy++) }
    ));
    const trustedContext = binding().trustedContext;
    const first = await bindings.mint({
      trustedContext,
      bootstrapProviderKey: 'customer-b-bootstrap-provider-v1',
      credentialProviderKey: 'customer-b-provider-v1',
      opaqueCredentialHandle: 'customer-b-handle',
      credentialGeneration: 'credential-generation-1',
      providerMetadata: {}
    });
    const replacement = await bindings.mint({
      trustedContext,
      bootstrapProviderKey: 'customer-b-bootstrap-provider-v1',
      credentialProviderKey: 'customer-b-provider-v1',
      opaqueCredentialHandle: 'customer-b-handle',
      credentialGeneration: 'credential-generation-1',
      providerMetadata: {}
    });
    if (!first.ok || !replacement.ok) throw new Error('binding fixture');
    const fixtures = credentialFixtures();
    const resolve = jest.spyOn(fixtures.apiKeyProvider, 'resolve');
    const operation = new OperationManifestRegistry([parsedManifest('inventory', [customerBOperation()])])
      .prepare('inventory', 'inventory.stock-on-hand', '1.0.0', boundedArguments({ sku: 'SKU-7' }));
    if (!operation.ok) throw new Error('manifest fixture');
    const profiles = new CredentialProfileRegistry(
      profileConfigurations,
      [fixtures.bearerProvider, fixtures.apiKeyProvider],
      [fixtures.bearerStrategy, fixtures.apiKeyStrategy]
    );
    const boundary = new CredentialExecutionBoundary(profiles);
    const work = jest.fn(async (leased: Parameters<typeof boundary.withAppliedCredential>[0]) =>
      boundary.withAppliedCredential(leased, operation.value, async () => true));
    const expectation = {
      trustedContext,
      bootstrapProviderKey: 'customer-b-bootstrap-provider-v1',
      credentialProviderKey: 'customer-b-provider-v1'
    };

    for (const reference of ['', `ccr_${'A'.repeat(43)}`, first.value.connectorContextRef]) {
      expect(await bindings.withLease(reference, expectation, work)).toEqual({
        ok: false,
        code: 'CONNECTOR_BINDING_INVALID'
      });
    }
    expect(work).not.toHaveBeenCalled();
    expect(resolve).not.toHaveBeenCalled();
    expect(await bindings.resolve(replacement.value.connectorContextRef, expectation)).toEqual({
      ok: true,
      value: expect.objectContaining({ credentialGeneration: 'credential-generation-1' })
    });
  });

  it('rejects a binding-to-credential-profile provider mismatch before any provider resolves', async () => {
    const now = 1_800_000_000;
    const bindings = new ConnectorBindingService(new InMemoryConnectorBindingStore(
      { maxEntries: 8, scopeMaxEntries: 8, sweepBatchSize: 8 },
      { nowSeconds: () => now, randomBytes: () => Buffer.alloc(32, 7) }
    ));
    const trustedContext = binding().trustedContext;
    const minted = await bindings.mint({
      trustedContext,
      bootstrapProviderKey: 'customer-b-bootstrap-provider-v1',
      credentialProviderKey: 'customer-b-provider-v1',
      opaqueCredentialHandle: 'customer-b-handle',
      credentialGeneration: 'credential-generation-1',
      providerMetadata: {}
    });
    if (!minted.ok) throw new Error('binding fixture');
    const operation = new OperationManifestRegistry([parsedManifest('metrics', [getOperation()])])
      .prepare('metrics', 'metrics.current', '1.0.0', boundedArguments({ region: 'TW' }));
    if (!operation.ok) throw new Error('manifest fixture');
    const fixtures = credentialFixtures();
    const apiKeyResolve = jest.spyOn(fixtures.apiKeyProvider, 'resolve');
    const bearerResolve = jest.spyOn(fixtures.bearerProvider, 'resolve');
    const profiles = new CredentialProfileRegistry(
      profileConfigurations,
      [fixtures.bearerProvider, fixtures.apiKeyProvider],
      [fixtures.bearerStrategy, fixtures.apiKeyStrategy]
    );
    const result = await bindings.withLease(minted.value.connectorContextRef, {
      trustedContext,
      bootstrapProviderKey: 'customer-b-bootstrap-provider-v1',
      credentialProviderKey: 'customer-b-provider-v1'
    }, async (leased) => new CredentialExecutionBoundary(profiles)
      .withAppliedCredential(leased, operation.value, async () => true));

    expect(result).toEqual({ ok: true, value: { ok: false, code: 'CONNECTOR_BINDING_INVALID' } });
    expect(apiKeyResolve).not.toHaveBeenCalled();
    expect(bearerResolve).not.toHaveBeenCalled();
  });

  it('rejects incomplete request-profile composition before provider resolution', () => {
    const fixtures = credentialFixtures();
    const apiKeyResolve = jest.spyOn(fixtures.apiKeyProvider, 'resolve');
    const profiles = new CredentialProfileRegistry(
      profileConfigurations,
      [fixtures.bearerProvider, fixtures.apiKeyProvider],
      [fixtures.bearerStrategy, fixtures.apiKeyStrategy]
    );
    const registry = new OperationManifestRegistry(
      [parsedManifest('inventory', [customerBOperation()])],
      new RequestProfileRegistry(['GET_QUERY_V1'])
    );

    const prepared = registry.prepare(
      'inventory',
      'inventory.stock-on-hand',
      '1.0.0',
      boundedArguments({ sku: 'SKU-7' })
    );
    const execution = prepared.ok
      ? new CredentialExecutionBoundary(profiles).withAppliedCredential(binding(), prepared.value, async () => true)
      : prepared;
    expect(execution).toEqual({ ok: false, code: 'CONNECTOR_OPERATION_UNAVAILABLE' });
    expect(apiKeyResolve).not.toHaveBeenCalled();
  });

  it('composes real exact-byte authentication, replay, invocation parsing, binding lease, manifest validation, and credential resolution in order without a route', async () => {
    const now = 1_800_000_000;
    const proofProfiles = serviceProofFixtureSet();
    const authenticator = new ExactRawBodyAuthenticator(
      new ConnectorServiceProofVerifier(new RuntimeServiceProfileRegistry([
        proofProfiles.central.config, proofProfiles.bridge.config, proofProfiles.customerB.config
      ]), () => now),
      new ReplayProtectionService(8, () => now)
    );
    const bindings = new ConnectorBindingService(new InMemoryConnectorBindingStore(
      { maxEntries: 8, scopeMaxEntries: 8, sweepBatchSize: 8 },
      { nowSeconds: () => now, randomBytes: () => Buffer.alloc(32, 9) }
    ));
    const trustedContext = {
      customerId: 'customer-b', integrationId: 'inventory-b', hostApp: 'customer-b-inventory',
      connectorInstanceId: 'customer-b-inventory-connector-1', organizationId: 'org-b', actorId: 'actor-b'
    };
    const minted = await bindings.mint({
      trustedContext, bootstrapProviderKey: 'customer-b-bootstrap-provider-v1',
      credentialProviderKey: 'customer-b-provider-v1', opaqueCredentialHandle: 'customer-b-handle',
      credentialGeneration: 'credential-generation-1', providerMetadata: {}
    });
    if (!minted.ok) throw new Error('binding fixture');
    const requestId = randomUUID();
    const body = Buffer.from(JSON.stringify({
      version: '1', requestId, remainingBudgetMs: 1_000,
      trustedContext: { ...trustedContext, connectorKey: 'inventory' },
      operation: { key: 'inventory.stock-on-hand', version: '1.0.0', arguments: { sku: 'SKU-7' } },
      connectorContextRef: minted.value.connectorContextRef
    }));
    const token = await signServiceProof(proofProfiles.central, {
      request_id: requestId, body_sha256: bodyDigest(body), jti: randomUUID()
    });
    const fixtures = credentialFixtures();
    const resolve = jest.spyOn(fixtures.apiKeyProvider, 'resolve');

    const missingProof = await authenticator.authenticate({
      routeClass: 'central-invocation', expectedProfileKey: 'central-v1', method: 'POST',
      contentType: 'application/json', rawBody: body
    });
    expect(missingProof).toEqual({ ok: false, code: 'CONNECTOR_AUTH_FAILED' });
    expect(resolve).not.toHaveBeenCalled();

    const authenticated = await authenticator.authenticate({
      routeClass: 'central-invocation', expectedProfileKey: 'central-v1', method: 'POST',
      contentType: 'application/json', authorization: `Bearer ${token}`, rawBody: body
    });
    expect(authenticated.ok).toBe(true);
    const replayed = await authenticator.authenticate({
      routeClass: 'central-invocation', expectedProfileKey: 'central-v1', method: 'POST',
      contentType: 'application/json', authorization: `Bearer ${token}`, rawBody: body
    });
    expect(replayed).toEqual({ ok: false, code: 'CONNECTOR_REPLAY_REJECTED' });
    expect(resolve).not.toHaveBeenCalled();

    const parsed = parseConnectorInvocationRequestV1(body);
    if (!parsed.ok) throw new Error('invocation fixture');
    const contextMismatch = await bindings.withLease(parsed.value.connectorContextRef, {
      trustedContext: { ...trustedContext, actorId: 'other-actor' },
      bootstrapProviderKey: 'customer-b-bootstrap-provider-v1', credentialProviderKey: 'customer-b-provider-v1'
    }, async () => true);
    expect(contextMismatch).toEqual({ ok: false, code: 'CONNECTOR_BINDING_INVALID' });
    expect(resolve).not.toHaveBeenCalled();

    const profiles = new CredentialProfileRegistry(profileConfigurations,
      [fixtures.bearerProvider, fixtures.apiKeyProvider], [fixtures.bearerStrategy, fixtures.apiKeyStrategy]);
    const manifests = new OperationManifestRegistry([parsedManifest('inventory', [customerBOperation()])]);
    const result = await bindings.withLease(parsed.value.connectorContextRef, {
      trustedContext, bootstrapProviderKey: 'customer-b-bootstrap-provider-v1', credentialProviderKey: 'customer-b-provider-v1'
    }, async (leased) => {
      const operation = manifests.prepare('inventory', parsed.value.operation.key, parsed.value.operation.version, parsed.value.operation.arguments);
      if (!operation.ok) return operation;
      return new CredentialExecutionBoundary(profiles).withAppliedCredential(leased, operation.value, async () => 'consumed');
    });
    expect(result).toEqual({ ok: true, value: { ok: true, value: 'consumed' } });
    expect(resolve).toHaveBeenCalledTimes(1);
  });
});
