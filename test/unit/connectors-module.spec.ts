import { MODULE_METADATA } from '@nestjs/common/constants';
import { Test } from '@nestjs/testing';
import { RiskLevel, ToolOperation } from '../../src/generated/prisma/enums';
import { DataAdapter, DataAdapterExecuteInput } from '../../src/connectors/data-adapter.interface';
import {
  DATA_ADAPTER_REGISTRATIONS,
  DataAdapterRegistration,
  DataAdapterRegistrations
} from '../../src/connectors/data-adapter-registration';
import { DataAdapterRegistry } from '../../src/connectors/data-adapter-registry.service';
import {
  ConnectorsModule,
  EMPTY_DATA_ADAPTER_REGISTRATIONS
} from '../../src/connectors/connectors.module';

describe('ConnectorsModule', () => {
  it('provides and exports one frozen explicit empty registration array', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [ConnectorsModule] }).compile();
    const registrations = moduleRef.get<DataAdapterRegistrations>(DATA_ADAPTER_REGISTRATIONS);

    expect(registrations).toBe(EMPTY_DATA_ADAPTER_REGISTRATIONS);
    expect(registrations).toEqual([]);
    expect(Object.isFrozen(registrations)).toBe(true);
    expect(moduleRef.get(DataAdapterRegistry)).toBeInstanceOf(DataAdapterRegistry);
  });

  it('uses one useValue provider with no multi-provider, factory, dynamic loading, or external source', () => {
    const providers = (Reflect.getMetadata(MODULE_METADATA.PROVIDERS, ConnectorsModule) ?? []) as unknown[];
    const imports = (Reflect.getMetadata(MODULE_METADATA.IMPORTS, ConnectorsModule) ?? []) as unknown[];
    const registrationProviders = providers.filter(
      (provider): provider is Record<string, unknown> => isRecord(provider) && provider.provide === DATA_ADAPTER_REGISTRATIONS
    );

    expect(registrationProviders).toHaveLength(1);
    expect(Object.keys(registrationProviders[0]).sort()).toEqual(['provide', 'useValue']);
    expect(registrationProviders[0].useValue).toBe(EMPTY_DATA_ADAPTER_REGISTRATIONS);
    expect(registrationProviders[0]).not.toHaveProperty('multi');
    expect(registrationProviders[0]).not.toHaveProperty('useFactory');
    expect(registrationProviders[0]).not.toHaveProperty('useClass');
    expect(imports).toEqual([]);
    expect(providers).toEqual([registrationProviders[0], DataAdapterRegistry]);
  });

  it('preserves an explicitly overridden duplicate array so the registry fails ambiguous', async () => {
    const first = createAdapter('adapter-one');
    const second = createAdapter('adapter-two');
    const duplicateRegistrations: DataAdapterRegistrations = Object.freeze([
      registration(first),
      registration(second)
    ]);
    const moduleRef = await Test.createTestingModule({ imports: [ConnectorsModule] })
      .overrideProvider(DATA_ADAPTER_REGISTRATIONS)
      .useValue(duplicateRegistrations)
      .compile();

    expect(moduleRef.get(DATA_ADAPTER_REGISTRATIONS)).toBe(duplicateRegistrations);
    await expect(moduleRef.get(DataAdapterRegistry).select(selection())).rejects.toMatchObject({
      response: {
        error: 'DATA_ADAPTER_UNAVAILABLE',
        message: 'Data adapter unavailable.'
      },
      status: 503
    });
    expect(first.isCompatible).toHaveBeenCalledTimes(1);
    expect(second.isCompatible).toHaveBeenCalledTimes(1);
    expect(first.healthCheck).not.toHaveBeenCalled();
    expect(second.healthCheck).not.toHaveBeenCalled();
    expect(first.execute).not.toHaveBeenCalled();
    expect(second.execute).not.toHaveBeenCalled();
  });
});

function selection() {
  const tool = Object.freeze({
    id: 'tool-a',
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
    requiresApproval: false
  });

  return Object.freeze({
    host: Object.freeze({
      customerId: 'customer-a',
      integrationId: 'integration-a',
      hostApp: 'erp',
      organizationId: 'organization-a',
      actorId: 'actor-a',
      roles: Object.freeze(['operator']),
      permissionScopes: Object.freeze(['inventory:read']),
      requestId: 'request-a'
    }),
    tool,
    operation: Object.freeze({
      canonicalToolKey: tool.key,
      arguments: Object.freeze({ entityId: 'SKU-001' }),
      schemaVersion: tool.version
    })
  });
}

function registration(adapter: DataAdapter): DataAdapterRegistration {
  return Object.freeze({
    adapter,
    connectorKey: 'fixture-connector',
    customerId: 'customer-a',
    integrationId: 'integration-a',
    hostApp: 'erp',
    active: true
  });
}

function createAdapter(key: string): DataAdapter {
  return {
    key,
    metadata: Object.freeze({
      adapterKey: key,
      sourceSystem: 'fixture-system',
      supportedHostApps: Object.freeze(['erp']),
      supportedCapabilities: Object.freeze(['fixture.inventory.lookup'])
    }),
    listTools: jest.fn(() => []),
    execute: jest.fn(async (input: DataAdapterExecuteInput) => ({
      toolKey: input.operation.canonicalToolKey,
      status: 'succeeded' as const,
      data: {}
    })),
    healthCheck: jest.fn(async () => ({
      dependency: key,
      status: 'healthy' as const,
      checkedAt: '2026-09-07T00:00:00.000Z'
    })),
    isCompatible: jest.fn(() => ({ compatible: true }))
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
