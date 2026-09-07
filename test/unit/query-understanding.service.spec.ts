import { AuditWriterService } from '../../src/audit/audit-writer.service';
import { RiskLevel } from '../../src/generated/prisma/enums';
import { QueryUnderstandingService } from '../../src/query-understanding/query-understanding.service';
import { QueryUnderstandingRepository } from '../../src/query-understanding/query-understanding.repository';

describe('QueryUnderstandingService Phase 1 authority boundary', () => {
  it('derives persistence scope from HostIntegrationContext and exposes no identity auth or transient reference to the pipeline', async () => {
    const understand = jest.fn().mockResolvedValue(output());
    const save = jest.fn().mockResolvedValue({ id: 'qu-001' });
    const append = jest.fn().mockResolvedValue({ id: 'audit-001' });
    const service = new QueryUnderstandingService(
      { understand } as never,
      { save } as unknown as QueryUnderstandingRepository,
      { append } as unknown as AuditWriterService
    );
    const hostIntegrationContext = {
      requestId: 'req-qu-boundary', customerId: 'customer-a', integrationId: 'integration-erp',
      organizationId: 'org-001', hostApp: 'erp', actorId: 'actor-001',
      roles: ['planner'] as const, permissionScopes: ['orders:read'] as const
    };

    await service.understandAndPersist({
      requestId: 'req-qu-boundary', sessionId: 'session-001', messageId: 'message-001', text: 'SO-10001',
      hostIntegrationContext,
      pageContext: { module: 'orders', entityType: 'order', entityId: 'SO-10001' }
    });

    expect(understand).toHaveBeenCalledWith(expect.objectContaining({ hostIntegrationContext }));
    expect(understand.mock.calls[0][0]).not.toHaveProperty('identityContext');
    expect(understand.mock.calls[0][0]).not.toHaveProperty('transientConnectorContext');
    expect(save).toHaveBeenCalledWith(expect.objectContaining({
      customerScope: expect.objectContaining({ customerId: 'customer-a', integrationId: 'integration-erp' })
    }));
  });
});

function output() {
  return {
    taskType: 'order_status_lookup', sentences: [], tokens: [], phrases: [], normalizedTerms: [], timeRanges: [],
    resolvedReferences: [], entityCandidates: [], subTasks: [], candidateTools: [], riskLevel: RiskLevel.low,
    confidence: 0.9, clarificationNeeds: [], requiredEvidence: []
  };
}
