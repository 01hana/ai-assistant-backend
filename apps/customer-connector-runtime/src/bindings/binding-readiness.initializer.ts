import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConnectorRuntimeConfigService } from '../config/runtime-configuration';
import { RuntimeReadinessRegistry } from '../health/readiness.service';
import { RuntimeServiceProfileRegistry } from '../service-auth/service-profile.registry';
import { BindingBootstrapProviderRegistry } from './binding-bootstrap-provider.registry';
import { InMemoryConnectorBindingStore } from './in-memory-connector-binding.store';

@Injectable()
export class BindingReadinessInitializer implements OnModuleInit {
  constructor(
    private readonly config: ConnectorRuntimeConfigService,
    private readonly readiness: RuntimeReadinessRegistry,
    private readonly serviceProfiles: RuntimeServiceProfileRegistry,
    private readonly providers: BindingBootstrapProviderRegistry,
    private readonly store: InMemoryConnectorBindingStore
  ) {}

  async onModuleInit(): Promise<void> {
    const storeReady = this.config.isValid && this.store.isOperational;
    this.readiness.setReady('bindingStore', storeReady);
    this.readiness.setReady('bindingRoute', storeReady && this.providers.isValid && await this.serviceProfiles.validate());
  }
}
