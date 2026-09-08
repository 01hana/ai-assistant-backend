import { Module } from '@nestjs/common';
import {
  DATA_ADAPTER_REGISTRATIONS,
  DataAdapterRegistrations
} from './data-adapter-registration';
import { DataAdapterRegistry } from './data-adapter-registry.service';
import { AdapterResultProjectorService } from './adapter-result-projector.service';
import { PermissionsModule } from '../permissions/permissions.module';
import {
  MOCK_DATA_ADAPTER_REGISTRATIONS,
  MockConnectorModule
} from './mock/mock-connector.module';

export const EMPTY_DATA_ADAPTER_REGISTRATIONS: DataAdapterRegistrations = Object.freeze([]);

@Module({
  imports: [PermissionsModule, MockConnectorModule],
  providers: [
    {
      provide: DATA_ADAPTER_REGISTRATIONS,
      useValue: MOCK_DATA_ADAPTER_REGISTRATIONS
    },
    DataAdapterRegistry,
    AdapterResultProjectorService
  ],
  exports: [DATA_ADAPTER_REGISTRATIONS, DataAdapterRegistry, AdapterResultProjectorService]
})
export class ConnectorsModule {}
