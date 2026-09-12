import { CredentialExecutionBoundary } from '../../src/credentials/credential-execution.boundary';
import { CredentialProfileRegistry } from '../../src/credentials/credential-profile.registry';
import { OperationManifestRegistry } from '../../src/manifest/operation-manifest.registry';
import { binding, credentialFixtures, profileConfigurations } from '../fixtures/phase5-credentials';
import { boundedArguments, customerBOperation, parsedManifest } from '../fixtures/phase5-manifests';

describe('CredentialExecutionBoundary', () => {
  it('resolves a provider-owned handle and applies the registered strategy without returning material', async () => {
    const fixtures = credentialFixtures();
    const profiles = new CredentialProfileRegistry(profileConfigurations,
      [fixtures.bearerProvider, fixtures.apiKeyProvider], [fixtures.bearerStrategy, fixtures.apiKeyStrategy]);
    const operation = new OperationManifestRegistry([parsedManifest('inventory', [customerBOperation()])])
      .prepare('inventory', 'inventory.stock-on-hand', '1.0.0', boundedArguments({ sku: 'SKU-7' }));
    expect(operation.ok).toBe(true);
    if (!operation.ok) return;
    const consumer = jest.fn(async (applied: object) => ({ accepted: 'X-Inventory-Key' in applied }));
    const result = await new CredentialExecutionBoundary(profiles).withAppliedCredential(binding(), operation.value, consumer);
    expect(result).toEqual({ ok: true, value: { accepted: true } });
    expect(consumer).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(result)).not.toMatch(/api-key-secret-sentinel|customer-b-handle|credential-generation/);
  });

  it('rejects provider, handle, and credential-generation mismatch without leaking details', async () => {
    const fixtures = credentialFixtures();
    const providerSpy = jest.spyOn(fixtures.apiKeyProvider, 'resolve');
    const profiles = new CredentialProfileRegistry(profileConfigurations,
      [fixtures.bearerProvider, fixtures.apiKeyProvider], [fixtures.bearerStrategy, fixtures.apiKeyStrategy]);
    const operation = new OperationManifestRegistry([parsedManifest('inventory', [customerBOperation()])])
      .prepare('inventory', 'inventory.stock-on-hand', '1.0.0', boundedArguments({ sku: 'SKU-7' }));
    if (!operation.ok) throw new Error('fixture');
    const boundary = new CredentialExecutionBoundary(profiles);
    expect(await boundary.withAppliedCredential(binding({ credentialProviderKey: 'metrics-provider-v1' }), operation.value, async () => true))
      .toEqual({ ok: false, code: 'CONNECTOR_BINDING_INVALID' });
    expect(providerSpy).not.toHaveBeenCalled();
    for (const value of [binding({ opaqueCredentialHandle: 'wrong' }), binding({ credentialGeneration: 'wrong' })]) {
      const result = await boundary.withAppliedCredential(value, operation.value, async () => true);
      expect(result).toEqual({ ok: false, code: 'CONNECTOR_UPSTREAM_AUTH_FAILED' });
      expect(JSON.stringify(result)).not.toMatch(/wrong|provider-rejected|api-key-secret-sentinel/);
    }
  });

  it('normalizes provider resolution failures without invoking the strategy or consumer', async () => {
    const fixtures = credentialFixtures();
    const providerFailure = new Error('provider-resolution-sentinel');
    jest.spyOn(fixtures.apiKeyProvider, 'resolve').mockRejectedValue(providerFailure);
    const strategy = jest.spyOn(fixtures.apiKeyStrategy, 'apply');
    const consumer = jest.fn(async () => true);
    const result = await boundaryFor(fixtures).withAppliedCredential(binding(), preparedCustomerBOperation(), consumer);

    expect(result).toEqual({ ok: false, code: 'CONNECTOR_UPSTREAM_AUTH_FAILED' });
    expect(strategy).not.toHaveBeenCalled();
    expect(consumer).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toMatch(/provider-resolution-sentinel|api-key-secret-sentinel|customer-b-handle/);
  });

  it('normalizes credential application failures without invoking the consumer', async () => {
    const fixtures = credentialFixtures();
    jest.spyOn(fixtures.apiKeyStrategy, 'apply').mockImplementation(() => {
      throw new Error('strategy-application-sentinel');
    });
    const consumer = jest.fn(async () => true);
    const result = await boundaryFor(fixtures).withAppliedCredential(binding(), preparedCustomerBOperation(), consumer);

    expect(result).toEqual({ ok: false, code: 'CONNECTOR_UPSTREAM_AUTH_FAILED' });
    expect(consumer).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toMatch(/strategy-application-sentinel|api-key-secret-sentinel|customer-b-handle/);
  });

  it('propagates the exact downstream consumer failure after credential setup transfers ownership', async () => {
    const fixtures = credentialFixtures();
    const consumerFailure = new Error('downstream-consumer-sentinel');
    const consumer = jest.fn(async () => {
      throw consumerFailure;
    });
    const execution = boundaryFor(fixtures).withAppliedCredential(binding(), preparedCustomerBOperation(), consumer);

    await expect(execution).rejects.toBe(consumerFailure);
    expect(consumer).toHaveBeenCalledTimes(1);
  });
});

function preparedCustomerBOperation() {
  const operation = new OperationManifestRegistry([parsedManifest('inventory', [customerBOperation()])])
    .prepare('inventory', 'inventory.stock-on-hand', '1.0.0', boundedArguments({ sku: 'SKU-7' }));
  if (!operation.ok) throw new Error('fixture');
  return operation.value;
}

function boundaryFor(fixtures: ReturnType<typeof credentialFixtures>): CredentialExecutionBoundary {
  return new CredentialExecutionBoundary(new CredentialProfileRegistry(
    profileConfigurations,
    [fixtures.bearerProvider, fixtures.apiKeyProvider],
    [fixtures.bearerStrategy, fixtures.apiKeyStrategy]
  ));
}
