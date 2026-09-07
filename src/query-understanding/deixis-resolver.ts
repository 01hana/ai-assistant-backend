import { NormalizedPageContext } from '../assistant/page-context/page-context.types';
import {
  QueryUnderstandingContextStateSnapshot,
  QueryUnderstandingResolvedReference
} from './query-understanding.types';

export const DEIXIS_PATTERN = /(這筆|這張|目前|剛剛選取|剛才選取)/;

export function resolveDeixisReferences(
  text: string,
  pageContext: NormalizedPageContext | undefined,
  assistantContextState: QueryUnderstandingContextStateSnapshot | undefined
): QueryUnderstandingResolvedReference[] {
  if (!DEIXIS_PATTERN.test(text)) {
    return [];
  }

  const pageEntity = getPageEntity(pageContext);
  const selectedRows = getSelectedRows(pageContext);
  if (selectedRows.length > 1) {
    return selectedRows.map((row) => ({
      source: 'page_context',
      entityType: pageEntity?.entityType,
      entityId: row.id,
      confidence: 0.45,
      needsClarification: true,
      reason: 'multiple_candidates'
    }));
  }

  if (pageEntity?.entityType && pageEntity.entityId) {
    return [
      {
        source: 'page_context',
        entityType: pageEntity.entityType,
        entityId: pageEntity.entityId,
        confidence: 0.92,
        needsClarification: false,
        reason: 'page_context_entity'
      }
    ];
  }

  if (pageEntity?.entityType && !pageEntity.entityId) {
    return [
      {
        source: 'page_context',
        entityType: pageEntity.entityType,
        confidence: 0.3,
        needsClarification: true,
        reason: 'missing_entity_id'
      }
    ];
  }

  if (assistantContextState?.currentEntityType && assistantContextState.currentEntityId) {
    return [
      {
        source: 'context_state',
        entityType: assistantContextState.currentEntityType,
        entityId: assistantContextState.currentEntityId,
        confidence: 0.82,
        needsClarification: false,
        reason: 'context_state_entity'
      }
    ];
  }

  return [
    {
      source: 'page_context',
      confidence: 0.2,
      needsClarification: true,
      reason: 'missing_page_context'
    }
  ];
}

export function getPageEntity(pageContext: NormalizedPageContext | undefined): { entityType?: string; entityId?: string } | undefined {
  if (!pageContext) {
    return undefined;
  }

  return {
    entityType: pageContext.entityType,
    entityId: pageContext.entityId
  };
}

function getSelectedRows(pageContext: NormalizedPageContext | undefined): Array<{ id: string }> {
  return (pageContext?.selectedRows ?? []).map((row) => ({ id: row.id }));
}
