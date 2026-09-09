import { INestApplication } from '@nestjs/common';
import request = require('supertest');
import { MockConnectorAdapter } from '../../src/connectors/mock/mock-connector.adapter';
import { AnswerDecisionService } from '../../src/assistant/answer/answer-decision.service';
import * as groundedAnswer from '../../src/assistant/runtime/grounded-answer-input.types';
import {
  createIdentityHeaders,
  createUs1TestAppWithState,
  parseSseResponse,
  Us1TestState
} from '../support/us1-test-app.helper';

describe('authorized evidence-grounded answer integration', () => {
  let app: INestApplication;
  let state: Us1TestState;

  beforeAll(async () => {
    ({ app, state } = await createUs1TestAppWithState());
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns an answered final SSE event with traceable evidence refs for an authorized query', async () => {
    const answerDecision = app.get(AnswerDecisionService);
    const decideGrounded = jest.spyOn(answerDecision, 'decideGrounded');
    const response = await request(app.getHttpServer())
      .post('/api/v1/assistant/sessions/session-owned-001/messages')
      .set(createIdentityHeaders({ 'x-request-id': 'req-us1-authorized-answer' }))
      .send({
        message: '請幫我查 SO-10001 訂單目前狀態',
        pageContext: {
          module: 'orders',
          entityType: 'order',
          entityId: 'SO-10001',
          visibleColumns: ['status', 'customerName']
        }
      });

    expect(response.status).toBe(200);

    const events = parseSseResponse(response.text);
    const finalEvent = events.find((event) => event.event === 'final');
    const evidenceEvent = events.find((event) => event.event === 'evidence_attached');

    expect(evidenceEvent?.data).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          evidenceRefs: expect.arrayContaining([expect.any(String)])
        })
      })
    );
    expect(finalEvent?.data).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          answerDecision: 'answered'
        })
      })
    );
    expect(decideGrounded).toHaveBeenCalledTimes(1);
    const groundedDecisionInput = decideGrounded.mock.calls[0]?.[0];
    expect(groundedDecisionInput).toEqual(
      expect.objectContaining({
        groundedAnswerInput: expect.objectContaining({
          canonicalToolKey: 'mock.orders.status.lookup',
          evidence: [
            expect.objectContaining({
              sourceType: 'structured_record',
              sourceId: 'SO-10001',
              projectedFacts: expect.objectContaining({ status: 'picking' })
            })
          ]
        })
      })
    );
    expect(groundedDecisionInput).not.toHaveProperty('evidenceRefs');
    decideGrounded.mockRestore();
  });

  it('keeps declared-but-denied customerCode out of projected evidence, grounded input, SSE, and public output', async () => {
    const customerCode = 'CUSTOMER_SECRET_SENTINEL';
    const adapter = app.get(MockConnectorAdapter);
    const originalExecute = adapter.execute.bind(adapter);
    const execute = jest.spyOn(adapter, 'execute').mockImplementation(async (input) => {
      const result = await originalExecute(input);
      return result.data
        ? { ...result, data: { ...result.data, customerCode } }
        : result;
    });
    const groundedInput = jest.spyOn(groundedAnswer, 'createGroundedAnswerInput');

    const response = await request(app.getHttpServer())
      .post('/api/v1/assistant/sessions/session-owned-001/messages')
      .set(createIdentityHeaders({ 'x-request-id': 'req-customer-code-denied' }))
      .send({
        message: '請幫我查 SO-10001 訂單目前狀態',
        pageContext: {
          module: 'orders',
          entityType: 'order',
          entityId: 'SO-10001',
          visibleColumns: ['status', 'customerCode']
        }
      });

    expect(response.status).toBe(200);
    expect(groundedInput).toHaveBeenCalled();
    expect(JSON.stringify({
      evidenceRefs: state.evidenceRefs,
      groundedInputs: groundedInput.mock.calls,
      groundedResults: groundedInput.mock.results,
      response: response.text
    })).not.toContain(customerCode);
    expect(JSON.stringify(state.evidenceRefs)).not.toContain('customerCode');
    expect(response.text).not.toContain('customerCode');

    groundedInput.mockRestore();
    execute.mockRestore();
  });
});
