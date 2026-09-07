export type PageContextSafeScalar = string | number | boolean | null;

export interface NormalizedPageContextSelectedRow {
  readonly id: string;
  readonly summary?: Readonly<{
    label?: PageContextSafeScalar;
    displayName?: PageContextSafeScalar;
    status?: PageContextSafeScalar;
  }>;
}

export interface NormalizedPageContextFilter {
  readonly field: string;
  readonly operator?: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
  readonly value: PageContextSafeScalar;
}

export interface NormalizedPageContextUserVisibleState {
  readonly tab?: string;
  readonly view?: string;
  readonly sortBy?: string;
  readonly sortDirection?: 'asc' | 'desc';
  readonly density?: 'compact' | 'comfortable' | 'spacious';
  readonly expandedSections?: readonly string[];
}

export interface NormalizedPageContext {
  readonly module?: string;
  readonly route?: string;
  readonly screenId?: string;
  readonly entityType?: string;
  readonly entityId?: string;
  readonly selectedRows?: readonly NormalizedPageContextSelectedRow[];
  readonly activeFilters?: readonly NormalizedPageContextFilter[];
  readonly visibleColumns?: readonly string[];
  readonly userVisibleState?: Readonly<NormalizedPageContextUserVisibleState>;
}

export interface PageEntityRef {
  entityType?: string;
  entityId?: string;
}

export interface PageContextAuditMetadata {
  module?: string;
  screenId?: string;
  entityType?: string;
  entityId?: string;
  visibleColumnCount: number;
  selectedRowCount: number;
  hasActiveFilters: boolean;
}
