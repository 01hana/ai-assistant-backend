import { DynamicModule, Module } from '@nestjs/common';
import { RuntimeConfigurationModule } from './config/configuration.module';
import { ServiceAuthModule } from './service-auth/service-auth.module';

@Module({})
export class CustomerConnectorRuntimeModule {
  static forEnvironment(environment: Record<string, unknown> = process.env): DynamicModule {
    return {
      module: CustomerConnectorRuntimeModule,
      imports: [RuntimeConfigurationModule.forEnvironment(environment), ServiceAuthModule]
    };
  }
}
