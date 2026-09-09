import { createGroundedAnswerInput } from '../../src/assistant/runtime/grounded-answer-input.types';
import { EvidenceSourceType } from '../../src/generated/prisma/enums';
import { SafeProjectedAdapterResult } from '../../src/tools/tool-registry.types';

describe('GroundedAnswerInput', () => {
  it('reconstructs only canonical identity, evidence identity/provenance, and safe projected facts', () => {
    const projectedResult: SafeProjectedAdapterResult = {
      kind: 'safe_projected_adapter_result',
      canonicalToolKey: 'mock.orders.status.lookup',
      schemaVersion: '1.0.0',
      facts: { status: 'picking' },
      fieldPaths: ['status'],
      evidenceProvenance: { orderId: 'SO-10001' }
    };
    const evidenceWithForbiddenSiblings = {
      id: 'evidence-001',
      sourceType: EvidenceSourceType.structured_record,
      sourceId: 'SO-10001',
      summary: { status: 'picking' },
      endpoint: 'https://internal.example.test'
    };
    const input = createGroundedAnswerInput({
      toolCallId: 'tool-call-001',
      projectedResult: {
        ...projectedResult,
        rawResult: 'RAW_ADAPTER_SENTINEL',
        connectorContextRef: 'ccr_FORBIDDEN',
        nativeCredential: 'sk-native-secret'
      } as SafeProjectedAdapterResult,
      evidenceRefs: [evidenceWithForbiddenSiblings]
    });

    expect(input).toEqual({
      toolCallId: 'tool-call-001',
      canonicalToolKey: 'mock.orders.status.lookup',
      evidence: [
        {
          evidenceRefId: 'evidence-001',
          sourceType: 'structured_record',
          sourceId: 'SO-10001',
          projectedFacts: { status: 'picking' }
        }
      ]
    });
    expect(Object.isFrozen(input)).toBe(true);
    expect(Object.isFrozen(input.evidence)).toBe(true);
    expect(JSON.stringify(input)).not.toMatch(/RAW_ADAPTER_SENTINEL|ccr_FORBIDDEN|sk-native-secret|internal\.example/);
  });

  it('returns no evidence entries when projected facts or attached evidence are absent', () => {
    const input = createGroundedAnswerInput({
      toolCallId: 'tool-call-001',
      projectedResult: {
        kind: 'safe_projected_adapter_result',
        canonicalToolKey: 'mock.orders.status.lookup',
        schemaVersion: '1.0.0',
        facts: {},
        fieldPaths: [],
        evidenceProvenance: {}
      },
      evidenceRefs: []
    });

    expect(input.evidence).toEqual([]);
  });

  it('does not copy forbidden siblings from evidence or projected-result cast inputs', () => {
    const input = createGroundedAnswerInput({
      toolCallId: 'tool-call-closed-boundary',
      projectedResult: {
        kind: 'safe_projected_adapter_result',
        canonicalToolKey: 'mock.inventory.availability.lookup',
        schemaVersion: '1.0.0',
        facts: { availableQuantity: 36 },
        fieldPaths: ['availableQuantity'],
        evidenceProvenance: { itemSku: 'SKU-DEMO-RED' },
        rawConnectorResult: 'RAW_RESULT_BYPASS_SENTINEL',
        connectorContextRef: 'ccr_ANSWER_BYPASS',
        browserRecord: { nativeCredential: 'RefreshToken ANSWER_BYPASS' }
      } as SafeProjectedAdapterResult,
      evidenceRefs: [
        {
          id: 'evidence-closed-boundary',
          sourceType: EvidenceSourceType.structured_record,
          sourceId: 'SKU-DEMO-RED',
          endpoint: 'https://customer.internal.example',
          adapterConfiguration: 'ANSWER_ADAPTER_CONFIG_SENTINEL'
        } as {
          id: string;
          sourceType: EvidenceSourceType;
          sourceId: string;
        }
      ]
    });

    expect(input).toEqual({
      toolCallId: 'tool-call-closed-boundary',
      canonicalToolKey: 'mock.inventory.availability.lookup',
      evidence: [
        {
          evidenceRefId: 'evidence-closed-boundary',
          sourceType: 'structured_record',
          sourceId: 'SKU-DEMO-RED',
          projectedFacts: { availableQuantity: 36 }
        }
      ]
    });
    expect(JSON.stringify(input)).not.toMatch(
      /RAW_RESULT_BYPASS_SENTINEL|ccr_ANSWER_BYPASS|RefreshToken|customer\.internal|ANSWER_ADAPTER_CONFIG_SENTINEL/
    );
  });
});
