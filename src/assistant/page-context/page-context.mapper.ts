import { Prisma } from '../../generated/prisma/client';
import { NormalizedPageContext, PageContextAuditMetadata, PageEntityRef } from './page-context.types';

export function toPageContextPersistence(pageContext?: NormalizedPageContext): Prisma.InputJsonValue | undefined {
  if (!pageContext) {
    return undefined;
  }

  return {
    module: pageContext.module,
    route: pageContext.route,
    screenId: pageContext.screenId,
    entityType: pageContext.entityType,
    entityId: pageContext.entityId,
    selectedRows: (pageContext.selectedRows ?? []).map((row) => ({
      id: row.id,
      ...(row.summary ? { summary: { ...row.summary } } : {})
    })),
    activeFilters: (pageContext.activeFilters ?? []).map((filter) => ({ ...filter })),
    visibleColumns: [...(pageContext.visibleColumns ?? [])],
    userVisibleState: pageContext.userVisibleState ? {
      tab: pageContext.userVisibleState.tab,
      view: pageContext.userVisibleState.view,
      sortBy: pageContext.userVisibleState.sortBy,
      sortDirection: pageContext.userVisibleState.sortDirection,
      density: pageContext.userVisibleState.density,
      expandedSections: [...(pageContext.userVisibleState.expandedSections ?? [])]
    } : {}
  } as unknown as Prisma.InputJsonValue;
}

export function getPageEntityRef(pageContext?: NormalizedPageContext): PageEntityRef {
  return {
    entityType: pageContext?.entityType,
    entityId: pageContext?.entityId
  };
}

export function getVisibleColumns(pageContext?: NormalizedPageContext): string[] {
  const visibleColumns = pageContext?.visibleColumns?.filter((column) => column.trim().length > 0) ?? [];
  return visibleColumns.length > 0 ? visibleColumns : ['status'];
}

export function toPageContextAuditMetadata(pageContext?: NormalizedPageContext): PageContextAuditMetadata | undefined {
  if (!pageContext) {
    return undefined;
  }

  return {
    module: pageContext.module,
    screenId: pageContext.screenId,
    entityType: pageContext.entityType,
    entityId: pageContext.entityId,
    visibleColumnCount: pageContext.visibleColumns?.length ?? 0,
    selectedRowCount: pageContext.selectedRows?.length ?? 0,
    hasActiveFilters: (pageContext.activeFilters?.length ?? 0) > 0
  };
}
