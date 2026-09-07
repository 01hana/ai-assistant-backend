export interface HostIntegrationContext {
  readonly customerId: string;
  readonly integrationId: string;
  readonly hostApp: string;
  readonly organizationId: string;
  readonly actorId: string;
  readonly roles: readonly string[];
  readonly permissionScopes: readonly string[];
  readonly requestId: string;
}

export interface TransientConnectorContext {
  readonly connectorContextRef?: string;
}

export interface HostIntegrationRequestContext {
  readonly host: HostIntegrationContext;
  readonly pageContext?: NormalizedPageContext;
  readonly transient: TransientConnectorContext;
}
import { NormalizedPageContext } from '../assistant/page-context/page-context.types';
