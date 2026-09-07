import { HostIntegrationContext, TransientConnectorContext } from '../host-integration/host-integration.types';
import { RegisteredToolDefinition } from '../tools/tool-registry.types';
import { ConnectorAdapter, ConnectorExecuteInput } from './connector-adapter.interface';

export interface DataAdapterMetadata {
  readonly adapterKey: string;
  readonly sourceSystem: string;
  readonly supportedHostApps: readonly string[];
  readonly supportedCapabilities: readonly string[];
}

export interface ValidatedNamedOperation {
  readonly canonicalToolKey: string;
  readonly arguments: Readonly<Record<string, unknown>>;
  readonly schemaVersion: string;
}

export interface DataAdapterCompatibilityInput {
  readonly host: HostIntegrationContext;
  readonly tool: RegisteredToolDefinition;
  readonly operation: ValidatedNamedOperation;
}

export interface DataAdapterCompatibilityResult {
  readonly compatible: boolean;
  readonly reason?: string;
}

export interface DataAdapterExecuteInput extends ConnectorExecuteInput {
  readonly host: HostIntegrationContext;
  readonly operation: ValidatedNamedOperation;
  readonly transientConnectorContext?: TransientConnectorContext;
}

export interface DataAdapter extends ConnectorAdapter<DataAdapterExecuteInput> {
  readonly metadata: Readonly<DataAdapterMetadata>;
  isCompatible(input: DataAdapterCompatibilityInput): DataAdapterCompatibilityResult;
}
