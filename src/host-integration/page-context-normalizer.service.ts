import { BadRequestException, Injectable } from '@nestjs/common';
import { PageContextDto } from '../assistant/page-context/page-context.dto';
import {
  NormalizedPageContext,
  NormalizedPageContextFilter,
  NormalizedPageContextSelectedRow,
  NormalizedPageContextUserVisibleState,
  PageContextSafeScalar
} from '../assistant/page-context/page-context.types';
import { TransientConnectorContext } from './host-integration.types';

const STRING_LIMIT = 256;
const ROUTE_LIMIT = 512;
const SELECTED_ROW_LIMIT = 100;
const FILTER_LIMIT = 32;
const VISIBLE_COLUMN_LIMIT = 64;
const EXPANDED_SECTION_LIMIT = 32;
const CONNECTOR_CONTEXT_REF = /^ccr_[A-Za-z0-9_-]{1,128}$/;
const FILTER_OPERATORS = new Set(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'contains', 'startsWith', 'endsWith']);
const ACTIVE_FILTER_FIELDS = new Set(['status', 'amount']);
const CREDENTIAL_VALUE = /(?:^|\s)(?:bearer\s+|sk-[A-Za-z0-9_-]{12,}|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/i;

export interface NormalizedPageContextRequest {
  readonly pageContext?: NormalizedPageContext;
  readonly transient: TransientConnectorContext;
}

@Injectable()
export class PageContextNormalizerService {
  splitAndNormalize(wire?: PageContextDto): NormalizedPageContextRequest {
    const transient = this.extractTransient(wire?.connectorContextRef);
    if (!wire) {
      return { pageContext: undefined, transient };
    }

    const pageContext: NormalizedPageContext = {
      ...optionalString('module', wire.module, STRING_LIMIT),
      ...optionalString('route', wire.route, ROUTE_LIMIT),
      ...optionalString('screenId', wire.screenId, STRING_LIMIT),
      ...optionalString('entityType', wire.entityType, STRING_LIMIT),
      ...optionalString('entityId', wire.entityId, STRING_LIMIT),
      ...optionalArray('selectedRows', this.normalizeRows(wire.selectedRows)),
      ...optionalArray('activeFilters', this.normalizeFilters(wire.activeFilters)),
      ...optionalArray('visibleColumns', normalizeStringArray(wire.visibleColumns, VISIBLE_COLUMN_LIMIT)),
      ...optionalObject('userVisibleState', this.normalizeVisibleState(wire.userVisibleState))
    };

    return {
      pageContext: Object.keys(pageContext).length > 0 ? deepFreeze(pageContext) : undefined,
      transient
    };
  }

  private extractTransient(connectorContextRef?: string): TransientConnectorContext {
    if (connectorContextRef === undefined) {
      return Object.freeze({});
    }
    if (!CONNECTOR_CONTEXT_REF.test(connectorContextRef)) {
      throw invalidPageContext();
    }
    return Object.freeze({ connectorContextRef });
  }

  private normalizeRows(rows?: PageContextDto['selectedRows']): NormalizedPageContextSelectedRow[] {
    assertArrayLimit(rows, SELECTED_ROW_LIMIT);
    return (rows ?? []).flatMap((row) => {
      const id = boundedString(row?.id, STRING_LIMIT);
      if (!id) return [];
      const summary = normalizeSummary(row.data);
      return [{ id, ...(summary ? { summary } : {}) }];
    });
  }

  private normalizeFilters(filters?: unknown[]): NormalizedPageContextFilter[] {
    assertArrayLimit(filters, FILTER_LIMIT);
    return (filters ?? []).flatMap((candidate) => {
      if (!isRecord(candidate)) return [];
      const field = boundedString(candidate.field, STRING_LIMIT);
      if (!field || !ACTIVE_FILTER_FIELDS.has(field)) return [];
      const value = safeScalar(candidate.value);
      if (value === undefined) return [];
      const operator = boundedString(candidate.operator, STRING_LIMIT);
      if (operator && !FILTER_OPERATORS.has(operator)) return [];
      return [{ field, ...(operator ? { operator: operator as NormalizedPageContextFilter['operator'] } : {}), value }];
    });
  }

  private normalizeVisibleState(value?: Record<string, unknown>): NormalizedPageContextUserVisibleState | undefined {
    if (!value) return undefined;
    const result: NormalizedPageContextUserVisibleState = {
      ...optionalSafeString('tab', value.tab),
      ...optionalSafeString('view', value.view),
      ...optionalSafeString('sortBy', value.sortBy),
      ...optionalEnum('sortDirection', value.sortDirection, ['asc', 'desc'] as const),
      ...optionalEnum('density', value.density, ['compact', 'comfortable', 'spacious'] as const),
      ...optionalArray('expandedSections', normalizeStringArray(value.expandedSections, EXPANDED_SECTION_LIMIT))
    };
    return Object.keys(result).length > 0 ? result : undefined;
  }
}

function normalizeSummary(value?: Record<string, unknown>) {
  if (!value) return undefined;
  const result = {
    ...optionalSafeScalar('label', value.label),
    ...optionalSafeScalar('displayName', value.displayName),
    ...optionalSafeScalar('status', value.status)
  };
  return Object.keys(result).length > 0 ? result : undefined;
}

function normalizeStringArray(value: unknown, limit: number): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > limit) throw invalidPageContext();
  return [...new Set(value.flatMap((item) => {
    const normalized = boundedString(item, STRING_LIMIT);
    return normalized && !looksSensitive(normalized) ? [normalized] : [];
  }))];
}

function boundedString(value: unknown, limit: number): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') throw invalidPageContext();
  const normalized = value.trim();
  if (normalized.length === 0) return undefined;
  if (normalized.length > limit) throw invalidPageContext();
  return normalized;
}

function safeScalar(value: unknown): PageContextSafeScalar | undefined {
  if (value === null || typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value !== 'string') return undefined;
  const normalized = boundedString(value, STRING_LIMIT);
  return normalized && !looksSensitive(normalized) ? normalized : undefined;
}

function optionalString<K extends string>(key: K, value: unknown, limit: number): Partial<Record<K, string>> {
  const normalized = boundedString(value, limit);
  return normalized && !looksSensitive(normalized) ? { [key]: normalized } as Record<K, string> : {};
}

function optionalSafeString<K extends string>(key: K, value: unknown): Partial<Record<K, string>> {
  const normalized = safeScalar(value);
  return typeof normalized === 'string' ? { [key]: normalized } as Record<K, string> : {};
}

function optionalSafeScalar<K extends string>(key: K, value: unknown): Partial<Record<K, PageContextSafeScalar>> {
  const normalized = safeScalar(value);
  return normalized !== undefined ? { [key]: normalized } as Record<K, PageContextSafeScalar> : {};
}

function optionalEnum<K extends string, V extends string>(key: K, value: unknown, allowed: readonly V[]): Partial<Record<K, V>> {
  const normalized = boundedString(value, STRING_LIMIT);
  return normalized && allowed.includes(normalized as V) ? { [key]: normalized as V } as Record<K, V> : {};
}

function optionalArray<K extends string, V>(key: K, value: V[]): Partial<Record<K, readonly V[]>> {
  return value.length > 0 ? { [key]: value } as unknown as Record<K, readonly V[]> : {};
}

function optionalObject<K extends string, V extends object>(key: K, value: V | undefined): Partial<Record<K, Readonly<V>>> {
  return value ? { [key]: value } as Record<K, Readonly<V>> : {};
}

function assertArrayLimit(value: unknown[] | undefined, limit: number): void {
  if (value !== undefined && (!Array.isArray(value) || value.length > limit)) throw invalidPageContext();
}

function looksSensitive(value: string): boolean {
  return CREDENTIAL_VALUE.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.freeze(value);
    for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested);
  }
  return value;
}

function invalidPageContext(): BadRequestException {
  return new BadRequestException({ error: 'INVALID_PAGE_CONTEXT', message: 'Page context is invalid.' });
}
