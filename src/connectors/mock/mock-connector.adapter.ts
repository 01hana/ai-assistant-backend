import { Injectable } from '@nestjs/common';
import {
  ConnectorExecuteResult,
  ConnectorToolDefinition,
  DependencyStatus
} from '../connector-adapter.interface';
import {
  DataAdapter,
  DataAdapterCompatibilityInput,
  DataAdapterCompatibilityResult,
  DataAdapterExecuteInput,
  DataAdapterMetadata
} from '../data-adapter.interface';
import { mockBusinessPartnerHistory, mockInventoryAvailability, mockOrderStatuses, mockWorkOrderProgress } from './fixtures';

@Injectable()
export class MockConnectorAdapter implements DataAdapter {
  readonly key = 'mock';
  readonly metadata: Readonly<DataAdapterMetadata> = Object.freeze({
    adapterKey: 'mock',
    sourceSystem: 'mock-fixture',
    supportedHostApps: Object.freeze(['erp']),
    supportedCapabilities: Object.freeze([
      'mock.business-partner.history.lookup',
      'mock.inventory.availability.lookup',
      'mock.orders.status.lookup',
      'mock.work-orders.progress.lookup'
    ])
  });

  // ToolDefinition DB records are the security source of truth.
  // Connector listTools() is only a capability report and is not used for permission, risk, active status, or schema decisions.
  listTools(): ConnectorToolDefinition[] {
    return [
      {
        key: 'mock.orders.status.lookup',
        name: 'Mock order status lookup',
        description: 'Read mock order status.',
        operation: 'read',
        riskLevel: 'low',
        inputSchema: { required: ['entityId'] },
        outputSchema: {},
        requiredPermissionScopes: ['orders:read']
      },
      {
        key: 'mock.work-orders.progress.lookup',
        name: 'Mock work order progress lookup',
        description: 'Read mock work order progress.',
        operation: 'read',
        riskLevel: 'low',
        inputSchema: { required: ['entityId'] },
        outputSchema: {},
        requiredPermissionScopes: ['work-orders:read']
      },
      {
        key: 'mock.inventory.availability.lookup',
        name: 'Mock inventory availability lookup',
        description: 'Read mock inventory availability.',
        operation: 'read',
        riskLevel: 'low',
        inputSchema: { required: ['entityId'] },
        outputSchema: {},
        requiredPermissionScopes: ['inventory:read']
      },
      {
        key: 'mock.business-partner.history.lookup',
        name: 'Mock business partner history lookup',
        description: 'Read mock customer or supplier history.',
        operation: 'read',
        riskLevel: 'low',
        inputSchema: { required: ['entityId'] },
        outputSchema: {},
        requiredPermissionScopes: ['business-partners:read']
      }
    ];
  }

  isCompatible(input: DataAdapterCompatibilityInput): DataAdapterCompatibilityResult {
    if (!this.metadata.supportedHostApps.includes(input.host.hostApp)) {
      return { compatible: false, reason: 'unsupported_host' };
    }
    if (!this.metadata.supportedCapabilities.includes(input.tool.key)) {
      return { compatible: false, reason: 'unsupported_capability' };
    }
    if (input.operation.canonicalToolKey !== input.tool.key) {
      return { compatible: false, reason: 'operation_mismatch' };
    }
    if (input.operation.schemaVersion !== input.tool.version) {
      return { compatible: false, reason: 'schema_version_mismatch' };
    }
    return { compatible: true };
  }

  async execute(input: DataAdapterExecuteInput): Promise<ConnectorExecuteResult> {
    const operation = input.operation;
    if (
      input.toolKey !== operation.canonicalToolKey ||
      input.requestId !== input.host.requestId ||
      input.organizationId !== input.host.organizationId ||
      input.actorId !== input.host.actorId ||
      !sameJsonValue(input.arguments, operation.arguments)
    ) {
      return invalidOperationContext(operation.canonicalToolKey);
    }

    const entityId = String(operation.arguments.entityId ?? '');
    const data = this.lookup(operation.canonicalToolKey, entityId);

    if (!data) {
      return {
        toolKey: operation.canonicalToolKey,
        status: 'failed',
        error: {
          code: 'NOT_FOUND',
          message: 'Mock connector record not found.'
        }
      };
    }

    return {
      toolKey: operation.canonicalToolKey,
      status: 'succeeded',
      data,
      metadata: {
        connectorKey: this.key
      }
    };
  }

  async healthCheck(): Promise<DependencyStatus> {
    return {
      dependency: this.key,
      status: 'healthy',
      checkedAt: new Date().toISOString()
    };
  }

  private lookup(toolKey: string, entityId: string): Record<string, unknown> | undefined {
    if (toolKey === 'mock.orders.status.lookup') {
      return toRecord(mockOrderStatuses.find((record) => record.orderId === entityId));
    }

    if (toolKey === 'mock.orders.status.update') {
      return {
        orderId: entityId,
        status: 'updated',
        sideEffectApplied: true
      };
    }

    if (toolKey === 'mock.orders.cancel') {
      return {
        orderId: entityId,
        status: 'cancelled',
        sideEffectApplied: true
      };
    }

    if (toolKey === 'mock.work-orders.progress.lookup') {
      return toRecord(mockWorkOrderProgress.find((record) => record.workOrderId === entityId));
    }

    if (toolKey === 'mock.inventory.availability.lookup') {
      return toRecord(mockInventoryAvailability.find((record) => record.itemSku === entityId));
    }

    if (toolKey === 'mock.business-partner.history.lookup') {
      return toRecord(mockBusinessPartnerHistory.find((record) => record.partnerId === entityId || record.displayCode === entityId));
    }

    return undefined;
  }
}

function invalidOperationContext(toolKey: string): ConnectorExecuteResult {
  return {
    toolKey,
    status: 'failed',
    error: {
      code: 'INVALID_OPERATION_CONTEXT',
      message: 'Mock connector operation context is invalid.'
    }
  };
}

function sameJsonValue(left: unknown, right: unknown): boolean {
  try {
    return JSON.stringify(left) === JSON.stringify(right);
  } catch {
    return false;
  }
}

function toRecord<T extends object>(record?: T): Record<string, unknown> | undefined {
  return record ? ({ ...record } as Record<string, unknown>) : undefined;
}
