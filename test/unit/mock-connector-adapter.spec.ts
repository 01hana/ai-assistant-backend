import { MockConnectorAdapter } from '../../src/connectors/mock/mock-connector.adapter';
import { DataAdapter, DataAdapterExecuteInput, ValidatedNamedOperation } from '../../src/connectors/data-adapter.interface';
import {
  MOCK_CONNECTOR_ADAPTER,
  MOCK_DATA_ADAPTER_REGISTRATIONS
} from '../../src/connectors/mock/mock-connector.module';
import { RiskLevel, ToolOperation } from '../../src/generated/prisma/enums';
import { HostIntegrationContext } from '../../src/host-integration/host-integration.types';
import { RegisteredToolDefinition } from '../../src/tools/tool-registry.types';

describe('MockConnectorAdapter', () => {
  const adapter: DataAdapter = new MockConnectorAdapter();

  it('declares immutable generic capabilities and deterministic compatibility', () => {
    expect(adapter.key).toBe('mock');
    expect(adapter.metadata).toEqual({
      adapterKey: 'mock',
      sourceSystem: 'mock-fixture',
      supportedHostApps: ['erp'],
      supportedCapabilities: [
        'mock.business-partner.history.lookup',
        'mock.inventory.availability.lookup',
        'mock.orders.status.lookup',
        'mock.work-orders.progress.lookup'
      ]
    });
    expect(Object.isFrozen(adapter.metadata)).toBe(true);
    expect(Object.isFrozen(adapter.metadata.supportedHostApps)).toBe(true);
    expect(Object.isFrozen(adapter.metadata.supportedCapabilities)).toBe(true);
    expect(adapter.isCompatible({ host: HOST, tool: TOOL, operation: OPERATION })).toEqual({ compatible: true });
    expect(adapter.isCompatible({
      host: { ...HOST, hostApp: 'wms' },
      tool: TOOL,
      operation: OPERATION
    })).toEqual({ compatible: false, reason: 'unsupported_host' });
    expect(adapter.isCompatible({
      host: HOST,
      tool: { ...TOOL, key: 'mock.orders.cancel' },
      operation: { ...OPERATION, canonicalToolKey: 'mock.orders.cancel' }
    })).toEqual({ compatible: false, reason: 'unsupported_capability' });
    expect(adapter.isCompatible({
      host: HOST,
      tool: TOOL,
      operation: { ...OPERATION, canonicalToolKey: 'mock.orders.status.lookup' }
    })).toEqual({ compatible: false, reason: 'operation_mismatch' });
  });

  it('executes a validated operation with trusted host and transient context without changing deterministic fixtures', async () => {
    const executeInput: DataAdapterExecuteInput = {
      requestId: HOST.requestId,
      organizationId: HOST.organizationId,
      actorId: HOST.actorId,
      toolKey: OPERATION.canonicalToolKey,
      arguments: OPERATION.arguments,
      host: HOST,
      operation: OPERATION,
      transientConnectorContext: Object.freeze({ connectorContextRef: 'ccr_selected_mock_only' })
    };

    await expect(
      adapter.execute(executeInput)
    ).resolves.toEqual(
      expect.objectContaining({
        toolKey: 'mock.inventory.availability.lookup',
        status: 'succeeded',
        data: expect.objectContaining({
          availableQuantity: 36,
          incomingQuantity: 120
        })
      })
    );
    await expect(adapter.healthCheck()).resolves.toEqual(expect.objectContaining({
      dependency: 'mock',
      status: 'healthy'
    }));
  });

  it('fails safely when legacy connector fields disagree with the validated operation', async () => {
    await expect(adapter.execute({
      requestId: HOST.requestId,
      organizationId: HOST.organizationId,
      actorId: HOST.actorId,
      toolKey: 'mock.orders.status.lookup',
      arguments: { entityId: 'SO-10001' },
      host: HOST,
      operation: OPERATION,
      transientConnectorContext: Object.freeze({})
    })).resolves.toEqual({
      toolKey: OPERATION.canonicalToolKey,
      status: 'failed',
      error: {
        code: 'INVALID_OPERATION_CONTEXT',
        message: 'Mock connector operation context is invalid.'
      }
    });
  });

  it('uses one adapter instance in two exact Customer-scoped registrations without authority fields', () => {
    expect(MOCK_CONNECTOR_ADAPTER).toBeInstanceOf(MockConnectorAdapter);
    expect(MOCK_DATA_ADAPTER_REGISTRATIONS).toHaveLength(2);
    expect(Object.isFrozen(MOCK_DATA_ADAPTER_REGISTRATIONS)).toBe(true);
    expect(MOCK_DATA_ADAPTER_REGISTRATIONS.map(({ customerId }) => customerId)).toEqual(['customer-a', 'customer-b']);
    for (const registration of MOCK_DATA_ADAPTER_REGISTRATIONS) {
      expect(registration.adapter).toBe(MOCK_CONNECTOR_ADAPTER);
      expect(registration).toEqual(expect.objectContaining({
        connectorKey: 'mock',
        integrationId: 'integration-erp',
        hostApp: 'erp',
        active: true
      }));
      expect(Object.keys(registration).sort()).toEqual([
        'active',
        'adapter',
        'connectorKey',
        'customerId',
        'hostApp',
        'integrationId'
      ]);
      expect(JSON.stringify(registration)).not.toContain('*');
    }
  });
});

const HOST: HostIntegrationContext = Object.freeze({
  customerId: 'customer-a',
  integrationId: 'integration-erp',
  hostApp: 'erp',
  organizationId: 'org-001',
  actorId: 'actor-001',
  roles: Object.freeze(['planner']),
  permissionScopes: Object.freeze(['inventory:read']),
  requestId: 'req-mock-connector'
});

const OPERATION: ValidatedNamedOperation = Object.freeze({
  canonicalToolKey: 'mock.inventory.availability.lookup',
  schemaVersion: '1.0.0',
  arguments: Object.freeze({ entityId: 'SKU-DEMO-RED' })
});

const TOOL: RegisteredToolDefinition = Object.freeze({
  id: 'tool-definition-inventory-001',
  key: OPERATION.canonicalToolKey,
  name: OPERATION.canonicalToolKey,
  version: OPERATION.schemaVersion,
  description: 'Mock inventory lookup.',
  operation: ToolOperation.read,
  riskLevel: RiskLevel.low,
  active: true,
  connectorKey: 'mock',
  timeoutMs: 3000,
  requiredPermissionScopes: ['inventory:read'],
  inputSchema: { required: [] },
  outputSchema: { required: [] },
  hasSideEffect: false,
  requiresConfirmation: false,
  requiresApproval: false
});
