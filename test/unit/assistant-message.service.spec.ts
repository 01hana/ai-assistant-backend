import { SendAssistantMessageInput } from '../../src/assistant/message/assistant-message.types';

describe('AssistantMessageService Phase 1 input boundary', () => {
  it('carries trusted, normalized, and transient inputs as separate contracts', () => {
    const input: SendAssistantMessageInput = {
      requestId: 'req-phase1-message',
      sessionId: 'session-001',
      message: '這張訂單目前狀態？',
      identityContext: {
        requestId: 'req-phase1-message',
        customer: { customerId: 'customer-a', integrationId: 'integration-erp' },
        organization: { organizationId: 'org-001' },
        hostApp: { hostApp: 'erp' },
        actor: { actorId: 'actor-001', roles: ['planner'], permissionScopes: ['orders:read'] },
        auth: { tokenId: 'private-token', gatewayIssuer: 'https://gateway.test.internal' }
      },
      hostIntegrationContext: {
        requestId: 'req-phase1-message',
        customerId: 'customer-a',
        integrationId: 'integration-erp',
        organizationId: 'org-001',
        hostApp: 'erp',
        actorId: 'actor-001',
        roles: ['planner'],
        permissionScopes: ['orders:read']
      },
      pageContext: { module: 'orders', entityType: 'order', entityId: 'SO-10001' },
      transientConnectorContext: { connectorContextRef: 'ccr_runtime_only' }
    };

    expect(input.pageContext).not.toHaveProperty('connectorContextRef');
    expect(input.transientConnectorContext).toEqual({ connectorContextRef: 'ccr_runtime_only' });
    expect(input.hostIntegrationContext).not.toHaveProperty('auth');
  });
});
