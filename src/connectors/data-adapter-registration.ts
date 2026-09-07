import { DataAdapter } from './data-adapter.interface';

export interface DataAdapterRegistration {
  readonly adapter: DataAdapter;
  readonly connectorKey: string;
  readonly customerId: string;
  readonly integrationId: string;
  readonly hostApp: string;
  readonly active: boolean;
}

export type DataAdapterRegistrations = readonly DataAdapterRegistration[];

export const DATA_ADAPTER_REGISTRATIONS = Symbol('DATA_ADAPTER_REGISTRATIONS');
