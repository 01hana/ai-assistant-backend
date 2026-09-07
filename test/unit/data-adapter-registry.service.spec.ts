import { ServiceUnavailableException } from '@nestjs/common';
import { RiskLevel, ToolOperation } from '../../src/generated/prisma/enums';
import { HostIntegrationContext } from '../../src/host-integration/host-integration.types';
import { RegisteredToolDefinition } from '../../src/tools/tool-registry.types';
import {
  DataAdapter,
  DataAdapterExecuteInput,
  ValidatedNamedOperation
} from '../../src/connectors/data-adapter.interface';
import { DataAdapterRegistration } from '../../src/connectors/data-adapter-registration';
import {
  DataAdapterRegistry,
  DataAdapterRegistrySelectInput
} from '../../src/connectors/data-adapter-registry.service';

describe('DataAdapterRegistry', () => {
  it('selects one exact trusted registration and checks compatibility then readiness', async () => {
    const adapter = createAdapter();
    const registry = new DataAdapterRegistry([registration(adapter)]);

    await expect(registry.select(selection())).resolves.toBe(adapter);
    expect(adapter.isCompatible).toHaveBeenCalledTimes(1);
    expect(adapter.isCompatible).toHaveBeenCalledWith(selection());
    expect(adapter.healthCheck).toHaveBeenCalledTimes(1);
    expect(adapter.execute).not.toHaveBeenCalled();
  });

  it('reuses the same adapter instance through isolated exact Customer registrations', async () => {
    const adapter = createAdapter();
    const registry = new DataAdapterRegistry([
      registration(adapter, { customerId: 'customer-a' }),
      registration(adapter, { customerId: 'customer-b' })
    ]);

    await expect(registry.select(selection({ customerId: 'customer-a' }))).resolves.toBe(adapter);
    expect(adapter.isCompatible).toHaveBeenCalledTimes(1);
    expect(adapter.isCompatible).toHaveBeenLastCalledWith(selection({ customerId: 'customer-a' }));

    await expect(registry.select(selection({ customerId: 'customer-b' }))).resolves.toBe(adapter);
    expect(adapter.isCompatible).toHaveBeenCalledTimes(2);
    expect(adapter.isCompatible).toHaveBeenLastCalledWith(selection({ customerId: 'customer-b' }));
    expect(adapter.healthCheck).toHaveBeenCalledTimes(2);
    expect(adapter.execute).not.toHaveBeenCalled();
  });

  it.each([
    ['wrong Customer', { customerId: 'customer-b' }, {}],
    ['wrong integration', { integrationId: 'integration-b' }, {}],
    ['wrong host', { hostApp: 'wms' }, {}],
    ['unknown connector', {}, { connectorKey: 'unknown-connector' }]
  ])('fails closed for %s without capability, readiness, or execution', async (_label, hostOverrides, toolOverrides) => {
    const adapter = createAdapter();
    const registry = new DataAdapterRegistry([registration(adapter)]);

    await expectUnavailable(registry.select(selection(hostOverrides, toolOverrides)));
    expect(adapter.isCompatible).not.toHaveBeenCalled();
    expect(adapter.healthCheck).not.toHaveBeenCalled();
    expect(adapter.execute).not.toHaveBeenCalled();
  });

  it('fails closed for an inactive registration', async () => {
    const adapter = createAdapter();
    const registry = new DataAdapterRegistry([registration(adapter, { active: false })]);

    await expectUnavailable(registry.select(selection()));
    expect(adapter.isCompatible).not.toHaveBeenCalled();
    expect(adapter.healthCheck).not.toHaveBeenCalled();
    expect(adapter.execute).not.toHaveBeenCalled();
  });

  it.each([
    ['connectorKey', { connectorKey: '*' }],
    ['customerId', { customerId: '*' }],
    ['integrationId', { integrationId: '*' }],
    ['hostApp', { hostApp: '*' }],
    ['blank connectorKey', { connectorKey: ' ' }]
  ])('rejects non-exact %s deployment bindings', async (_label, overrides) => {
    const adapter = createAdapter();
    const registry = new DataAdapterRegistry([registration(adapter, overrides)]);

    await expectUnavailable(registry.select(selection()));
    expect(adapter.isCompatible).not.toHaveBeenCalled();
    expect(adapter.healthCheck).not.toHaveBeenCalled();
    expect(adapter.execute).not.toHaveBeenCalled();
  });

  it.each([
    ['host capability', { supportedHostApps: ['wms'] }],
    ['canonical tool capability', { supportedCapabilities: ['fixture.other.lookup'] }]
  ])('fails closed before isCompatible when adapter lacks %s', async (_label, metadataOverrides) => {
    const adapter = createAdapter({ metadata: metadataOverrides });
    const registry = new DataAdapterRegistry([registration(adapter)]);

    await expectUnavailable(registry.select(selection()));
    expect(adapter.isCompatible).not.toHaveBeenCalled();
    expect(adapter.healthCheck).not.toHaveBeenCalled();
    expect(adapter.execute).not.toHaveBeenCalled();
  });

  it('fails closed when the exactly scoped adapter reports incompatibility', async () => {
    const adapter = createAdapter({ compatible: false });
    const registry = new DataAdapterRegistry([registration(adapter)]);

    await expectUnavailable(registry.select(selection()));
    expect(adapter.isCompatible).toHaveBeenCalledTimes(1);
    expect(adapter.healthCheck).not.toHaveBeenCalled();
    expect(adapter.execute).not.toHaveBeenCalled();
  });

  it('fails closed as ambiguous before readiness when multiple adapters are compatible', async () => {
    const first = createAdapter({ key: 'adapter-one' });
    const second = createAdapter({ key: 'adapter-two' });
    const registry = new DataAdapterRegistry([registration(first), registration(second)]);

    await expectUnavailable(registry.select(selection()));
    expect(first.isCompatible).toHaveBeenCalledTimes(1);
    expect(second.isCompatible).toHaveBeenCalledTimes(1);
    expect(first.healthCheck).not.toHaveBeenCalled();
    expect(second.healthCheck).not.toHaveBeenCalled();
    expect(first.execute).not.toHaveBeenCalled();
    expect(second.execute).not.toHaveBeenCalled();
  });

  it.each(['degraded', 'unavailable'] as const)('fails closed when readiness is %s', async (status) => {
    const adapter = createAdapter({ health: status });
    const registry = new DataAdapterRegistry([registration(adapter)]);

    await expectUnavailable(registry.select(selection()));
    expect(adapter.healthCheck).toHaveBeenCalledTimes(1);
    expect(adapter.execute).not.toHaveBeenCalled();
  });

  it('accepts no Browser or transient authority and ignores runtime excess fields', async () => {
    const adapter = createAdapter();
    const registry = new DataAdapterRegistry([registration(adapter)]);
    const trustedInput = selection();
    const browserDecoratedInput = {
      ...trustedInput,
      pageContext: {
        customerId: 'attacker-customer',
        connectorKey: 'attacker-connector',
        adapter: 'attacker-adapter'
      },
      transientConnectorContext: {
        connectorContextRef: 'ccr_attacker_reference'
      }
    } as DataAdapterRegistrySelectInput;

    await expect(registry.select(browserDecoratedInput)).resolves.toBe(adapter);
    expect(adapter.isCompatible).toHaveBeenCalledWith(trustedInput);
    expect(adapter.execute).not.toHaveBeenCalled();
    expect(Object.keys(trustedInput).sort()).toEqual(['host', 'operation', 'tool']);
  });

  it('has no default or mock fallback when no registration exists', async () => {
    const registry = new DataAdapterRegistry([]);

    await expectUnavailable(registry.select(selection()));
  });
});

async function expectUnavailable(promise: Promise<DataAdapter>): Promise<void> {
  try {
    await promise;
    throw new Error('Expected registry selection to fail closed.');
  } catch (error) {
    expect(error).toBeInstanceOf(ServiceUnavailableException);
    expect((error as ServiceUnavailableException).getResponse()).toEqual({
      error: 'DATA_ADAPTER_UNAVAILABLE',
      message: 'Data adapter unavailable.'
    });
  }
}

function selection(
  hostOverrides: Partial<HostIntegrationContext> = {},
  toolOverrides: Partial<RegisteredToolDefinition> = {}
): DataAdapterRegistrySelectInput {
  const tool = toolDefinition(toolOverrides);
  const operation: ValidatedNamedOperation = Object.freeze({
    canonicalToolKey: tool.key,
    arguments: Object.freeze({ entityId: 'SKU-001' }),
    schemaVersion: tool.version
  });

  return Object.freeze({
    host: hostContext(hostOverrides),
    tool,
    operation
  });
}

function hostContext(overrides: Partial<HostIntegrationContext> = {}): HostIntegrationContext {
  return Object.freeze({
    customerId: 'customer-a',
    integrationId: 'integration-a',
    hostApp: 'erp',
    organizationId: 'organization-a',
    actorId: 'actor-a',
    roles: Object.freeze(['operator']),
    permissionScopes: Object.freeze(['inventory:read']),
    requestId: 'request-a',
    ...overrides
  });
}

function toolDefinition(overrides: Partial<RegisteredToolDefinition> = {}): RegisteredToolDefinition {
  return Object.freeze({
    id: 'tool-definition-a',
    key: 'fixture.inventory.lookup',
    name: 'Fixture inventory lookup',
    version: '1.0.0',
    description: 'Fixture lookup.',
    operation: ToolOperation.read,
    riskLevel: RiskLevel.low,
    active: true,
    connectorKey: 'fixture-connector',
    requiredPermissionScopes: ['inventory:read'],
    inputSchema: { required: ['entityId'] },
    outputSchema: { required: [] },
    hasSideEffect: false,
    requiresConfirmation: false,
    requiresApproval: false,
    ...overrides
  });
}

function registration(adapter: DataAdapter, overrides: Partial<DataAdapterRegistration> = {}): DataAdapterRegistration {
  return Object.freeze({
    adapter,
    connectorKey: 'fixture-connector',
    customerId: 'customer-a',
    integrationId: 'integration-a',
    hostApp: 'erp',
    active: true,
    ...overrides
  });
}

function createAdapter(options: {
  key?: string;
  compatible?: boolean;
  health?: 'healthy' | 'degraded' | 'unavailable';
  metadata?: {
    supportedHostApps?: readonly string[];
    supportedCapabilities?: readonly string[];
  };
} = {}): DataAdapter {
  const key = options.key ?? 'fixture-adapter';
  const metadata = Object.freeze({
    adapterKey: key,
    sourceSystem: 'fixture-system',
    supportedHostApps: Object.freeze(options.metadata?.supportedHostApps ?? ['erp']),
    supportedCapabilities: Object.freeze(options.metadata?.supportedCapabilities ?? ['fixture.inventory.lookup'])
  });

  return {
    key,
    metadata,
    listTools: jest.fn(() => []),
    execute: jest.fn(async (input: DataAdapterExecuteInput) => ({
      toolKey: input.operation.canonicalToolKey,
      status: 'succeeded' as const,
      data: {}
    })),
    healthCheck: jest.fn(async () => ({
      dependency: key,
      status: options.health ?? 'healthy',
      checkedAt: '2026-09-07T00:00:00.000Z'
    })),
    isCompatible: jest.fn(() => ({
      compatible: options.compatible ?? true,
      ...(options.compatible === false ? { reason: 'fixture-incompatible' } : {})
    }))
  };
}
