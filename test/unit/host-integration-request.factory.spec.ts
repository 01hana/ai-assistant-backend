import { NotFoundException } from '@nestjs/common';
import {
  createCustomerScopeFromHostIntegrationContext,
  HostIntegrationRequestFactory
} from '../../src/host-integration/host-integration-request.factory';
import { RequestIdentityContext } from '../../src/identity/identity-context.types';
import { PageContextNormalizerService } from '../../src/host-integration/page-context-normalizer.service';
import { HostIntegrationRequestContext } from '../../src/host-integration/host-integration.types';

describe('HostIntegrationRequestFactory', () => {
  const identity = identityContext();

  it('copies and freezes trusted host authority only from verified identity', () => {
    const factory = new HostIntegrationRequestFactory();
    const host = factory.createHostContext(identity);

    expect(host).toEqual({
      customerId: 'customer-a',
      integrationId: 'integration-a',
      hostApp: 'erp',
      organizationId: 'org-001',
      actorId: 'actor-001',
      roles: ['planner'],
      permissionScopes: ['orders:read'],
      requestId: 'req-host-001'
    });
    expect(Object.isFrozen(host)).toBe(true);
    expect(Object.isFrozen(host.roles)).toBe(true);
    expect(Object.isFrozen(host.permissionScopes)).toBe(true);

    identity.actor.roles.push('browser-admin');
    identity.actor.permissionScopes.push('all:write');
    expect(host.roles).toEqual(['planner']);
    expect(host.permissionScopes).toEqual(['orders:read']);
  });

  it.each([
    ['customerId', (value: RequestIdentityContext) => (value.customer.customerId = ' ')],
    ['integrationId', (value: RequestIdentityContext) => (value.customer.integrationId = '')],
    ['hostApp', (value: RequestIdentityContext) => (value.hostApp.hostApp = ' ')],
    ['organizationId', (value: RequestIdentityContext) => (value.organization.organizationId = '')],
    ['actorId', (value: RequestIdentityContext) => (value.actor.actorId = ' ')],
    ['requestId', (value: RequestIdentityContext) => (value.requestId = '')]
  ])('fails closed when trusted %s is missing', (_field, mutate) => {
    const invalid = identityContext();
    mutate(invalid);
    expect(() => new HostIntegrationRequestFactory().createHostContext(invalid)).toThrow(NotFoundException);
  });

  it('fails closed when trusted roles or permission scopes contain blank values', () => {
    expect(() =>
      new HostIntegrationRequestFactory().createHostContext({
        ...identityContext(),
        actor: { ...identityContext().actor, roles: ['planner', ' '] }
      })
    ).toThrow(NotFoundException);
    expect(() =>
      new HostIntegrationRequestFactory().createHostContext({
        ...identityContext(),
        actor: { ...identityContext().actor, permissionScopes: ['orders:read', ''] }
      })
    ).toThrow(NotFoundException);
  });

  it.each([
    ['Customer', { customerId: 'customer-b' }],
    ['integration', { integrationId: 'integration-b' }],
    ['host app', { hostApp: 'mes' }],
    ['organization', { organizationId: 'org-002' }],
    ['actor', { actorId: 'actor-002' }],
    ['roles', { roles: ['admin'] }],
    ['permission scopes', { permissionScopes: ['all:write'] }]
  ])('fails closed for cross-%s trusted scope mismatch', (_label, mismatch) => {
    const factory = new HostIntegrationRequestFactory();
    const trustedScope = {
      ...createCustomerScopeFromHostIntegrationContext(factory.createHostContext(identityContext())),
      ...mismatch
    };

    expect(() => factory.createHostContext(identityContext(), trustedScope)).toThrow(NotFoundException);
  });

  it('does not let Browser PageContext substitute for missing trusted authority', () => {
    const invalid = identityContext();
    invalid.customer.customerId = '';
    const browserContext = {
      userVisibleState: {
        customerId: 'customer-browser',
        integrationId: 'integration-browser',
        hostApp: 'browser-host',
        organizationId: 'browser-org',
        actorId: 'browser-actor',
        roles: ['admin'],
        permissionScopes: ['all:write']
      }
    };

    expect(() => new HostIntegrationRequestFactory().create(invalid, browserContext)).toThrow(
      NotFoundException
    );
  });

  it('creates one exact ingress context and keeps Browser authority and transient state separated', () => {
    const factory = new HostIntegrationRequestFactory(new PageContextNormalizerService());
    const context: HostIntegrationRequestContext = factory.create(identityContext(), {
      connectorContextRef: 'ccr_factory_boundary',
      module: 'orders',
      entityType: 'order',
      entityId: 'SO-10001',
      selectedRows: [{ id: 'SO-10001', data: { label: 'Order 10001', customerId: 'customer-browser' } }],
      userVisibleState: {
        customerId: 'customer-browser',
        hostApp: 'browser-host',
        permissionScopes: ['all:write']
      }
    });

    expect(context.host).toEqual(expect.objectContaining({
      customerId: 'customer-a',
      integrationId: 'integration-a',
      organizationId: 'org-001',
      hostApp: 'erp',
      actorId: 'actor-001',
      roles: ['planner'],
      permissionScopes: ['orders:read']
    }));
    expect(context.pageContext).toEqual({
      module: 'orders',
      entityType: 'order',
      entityId: 'SO-10001',
      selectedRows: [{ id: 'SO-10001', summary: { label: 'Order 10001' } }]
    });
    expect(context.pageContext).not.toHaveProperty('connectorContextRef');
    expect(context.transient).toEqual({ connectorContextRef: 'ccr_factory_boundary' });
    expect(Object.isFrozen(context)).toBe(true);

    const { host, pageContext } = context;
    expect({ hostIntegrationContext: host, pageContext }).not.toHaveProperty('transient');
    expect({ hostIntegrationContext: host, pageContext, transientConnectorContext: context.transient })
      .toHaveProperty('transientConnectorContext.connectorContextRef', 'ccr_factory_boundary');
  });
});

function identityContext(): RequestIdentityContext {
  return {
    requestId: 'req-host-001',
    customer: { customerId: 'customer-a', integrationId: 'integration-a' },
    organization: { organizationId: 'org-001' },
    hostApp: { hostApp: 'erp' },
    actor: { actorId: 'actor-001', roles: ['planner'], permissionScopes: ['orders:read'] },
    auth: { tokenId: 'jwt-001', gatewayIssuer: 'https://gateway.test.internal' }
  };
}
