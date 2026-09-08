import { SafeProjectedAdapterResult } from '../../tools/tool-registry.types';

export interface GroundedAnswerInput {
  readonly toolCallId: string;
  readonly canonicalToolKey: string;
  readonly evidence: readonly {
    readonly evidenceRefId: string;
    readonly sourceType: string;
    readonly sourceId: string;
    readonly projectedFacts: Readonly<Record<string, unknown>>;
  }[];
}

export interface CreateGroundedAnswerInput {
  readonly toolCallId: string;
  readonly projectedResult: SafeProjectedAdapterResult;
  readonly evidenceRefs: readonly {
    readonly id: string;
    readonly sourceType: string;
    readonly sourceId: string;
  }[];
}

export function createGroundedAnswerInput(input: CreateGroundedAnswerInput): GroundedAnswerInput {
  const projectedFacts = deepFreezeCopy(input.projectedResult.facts) as Readonly<Record<string, unknown>>;
  return Object.freeze({
    toolCallId: input.toolCallId,
    canonicalToolKey: input.projectedResult.canonicalToolKey,
    evidence: Object.freeze(
      input.evidenceRefs.map((evidence) =>
        Object.freeze({
          evidenceRefId: evidence.id,
          sourceType: String(evidence.sourceType),
          sourceId: evidence.sourceId,
          projectedFacts
        })
      )
    )
  });
}

function deepFreezeCopy(value: unknown): unknown {
  if (Array.isArray(value)) return Object.freeze(value.map((entry) => deepFreezeCopy(entry)));
  if (isRecord(value)) {
    return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, deepFreezeCopy(nested)])));
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
