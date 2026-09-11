import request from 'supertest';
import { createCustomerConnectorRuntimeApplication } from '../../src/main';
import { validRuntimeEnvironment } from '../fixtures/runtime-environment';

describe('Phase 3 protected route inactivity', () => {
  it.each(['/v1/internal/connector-bindings', '/v1/connector/invocations'])('does not activate POST %s', async (path) => {
    const app = await createCustomerConnectorRuntimeApplication(validRuntimeEnvironment());
    await app.init();
    try {
      await request(app.getHttpServer()).post(path).set('Authorization', 'Bearer sentinel').send({ providerPayload: 'secret' }).expect(404);
    } finally {
      await app.close();
    }
  });
});
