import { DynamicModule, Global, Module } from '@nestjs/common';
import { CONNECTOR_RUNTIME_ENVIRONMENT, ConnectorRuntimeConfigService } from './runtime-configuration';

@Global()
@Module({})
export class RuntimeConfigurationModule {
  static forEnvironment(environment: Record<string, unknown> = process.env): DynamicModule {
    return {
      module: RuntimeConfigurationModule,
      providers: [
        { provide: CONNECTOR_RUNTIME_ENVIRONMENT, useValue: environment },
        ConnectorRuntimeConfigService
      ],
      exports: [ConnectorRuntimeConfigService]
    };
  }
}
