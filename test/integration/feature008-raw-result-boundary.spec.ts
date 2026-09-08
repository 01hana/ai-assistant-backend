import { INestApplication } from '@nestjs/common';
import { createHash } from 'crypto';
import request = require('supertest');
import { StructuredLoggerService } from '../../src/common/logger/structured-logger.service';
import { MockConnectorAdapter } from '../../src/connectors/mock/mock-connector.adapter';
import { LlmExecutionService } from '../../src/llm/llm-execution.service';
import { LlmInputSanitizerService } from '../../src/permissions/llm-input-sanitizer.service';
import * as groundedAnswer from '../../src/assistant/runtime/grounded-answer-input.types';
import * as observabilityMetadata from '../../src/observability/observability-metadata.helper';
import {
  createIdentityHeaders,
  createUs1TestAppWithState,
  Us1TestState
} from '../support/us1-test-app.helper';

const RAW_RESULT = 'RAW_ADAPTER_RESULT_SENTINEL_008';
const CUSTOMER_SECRET = 'RAW_CUSTOMER_SECRET_008';
const INTERNAL_COST = 'RAW_INTERNAL_COST_008';
const CONNECTOR_CONTEXT = 'ccr_PHASE4_RAW_BOUNDARY_008';
const SENTINELS = [RAW_RESULT, CUSTOMER_SECRET, INTERNAL_COST, CONNECTOR_CONTEXT] as const;

describe('Feature 008 raw adapter result boundary', () => {
  let app: INestApplication;
  let state: Us1TestState;

  beforeAll(async () => {
    ({ app, state } = await createUs1TestAppWithState());
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('releases only projected facts and keeps denied raw values out of every downstream sink', async () => {
    jest.spyOn(MockConnectorAdapter.prototype, 'execute').mockResolvedValueOnce({
      toolKey: 'mock.orders.status.lookup',
      status: 'succeeded',
      data: {
        orderId: 'SO-10001',
        organizationId: INTERNAL_COST,
        customerCode: CUSTOMER_SECRET,
        status: 'picking'
      }
    });
    const captures = captureNegativeSurfaces(app);
    const initialToolCalls = state.toolCalls.length;
    const initialEvidence = state.evidenceRefs.length;
    const initialAudit = state.auditEvents.length;

    const response = await sendOrderStatusRequest(app, 'req-feature008-raw-success');

    expect(response.status).toBe(200);
    const newToolCalls = state.toolCalls.slice(initialToolCalls);
    const newEvidence = state.evidenceRefs.slice(initialEvidence);
    const newAudit = state.auditEvents.slice(initialAudit);
    expect(newToolCalls).toHaveLength(1);
    expect(newToolCalls[0]).toEqual(expect.objectContaining({
      status: 'success',
      outputSummary: {
        canonicalToolKey: 'mock.orders.status.lookup',
        schemaVersion: '1.0.0',
        fieldPaths: ['orderId', 'status'],
        fieldCount: 2,
        evidenceProvenanceFields: ['orderId']
      }
    }));
    expect(newToolCalls[0].inputSummary).toEqual({
      canonicalToolKey: 'mock.orders.status.lookup',
      schemaVersion: '1.0.0',
      argumentKeys: ['entityId'],
      argumentCount: 1
    });
    expect(newEvidence).toHaveLength(1);
    expect(captures.groundedInput).toHaveBeenCalled();

    assertSentinelsAbsent({
      toolCalls: newToolCalls,
      evidenceRefs: newEvidence,
      auditEvents: newAudit,
      structuredLogs: captures.structuredLog.mock.calls,
      telemetry: captures.observability.mock.calls,
      sanitizerInputs: captures.sanitizer.mock.calls,
      sanitizerOutputs: captures.sanitizer.mock.results.map((entry) => entry.value),
      groundedAnswerInputs: captures.groundedInput.mock.calls,
      modelCalls: {
        generateAnswer: captures.generateAnswer.mock.calls,
        classifyIntent: captures.classifyIntent.mock.calls,
        summarize: captures.summarize.mock.calls
      },
      sseBuilderInputs: state.orchestration.sseEventBuilds.mock.calls,
      serializedSse: response.text,
      publicResponse: response.body
    });
  });

  it('fails the started ToolCall atomically when malformed raw output cannot be projected', async () => {
    jest.spyOn(MockConnectorAdapter.prototype, 'execute').mockResolvedValueOnce({
      toolKey: 'mock.orders.status.lookup',
      status: 'succeeded',
      data: {
        orderId: 'SO-10001',
        status: 'picking',
        rawResult: RAW_RESULT
      }
    });
    const captures = captureNegativeSurfaces(app);
    const initialToolCalls = state.toolCalls.length;
    const initialEvidence = state.evidenceRefs.length;
    const initialAudit = state.auditEvents.length;

    const response = await sendOrderStatusRequest(app, 'req-feature008-raw-failure');

    expect(response.status).toBe(200);
    const newToolCalls = state.toolCalls.slice(initialToolCalls);
    const newEvidence = state.evidenceRefs.slice(initialEvidence);
    const newAudit = state.auditEvents.slice(initialAudit);
    expect(newToolCalls).toHaveLength(1);
    expect(newToolCalls[0]).toEqual(expect.objectContaining({
      status: 'failed',
      executionStatus: 'failed',
      outputSummary: {},
      errorCode: 'ADAPTER_RESULT_PROJECTION_FAILED'
    }));
    expect(newEvidence).toHaveLength(0);
    expect(captures.groundedInput).not.toHaveBeenCalled();

    assertSentinelsAbsent({
      toolCalls: newToolCalls,
      evidenceRefs: newEvidence,
      auditEvents: newAudit,
      structuredLogs: captures.structuredLog.mock.calls,
      telemetry: captures.observability.mock.calls,
      sanitizerInputs: captures.sanitizer.mock.calls,
      sanitizerOutputs: captures.sanitizer.mock.results.map((entry) => entry.value),
      groundedAnswerInputs: captures.groundedInput.mock.calls,
      modelCalls: {
        generateAnswer: captures.generateAnswer.mock.calls,
        classifyIntent: captures.classifyIntent.mock.calls,
        summarize: captures.summarize.mock.calls
      },
      sseBuilderInputs: state.orchestration.sseEventBuilds.mock.calls,
      serializedSse: response.text,
      publicResponse: response.body
    });
  });
});

function captureNegativeSurfaces(app: INestApplication) {
  const llmExecution = app.get(LlmExecutionService);
  return {
    structuredLog: jest.spyOn(StructuredLoggerService.prototype, 'write'),
    observability: jest.spyOn(observabilityMetadata, 'createRuntimeDecisionMetadata'),
    sanitizer: jest.spyOn(app.get(LlmInputSanitizerService), 'sanitize'),
    groundedInput: jest.spyOn(groundedAnswer, 'createGroundedAnswerInput'),
    generateAnswer: jest.spyOn(llmExecution, 'generateAnswer'),
    classifyIntent: jest.spyOn(llmExecution, 'classifyIntent'),
    summarize: jest.spyOn(llmExecution, 'summarize')
  };
}

async function sendOrderStatusRequest(app: INestApplication, requestId: string) {
  return request(app.getHttpServer())
    .post('/api/v1/assistant/sessions/session-owned-001/messages')
    .set(createIdentityHeaders({ 'x-request-id': requestId }))
    .send({
      message: '這張訂單目前狀態？',
      pageContext: {
        connectorContextRef: CONNECTOR_CONTEXT,
        module: 'orders',
        entityType: 'order',
        entityId: 'SO-10001',
        selectedRows: [{ id: 'SO-10001', data: { label: 'Order 10001' } }],
        visibleColumns: ['orderId', 'status']
      }
    });
}

function assertSentinelsAbsent(value: unknown): void {
  const serialized = JSON.stringify(value);
  for (const sentinel of SENTINELS) {
    expect(serialized).not.toContain(sentinel);
    expect(serialized).not.toContain(Buffer.from(sentinel).toString('base64'));
    expect(serialized).not.toContain(createHash('sha256').update(sentinel).digest('hex'));
  }
  expect(serialized).not.toContain('ADAPTER_RESULT_SENTINEL_008');
  expect(serialized).not.toContain('CUSTOMER_SECRET_008');
  expect(serialized).not.toContain('INTERNAL_COST_008');
  expect(serialized).not.toContain('PHASE4_RAW_BOUNDARY_008');
}
