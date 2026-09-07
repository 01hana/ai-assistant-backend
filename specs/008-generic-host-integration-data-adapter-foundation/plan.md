# Implementation Plan: Generic Host Integration and Data Adapter Foundation

**Branch**: `008-generic-host-integration-data-adapter-foundation` | **Date**: 2026-09-03 | **Spec**: [spec.md](./spec.md) | **Design**: [design.md](./design.md)

**Input**: The approved Feature 008 specification and technical design.

## Summary

Feature 008 replaces the Assistant runtime's direct `MockConnectorAdapter` dependency with one generic, trusted, read-oriented adapter path. The implementation constructs request-scoped host-integration context only from verified identity, extracts `connectorContextRef` into an execution-local transient object, normalizes Browser PageContext to non-authoritative hints, performs permission authorization before adapter eligibility or business-data access, selects exactly one Backend-registered adapter, validates structured arguments by the resolved ToolDefinition, and projects every adapter result through Backend-owned output policy before evidence or grounded-answer use.

The change preserves the accepted Assistant session, message, SSE, AnswerDecision, feedback, approval, Gateway identity, SDK, ToolCall, audit, and deterministic mock-answer contracts. It introduces no second Assistant API or connector runtime, no Customer-specific adapter or transport, no Feature 002 activation, and no Prisma schema change.

## Technical Context

**Language/Version**: TypeScript 6 on the existing Node.js/NestJS runtime

**Primary Dependencies**: NestJS 11, Prisma Client 7, existing identity, Assistant, tools, permissions, evidence, audit, observability, and connector modules

**Storage**: Existing PostgreSQL/Prisma models and JSON fields only; ToolDefinition policies are provisioned through the existing idempotent seed upsert

**Testing**: Jest 30 unit, integration, contract, and end-to-end suites; existing TypeScript, ESLint, and Nest build commands

**Target Platform**: Existing Backend service deployment; no new service or Customer-local runtime

**Project Type**: NestJS Backend within the existing monorepo

**Performance Goals**: Preserve the existing request/SSE lifecycle while bounding adapter execution and projection by the trusted ToolDefinition timeout and result limits

**Constraints**: Permission before selection/access; default-deny projection; raw results and transient references never reach durable or downstream Assistant surfaces; no public-contract or database-schema change

**Scale/Scope**: One generic path for the current mock adapter and future read-oriented adapters; no real SCM, MES, ERP, CRM, WMS, or other Customer integration in Feature 008

## Constitution and Contract Gates

The implementation must satisfy these gates before runtime cutover and again at final verification:

- **Maintainable architecture**: one Assistant orchestration path; host-integration, connectors, tools, permissions, and evidence retain acyclic ownership boundaries.
- **Test-first regression safety**: add focused failing tests at each phase before changing the corresponding behavior; retain the verified baseline.
- **Trusted identity boundary**: Customer, integration, host app, organization, actor, roles, and scopes come only from verified Backend identity.
- **API and embedding compatibility**: no route, wire-shape mode, SDK contract, SSE event shape, or AnswerDecision addition.
- **Tool-first authorization**: permission pre-check completes successfully before adapter eligibility, connector invocation, or business-data access; post-fetch permission filtering is prohibited.
- **Auditability without leakage**: retain ToolCall/audit correlation using safe summaries only; never persist or emit transient references, native credentials, raw Browser records, raw adapter data, or full unminimized arguments.
- **Evidence quality**: only validated, projected, masked, minimized results can become EvidenceRef or grounded-answer input.
- **Human-review compatibility**: existing no-answer, feedback, approval, and review flows remain unchanged.

No constitutional exception or complexity waiver is required.

## Dependency-Ordered Implementation

### Phase 0 — Baseline and Contract Guards

**Objective**: Freeze the accepted public and internal lifecycle before changing the runtime.

1. Record focused baselines for PageContext mapping, ToolRegistry resolution, permission pre-check, current mock execution, ToolCall lifecycle, EvidenceRef creation, message SSE, and Gateway identity.
2. Add or identify contract guards for sessions, messages, SSE events, feedback, approvals, Gateway identity, SDK-facing DTOs, AnswerDecision values, and deterministic mock answers.
3. Confirm Feature 002 remains inactive, Feature 009 remains future work, and neither Prisma schema nor migrations require modification.
4. Capture the current direct path as the migration baseline: ingress and identity, PageContext persistence, planning, ToolDefinition/policy resolution, permission pre-check, direct mock invocation, UI-driven minimization, EvidenceRef, answer decision, and SSE.

**Exit gate**: The focused baseline is green and failures in later phases can be attributed to Feature 008 changes. The current verification baseline is 9 suites and 43 tests passing; the existing `ts-jest` `allowJs` warning is informational and not a Feature 008 blocker.

### Phase 1 — Trusted Host Context and Transient Boundary

**Objective**: Separate trusted identity authority, transient connector state, and normalized presentation hints before any planning or persistence path.

1. Add a narrow `src/host-integration` domain containing:
   - `HostIntegrationContext`, with Customer, integration, host app, organization, actor, roles, scopes, and request ID derived only from `RequestIdentityContext`;
   - `TransientConnectorContext`, containing only an optional bounded opaque `connectorContextRef`;
   - a request factory that validates required trusted authorities and fails closed on missing or incompatible combinations; and
   - a PageContext normalizer with separate wire and normalized types.
2. At Assistant controller ingress, extract `connectorContextRef` before calling message repositories, context-state services, planning, query understanding, ToolCall/audit code, or logging. Pass it separately only in the in-memory runtime request.
3. Replace direct wire PageContext persistence with normalized PageContext:
   - allow `activeFilters` only for Backend-allowlisted keys with shallow bounded scalar values;
   - allow `userVisibleState` only for Backend-allowlisted presentation keys and explicitly safe shallow shapes;
   - reduce `selectedRows` to identifiers plus Backend-defined safe summary fields; and
   - retain route, entity type/ID, selected identifiers, and approved summaries as non-authoritative hints.
4. Drop or reject nested business records, credentials, authority-like fields, connector/adapter/source selectors, endpoints, and evidence claims. Presentation hints may narrow display but cannot expand authorization, operation, adapter, or result-release authority.
5. Split orchestration inputs so planning/query understanding receive only trusted host context, normalized PageContext, message text, and ordinary planning state. `TransientConnectorContext` bypasses planning, ToolRegistry validation, ExecutionPlan, ToolCall summaries, EvidenceRef, grounded-answer input, models, logs, telemetry, SSE, and responses.
6. Propagate the narrowed contracts through current consumers: session creation types/service, message persistence, context-state transition types, planning/query-understanding types and services, entity/deixis readers, and PageContext-bearing approval/action/escalation input types. Approval workflow behavior and public contracts remain unchanged; this is an internal normalized-input boundary only.

**Exit gate**: Context construction and PageContext normalization tests pass; cross-Customer/integration/host mismatches fail closed; negative-surface tests prove raw Browser payloads, native credentials, and `connectorContextRef` cannot enter prohibited surfaces.

### Phase 2 — Generic Adapter Contract and Trusted Registry

**Objective**: Establish an explicit Backend-owned adapter registry without changing the active runtime path yet.

1. Evolve the connector domain with `DataAdapter extends ConnectorAdapter`, adding stable metadata, compatibility/readiness behavior, validated named-read execution, and bounded safe failures while reusing existing connector health and execution concepts.
2. Define `DataAdapterRegistration` as trusted deployment composition containing only the adapter instance, exact Customer, integration, host app, connector key, and active state. Registration is deployment eligibility, not Browser input, a Prisma entity, or operation/capability authority; it contains no ToolDefinition-key or operation allowlist.
3. Define `DATA_ADAPTER_REGISTRATIONS` as a Nest injection token whose value is a readonly registration array assembled explicitly in the connectors composition root. Do not use or imply Angular-style `multi: true` registration.
4. Implement `DataAdapterRegistry` selection after trusted ToolDefinition resolution and permission success. First match registrations by the trusted context, the ToolDefinition's trusted `connectorKey`, and active state. Then ask the exactly scoped adapter to evaluate its implementation capability and `isCompatible` behavior for the resolved canonical operation before readiness.
5. Require exactly one eligible registration. Zero, multiple, inactive, unknown, mismatched, incompatible, or unhealthy candidates fail closed without incidental ordering, Browser influence, configuration disclosure, or mock fallback.

**Exit gate**: Registry unit tests cover exact success, two-Customer isolation with identical subordinate identifiers, wrong integration/host/connector, inactive and unknown registrations, zero and multiple candidates, incompatibility, and unhealthy readiness through a deterministic explicit registration array.

```text
REGISTRATION_OPERATION_AUTHORITY=NO
ADAPTER_CAPABILITY_CHECK_REQUIRED=YES
```

### Phase 3 — Structured Operations and ToolDefinition Result Policy

**Objective**: Make the resolved ToolDefinition the single authority for operation identity, structured input, adapter connector key, and output release.

1. Constrain planned and persisted candidates to safe `{ key, arguments, reason }` values. Do not persist an independent operation authority.
2. Resolve the canonical operation solely from the trusted ToolDefinition stable key/name. Ignore any legacy `operation` field and re-derive identity after ToolDefinition resolution.
3. Enforce and test:

   ```text
   PLANNER_OPERATION_AUTHORITY=NO
   TOOL_DEFINITION_OPERATION_AUTHORITY=YES
   ```

4. Validate structured arguments against the resolved ToolDefinition `inputSchema` before adapter selection or business-data access. Reject missing, malformed, excessive, incompatible, arbitrary SQL, generated SQL, free-form connector commands, arbitrary URL/path/query forwarding, and Browser-defined operation code.
5. Redact/minimize argument summaries before ToolCall or audit use; never store native credentials, the transient reference, or complete unminimized values.
6. Treat one resolved ToolDefinition key as one canonical operation contract associating `inputSchema`, trusted `connectorKey`, and `outputSchema`. Do not add adapter-owned release rules or a parallel result-policy registry.
7. Add the approved versioned result-policy metadata to existing ToolDefinition seed definitions. Use the current `scripts/seed.ts` `prisma.toolDefinition.upsert` flow and mirror the same definitions in `test/support/us1-test-app.helper.ts`. Keep provisioning idempotent and make absence or invalidity fail default-deny.

**Exit gate**: Tests prove canonical derivation, legacy operation-field non-authority, structured validation, arbitrary-execution rejection, safe summaries, valid versioned output policies, default denial when policy is absent/invalid, and repeatable seed/test-fixture provisioning.

### Phase 4 — Projection, Masking, and Evidence Boundary

**Objective**: Make raw adapter results execution-local and establish one safe downstream representation.

1. Add an adapter-result projector driven only by the resolved ToolDefinition `outputSchema` policy. Apply this fixed order:
   1. validate the raw result against the canonical output contract;
   2. apply default-deny field projection;
   3. apply existing permission-aware masking;
   4. enforce the policy's depth, item-count, string, and overall-size limits; and
   5. return `SafeProjectedAdapterResult`.
2. Keep the raw result scoped to adapter return and projection only. On validation, projection, masking, or minimization failure, discard it and produce a bounded internal failure without raw fields or schema details.
3. Update EvidenceRef attachment to accept only `SafeProjectedAdapterResult` plus approved provenance. Remove Browser `visibleColumns` as release authority; it may only narrow already-approved presentation.
4. Define `GroundedAnswerInput` using the canonical ToolDefinition key, projected facts, and EvidenceRef identifiers/provenance. Exclude raw results, transient references, credentials, adapter configuration, endpoints, Browser records, and unvalidated arguments.
5. Persist and audit the safe output summary only after `SafeProjectedAdapterResult` exists. Safe input-summary construction is a separate pre-start process defined in the ToolCall lifecycle section.

**Exit gate**: Projector and evidence tests cover allowed/denied fields, wrong result shape, missing policy, nesting, item/size bounds, permission masking, presentation narrowing, empty evidence, and failure cleanup. Captured persistence, audit, log, telemetry, model, SSE, and response sinks contain no raw adapter payload.

### Phase 5 — Mock Migration and Runtime Cutover

**Objective**: Move the existing mock behavior onto the generic path without public behavior change.

1. Make `MockConnectorAdapter` implement the generic adapter contract and contribute exact trusted registrations through `DATA_ADAPTER_REGISTRATIONS`. Add no mock special case, wildcard eligibility, or fallback.
2. Preserve current deterministic mock lookups and safe answer fields through structured arguments and the ToolDefinition-owned output policy.
3. Replace `AssistantReadonlyRuntimeService`'s direct `MockConnectorAdapter` dependency with `DataAdapterRegistry` and the result projector.
4. Enforce the single runtime sequence:

   ```text
   verified identity
   → HostIntegrationContext + extracted transient context
   → normalized PageContext
   → planning and trusted ToolDefinition resolution
   → permission pre-check
   → argument validation
   → ToolCall start with safe input summary
   → trusted registry selection and readiness
   → selected adapter invocation with transient context
   → output validation and default-deny projection
   → permission masking and minimization
   → safe ToolCall completion summary
   → EvidenceRef / GroundedAnswerInput
   → existing deterministic answer and SSE lifecycle
   ```

5. Preserve the permission-denied blocked lifecycle before registry selection or adapter access. All failures after ToolCall start use the existing failed lifecycle and safe no-answer mapping.
6. Remove only obsolete direct mock wiring after the registry path passes equivalent tests. Do not add Customer, host, source-system, or connector conditionals to Assistant core.

**Exit gate**: Existing mock scenarios select only through exact trusted registration; permission denial invokes neither registry eligibility nor adapter execution; unknown/incompatible selection never falls back; existing ToolCall, evidence, answer, and SSE behavior remains compatible.

### Phase 6 — Security and Compatibility Closeout

**Objective**: Prove all security boundaries and accepted contracts after cutover.

1. Complete negative-surface tests for raw Browser records, nested PageContext, authority injection, native credentials, transient references, raw adapter output, full arguments, adapter configuration, endpoint/network details, and internal error details.
2. Test adapter-not-found, ambiguity, incompatibility, unhealthy readiness, timeout, dependency failure, unusable opaque reference, malformed result, projection failure, masking failure, and valid no-evidence behavior with deterministic doubles.
3. Confirm Feature 008 validates only opaque-reference syntax and transient handling. Binding, expiry, revocation, replay protection, identity match, credentials, endpoint resolution, transport, authentication, and semantic usability remain Feature 009 concerns.
4. Run focused suites after each subsystem change, then all unit, integration, contract, typecheck, lint, build, and regression commands.
5. Review the final diff for prohibited public API, SDK, Gateway, Prisma, Feature 002, Customer-specific, or Feature 009 implementation changes.

**Exit gate**: Every Feature 008 acceptance scenario passes, no public AnswerDecision or SSE/API contract changed, no prohibited data reaches a durable or public surface, and the generic mock path is regression-compatible.

## ToolCall and Failure Lifecycle

| Condition | Adapter/business-data access | ToolCall transition | Existing public mapping | Disclosure rule |
| --- | --- | --- | --- | --- |
| Permission denied | None | Existing blocked ToolCall | `permission_denied` | Existing safe permission response only |
| Invalid structured arguments | None | Existing blocked/validation semantics with safe summary | Existing safe no-answer behavior | No full arguments or schema internals |
| Registration missing, ambiguous, inactive, incompatible, or unhealthy | No business-data execution | Started, then failed | Existing `no_answer` with tool-failure reason | No registration, connector, endpoint, or Customer detail |
| Timeout, adapter exception, safe dependency failure, or unusable opaque reference | Attempted | Started, then failed | Existing `no_answer` with tool-failure reason | No raw/partial data, network topology, credential, or retry detail |
| Malformed result or projection/masking/minimization failure | Attempted; raw result remains transient | Started, then failed | Existing `no_answer` with tool-failure reason | No raw fields or policy/schema details |
| Valid projected result without usable evidence | Completed | Completed with safe summary | Existing `no_answer` | No hidden result disclosure |
| Valid projected evidence | Completed | Completed with safe summary | Existing answered flow | Projected, masked, minimized evidence only |

`ToolCall` input and output summaries never contain `connectorContextRef`, Customer-native credentials, raw Browser records, raw adapter results, or complete unminimized arguments. `NoAnswerGateService` remains the public mapping authority. No new AnswerDecision or SSE event type is introduced.

### Safe summary timing

Safe input and output summaries are produced at different lifecycle points:

```text
SAFE INPUT SUMMARY
validated structured arguments
→ input-specific allowlist, redaction, and minimization
→ safe input summary
→ ToolCall start

SAFE OUTPUT SUMMARY
raw adapter result
→ output validation
→ ToolDefinition.outputSchema result policy
→ permission masking
→ minimization
→ SafeProjectedAdapterResult
→ safe output summary
→ ToolCall complete
```

The safe input summary excludes `connectorContextRef`, native credentials, the full arbitrary argument payload, and unapproved sensitive values. The safe output summary is derived only from `SafeProjectedAdapterResult`. Raw adapter output never enters a ToolCall input summary, output summary, lifecycle event, or persisted ToolCall field.

## Repository-Aware File Change Matrix

`NEW` rows are proposed paths that do not exist in the current source. `MODIFIED` and `REUSED/UNCHANGED` rows use paths verified in the current repository. The matrix describes implementation impact without creating task identifiers.

### New files

| File / module | Current responsibility | Planned change | Phase | Risk | Validation |
| --- | --- | --- | --- | --- | --- |
| **NEW** `src/host-integration/host-integration.types.ts` | No current file; trusted identity and PageContext are carried through Assistant-specific types | Define `HostIntegrationContext`, `TransientConnectorContext`, ingress carrier, and normalized/wire boundaries without replacing identity authority | 1 | High: authority or transient state could be conflated | Context-construction, type-boundary, and negative-surface unit tests |
| **NEW** `src/host-integration/host-integration-request.factory.ts` | No current file; controller forwards verified identity and raw PageContext | Construct trusted context, extract the opaque reference, and normalize remaining PageContext at ingress | 1 | High: extraction after persistence could leak the reference | Controller/factory tests asserting extraction precedes every repository/planning call |
| **NEW** `src/host-integration/page-context-normalizer.service.ts` | No current fixed Backend normalizer | Enforce field allowlists, shallow safe shapes, bounds, authority rejection, and selected-row reduction | 1 | High: raw Browser data could become authority or evidence | Nested/raw/credential/authority rejection and safe-hint tests |
| **NEW** `src/host-integration/host-integration.module.ts` | No current host-integration module | Provide the factory and normalizer while depending only on identity-facing types | 1 | Medium: dependency-cycle risk | Nest provider-resolution and architecture tests |
| **NEW** `src/connectors/data-adapter.interface.ts` | No generic data-adapter contract | Define `DataAdapter extends ConnectorAdapter`, canonical compatibility input, validated execution input, and raw execution-local result types | 2 | High: a second runtime or adapter-owned release authority could emerge | Interface-shape and deterministic adapter-double tests |
| **NEW** `src/connectors/data-adapter-registration.ts` | No explicit adapter registration/token | Define `DataAdapterRegistration` with only `adapter`, `connectorKey`, `customerId`, `integrationId`, `hostApp`, and `active`, plus `DATA_ADAPTER_REGISTRATIONS` | 2 | High: registration could become a second operation authority | Static shape test rejecting operation/ToolDefinition allowlist fields |
| **NEW** `src/connectors/data-adapter-registry.service.ts` | No trusted adapter-selection provider | Match exact deployment binding, then apply adapter capability/compatibility and readiness; require one result and never fall back | 2 | High: ambiguous or cross-Customer selection | Exact-match, ambiguity, isolation, capability, readiness, and no-fallback tests |
| **NEW** `src/connectors/adapter-result-projector.service.ts` | No server-owned operation-specific projector | Validate raw results and enforce ToolDefinition output policy, masking, minimization, and bounded `SafeProjectedAdapterResult` | 4 | Critical: raw or unauthorized fields could escape | Default-deny, schema, field, masking, nesting, size, and leak-capture tests |
| **NEW** `src/connectors/connectors.module.ts` | Current composition is limited to the mock module | Assemble the readonly registration array and export registry/projector providers without `multi: true` assumptions | 2, 5 | High: provider wiring could create missing, duplicate, or fallback candidates | Nest composition test with explicit registration-array fixtures |
| **NEW** `src/assistant/runtime/grounded-answer-input.types.ts` | No explicit generic grounded-answer type exists | Define the post-projection boundary containing canonical ToolDefinition key, EvidenceRef provenance, and projected facts only | 4 | High: raw data could bypass evidence controls | Type/boundary tests and captured model-input assertions |

### Modified files

| File / module | Current responsibility | Planned change | Phase | Risk | Validation |
| --- | --- | --- | --- | --- | --- |
| **MODIFIED** `src/assistant/assistant.controller.ts` | Accepts session/message requests and reads verified identity | Invoke the host-integration factory at ingress; discard session-only transient state and pass message transient state separately | 1 | High: late extraction could persist the reference | Controller ordering and request-compatibility tests |
| **MODIFIED** `src/assistant/page-context/page-context.dto.ts` | Defines validated public wire PageContext fields | Accept bounded opaque `connectorContextRef` as a compatible optional wire field while retaining strict validation | 1 | High: credential-shaped or arbitrary values could enter | DTO syntax, length, credential-pattern, and unknown-field tests |
| **MODIFIED** `src/assistant/page-context/page-context.types.ts` | Defines the current internal PageContext shape | Separate wire-facing data from `NormalizedPageContext`; remove arbitrary nested internal containers | 1 | High: unsafe fields could remain structurally reachable | Compile-time fixtures and normalizer unit tests |
| **MODIFIED** `src/assistant/page-context/page-context.mapper.ts` | Maps PageContext to persistence/audit data and exposes entity/visible-column helpers | Accept normalized context only; preserve safe entity hints and make visible columns presentation-only | 1, 4 | High: old mapping could retain raw data or release authority | Persistence/audit snapshots and visible-column non-authority tests |
| **MODIFIED** `src/assistant/session/assistant-session.types.ts` | Defines session creation and visibility inputs using verified identity and wire PageContext | Use `HostIntegrationContext` and `NormalizedPageContext` for session creation while leaving visibility/public response contracts unchanged | 1 | High: session creation could retain wire-only context | Session input and transient-discard tests |
| **MODIFIED** `src/assistant/session/assistant-session.service.ts` | Creates Customer-scoped sessions, initial context state, and session audit metadata | Use trusted host context for creation scope and forward only normalized PageContext to context state and audit | 1 | High: session persistence could receive raw or transient context | Session service and controller-ingress tests |
| **MODIFIED** `src/assistant/message/assistant-message.types.ts` | Defines message orchestration input | Carry trusted host context, normalized PageContext, and transient runtime input as separate fields | 1 | High: transient state could enter a broad DTO | Type-shape and prohibited-surface tests |
| **MODIFIED** `src/assistant/message/assistant-message.service.ts` | Persists messages, invokes planning/runtime, attaches evidence, decides answers, and emits SSE | Persist/plan only normalized context, pass transient state only to runtime, and attach evidence from safe projected output | 1, 4, 5 | Critical: broad orchestration can leak data across surfaces | Integration sink-capture, evidence, answer, and SSE regression tests |
| **MODIFIED** `src/assistant/message/assistant-message.repository.ts` | Persists user messages and PageContext JSON | Accept only `NormalizedPageContext`; never accept or persist the wire-only reference or raw Browser records | 1 | Critical: raw request context could become durable | Repository persistence and sentinel leak tests |
| **MODIFIED** `src/assistant/context/assistant-context-state.types.ts` | Defines PageContext-bearing context-state transitions | Narrow every PageContext-bearing transition to `NormalizedPageContext` without redesigning the service | 1 | High: later state transitions could reintroduce raw context | Context-state type and persistence tests |
| **MODIFIED** `src/assistant/planning/assistant-planning.types.ts` | Defines planning inputs and persisted execution-plan candidate structures | Phase 1: accept trusted host context and normalized PageContext only. Phase 3: constrain candidates to safe `{ key, arguments, reason }` and exclude independent operation authority | 1, 3 | High: broad authority or planner operation injection | Phase 1 input-boundary tests; Phase 3 candidate serialization and legacy-field tests |
| **MODIFIED** `src/assistant/planning/assistant-planning.service.ts` | Builds and persists ExecutionPlan from query understanding and page/context state | Phase 1: consume trusted host fields and construct an explicitly bounded query-understanding input without transient context. Phase 3: persist the generic validated candidate shape | 1, 3 | High: unsafe identity, arguments, or reference persistence | Phase 1 propagation/secret tests; Phase 3 planning persistence tests |
| **MODIFIED** `src/query-understanding/query-understanding.types.ts` | Defines query-understanding authority and PageContext inputs | Accept `HostIntegrationContext` and `NormalizedPageContext` only; expose no transient connector input | 1 | High: query understanding could receive broad identity or raw context | Query-understanding input-shape and negative-surface tests |
| **MODIFIED** `src/query-understanding/query-understanding.service.ts` | Runs the pipeline, persists understanding output, and writes audit metadata | Derive Customer/integration/host authority from trusted host context and forward an explicitly bounded input without transient state | 1 | High: broad request data could enter planning persistence or audit | Service spy, persistence, and audit-capture tests |
| **MODIFIED** `src/query-understanding/entity-extractor.ts` | Extracts entity candidates from text, PageContext, and context state | Consume only `NormalizedPageContext` rather than arbitrary JSON | 1 | Medium: raw Browser records could become entity truth | Normalized entity-hint tests |
| **MODIFIED** `src/query-understanding/deixis-resolver.ts` | Resolves page/entity and selected-row references | Consume only normalized entity hints and safe selected-row identifiers/summaries | 1 | High: nested Browser records could become reference truth | Deixis ambiguity and raw-selected-row rejection tests |
| **MODIFIED** `src/approvals/action-draft.types.ts` | Defines internal medium-risk action-draft creation input | Narrow PageContext-bearing input to `NormalizedPageContext`; do not change workflow behavior or public contracts | 1 | High: raw context could enter persisted draft summaries | Action-draft persistence sentinel tests |
| **MODIFIED** `src/approvals/approval-request.types.ts` | Defines internal high-risk approval creation input | Narrow PageContext-bearing input to `NormalizedPageContext`; do not change workflow behavior or public contracts | 1 | High: raw context could enter persisted approval summaries | Approval persistence sentinel tests |
| **MODIFIED** `src/approvals/escalation-request.types.ts` | Defines internal critical-risk escalation creation input | Narrow PageContext-bearing input to `NormalizedPageContext`; do not change workflow behavior or public contracts | 1 | High: raw context could enter persisted escalation summaries | Escalation persistence sentinel tests |
| **MODIFIED** `src/query-understanding/query-task-decomposer.ts` | Produces current mock-oriented candidate tool decisions | Produce generic ToolDefinition keys, structured candidate arguments, and reasons using only normalized hints | 3 | Medium: mock-specific or Browser-defined operation authority | Decomposer unit tests and query-understanding persistence regression |
| **MODIFIED** `src/assistant/runtime/runtime.types.ts` | Defines readonly runtime input/result | Carry trusted host/transient inputs separately and expose only safe projected runtime results | 1, 4 | High: raw/transient state could escape through result types | Type-shape and runtime result tests |
| **MODIFIED** `src/assistant/runtime/assistant-readonly-runtime.service.ts` | Resolves tools/permissions, directly invokes mock, sanitizes result, and controls ToolCall lifecycle | Enforce canonical arguments, safe input summary, registry selection, selected-adapter invocation, projection, safe output summary, and existing failure mapping | 3, 5 | Critical: ordering or lifecycle regression | Permission-before-access, ToolCall transition, no-fallback, and mock-equivalence tests |
| **MODIFIED** `src/connectors/connector-adapter.interface.ts` | Defines current connector key, tools, execute, and health contract | Generalize execution context so `DataAdapter` can carry trusted host context, canonical operation, validated arguments, and optional transient context | 2 | Medium: existing mock contract breakage | Interface and mock adapter unit tests |
| **MODIFIED** `src/connectors/mock/mock-connector.adapter.ts` | Executes deterministic mock entity lookups | Implement DataAdapter metadata/capability/compatibility and generic validated named operations while preserving results | 5 | High: accepted mock behavior could drift | Existing fixture/adapter tests plus registry-path equivalence tests |
| **MODIFIED** `src/connectors/mock/mock-connector.module.ts` | Exports the directly injected mock adapter | Contribute exact mock deployment data to the explicit composition root; remove direct Assistant dependency after cutover | 5 | High: accidental global mock fallback | Provider-resolution and unknown-registration failure tests |
| **MODIFIED** `src/tools/tool-registry.service.ts` | Resolves Customer ToolDefinition/policy and validates input | Derive canonical operation from the resolved stable key and interpret the existing input/output contracts without parallel authority | 3, 4 | Critical: schema or connector authority drift | Canonical-key, legacy-field, input-schema, and output-policy tests |
| **MODIFIED** `src/tools/tool-registry.types.ts` | Defines resolved tool and registry validation types | Add typed validated-operation and result-policy interpretations keyed only by resolved ToolDefinition | 3, 4 | High: duplicate operation identity | Type/authority unit tests |
| **MODIFIED** `src/permissions/llm-input-sanitizer.service.ts` | Sanitizes current tool result using Browser-visible fields | Consume only server-projected data for downstream sanitization; remove Browser field expansion authority | 4 | Critical: denied fields could reach model/evidence | Field-masking-before-LLM and visible-column non-expansion tests |
| **MODIFIED** `src/assistant/runtime/tool-call.service.ts` | Creates blocked/started/completed/failed ToolCall lifecycle and summaries | Accept separately produced safe input summary at start and safe output summary only from `SafeProjectedAdapterResult` at completion | 3, 4, 5 | Critical: raw result or transient input could be persisted | Lifecycle and ToolCall payload negative-surface tests |
| **MODIFIED** `src/evidence/evidence-ref.service.ts` | Creates structured EvidenceRef using sanitized records and visible fields | Accept only safe projected result and approved provenance; remove Browser-visible field authority | 4 | Critical: raw business data could become evidence | Evidence allowlist/provenance and raw-result rejection tests |
| **MODIFIED** `src/assistant/assistant.module.ts` | Composes Assistant dependencies and directly imports `MockConnectorModule` | Import host-integration and connector composition providers; remove direct mock runtime wiring at cutover | 1, 5 | High: dependency or duplicate-provider failure | Nest module compilation and runtime provider tests |
| **MODIFIED** `scripts/seed.ts` | Idempotently upserts ToolDefinitions and Customer policies | Add approved versioned ToolDefinition output-policy data through the existing upsert path | 3 | High: missing policy causes default denial or mock regression | Seed integration/idempotency and policy-content tests |
| **MODIFIED** `test/support/us1-test-app.helper.ts` | Provides in-memory modules, repositories, ToolDefinitions, and application fixtures | Mirror production composition, registrations, and ToolDefinition output-policy fixtures | 2–5 | High: test runtime could diverge from production composition | Test-app provider and seed-parity assertions |

### Reused/unchanged files and modified existing test groups

| File / module | Current responsibility | Planned change | Phase | Risk | Validation |
| --- | --- | --- | --- | --- | --- |
| **REUSED/UNCHANGED** `src/permissions/tool-permission-precheck.service.ts` | Enforces resolved Customer tool permission and records safe denial | Reuse as the mandatory authorization gate before registry eligibility and business-data access; no redesign expected | 0, 5 | Critical: invocation order could regress despite unchanged code | Spy asserts registry and adapter are untouched on denial |
| **REUSED/UNCHANGED** `src/permissions/masking.util.ts` | Applies existing permission-aware field masking | Reuse after default-deny projection and before minimization; change only if its current signature cannot consume projected data | 4 | High: masking order could drift | Existing permission-masking tests plus projector-order tests |
| **REUSED/UNCHANGED** `src/assistant/answer/answer-decision.service.ts` and `src/assistant/answer/no-answer-gate.service.ts` | Produce deterministic decisions and map blocked/failed tool outcomes | Preserve existing answered, permission-denied, and tool-failure/no-answer mappings | 5, 6 | High: public AnswerDecision regression | Answer-decision and safe-failure integration tests |
| **REUSED/UNCHANGED** `src/assistant/sse/assistant-sse-event.builder.ts` | Builds existing Assistant SSE lifecycle | Preserve event names and payload shapes while consuming existing lifecycle results | 5, 6 | High: public stream incompatibility | Assistant message SSE contract tests |
| **REUSED/UNCHANGED** `prisma/schema.prisma` and `prisma/migrations/` | Define persistent schema and migrations | No schema or migration change; use existing JSON fields | All | Critical: unintended migration scope | Git diff guard and Prisma-schema checksum/diff review |
| **MODIFIED** `test/unit/page-context-mapper.spec.ts`, `test/unit/tool-registry.service.spec.ts`, `test/unit/tool-permission-precheck.service.spec.ts`, `test/unit/assistant-readonly-runtime.service.spec.ts`, `test/unit/mock-connector-adapter.spec.ts`, and `test/unit/evidence-ref.service.spec.ts` | Cover the current focused component baseline | Extend these exact suites where behavior changes and keep baseline assertions; add focused new unit specs beside them for new providers | 0–6 | Medium: regression coverage gaps | Unit suite passes with new negative cases |
| **MODIFIED** `test/integration/authorized-tool-execution.spec.ts`, `test/integration/tool-permission-denied.spec.ts`, `test/integration/tool-execution-failed-sse.spec.ts`, `test/integration/tool-failure-safe-response.spec.ts`, `test/integration/field-masking-before-llm.spec.ts`, `test/integration/authorized-evidence-answer.spec.ts`, `test/integration/query-understanding-persistence.spec.ts`, and `test/integration/secret-redaction.spec.ts` | Cover authorized execution, denial/failure, masking/evidence, planning persistence, and redaction | Extend as regression/integration hosts for the generic path and prohibited-surface assertions | 0–6 | High: cross-service boundary gaps | Integration suite and targeted sink-capture assertions pass |
| **REUSED/UNCHANGED** `test/contract/assistant-sessions.contract.spec.ts`, `test/contract/assistant-messages-sse.contract.spec.ts`, `test/contract/feedback.contract.spec.ts`, `test/contract/approval-requests.contract.spec.ts`, and `test/contract/gateway-internal-identity.contract.spec.ts` | Guard accepted public Assistant, workflow, and Gateway identity contracts | No expected contract updates; run unchanged as release guards | 0, 6 | Critical: unintended public contract change | Contract suite passes without snapshot/schema changes |

All other public API, SDK, Gateway, Feature 002, real Customer connector, and Feature 009 files remain outside implementation scope.

## Persistence and Provisioning

- `ExecutionPlan.candidateTools` continues using its existing JSON storage and is constrained to safe `{ key, arguments, reason }` candidates.
- Existing ToolDefinition `inputSchema`, `connectorKey`, and `outputSchema` remain the versioned operation-contract storage locations.
- Existing ToolCall JSON fields hold minimized summaries only.
- `DataAdapterRegistration`, `TransientConnectorContext`, raw adapter results, and `GroundedAnswerInput` receive no persistence representation.
- ToolDefinition output policies are rolled out by editing the existing static seed definitions consumed by `prisma.toolDefinition.upsert`, then updating the matching in-memory test definitions. Seed execution must be repeatable without duplicate records or policy drift.

```text
PRISMA_SCHEMA_CHANGE_REQUIRED=NO
PUBLIC_CONTRACT_CHANGE_REQUIRED=NO
```

## Test Strategy and Commands

### Focused unit coverage

- Trusted context construction and missing/mismatched authority rejection.
- Opaque-reference syntax, extraction, and absence from planning/query-understanding inputs.
- Fixed PageContext allowlists, bounds, shallow shapes, selected-row reduction, and nested/raw/credential rejection.
- Canonical ToolDefinition operation derivation and legacy operation-field ignoring.
- Structured argument validation and safe input summarization.
- Explicit adapter-array registration, exact eligibility, ambiguity, compatibility, readiness, and no fallback.
- ToolDefinition output-policy parsing, default denial, projection, masking, minimization, and size/depth/item limits.
- ToolCall blocked/start/complete/fail transitions around every registry and projection outcome.
- EvidenceRef and grounded-answer acceptance of safe projected results only.
- Mock adapter behavior through the registry path.

### Integration and contract coverage

- Permission denial before registry eligibility, connector invocation, or business-data access.
- Two-Customer isolation with identical organization, actor, and host identifiers.
- Transient-reference and raw-payload inspection across persistence, history, context state, audit, logs, telemetry, evidence, model input, SSE, and responses.
- ToolDefinition policy provisioning and Customer tool-policy compatibility.
- Successful projected evidence and deterministic answer behavior.
- Timeout, unavailable/unhealthy adapter, malformed output, projection failure, and dependency failure through existing safe no-answer/SSE behavior.
- Existing sessions, messages, history, SSE, feedback, approvals, Gateway identity, and SDK-facing contract regressions.

### Repository commands

Run focused Jest files during each phase, followed by:

```bash
npm run test:unit -- --runInBand
npm run test:integration -- --runInBand
npm run test:contract -- --runInBand
npm run typecheck
npm run lint
npm run build
npm run test
```

Run `npm run prisma:seed` only against a provisioned development/test database to verify idempotent ToolDefinition policy rollout. Do not run a migration command because this feature has no schema change.

## Dependencies, Risk Containment, and Rollback

The phase dependency graph is fixed:

```text
Phase 0 — baseline and contract guards
  ↓
Phase 1 — trusted host context and transient boundary
  ↓
Phase 2 — adapter contract and trusted deployment registry
  ↓
Phase 3 — canonical operation and ToolDefinition policy rollout
  ↓
Phase 4 — server-owned projection and evidence boundary
  ↓
Phase 5 — mock registry runtime cutover
  ↓
Phase 6 — security and public-contract closeout
```

Phase 5 must not start until all of these prerequisites are satisfied:

```text
HOST_CONTEXT_READY=YES
TRUSTED_REGISTRY_READY=YES
TOOL_DEFINITION_RESULT_POLICY_READY=YES
MOCK_TOOL_POLICY_DATA_READY=YES
SERVER_OWNED_PROJECTION_READY=YES
```

- Keep the direct mock path in place until Phases 1–4 are independently green; perform the wiring replacement atomically in Phase 5 and remove obsolete direct injection only after equivalence tests pass.
- Treat any missing/invalid ToolDefinition result policy, non-unique adapter selection, projection error, or prohibited data observation as a release blocker and fail closed at runtime.
- If cutover regression occurs, revert only the Phase 5 wiring while retaining isolated, unused Phase 1–4 components; do not introduce a runtime fallback that bypasses registry or projection controls.
- No feature flag is required because dual active paths or silent fallback would weaken the security boundary.

## Feature 009 Handoff

Feature 009, `009-productized-business-connector-runtime`, consumes the Feature 008 extension seam: trusted host context, opaque transient reference, explicit adapter registration, canonical named-operation contract, and safe projected result. It owns central transport/network safety and service authentication, plus Customer-local reference binding, expiry/revocation/replay controls, credential isolation, operation binding, deployment, and real Customer API access. Shinmone SCM is its first reference integration and must not create a Feature 008 core-runtime branch.

## Completion Criteria

- All seven phases satisfy their exit gates in dependency order.
- The mock connector runs only through exact trusted registry selection and the standard projection path.
- Permission authorization occurs before adapter eligibility or business-data access in every case.
- Planner/browser input cannot establish canonical operation, adapter, source, identity, permission, or result-release authority.
- `connectorContextRef`, native credentials, raw Browser payloads, and raw adapter results are absent from every prohibited surface.
- Existing public Assistant, SSE, Gateway, SDK, feedback, approval, ToolCall, audit, EvidenceRef, and AnswerDecision contracts remain compatible.
- No Prisma schema/migration, Customer-specific connector, Feature 002 activation, or Feature 009 implementation is present.
- Full verification is green and no unresolved implementation blocker remains.

```text
PLAN_FILE=specs/008-generic-host-integration-data-adapter-foundation/plan.md
PLAN_ONLY=YES
SPEC_MODIFIED=NO
DESIGN_MODIFIED=NO
TASKS_CREATED=NO
IMPLEMENTATION_STARTED=NO
CURRENT_SOURCE_REVERIFIED=YES
PHASE_COUNT=7
PHASE_ORDER_CHANGED=NO
REGISTRATION_OPERATION_AUTHORITY=NO
ADAPTER_CAPABILITY_CHECK_REQUIRED=YES
DATA_ADAPTER_REGISTRATION_FIELDS=adapter,connectorKey,customerId,integrationId,hostApp,active
FILE_CHANGE_MATRIX_DEFINED=YES
SAFE_INPUT_SUMMARY_TIMING_DEFINED=YES
SAFE_OUTPUT_SUMMARY_TIMING_DEFINED=YES
RAW_ADAPTER_RESULT_IN_TOOLCALL=NO
DEPENDENCY_GRAPH_DEFINED=YES
PHASE5_REQUIRES_HOST_CONTEXT_READY=YES
PHASE5_REQUIRES_REGISTRY_READY=YES
PHASE5_REQUIRES_TOOL_POLICY_READY=YES
PHASE5_REQUIRES_PROJECTOR_READY=YES
PRISMA_SCHEMA_CHANGE_REQUIRED=NO
PUBLIC_CONTRACT_CHANGE_REQUIRED=NO
OPEN_PLAN_BLOCKERS=0
NEXT_ACTION=REVIEW_FINAL_FEATURE008_PLAN
```
