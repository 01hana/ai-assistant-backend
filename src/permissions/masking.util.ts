export const MASKED_VALUE = '[MASKED]';

export interface FieldMaskingPolicy {
  allowedFields?: string[];
  deniedFields?: string[];
  maskValue?: string;
}

export interface RowPermissionResult<T> {
  allowed: boolean;
  row?: T;
  reason?: string;
}

export interface FieldPathMask {
  readonly fieldPath: string;
  readonly action: 'omit' | 'redact';
}

export function maskFields<T extends Record<string, unknown>>(record: T, policy: FieldMaskingPolicy): T {
  const maskValue = policy.maskValue ?? MASKED_VALUE;
  const deniedFields = new Set(policy.deniedFields ?? []);
  const allowedFields = policy.allowedFields ? new Set(policy.allowedFields) : undefined;

  return Object.fromEntries(
    Object.entries(record).map(([field, value]) => {
      if (deniedFields.has(field) || (allowedFields && !allowedFields.has(field))) {
        return [field, maskValue];
      }

      return [field, value];
    })
  ) as T;
}

export function filterRow<T>(row: T, allowed: boolean, reason?: string): RowPermissionResult<T> {
  if (!allowed) {
    return {
      allowed: false,
      reason
    };
  }

  return {
    allowed: true,
    row
  };
}

export function minimizeForLlmInput<T extends Record<string, unknown>>(record: T, allowedFields: string[]): Partial<T> {
  const allowed = new Set(allowedFields);
  return Object.fromEntries(Object.entries(record).filter(([field]) => allowed.has(field))) as Partial<T>;
}

export function applyFieldPathMasks<T extends Record<string, unknown>>(record: T, masks: readonly FieldPathMask[]): T {
  const result = deepCopy(record) as T;
  for (const mask of masks) {
    if (mask.action === 'omit') {
      deleteAtPath(result, mask.fieldPath);
    } else {
      setExistingValueAtPath(result, mask.fieldPath, MASKED_VALUE);
    }
  }
  removeEmptyObjects(result);
  return result;
}

export function minimizeForFieldPaths<T extends Record<string, unknown>>(record: T, allowedFieldPaths: readonly string[]): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const fieldPath of allowedFieldPaths) {
    const value = valueAtPath(record, fieldPath);
    if (value !== undefined) setValueAtPath(result, fieldPath, deepCopy(value));
  }
  return result as Partial<T>;
}

function valueAtPath(record: Record<string, unknown>, fieldPath: string): unknown {
  let current: unknown = record;
  for (const segment of fieldPath.split('.')) {
    if (!isRecord(current) || !Object.prototype.hasOwnProperty.call(current, segment)) return undefined;
    current = current[segment];
  }
  return current;
}

function setValueAtPath(record: Record<string, unknown>, fieldPath: string, value: unknown): void {
  const segments = fieldPath.split('.');
  let current = record;
  for (const segment of segments.slice(0, -1)) {
    if (!isRecord(current[segment])) current[segment] = {};
    current = current[segment] as Record<string, unknown>;
  }
  current[segments[segments.length - 1]] = value;
}

function setExistingValueAtPath(record: Record<string, unknown>, fieldPath: string, value: unknown): void {
  const segments = fieldPath.split('.');
  let current = record;
  for (const segment of segments.slice(0, -1)) {
    if (!isRecord(current[segment])) return;
    current = current[segment] as Record<string, unknown>;
  }
  const leaf = segments[segments.length - 1];
  if (Object.prototype.hasOwnProperty.call(current, leaf)) current[leaf] = value;
}

function deleteAtPath(record: Record<string, unknown>, fieldPath: string): void {
  const segments = fieldPath.split('.');
  let current = record;
  for (const segment of segments.slice(0, -1)) {
    if (!isRecord(current[segment])) return;
    current = current[segment] as Record<string, unknown>;
  }
  delete current[segments[segments.length - 1]];
}

function removeEmptyObjects(record: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(record)) {
    if (!isRecord(value)) continue;
    removeEmptyObjects(value);
    if (Object.keys(value).length === 0) delete record[key];
  }
}

function deepCopy(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((entry) => deepCopy(entry));
  if (isRecord(value)) return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, deepCopy(nested)]));
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
