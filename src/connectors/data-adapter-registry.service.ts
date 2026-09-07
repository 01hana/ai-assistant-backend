import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { HostIntegrationContext } from '../host-integration/host-integration.types';
import { RegisteredToolDefinition } from '../tools/tool-registry.types';
import { DataAdapter, ValidatedNamedOperation } from './data-adapter.interface';
import {
  DATA_ADAPTER_REGISTRATIONS,
  DataAdapterRegistration,
  DataAdapterRegistrations
} from './data-adapter-registration';

export interface DataAdapterRegistrySelectInput {
  readonly host: HostIntegrationContext;
  readonly tool: RegisteredToolDefinition;
  readonly operation: ValidatedNamedOperation;
}

@Injectable()
export class DataAdapterRegistry {
  constructor(
    @Inject(DATA_ADAPTER_REGISTRATIONS)
    private readonly registrations: DataAdapterRegistrations
  ) {}

  async select(input: DataAdapterRegistrySelectInput): Promise<DataAdapter> {
    const exactlyBound = this.registrations.filter((registration) => this.isExactActiveBinding(registration, input));
    const compatibilityInput: DataAdapterRegistrySelectInput = Object.freeze({
      host: input.host,
      tool: input.tool,
      operation: input.operation
    });

    let compatible: DataAdapterRegistration[];
    try {
      compatible = exactlyBound.filter((registration) => {
        const { metadata } = registration.adapter;
        if (!metadata.supportedHostApps.includes(input.host.hostApp) || !metadata.supportedCapabilities.includes(input.tool.key)) {
          return false;
        }

        return registration.adapter.isCompatible(compatibilityInput).compatible;
      });
    } catch {
      throw unavailable();
    }

    if (compatible.length !== 1) {
      throw unavailable();
    }

    const adapter = compatible[0].adapter;
    try {
      const readiness = await adapter.healthCheck();
      if (readiness.status !== 'healthy') {
        throw unavailable();
      }
    } catch {
      throw unavailable();
    }

    return adapter;
  }

  private isExactActiveBinding(registration: DataAdapterRegistration, input: DataAdapterRegistrySelectInput): boolean {
    return (
      registration.active === true &&
      isConcreteBinding(registration.connectorKey) &&
      isConcreteBinding(registration.customerId) &&
      isConcreteBinding(registration.integrationId) &&
      isConcreteBinding(registration.hostApp) &&
      registration.connectorKey === input.tool.connectorKey &&
      registration.customerId === input.host.customerId &&
      registration.integrationId === input.host.integrationId &&
      registration.hostApp === input.host.hostApp
    );
  }
}

function isConcreteBinding(value: string): boolean {
  return value.trim().length > 0 && value !== '*';
}

function unavailable(): ServiceUnavailableException {
  return new ServiceUnavailableException({
    error: 'DATA_ADAPTER_UNAVAILABLE',
    message: 'Data adapter unavailable.'
  });
}
