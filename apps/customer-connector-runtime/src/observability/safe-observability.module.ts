import { Module } from '@nestjs/common';
import { SafeConnectorTelemetry } from './safe-connector.telemetry';

@Module({
  providers: [{ provide: SafeConnectorTelemetry, useFactory: () => new SafeConnectorTelemetry() }],
  exports: [SafeConnectorTelemetry]
})
export class SafeObservabilityModule {}
