import {
  CONNECTOR_LIMITS_V1,
  isValidBindingProviderPayloadLimit,
  isValidConnectorTransportBudget,
  validateBoundedJsonValue
} from '../../src';

describe('Shared connector bounds', () => {
  it('locks the accepted transport and JSON ceilings', () => {
    expect(CONNECTOR_LIMITS_V1).toEqual({
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
    });
    expect(Object.isFrozen(CONNECTOR_LIMITS_V1)).toBe(true);
  });

  it('bounds per-profile provider payload limits under the binding envelope', () => {
    expect(isValidBindingProviderPayloadLimit(1)).toBe(true);
    expect(isValidBindingProviderPayloadLimit(16_384)).toBe(true);
    expect(isValidBindingProviderPayloadLimit(16_385)).toBe(false);
    expect(isValidBindingProviderPayloadLimit(1.5)).toBe(false);
  });

  it('bounds business transport budgets without becoming timeout authority', () => {
    expect(isValidConnectorTransportBudget(500)).toBe(true);
    expect(isValidConnectorTransportBudget(4_500)).toBe(true);
    expect(isValidConnectorTransportBudget(4_501)).toBe(false);
  });

  it('rejects oversized/deep/non-JSON values', () => {
    expect(validateBoundedJsonValue({ safe: ['value'] })).toBe(true);
    expect(validateBoundedJsonValue({ secret: 'x'.repeat(1_025) })).toBe(false);
    expect(validateBoundedJsonValue({ value: Number.NaN })).toBe(false);
    expect(validateBoundedJsonValue(new Array(101).fill(null))).toBe(false);
  });
});
