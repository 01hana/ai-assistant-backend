import { DynamicModule, Module } from '@nestjs/common';
import { RuntimeConfigurationModule } from './config/configuration.module';
import { ServiceAuthModule } from './service-auth/service-auth.module';
import { ConnectorBindingModule } from './bindings/connector-binding.module';
import type { BindingBootstrapProvider } from './bindings/binding-bootstrap-provider';
import { OperationManifestModule } from './manifest/operation-manifest.module';
import type { CredentialApplicationStrategy, CredentialProvider } from './credentials/credential.types';

export interface Phase5RuntimeRegistrations {
  readonly credentialProviders?: readonly CredentialProvider[];
  readonly credentialStrategies?: readonly CredentialApplicationStrategy[];
}

@Module({})
export class CustomerConnectorRuntimeModule {
  static forEnvironment(
    environment: Record<string, unknown> = process.env,
    providers: readonly BindingBootstrapProvider[] = [],
    phase5: Phase5RuntimeRegistrations = {}
  ): DynamicModule {
    return {
      module: CustomerConnectorRuntimeModule,
      imports: [
        RuntimeConfigurationModule.forEnvironment(environment),
        ServiceAuthModule,
        ConnectorBindingModule.register(providers),
        OperationManifestModule.register(phase5.credentialProviders, phase5.credentialStrategies)
      ]
    };
  }
}
