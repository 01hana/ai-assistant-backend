import { Module } from '@nestjs/common';
import {
  DATA_ADAPTER_REGISTRATIONS,
  DataAdapterRegistrations
} from './data-adapter-registration';
import { DataAdapterRegistry } from './data-adapter-registry.service';

export const EMPTY_DATA_ADAPTER_REGISTRATIONS: DataAdapterRegistrations = Object.freeze([]);

@Module({
  imports: [],
  providers: [
    {
      provide: DATA_ADAPTER_REGISTRATIONS,
      useValue: EMPTY_DATA_ADAPTER_REGISTRATIONS
    },
    DataAdapterRegistry
  ],
  exports: [DATA_ADAPTER_REGISTRATIONS, DataAdapterRegistry]
})
export class ConnectorsModule {}
