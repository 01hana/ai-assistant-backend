import { Injectable } from '@nestjs/common';
import { minimizeForFieldPaths, minimizeForLlmInput } from './masking.util';

export interface LlmInputSanitizationInput<TRecord extends Record<string, unknown>> {
  record: TRecord;
  visibleFields?: string[];
  allowedFieldPaths?: readonly string[];
  limits?: Readonly<{
    maxDepth: number;
    maxItems: number;
    maxStringLength: number;
    maxTotalBytes: number;
  }>;
}

export interface LlmInputSanitizationResult<TRecord extends Record<string, unknown> = Record<string, unknown>> {
  sanitized: Partial<TRecord>;
  visibleFields: string[];
  removedFieldCount: number;
}

@Injectable()
export class LlmInputSanitizerService {
  sanitize<TRecord extends Record<string, unknown>>(input: LlmInputSanitizationInput<TRecord>): LlmInputSanitizationResult<TRecord> {
    const allowedFieldPaths = input.allowedFieldPaths ?? input.visibleFields ?? [];
    const sanitized = input.allowedFieldPaths
      ? minimizeForFieldPaths(input.record, allowedFieldPaths)
      : minimizeForLlmInput(input.record, [...allowedFieldPaths]);
    if (input.limits && !withinLimits(sanitized, input.limits)) {
      throw new Error('Projected result exceeds configured limits.');
    }
    const allowed = new Set(allowedFieldPaths.map((fieldPath) => fieldPath.split('.')[0]));
    const removedFieldCount = Object.keys(input.record).filter((field) => !allowed.has(field)).length;

    return {
      sanitized,
      visibleFields: [...allowedFieldPaths],
      removedFieldCount
    };
  }
}

function withinLimits(
  value: unknown,
  limits: { maxDepth: number; maxItems: number; maxStringLength: number; maxTotalBytes: number }
): boolean {
  try {
    if (Buffer.byteLength(JSON.stringify(value), 'utf8') > limits.maxTotalBytes) return false;
  } catch {
    return false;
  }
  const state = { items: 0 };
  return inspectValue(value, 1, state, limits);
}

function inspectValue(
  value: unknown,
  depth: number,
  state: { items: number },
  limits: { maxDepth: number; maxItems: number; maxStringLength: number }
): boolean {
  if (depth > limits.maxDepth) return false;
  if (typeof value === 'string') return value.length <= limits.maxStringLength;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'boolean' || value === null) return true;
  if (Array.isArray(value)) {
    state.items += value.length;
    return state.items <= limits.maxItems && value.every((entry) => inspectValue(entry, depth + 1, state, limits));
  }
  if (!isRecord(value)) return false;
  return Object.values(value).every((nested) => inspectValue(nested, depth + 1, state, limits));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
