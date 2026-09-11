import { DynamicModule, Module } from '@nestjs/common';
import { RuntimeConfigurationModule } from './config/configuration.module';
import { ServiceAuthModule } from './service-auth/service-auth.module';
import { ConnectorBindingModule } from './bindings/connector-binding.module';
import type { BindingBootstrapProvider } from './bindings/binding-bootstrap-provider';

@Module({})
export class CustomerConnectorRuntimeModule {
  static forEnvironment(environment: Record<string, unknown> = process.env, providers: readonly BindingBootstrapProvider[] = []): DynamicModule {
    return {
      module: CustomerConnectorRuntimeModule,
      imports: [RuntimeConfigurationModule.forEnvironment(environment), ServiceAuthModule, ConnectorBindingModule.register(providers)]
    };
  }
}
