import { DynamicModule, Module } from '@nestjs/common';
import { ConnectorRuntimeConfigService } from '../config/runtime-configuration';
import { CredentialModule } from '../credentials/credential.module';
import { CredentialProfileRegistry } from '../credentials/credential-profile.registry';
import type { CredentialApplicationStrategy, CredentialProvider } from '../credentials/credential.types';
import { RuntimeHealthModule } from '../health/runtime-health.module';
import { RuntimeReadinessRegistry } from '../health/readiness.service';
import { ManifestBoundaryReadinessInitializer } from './manifest-boundary-readiness.initializer';
import { ManifestFileLoader } from './manifest-file.loader';
import { OperationManifestRegistry } from './operation-manifest.registry';
import { RequestProfileRegistry } from './request-profile.registry';

@Module({})
export class OperationManifestModule {
  static register(providers: readonly CredentialProvider[] = [], strategies: readonly CredentialApplicationStrategy[] = []): DynamicModule {
    return {
      module: OperationManifestModule,
      imports: [RuntimeHealthModule, CredentialModule.register(providers, strategies)],
      providers: [
        ManifestFileLoader,
        RequestProfileRegistry,
        {
          provide: OperationManifestRegistry,
          useFactory: (config: ConnectorRuntimeConfigService, loader: ManifestFileLoader, profiles: RequestProfileRegistry) => {
            const loaded = config.validation.ok ? loader.load(config.validation.config.manifestFiles) : undefined;
            return new OperationManifestRegistry(loaded?.ok ? loaded.value : [], profiles);
          },
          inject: [ConnectorRuntimeConfigService, ManifestFileLoader, RequestProfileRegistry]
        },
        {
          provide: ManifestBoundaryReadinessInitializer,
          useFactory: (
            readiness: RuntimeReadinessRegistry,
            manifests: OperationManifestRegistry,
            credentials: CredentialProfileRegistry,
            requestProfiles: RequestProfileRegistry
          ) => new ManifestBoundaryReadinessInitializer(readiness, manifests, credentials, requestProfiles),
          inject: [RuntimeReadinessRegistry, OperationManifestRegistry, CredentialProfileRegistry, RequestProfileRegistry]
        }
      ],
      exports: [OperationManifestRegistry, RequestProfileRegistry, CredentialModule]
    };
  }
}
