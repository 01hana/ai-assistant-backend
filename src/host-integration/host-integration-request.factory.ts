import { Injectable, NotFoundException } from '@nestjs/common';
import { CustomerScope } from '../identity/customer-scope.types';
import { RequestIdentityContext } from '../identity/identity-context.types';
import { HostIntegrationContext } from './host-integration.types';
import { PageContextDto } from '../assistant/page-context/page-context.dto';
import { HostIntegrationRequestContext } from './host-integration.types';
import { PageContextNormalizerService } from './page-context-normalizer.service';

@Injectable()
export class HostIntegrationRequestFactory {
  constructor(
    private readonly pageContextNormalizer: PageContextNormalizerService = new PageContextNormalizerService()
  ) {}

  create(identityContext: RequestIdentityContext, wirePageContext?: PageContextDto): HostIntegrationRequestContext {
    const host = this.createHostContext(identityContext);
    const { pageContext, transient } = this.pageContextNormalizer.splitAndNormalize(wirePageContext);
    return Object.freeze({ host, pageContext, transient });
  }

  createHostContext(
    identityContext: RequestIdentityContext,
    expectedScope?: CustomerScope
  ): HostIntegrationContext {
    assertRequiredIdentity(identityContext);

    const host = Object.freeze({
      customerId: identityContext.customer.customerId,
      integrationId: identityContext.customer.integrationId,
      hostApp: identityContext.hostApp.hostApp,
      organizationId: identityContext.organization.organizationId,
      actorId: identityContext.actor.actorId,
      roles: Object.freeze([...identityContext.actor.roles]),
      permissionScopes: Object.freeze([...identityContext.actor.permissionScopes]),
      requestId: identityContext.requestId
    });

    if (expectedScope) {
      assertHostMatchesCustomerScope(host, expectedScope);
    }

    return host;
  }
}

export function createCustomerScopeFromHostIntegrationContext(host: HostIntegrationContext): CustomerScope {
  return Object.freeze({
    customerId: host.customerId,
    integrationId: host.integrationId,
    organizationId: host.organizationId,
    hostApp: host.hostApp,
    actorId: host.actorId,
    roles: Object.freeze([...host.roles]),
    permissionScopes: Object.freeze([...host.permissionScopes])
  }) as CustomerScope;
}

function assertRequiredIdentity(identity: RequestIdentityContext): void {
  const required = [
    identity.customer.customerId,
    identity.customer.integrationId,
    identity.hostApp.hostApp,
    identity.organization.organizationId,
    identity.actor.actorId,
    identity.requestId
  ];
  if (
    required.some((value) => typeof value !== 'string' || value.trim().length === 0) ||
    !validStringArray(identity.actor.roles) ||
    !validStringArray(identity.actor.permissionScopes)
  ) {
    throw notFound();
  }
}

function assertHostMatchesCustomerScope(host: HostIntegrationContext, scope: CustomerScope): void {
  if (
    host.customerId !== scope.customerId ||
    host.integrationId !== scope.integrationId ||
    host.organizationId !== scope.organizationId ||
    host.hostApp !== scope.hostApp ||
    host.actorId !== scope.actorId ||
    !sameSet(host.roles, scope.roles) ||
    !sameSet(host.permissionScopes, scope.permissionScopes)
  ) {
    throw notFound();
  }
}

function validStringArray(values: unknown): values is string[] {
  return Array.isArray(values) && values.every((value) => typeof value === 'string' && value.trim().length > 0);
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  const normalizedLeft = [...new Set(left)].sort();
  const normalizedRight = [...new Set(right)].sort();
  return normalizedLeft.length === normalizedRight.length && normalizedLeft.every((value, index) => value === normalizedRight[index]);
}

function notFound(): NotFoundException {
  return new NotFoundException({ error: 'NOT_FOUND', message: 'Customer resource not found.' });
}
