import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConnectorRuntimeConfigService } from '../config/runtime-configuration';
import { SafeConnectorTelemetry } from '../observability/safe-connector.telemetry';
import { ReplayProtectionService } from '../replay/replay-protection.service';
import { RuntimeServiceProfileRegistry } from '../service-auth/service-profile.registry';
import { RuntimeReadinessRegistry } from './readiness.service';

@Injectable()
export class Phase3ReadinessInitializer implements OnModuleInit {
  constructor(
    private readonly config: ConnectorRuntimeConfigService,
    private readonly readiness: RuntimeReadinessRegistry,
    @Inject(RuntimeServiceProfileRegistry) private readonly profiles: Pick<RuntimeServiceProfileRegistry, 'validate'>,
    private readonly replay: ReplayProtectionService,
    private readonly telemetry: SafeConnectorTelemetry
  ) {}

  async onModuleInit(): Promise<void> {
    const configuration = this.config.isValid;
    this.readiness.setReady('configuration', configuration);
    this.readiness.setReady('serviceAuth', configuration && await this.profiles.validate());
    this.readiness.setReady('replay', configuration && this.replay instanceof ReplayProtectionService);
    this.readiness.setReady('observability', configuration && this.telemetry.isOperational === true);
  }
}
