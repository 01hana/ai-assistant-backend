import { NormalizedPageContext } from '../page-context/page-context.types';
import { CustomerScope } from '../../identity/customer-scope.types';
import { AssistantPlanningResult } from '../planning/assistant-planning.types';

export interface UpdateAssistantContextStateInput {
  customerScope: CustomerScope;
  sessionId: string;
  pageContext?: NormalizedPageContext;
  planningResult: AssistantPlanningResult;
  toolCallIds: string[];
  evidenceRefIds: string[];
  pendingApprovalRequestId?: string;
  pendingEscalationRequestId?: string;
}

export interface MarkWaitingClarificationInput extends UpdateAssistantContextStateInput {
  clarificationQuestionId: string;
  reason: string;
  question: string;
  candidateRefs: unknown[];
  blocking: boolean;
}
