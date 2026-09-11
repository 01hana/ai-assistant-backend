import { RuntimeReadinessRegistry, RuntimeReadinessService } from '../../src/health/readiness.service';
import { ConnectorRuntimeConfigService } from '../../src/config/runtime-configuration';
import { validRuntimeEnvironment } from '../fixtures/runtime-environment';
import { Phase3ReadinessInitializer } from '../../src/health/phase3-readiness.initializer';
import { ReplayProtectionService } from '../../src/replay/replay-protection.service';

describe('Customer Connector Runtime health and readiness', () => {
  it('keeps public readiness fail-closed after only foundational capabilities are available', () => {
    const registry = new RuntimeReadinessRegistry();
    for (const dependency of ['configuration', 'serviceAuth', 'replay', 'observability'] as const) {
      registry.setReady(dependency, true);
    }
    const service = new RuntimeReadinessService(
      new ConnectorRuntimeConfigService(validRuntimeEnvironment()),
      registry
    );

    expect(service.snapshot()).toMatchObject({ configurationValid: true, ready: false });
    expect(service.getPublicReadiness()).toEqual({
      status: 'not_ready',
      service: 'customer-connector-runtime',
      runtimeDependencies: 'not_evaluated',
      productionReady: false
    });
    expect(JSON.stringify(service.getPublicReadiness())).not.toMatch(/customerId|integration|hostApp|kid|issuer|audience|profile/i);
  });

  it('keeps invalid trust configuration unavailable without reflecting its inputs', () => {
    const secret = 'configuration-secret-sentinel';
    const service = new RuntimeReadinessService(
      new ConnectorRuntimeConfigService({ CONNECTOR_PRIVATE_KEY: secret }),
      new RuntimeReadinessRegistry()
    );

    expect(service.snapshot()).toMatchObject({ configurationValid: false, ready: false });
    expect(JSON.stringify(service.getPublicReadiness())).not.toContain(secret);
  });

  it('marks only foundational capabilities while retaining business readiness false', async () => {
    const config = new ConnectorRuntimeConfigService(validRuntimeEnvironment());
    const registry = new RuntimeReadinessRegistry();
    const initializer = new Phase3ReadinessInitializer(
      config, registry,
      { validate: jest.fn().mockResolvedValue(true) } as never,
      new ReplayProtectionService(2, () => 1_800_000_010),
      { isOperational: true } as never
    );

    await initializer.onModuleInit();

    expect(registry.snapshot()).toMatchObject({
      configuration: true, serviceAuth: true, replay: true, observability: true,
      bindingStore: false, bindingRoute: false, credentialProfiles: false, manifest: false,
      requestProfiles: false, upstream: false, invocationRoute: false
    });
    expect(new RuntimeReadinessService(config, registry).getPublicReadiness()).toMatchObject({
      status: 'not_ready', productionReady: false
    });
  });
});
