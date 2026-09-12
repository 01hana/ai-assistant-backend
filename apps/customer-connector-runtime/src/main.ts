import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { CustomerConnectorRuntimeModule } from './customer-connector-runtime.module';
import type { BindingBootstrapProvider } from './bindings/binding-bootstrap-provider';
import type { Phase5RuntimeRegistrations } from './customer-connector-runtime.module';

export async function createCustomerConnectorRuntimeApplication(
  environment: Record<string, unknown> = process.env,
  bootstrapProviders: readonly BindingBootstrapProvider[] = [],
  phase5: Phase5RuntimeRegistrations = {}
): Promise<INestApplication> {
  return NestFactory.create(CustomerConnectorRuntimeModule.forEnvironment(environment, bootstrapProviders, phase5), {
    bufferLogs: true,
    bodyParser: false
  });
}

export async function bootstrap(): Promise<INestApplication> {
  const app = await createCustomerConnectorRuntimeApplication();
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3100);
  return app;
}

if (require.main === module) void bootstrap();
