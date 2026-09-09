import { AnswerDecisionService } from '../../src/assistant/answer/answer-decision.service';
import { AnswerDecisionStatus, ExecutionDecision, RiskLevel } from '../../src/generated/prisma/enums';
import { PrismaService } from '../../src/prisma/prisma.service';
import { CUSTOMER_SCOPE_FIXTURES, createCustomerScopeFixtureScope } from '../support/customer-scope-fixtures';

describe('AnswerDecisionService', () => {
  it('persists an answered decision when sanitized evidence covers allowed claims', async () => {
    const groundingCreate = jest.fn().mockResolvedValue({ id: 'grounding-001' });
    const answerCreate = jest.fn().mockResolvedValue({ id: 'answer-decision-001' });
    const service = new AnswerDecisionService({
      db: {
        groundingCheck: { create: groundingCreate },
        answerDecision: { create: answerCreate }
      }
    } as unknown as PrismaService);

    const result = await service.decide({
      customerScope: createCustomerScopeFixtureScope(CUSTOMER_SCOPE_FIXTURES.customerA),
      requestId: 'req-answer',
      messageId: 'message-001',
      executionPlan: createPlan(ExecutionDecision.continue),
      evidenceRefs: [{ id: 'evidence-001', summary: { status: '已確認' } }]
    });

    expect(result.status).toBe(AnswerDecisionStatus.answered);
    expect(result.answer.text).toContain('已確認');
    expect(groundingCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          customerId: 'customer-a',
          covered: true,
          evidenceRefIds: ['evidence-001']
        })
      })
    );
    expect(answerCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ customerId: 'customer-a', messageId: 'message-001' })
      })
    );
  });

  it('returns clarification when execution planning says clarify', async () => {
    const service = createService();
    const result = await service.decide({
      customerScope: createCustomerScopeFixtureScope(CUSTOMER_SCOPE_FIXTURES.customerA),
      requestId: 'req-answer',
      messageId: 'message-001',
      executionPlan: createPlan(ExecutionDecision.clarify),
      evidenceRefs: []
    });

    expect(result.status).toBe(AnswerDecisionStatus.clarification_required);
  });

  it('returns no-answer when evidence is missing', async () => {
    const service = createService();
    const result = await service.decide({
      customerScope: createCustomerScopeFixtureScope(CUSTOMER_SCOPE_FIXTURES.customerA),
      requestId: 'req-answer',
      messageId: 'message-001',
      executionPlan: createPlan(ExecutionDecision.continue),
      evidenceRefs: []
    });

    expect(result.status).toBe(AnswerDecisionStatus.no_answer);
  });

  it('consumes projected adapter evidence only through GroundedAnswerInput', async () => {
    const groundingCreate = jest.fn().mockResolvedValue({ id: 'grounding-grounded' });
    const answerCreate = jest.fn().mockResolvedValue({ id: 'answer-grounded' });
    const service = new AnswerDecisionService({
      db: {
        groundingCheck: { create: groundingCreate },
        answerDecision: { create: answerCreate }
      }
    } as unknown as PrismaService);

    const result = await service.decideGrounded({
      customerScope: createCustomerScopeFixtureScope(CUSTOMER_SCOPE_FIXTURES.customerA),
      requestId: 'req-grounded',
      messageId: 'message-grounded',
      executionPlan: createPlan(ExecutionDecision.continue),
      groundedAnswerInput: {
        toolCallId: 'tool-call-grounded',
        canonicalToolKey: 'mock.orders.status.lookup',
        evidence: [
          {
            evidenceRefId: 'evidence-grounded',
            sourceType: 'structured_record',
            sourceId: 'SO-10001',
            projectedFacts: { status: '已確認' }
          }
        ]
      }
    });

    expect(result.status).toBe(AnswerDecisionStatus.answered);
    expect(result.answer.text).toContain('已確認');
    expect(groundingCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ evidenceRefIds: ['evidence-grounded'] })
      })
    );
  });

  it('does not accept legacy arbitrary evidence summaries on the grounded adapter seam', async () => {
    const service = createService();

    await service.decideGrounded({
      customerScope: createCustomerScopeFixtureScope(CUSTOMER_SCOPE_FIXTURES.customerA),
      requestId: 'req-grounded-legacy',
      messageId: 'message-grounded-legacy',
      executionPlan: createPlan(ExecutionDecision.continue),
      groundedAnswerInput: undefined,
      // @ts-expect-error Grounded adapter decisions cannot accept arbitrary legacy evidence summaries.
      evidenceRefs: [{ id: 'legacy-evidence', summary: { rawResult: 'RAW_ADAPTER_SENTINEL' } }]
    });
  });
});

function createService() {
  return new AnswerDecisionService({
    db: {
      groundingCheck: { create: jest.fn().mockResolvedValue({ id: 'grounding-001' }) },
      answerDecision: { create: jest.fn().mockResolvedValue({ id: 'answer-decision-001' }) }
    }
  } as unknown as PrismaService);
}

function createPlan(decision: ExecutionDecision) {
  return {
    id: 'plan-001',
    customerId: 'customer-a',
    sessionId: 'session-001',
    messageId: 'message-001',
    taskType: 'order_status_lookup',
    requiredEvidence: [],
    candidateTools: [],
    permissionChecks: [],
    riskAssessment: RiskLevel.low,
    clarificationNeeds: null,
    expectedAnswerShape: {},
    requiresMultiStepToolUse: false,
    decision,
    createdAt: new Date()
  };
}
