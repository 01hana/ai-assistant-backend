import request from 'supertest';
import { createCustomerConnectorRuntimeApplication } from '../../src/main';
import { validRuntimeEnvironment } from '../fixtures/runtime-environment';

describe('protected route activation boundary', () => {
  it('activates only the binding route in Phase 4', async () => {
    const app = await createCustomerConnectorRuntimeApplication(validRuntimeEnvironment());
    await app.init();
    try {
      await request(app.getHttpServer()).post('/v1/internal/connector-bindings')
        .set('Content-Type', 'application/json').set('Authorization', 'Bearer sentinel').send({ providerPayload: 'secret' }).expect(401);
      await request(app.getHttpServer()).post('/v1/connector/invocations')
        .set('Authorization', 'Bearer sentinel').send({ providerPayload: 'secret' }).expect(404);
    } finally {
      await app.close();
    }
  });
});
