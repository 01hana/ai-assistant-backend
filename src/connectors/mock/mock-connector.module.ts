import { Module } from '@nestjs/common';
import { DataAdapterRegistrations } from '../data-adapter-registration';
import { MockConnectorAdapter } from './mock-connector.adapter';

export const MOCK_CONNECTOR_ADAPTER = new MockConnectorAdapter();

export const MOCK_DATA_ADAPTER_REGISTRATIONS: DataAdapterRegistrations = Object.freeze([
  Object.freeze({
    adapter: MOCK_CONNECTOR_ADAPTER,
    connectorKey: 'mock',
    customerId: 'customer-a',
    integrationId: 'integration-erp',
    hostApp: 'erp',
    active: true
  }),
  Object.freeze({
    adapter: MOCK_CONNECTOR_ADAPTER,
    connectorKey: 'mock',
    customerId: 'customer-b',
    integrationId: 'integration-erp',
    hostApp: 'erp',
    active: true
  })
]);

@Module({
  providers: [{ provide: MockConnectorAdapter, useValue: MOCK_CONNECTOR_ADAPTER }],
  exports: [MockConnectorAdapter]
})
export class MockConnectorModule {}
