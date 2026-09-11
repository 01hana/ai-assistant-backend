import { Injectable } from '@nestjs/common';
import { ConnectorRuntimeConfigService } from '../config/runtime-configuration';

export type RuntimeDependency =
  | 'configuration' | 'serviceAuth' | 'replay' | 'observability'
  | 'bindingStore' | 'bindingRoute' | 'credentialProfiles' | 'manifest' | 'requestProfiles' | 'upstream' | 'invocationRoute';

const DEPENDENCIES: readonly RuntimeDependency[] = Object.freeze([
  'configuration', 'serviceAuth', 'replay', 'observability', 'bindingStore', 'bindingRoute', 'credentialProfiles',
  'manifest', 'requestProfiles', 'upstream', 'invocationRoute'
]);

@Injectable()
export class RuntimeReadinessRegistry {
  private readonly states = new Map<RuntimeDependency, boolean>(DEPENDENCIES.map((dependency) => [dependency, false]));

  setReady(dependency: RuntimeDependency, ready: boolean): void {
    if (!DEPENDENCIES.includes(dependency)) throw new Error('Unknown runtime readiness dependency.');
    this.states.set(dependency, ready);
  }

  snapshot(): Readonly<Record<RuntimeDependency, boolean>> {
    return Object.freeze(Object.fromEntries(DEPENDENCIES.map((dependency) => [dependency, this.states.get(dependency) === true])) as Record<RuntimeDependency, boolean>);
  }
}

@Injectable()
export class RuntimeReadinessService {
  constructor(private readonly config: ConnectorRuntimeConfigService, private readonly registry: RuntimeReadinessRegistry) {}

  snapshot(): Readonly<{ configurationValid: boolean; ready: boolean; missing: readonly RuntimeDependency[] }> {
    const states = this.registry.snapshot();
    const missing = Object.freeze(DEPENDENCIES.filter((dependency) => !states[dependency]));
    const configurationValid = this.config.isValid;
    return Object.freeze({ configurationValid, ready: configurationValid && missing.length === 0, missing });
  }

  getPublicReadiness(): Readonly<{ status: 'ready' | 'not_ready'; service: 'customer-connector-runtime'; runtimeDependencies: 'available' | 'not_evaluated'; productionReady: boolean }> {
    const ready = this.snapshot().ready;
    return Object.freeze({
      status: ready ? 'ready' : 'not_ready',
      service: 'customer-connector-runtime',
      runtimeDependencies: ready ? 'available' : 'not_evaluated',
      productionReady: ready
    });
  }
}
