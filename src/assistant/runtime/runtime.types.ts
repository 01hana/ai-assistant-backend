import { ToolCall } from '../../generated/prisma/client';
import { RiskLevel, ToolCallStatus, ToolExecutionStatus } from '../../generated/prisma/enums';
import { RequestIdentityContext } from '../../identity/identity-context.types';
import { HostIntegrationContext, TransientConnectorContext } from '../../host-integration/host-integration.types';
import { CustomerScope } from '../../identity/customer-scope.types';
import { ConnectorExecuteResult } from '../../connectors/connector-adapter.interface';
import { NormalizedPageContext, PageEntityRef } from '../page-context/page-context.types';
import { PersistedExecutionPlan } from '../planning/assistant-planning.types';
import {
  SafeProjectedAdapterResult,
  SafeToolInputSummary,
  ToolPermissionDeniedReason
} from '../../tools/tool-registry.types';

export interface StructuredBusinessRecord {
  [key: string]: unknown;
}

export interface AssistantReadonlyRuntimeInput {
  customerScope: CustomerScope;
  requestId: string;
  sessionId: string;
  sourceMessageId: string;
  responseMessageId: string;
  identityContext: RequestIdentityContext;
  hostIntegrationContext: HostIntegrationContext;
  executionPlan: PersistedExecutionPlan;
  pageContext?: NormalizedPageContext;
  transientConnectorContext: TransientConnectorContext;
}

export interface AssistantReadonlyRuntimeResult {
  toolName: string;
  toolVersion: string;
  toolCallId?: string;
  toolLifecycle: 'completed' | 'blocked' | 'failed';
  riskLevel: RiskLevel;
  entityRef: PageEntityRef;
  visibleFields: string[];
  projectedResult?: SafeProjectedAdapterResult;
  deniedReason?: ToolPermissionDeniedReason;
  connectorStatus?: ConnectorExecuteResult['status'];
  connectorErrorCode?: string;
  durationMs?: number;
}

export interface StartToolCallInput {
  customerScope: CustomerScope;
  requestId: string;
  sessionId: string;
  messageId: string;
  identityContext: RequestIdentityContext;
  toolName: string;
  toolVersion?: string;
  riskLevel?: RiskLevel;
  entityId?: string;
  visibleFields: string[];
  safeInputSummary: SafeToolInputSummary;
}

export interface CompleteToolCallInput {
  customerScope: CustomerScope;
  toolCallId: string;
  requestId: string;
  sessionId: string;
  messageId: string;
  identityContext: RequestIdentityContext;
  toolName: string;
  toolVersion?: string;
  riskLevel?: RiskLevel;
  visibleFields: string[];
  projectedResult: SafeProjectedAdapterResult;
  durationMs?: number;
}

export interface FailToolCallInput {
  customerScope: CustomerScope;
  toolCallId: string;
  requestId: string;
  sessionId: string;
  messageId: string;
  identityContext: RequestIdentityContext;
  toolName: string;
  toolVersion?: string;
  riskLevel?: RiskLevel;
  errorCode: string;
  durationMs?: number;
}

export interface BlockToolCallInput {
  customerScope: CustomerScope;
  requestId: string;
  sessionId: string;
  messageId: string;
  identityContext: RequestIdentityContext;
  toolName: string;
  toolVersion?: string;
  riskLevel?: RiskLevel;
  entityId?: string;
  visibleFields: string[];
  deniedReason: ToolPermissionDeniedReason;
}

export interface CompletedToolCallResult {
  toolCall: ToolCall;
}

export interface CreateToolCallInput extends StartToolCallInput {
  projectedResult: SafeProjectedAdapterResult;
  status?: ToolCallStatus;
  executionStatus?: ToolExecutionStatus;
}

/** Internal-only result access contract; no HTTP result endpoint is added by T056. */
export interface VisibleToolCallInput {
  customerScope: CustomerScope;
  toolCallId: string;
  sessionId: string;
  messageId: string;
}
