import type {
  ArgumentMappingV1,
  BoundedJsonScalar,
  ConnectorOperationManifestEntryV1,
  FixedJsonBodyEntryV1,
  FixedQueryEntryV1
} from '@internal-ai-assistant/connector-runtime-contract';

export type MappedReadRequest =
  | Readonly<{ profile: 'GET_QUERY_V1'; path: string; query: readonly FixedQueryEntryV1[] }>
  | Readonly<{ profile: 'POST_QUERY_JSON_V1'; path: string; body: readonly FixedJsonBodyEntryV1[] }>;

export class RequestProfileRegistry {
  private readonly profiles: ReadonlySet<string>;
  readonly isValid: boolean;

  constructor(profiles: readonly string[] = ['GET_QUERY_V1', 'POST_QUERY_JSON_V1']) {
    this.profiles = new Set(profiles);
    this.isValid = profiles.length === 2 && this.profiles.size === 2 &&
      this.profiles.has('GET_QUERY_V1') && this.profiles.has('POST_QUERY_JSON_V1');
  }

  supports(profile: string): boolean { return this.isValid && this.profiles.has(profile); }

  map(operation: ConnectorOperationManifestEntryV1, args: Readonly<Record<string, unknown>>): MappedReadRequest | undefined {
    if (!this.supports(operation.request.profile)) return undefined;
    if (operation.request.profile === 'GET_QUERY_V1') {
      const dynamic = mapArguments(operation.request.argumentMappings, args, (value) => String(value));
      if (!dynamic) return undefined;
      return deepFreeze({
        profile: 'GET_QUERY_V1' as const, path: operation.request.path as string,
        query: [...operation.request.fixedQuery, ...dynamic]
      });
    }
    const dynamic = mapArguments(operation.request.argumentMappings, args, (value) => value as BoundedJsonScalar);
    if (!dynamic) return undefined;
    return deepFreeze({
      profile: 'POST_QUERY_JSON_V1' as const, path: operation.request.path as string,
      body: [...operation.request.fixedBody, ...dynamic]
    });
  }
}

function mapArguments<T extends string | BoundedJsonScalar>(
  mappings: readonly ArgumentMappingV1[],
  args: Readonly<Record<string, unknown>>,
  convert: (value: unknown) => T
): readonly Readonly<{ name: string; value: T }>[] | undefined {
  const result: Readonly<{ name: string; value: T }>[] = [];
  for (const mapping of mappings) {
    if (!(mapping.argument in args)) continue;
    result.push(Object.freeze({ name: mapping.name, value: convert(args[mapping.argument]) }));
  }
  return Object.freeze(result);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as object)) deepFreeze(child);
  }
  return value;
}
