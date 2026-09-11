export const CONNECTOR_LIMITS_V1 = Object.freeze({
  invocationRequestBytes: 16_384,
  invocationResponseBytes: 16_384,
  bindingRequestBytes: 16_384,
  bindingResponseBytes: 4_096,
  upstreamResponseBytes: 262_144,
  maximumJsonDepth: 8,
  maximumArrayItems: 100,
  maximumObjectKeys: 64,
  maximumStringLength: 1_024,
  minimumTransportBudgetMs: 500,
  maximumTransportBudgetMs: 4_500
} as const);

export type BoundedJsonScalar = string | number | boolean | null;
type BoundedJsonValue = BoundedJsonScalar | BoundedJsonObject | readonly BoundedJsonValue[];
interface BoundedJsonObject { readonly [key: string]: BoundedJsonValue }

export function isValidBindingProviderPayloadLimit(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 1 && (value as number) <= CONNECTOR_LIMITS_V1.bindingRequestBytes;
}

export function isValidConnectorTransportBudget(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= CONNECTOR_LIMITS_V1.minimumTransportBudgetMs &&
    (value as number) <= CONNECTOR_LIMITS_V1.maximumTransportBudgetMs;
}

export function validateBoundedJsonValue(value: unknown, depth = 0): boolean {
  if (depth > CONNECTOR_LIMITS_V1.maximumJsonDepth) return false;
  if (value === null || typeof value === 'boolean') return true;
  if (typeof value === 'string') return value.length <= CONNECTOR_LIMITS_V1.maximumStringLength;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) {
    return value.length <= CONNECTOR_LIMITS_V1.maximumArrayItems && value.every((item) => validateBoundedJsonValue(item, depth + 1));
  }
  if (!isPlainJsonObject(value) || Object.keys(value).length > CONNECTOR_LIMITS_V1.maximumObjectKeys) return false;
  return Object.entries(value).every(([key, item]) => key.length > 0 && key.length <= 128 && validateBoundedJsonValue(item, depth + 1));
}

function isPlainJsonObject(value: unknown): value is { readonly [key: string]: unknown } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function boundedJsonByteLength(value: unknown): number {
  try {
    return new TextEncoder().encode(JSON.stringify(value)).byteLength;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}
