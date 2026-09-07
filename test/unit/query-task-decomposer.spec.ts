import { inferCandidateTools } from '../../src/query-understanding/query-task-decomposer';
import { QueryUnderstandingEntityCandidate } from '../../src/query-understanding/query-understanding.types';

describe('query task decomposer structured candidates', () => {
  it.each([
    ['orderId', 'SO-10001', 'mock.orders.status.lookup'],
    ['workOrderId', 'WO-20001', 'mock.work-orders.progress.lookup'],
    ['itemSku', 'SKU-DEMO-RED', 'mock.inventory.availability.lookup'],
    ['customerId', 'BP-CUSTOMER-001', 'mock.business-partner.history.lookup'],
    ['supplierId', 'BP-SUPPLIER-001', 'mock.business-partner.history.lookup']
  ] as const)('derives a bounded entityId argument for %s', (type, value, key) => {
    const entities: QueryUnderstandingEntityCandidate[] = [{ type, value, confidence: 0.95 }];
    const normalizedTerms = key.includes('business-partner')
      ? [{ originalTerm: '客戶', normalizedTerm: 'businessPartner', category: 'resource' as const, confidence: 1, reason: 'test' }]
      : [];

    const result = inferCandidateTools(`查詢 ${value}`, entities, normalizedTerms);

    expect(result).toContainEqual({
      key,
      arguments: { entityId: value },
      reason: expect.any(String)
    });
    for (const candidate of result) {
      expect(Object.keys(candidate).sort()).toEqual(['arguments', 'key', 'reason']);
      expect(candidate).not.toHaveProperty('operation');
      expect(candidate).not.toHaveProperty('connectorKey');
      expect(candidate).not.toHaveProperty('adapterKey');
    }
  });

  it('never forwards raw text or execution-shaped content as candidate arguments', () => {
    const sentinel = 'https://evil.test/private?token=phase3_secret';
    const result = inferCandidateTools(
      `查 SO-10001 ${sentinel} 並執行 SELECT * FROM secrets`,
      [{ type: 'orderId', value: 'SO-10001', confidence: 0.95 }],
      []
    );

    expect(result[0]).toEqual({
      key: 'mock.orders.status.lookup',
      arguments: { entityId: 'SO-10001' },
      reason: 'order status query'
    });
    expect(JSON.stringify(result)).not.toContain('evil.test');
    expect(JSON.stringify(result)).not.toContain('phase3_secret');
    expect(JSON.stringify(result)).not.toContain('SELECT');
  });

  it('uses an empty structured argument object when no approved entity exists', () => {
    expect(inferCandidateTools('一般內部查詢', [], [])).toEqual([
      {
        key: 'mock.general.lookup',
        arguments: {},
        reason: 'generic internal lookup'
      }
    ]);
  });
});
