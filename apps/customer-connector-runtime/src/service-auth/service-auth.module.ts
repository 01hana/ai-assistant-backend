import { Module } from '@nestjs/common';
import { ConnectorRuntimeConfigService } from '../config/runtime-configuration';
import { Phase3ReadinessInitializer } from '../health/phase3-readiness.initializer';
import { RuntimeHealthModule } from '../health/runtime-health.module';
import { SafeConnectorTelemetry } from '../observability/safe-connector.telemetry';
import { SafeObservabilityModule } from '../observability/safe-observability.module';
import { ReplayProtectionService } from '../replay/replay-protection.service';
import { ExactRawBodyAuthenticator } from './exact-raw-body.authenticator';
import { RuntimeServiceProfileRegistry } from './service-profile.registry';
import { ConnectorServiceProofVerifier } from './service-proof.verifier';

@Module({
  imports: [RuntimeHealthModule, SafeObservabilityModule],
  providers: [
    {
      provide: RuntimeServiceProfileRegistry,
      useFactory: (config: ConnectorRuntimeConfigService) => new RuntimeServiceProfileRegistry(
        config.validation.ok
          ? [...config.validation.config.centralProfiles, ...config.validation.config.bootstrapProfiles]
          : []
      ),
      inject: [ConnectorRuntimeConfigService]
    },
    {
      provide: ReplayProtectionService,
      useFactory: (config: ConnectorRuntimeConfigService) => new ReplayProtectionService(
        config.validation.ok ? config.validation.config.replayCacheMaxEntries : 1
      ),
      inject: [ConnectorRuntimeConfigService]
    },
    {
      provide: ConnectorServiceProofVerifier,
      useFactory: (profiles: RuntimeServiceProfileRegistry) => new ConnectorServiceProofVerifier(profiles),
      inject: [RuntimeServiceProfileRegistry]
    },
    {
      provide: ExactRawBodyAuthenticator,
      useFactory: (verifier: ConnectorServiceProofVerifier, replay: ReplayProtectionService, telemetry: SafeConnectorTelemetry) =>
        new ExactRawBodyAuthenticator(verifier, replay, telemetry),
      inject: [ConnectorServiceProofVerifier, ReplayProtectionService, SafeConnectorTelemetry]
    },
    Phase3ReadinessInitializer
  ],
  exports: [RuntimeServiceProfileRegistry, ReplayProtectionService, ConnectorServiceProofVerifier, ExactRawBodyAuthenticator]
})
export class ServiceAuthModule {}
