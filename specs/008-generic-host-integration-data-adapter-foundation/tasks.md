# Tasks: Feature 008 — Generic Host Integration and Data Adapter Foundation

**Input**: Approved `spec.md`, `design.md`, and `plan.md` in this directory.  
**Scope**: Implement the generic, Customer-neutral read-oriented adapter foundation through the existing Assistant runtime. Feature 002, real Customer connectors, Feature 009, public API redesign, and Prisma schema changes are out of scope.

## Execution Rules

- Complete phases in order. Every `[RED]` task must fail for its intended missing behavior before the immediately following `[GREEN]` task starts.
- `[P]` is limited to the three independent read-only baseline groups. All later work is sequential because it shares contracts, fixtures, module wiring, or phase gates.
- Each task records observable behavior, exact files, direct dependencies, validation, and a task-specific guard. No task authorizes work outside its listed files and approved supporting test files.
- Permission must succeed before registry eligibility, connector invocation, or Customer business-data access. Post-fetch permission filtering is prohibited.
- `connectorContextRef` is syntax-checked and transient only. It never enters planning, persistence, ToolCall, evidence, audit, logs, telemetry, model input, SSE, or public responses, and reaches only the finally selected adapter invocation.
- Canonical operation authority is the resolved ToolDefinition stable key/name; `inputSchema`, `connectorKey`, and `outputSchema` respectively own input validation, deployment lookup, and result release.
- `DataAdapterRegistration` contains only `adapter`, `connectorKey`, `customerId`, `integrationId`, `hostApp`, and `active`. Adapter capability is separate; registration has no operation/ToolDefinition allowlist or wildcard.
- Raw adapter results are execution-local. Safe output follows validation → ToolDefinition policy → default-deny projection → permission masking → minimization → `SafeProjectedAdapterResult`.
- Preserve existing blocked/started/completed/failed ToolCall semantics and all session, message, SSE, AnswerDecision, feedback, approval, Gateway identity, and SDK contracts.

## Phase 0 — Baseline and Contract Guards

**Goal**: Freeze accepted behavior before Feature 008 production changes.  
**Dependencies**: None.  
**Independent test**: Existing focused, public-contract, and deterministic mock suites pass unchanged.

- [x] T001 [VERIFY] Re-run and record the focused Feature 008 baseline against `test/unit/page-context-mapper.spec.ts`, `test/unit/tool-registry.service.spec.ts`, `test/unit/tool-permission-precheck.service.spec.ts`, `test/unit/assistant-readonly-runtime.service.spec.ts`, `test/unit/mock-connector-adapter.spec.ts`, `test/unit/evidence-ref.service.spec.ts`, `test/integration/authorized-tool-execution.spec.ts`, `test/contract/assistant-messages-sse.contract.spec.ts`, and `test/contract/gateway-internal-identity.contract.spec.ts`.
  - Files: `specs/008-generic-host-integration-data-adapter-foundation/tasks.md` for execution evidence only.
  - Depends on: none.
  - Validation: Run the nine files with `npm run test -- --runInBand`; confirm 9 suites and 43 tests pass and record the existing `ts-jest` `allowJs` warning as informational.
  - Guard: Do not change production code, tests, configuration, or the warning while capturing baseline evidence.

- [x] T002 [VERIFY] [P] Verify public session, message/SSE, and Gateway identity guards in `test/contract/assistant-sessions.contract.spec.ts`, `test/contract/assistant-messages-sse.contract.spec.ts`, and `test/contract/gateway-internal-identity.contract.spec.ts`.
  - Files: The three listed contract suites; no edits expected.
  - Depends on: T001.
  - Validation: Run `npm run test:contract -- --runInBand` with the three file paths and record the passing contract baseline.
  - Guard: Do not approve a new endpoint, request mode, SSE event shape, Gateway authority, or SDK-visible contract.

- [x] T003 [VERIFY] [P] Verify feedback and approval compatibility in `test/contract/feedback.contract.spec.ts` and `test/contract/approval-requests.contract.spec.ts`.
  - Files: The two listed contract suites; no edits expected.
  - Depends on: T001.
  - Validation: Run `npm run test:contract -- --runInBand` with both file paths.
  - Guard: Do not redesign feedback, approval, review, or human-intervention behavior.

- [x] T004 [VERIFY] [P] Capture deterministic mock, ToolCall, permission, EvidenceRef, answer, and failure behavior in `test/unit/assistant-readonly-runtime.service.spec.ts`, `test/unit/mock-connector-adapter.spec.ts`, `test/unit/evidence-ref.service.spec.ts`, `test/unit/answer-decision.service.spec.ts`, `test/integration/tool-permission-denied.spec.ts`, `test/integration/authorized-evidence-answer.spec.ts`, and `test/integration/tool-failure-safe-response.spec.ts`.
  - Files: The seven listed existing suites; no edits expected.
  - Depends on: T001.
  - Validation: Run `npm run test -- --runInBand` with the listed file paths and retain expected blocked/started/completed/failed and no-answer behavior.
  - Guard: Do not alter fixtures or expectations to manufacture a passing baseline.

- [x] T005 [VERIFY] Record the Phase 0 checkpoint in `specs/008-generic-host-integration-data-adapter-foundation/tasks.md`.
  - Files: `specs/008-generic-host-integration-data-adapter-foundation/tasks.md` evidence only.
  - Depends on: T002, T003, T004.
  - Validation: Confirm all Phase 0 commands pass and the focused count remains 9 suites/43 tests.
  - Guard: This checkpoint implements no behavior and must report `BASELINE_CAPTURED=YES`, `PUBLIC_CONTRACT_BASELINE_CAPTURED=YES`, and `MOCK_RUNTIME_BASELINE_CAPTURED=YES`.

### Phase 0 Execution Evidence — 2026-09-07

- T001 PASS — exact focused command completed with 9/9 suites and 43/43 tests passing, 0 snapshots; the existing `ts-jest` `allowJs` warning was present and remained informational.
- T002 PASS — session, message/SSE, and Gateway identity contract command completed with 3/3 suites and 25/25 tests passing, 0 snapshots; no contract or snapshot was updated.
- T003 PASS — feedback and approval contract command completed with 2/2 suites and 5/5 tests passing, 0 snapshots; no flow or expectation was changed.
- T004 PASS — deterministic mock, ToolCall, permission, EvidenceRef, AnswerDecision, and safe-failure command completed with 7/7 suites and 23/23 tests passing, 0 snapshots; no fixture or expectation was changed.
- Pre-run and post-test Git status/diff were clean. Phase 0 changed no production code, tests, Prisma files, seeds, package configuration, or approved `spec.md`, `design.md`, or `plan.md`; this evidence and the T001–T005 checkboxes are the only Phase 0 artifact update.
- T006 remains unstarted.

```text
BASELINE_CAPTURED=YES
PUBLIC_CONTRACT_BASELINE_CAPTURED=YES
MOCK_RUNTIME_BASELINE_CAPTURED=YES
```

## Phase 1 — Host Context and Transient Boundary

**Goal**: Separate verified authority, normalized Browser hints, and execution-local connector context at ingress.  
**Dependencies**: T005.  
**Independent test**: Valid identity creates trusted context; unsafe Browser fields are removed/rejected; the opaque reference is observable only at the selected runtime input boundary.

- [x] T006 [RED] [US1] Add failing trusted-context and factory tests in proposed `test/unit/host-integration-request.factory.spec.ts`.
  - Files: `test/unit/host-integration-request.factory.spec.ts` (new).
  - Depends on: T005.
  - Validation: Run `npm run test:unit -- --runInBand test/unit/host-integration-request.factory.spec.ts`; failures must be limited to absent HostIntegrationContext/factory behavior.
  - Guard: Test Customer, integration, host app, organization, actor, roles, scopes, request ID, missing authority, and cross-scope mismatch using verified `RequestIdentityContext` only.

- [x] T007 [GREEN] [US1] Add trusted and transient request contracts and the ingress factory in `src/host-integration/host-integration.types.ts`, `src/host-integration/host-integration-request.factory.ts`, and `src/host-integration/host-integration.module.ts`.
  - Files: The three proposed new files.
  - Depends on: T006.
  - Validation: Make T006 pass and run `npm run typecheck`.
  - Guard: Do not replace IdentityGuard authority, use Browser values as authority, create request-global mutable state, or add persistence.

- [x] T008 [RED] [US3] Add failing PageContext normalization and opaque-reference tests in proposed `test/unit/page-context-normalizer.service.spec.ts` and existing `test/unit/page-context-mapper.spec.ts`.
  - Files: `test/unit/page-context-normalizer.service.spec.ts` (new), `test/unit/page-context-mapper.spec.ts`.
  - Depends on: T007.
  - Validation: Run both files with `npm run test:unit -- --runInBand`; failures must cover bounded `ccr_<base64url-id>` syntax, shallow allowlists, raw/nested records, credentials, authority keys, and selected-row reduction.
  - Guard: Browser-declared “safe” fields, `visibleColumns`, filters, and presentation state cannot establish evidence, operation, connector, adapter, or result authority.

- [x] T009 [GREEN] [US3] Implement wire/normalized PageContext separation in `src/assistant/page-context/page-context.dto.ts`, `src/assistant/page-context/page-context.types.ts`, `src/host-integration/page-context-normalizer.service.ts`, and `src/assistant/page-context/page-context.mapper.ts`.
  - Files: The four listed files, including the proposed new normalizer.
  - Depends on: T008.
  - Validation: Make T008 pass; run `npm run typecheck` and the PageContext unit suites.
  - Guard: Accept `connectorContextRef` only as compatible optional wire input; never include it in `NormalizedPageContext` or make raw records necessary for business answers.

- [x] T010 [RED] [US2] Add failing ingress/orchestration and normalized-consumer tests for immediate reference extraction, session discard, runtime-only message passage, and planner/query-understanding exclusion.
  - Files: `test/unit/assistant-message.service.spec.ts` (new), `test/integration/feature008-transient-boundary.spec.ts` (new), proposed `test/unit/query-understanding.service.spec.ts`, and existing `test/unit/assistant-session.service.spec.ts`, `test/unit/assistant-message.repository.spec.ts`, `test/unit/assistant-context-state.service.spec.ts`, `test/unit/assistant-planning.service.spec.ts`, `test/unit/query-understanding-placeholder.spec.ts`, `test/unit/deixis-resolution.spec.ts`, `test/integration/action-draft-confirmation.spec.ts`, `test/integration/approval-request-flow.spec.ts`, and `test/integration/escalation-request-flow.spec.ts`.
  - Depends on: T009.
  - Validation: Run the listed files with `npm run test -- --runInBand`; assert extraction precedes repository, context-state, planning, audit, and logging calls, and observe RED because session creation, message persistence, context state, planning/query understanding, entity/deixis readers, and approval/action/escalation creation inputs still accept broad identity, wire PageContext, or arbitrary JSON instead of the required trusted/normalized inputs.
  - Guard: Do not create a second request mode, pass `TransientConnectorContext` to planning, QueryTaskDecomposer, ToolRegistry, ExecutionPlan, EvidenceRef, or grounded-answer inputs, or test Phase 3 candidate-operation shape, DataAdapter, registry, or projection behavior.

- [x] T011 [GREEN] [US2] Wire separated trusted, normalized, and transient inputs through the Assistant ingress and every current Phase 1 PageContext consumer.
  - Files: `src/assistant/assistant.controller.ts`, `src/assistant/message/assistant-message.types.ts`, `src/assistant/message/assistant-message.service.ts`, `src/assistant/runtime/runtime.types.ts`, `src/assistant/assistant.module.ts`, `src/assistant/session/assistant-session.types.ts`, `src/assistant/session/assistant-session.service.ts`, `src/assistant/message/assistant-message.repository.ts`, `src/assistant/context/assistant-context-state.types.ts`, `src/assistant/planning/assistant-planning.types.ts`, `src/assistant/planning/assistant-planning.service.ts`, `src/query-understanding/query-understanding.types.ts`, `src/query-understanding/query-understanding.service.ts`, `src/query-understanding/entity-extractor.ts`, `src/query-understanding/deixis-resolver.ts`, `src/approvals/action-draft.types.ts`, `src/approvals/approval-request.types.ts`, and `src/approvals/escalation-request.types.ts`.
  - Depends on: T010.
  - Validation: Make T010 pass; run targeted unit/integration tests and `npm run typecheck`; prove verified identity becomes `HostIntegrationContext`, wire PageContext becomes `NormalizedPageContext`, and only the message runtime receives `TransientConnectorContext` separately in memory.
  - Guard: Session creation discards transient context; session, message persistence, context state, planning, query understanding, entity/deixis readers, and approval persistence-producing inputs receive normalized context only. Approval behavior/public contracts remain unchanged. `PHASE3_CANDIDATE_OPERATION_RESTRUCTURING_INCLUDED=NO`: do not add `{ key, arguments, reason }`, legacy-operation handling, canonical ToolDefinition operation derivation, structured input validation, or ToolDefinition output policy.

### Phase 1 T006–T012 Execution Evidence — 2026-09-07

- T006 RED observed because the Host Integration factory module was absent; T007 GREEN completed with 1/1 suite and 16/16 tests passing, followed by a passing typecheck.
- T008 RED observed for the absent normalizer and raw PageContext leakage; T009 GREEN completed with 2/2 suites and 17/17 tests passing.
- T010 RED observed across the broad session, message, context, planning, query-understanding, and approval input contracts; T011 GREEN completed with 12/12 targeted suites and 42/42 tests passing, followed by a passing typecheck.
- PageContext, planning persistence, query-understanding persistence, secret-redaction, session, and message/SSE regression coverage completed with 7/7 suites and 39/39 tests passing.
- T012's initial expanded sentinel run was naturally green immediately after T011 with 2/2 suites and 7/7 tests passing. At that point T012–T014 remained unchecked, T013 was not started, and Phase 1 checkpoint values were not recorded pending human reconciliation.

- [x] T012 [RED] [US2] Expand prohibited-surface coverage in `test/integration/feature008-transient-boundary.spec.ts` and `test/integration/secret-redaction.spec.ts`.
  - Files: The two listed integration suites.
  - Depends on: T011.
  - Validation: Assert `connectorContextRef`, native credentials, and raw Browser records are absent from AssistantMessage, AssistantContextState, ExecutionPlan, ToolCall, EvidenceRef, audit, logs, telemetry, prompt/model, SSE, and public response captures.
  - Guard: Do not weaken assertions by redacting after persistence; prohibited values must never enter the surfaces.

- [ ] T013 [GREEN] [US2] Close transient and normalized-context leaks in `src/assistant/message/assistant-message.service.ts`, `src/assistant/page-context/page-context.mapper.ts`, and `src/assistant/runtime/runtime.types.ts`.
  - Files: The three listed files; touch no additional production surface unless T012 identifies a directly participating approved boundary.
  - Depends on: T012.
  - Validation: Make T012 pass and rerun `test/integration/query-understanding-persistence.spec.ts` and `test/integration/secret-redaction.spec.ts`.
  - Guard: Do not persist hashes, encoded forms, audit metadata, or derived copies of the opaque reference or native credentials.

- [x] T014 [VERIFY] [US1] Record the Phase 1 checkpoint in `specs/008-generic-host-integration-data-adapter-foundation/tasks.md`.
  - Files: This task file for evidence; Phase 1 source/test files are validation inputs only.
  - Depends on: T013.
  - Validation: Run all new Phase 1 suites, existing PageContext/planning persistence tests, and `npm run typecheck`.
  - Guard: Implement no new behavior; report `HOST_CONTEXT_READY=YES`, `NORMALIZED_PAGE_CONTEXT_READY=YES`, and `TRANSIENT_CONTEXT_ISOLATION_READY=YES` only when all negative surfaces pass.

### Phase 1 Corrective Conformance Evidence — 2026-09-07

- T009 correction PASS — an independently observed RED proved arbitrary Browser filter fields survived the prior denylist; the Backend now accepts only exact `status` and `amount` active-filter keys. The corrected normalizer suite passed 14/14 tests.
- T011 correction PASS — an independently observed RED proved the factory lacked the single `create(identityContext, wirePageContext)` seam. `HostIntegrationRequestFactory` now returns the exact trusted/normalized/transient request context, `HostIntegrationModule` owns the factory and normalizer, and Assistant ingress uses only the factory. The corrected factory suite passed 17/17 tests.
- T012 security verification PASS — the naturally green history remains unchanged. Expanded captures prove prohibited sentinels do not reach persistence, audit, ToolCall, EvidenceRef, SSE, public output, structured logs, observability metadata, model-input preparation, or actual LLM execution. Structured logging and actual LLM execution are `NOT_PRESENT_IN_PHASE1_PATH`; observability receives server-owned duration metadata only.
- Complete focused Phase 1 and public-contract validation passed 22/22 suites and 114/114 tests. Typecheck and modified-file lint passed. Repository-wide lint reproduced the pre-existing 41 errors only in unrelated Gateway and identity-bridge files; no changed Phase 1 file failed lint.
- T013 remains unchecked and was not executed because T012 found no leak. T014 dependency is reconciled through the verified no-leak path. T015 remains unchecked and Phase 2 was not started.

```text
ACTIVE_FILTER_SELECTION_MODEL=BACKEND_EXPLICIT_ALLOWLIST
UNKNOWN_ACTIVE_FILTER_FIELD=DROP_OR_FAIL_CLOSED
BROWSER_EXPANDS_FILTER_ALLOWLIST=NO
T012_RED_OBSERVED=NO
T012_ALREADY_GREEN_DUE_TO_PRIOR_APPROVED_GREEN=YES
T012_SECURITY_VERIFICATION=PASS
CONNECTOR_CONTEXT_REF_IN_LOGS=NO
CONNECTOR_CONTEXT_REF_IN_TELEMETRY=NO
CONNECTOR_CONTEXT_REF_IN_MODEL_INPUT=NO
RAW_BROWSER_RECORD_IN_LOGS=NO
RAW_BROWSER_RECORD_IN_TELEMETRY=NO
RAW_BROWSER_RECORD_IN_MODEL_INPUT=NO
CUSTOMER_NATIVE_CREDENTIAL_IN_LOGS=NO
CUSTOMER_NATIVE_CREDENTIAL_IN_TELEMETRY=NO
CUSTOMER_NATIVE_CREDENTIAL_IN_MODEL_INPUT=NO
STRUCTURED_LOG_SURFACE=NOT_PRESENT_IN_PHASE1_PATH
ACTUAL_LLM_EXECUTION_SURFACE=NOT_PRESENT_IN_PHASE1_PATH
T013_REQUIRED=NO
T013_STATUS=NOT_REQUIRED
T014_DEPENDENCY_SATISFIED_BY_T012_NO_LEAK=YES
HOST_CONTEXT_READY=YES
NORMALIZED_PAGE_CONTEXT_READY=YES
TRANSIENT_CONTEXT_ISOLATION_READY=YES
```

## Phase 2 — Data Adapter and Trusted Registry

**Goal**: Establish the generic connector-domain contract and exact deployment registry without cutting over the Assistant runtime.  
**Dependencies**: T014.  
**Independent test**: An exact trusted registration is uniquely eligible only after adapter capability and readiness checks; all other selections fail closed.

- [x] T015 [RED] [US4] Add failing contract-shape tests in proposed `test/unit/data-adapter-contract.spec.ts`.
  - Files: `test/unit/data-adapter-contract.spec.ts` (new).
  - Depends on: T014.
  - Validation: Run the new unit file; assert `DataAdapter extends ConnectorAdapter` and registration has exactly `adapter`, `connectorKey`, `customerId`, `integrationId`, `hostApp`, and `active`.
  - Guard: `REGISTRATION_OPERATION_AUTHORITY=NO`; prohibit `supportedToolKeys`, operations, ToolDefinition allowlists, Customer/integration/host wildcards, and result policies in registration.

- [x] T016 [GREEN] [US4] Add generic adapter and exact registration contracts in `src/connectors/data-adapter.interface.ts`, `src/connectors/data-adapter-registration.ts`, and `src/connectors/connector-adapter.interface.ts`.
  - Files: Two proposed new files and the existing connector interface.
  - Depends on: T015.
  - Validation: Make T015 pass and run `npm run typecheck`.
  - Guard: Adapter capability/`isCompatible` remains implementation behavior; the adapter cannot decide output release or Customer deployment eligibility.

- [x] T017 [RED] [US4] Add failing registry-selection tests in proposed `test/unit/data-adapter-registry.service.spec.ts`.
  - Files: `test/unit/data-adapter-registry.service.spec.ts` (new).
  - Depends on: T016.
  - Validation: Cover same adapter/two Customers, wrong Customer/integration/host, inactive registration, unknown connectorKey, zero/exactly-one/multiple candidates, capability incompatibility, unhealthy readiness, Browser selection attempts, and no fallback.
  - Guard: Selection order must be exact registration match → adapter capability/compatibility → exactly one → readiness; do not invoke business-data execution.

- [x] T018 [GREEN] [US4] Implement trusted selection in proposed `src/connectors/data-adapter-registry.service.ts`.
  - Files: `src/connectors/data-adapter-registry.service.ts` (new).
  - Depends on: T017.
  - Validation: Make T017 pass and run `npm run typecheck`.
  - Guard: Use only trusted ToolDefinition.connectorKey and HostIntegrationContext scope; disclose no registration/source details and never fall back to mock.

- [x] T019 [RED] [US4] Add failing explicit provider-array composition tests in proposed `test/unit/connectors-module.spec.ts`.
  - Files: `test/unit/connectors-module.spec.ts` (new).
  - Depends on: T018.
  - Validation: Assert one readonly `DATA_ADAPTER_REGISTRATIONS` array is assembled explicitly, preserves duplicate detection, and uses no Angular-style `multi: true` assumption.
  - Guard: Do not import the new registry into `AssistantReadonlyRuntimeService` or activate the cutover in this task.

- [x] T020 [GREEN] [US4] Add connector composition in proposed `src/connectors/connectors.module.ts` and mirror its providers in `test/support/us1-test-app.helper.ts`.
  - Files: The proposed connector module and existing test helper.
  - Depends on: T019.
  - Validation: Make T019 pass and run provider-resolution/typecheck tests.
  - Guard: Keep the current direct mock runtime path active; add no database registry, dynamic plugin loading, Browser registration, or control-plane CRUD.

- [x] T021 [VERIFY] [US4] Record the Phase 2 checkpoint in `specs/008-generic-host-integration-data-adapter-foundation/tasks.md`.
  - Files: This task file for evidence; Phase 2 source/test files are validation inputs only.
  - Depends on: T020.
  - Validation: Run all Phase 2 unit tests and confirm runtime production wiring still uses the pre-cutover path.
  - Guard: Report `DATA_ADAPTER_CONTRACT_READY=YES`, `TRUSTED_REGISTRY_READY=YES`, `MULTI_CUSTOMER_REGISTRATION_ISOLATION_READY=YES`, and `REGISTRATION_OPERATION_AUTHORITY=NO` only after exact-match negatives pass.

### Phase 2 T015–T021 Execution Evidence — 2026-09-07

- T015 RED observed because the DataAdapter contract and registration modules were absent and `ConnectorAdapter` was not generic. T016 GREEN completed with 1/1 suite and 3/3 tests passing, followed by a passing typecheck.
- T017 RED observed because `DataAdapterRegistry` was absent. T018 GREEN completed with 1/1 suite and 20/20 tests passing, followed by a passing typecheck. The suite covers exact Customer/integration/host/connector isolation, inactive and wildcard registrations, capability and compatibility rejection, ambiguity, readiness failure, Browser/transient non-authority, zero business execution, and no fallback.
- T019 RED observed because `ConnectorsModule` and its explicit registration provider were absent. T020 GREEN completed with 1/1 suite and 3/3 tests passing, followed by a passing typecheck. The production provider is one frozen empty array; an explicit duplicate override remains visible to the registry and fails ambiguous.
- T021 checkpoint PASS — all Phase 2 suites completed with 3/3 suites and 26/26 tests passing. Existing mock adapter, mock fixtures, and direct readonly-runtime coverage completed with 3/3 suites and 18/18 tests passing. The Phase 1 transient-boundary regression completed with 1/1 suite and 2/2 tests passing.
- Typecheck, modified-file lint, and `git diff --check` passed. The checkpoint corrected only the contract test's lint-only constant-condition wrapper and the existing readonly-runtime test fixture's missing Phase 1 trusted/transient fields; no production behavior or runtime wiring changed.
- Scope inspection confirmed no change to Prisma schema/migrations, seed data, `.specify/feature.json`, ToolDefinition policy, Gateway, identity bridge, SDK, Customer SPA, Feature 009, or `AssistantReadonlyRuntimeService`. `QueryUnderstandingToolCandidate` remains exactly `{ key, reason }`; T022 remains unchecked.

```text
DATA_ADAPTER_CONTRACT_READY=YES
TRUSTED_REGISTRY_READY=YES
MULTI_CUSTOMER_REGISTRATION_ISOLATION_READY=YES
DATA_ADAPTER_REGISTRATION_FIELDS=adapter,connectorKey,customerId,integrationId,hostApp,active
REGISTRATION_OPERATION_AUTHORITY=NO
WILDCARD_REGISTRATION_SUPPORTED=NO
ADAPTER_CAPABILITY_CHECK_REQUIRED=YES
EXACTLY_ONE_SELECTION_REQUIRED=YES
READINESS_CHECK_REQUIRED=YES
CONNECTOR_CONTEXT_REF_USED_FOR_REGISTRY_SELECTION=NO
PRODUCTION_REGISTRATION_ARRAY_FROZEN=YES
PRODUCTION_REGISTRATION_ARRAY_EMPTY=YES
DUPLICATE_REGISTRATIONS_PRESERVED=YES
MOCK_FALLBACK_PRESENT=NO
DIRECT_MOCK_RUNTIME_PATH_STILL_ACTIVE=YES
ASSISTANT_RUNTIME_REGISTRY_CUTOVER_STARTED=NO
PHASE3_IMPLEMENTATION_STARTED=NO
T022_STARTED=NO
```

## Phase 3 — Structured Operations and ToolDefinition Policy

**Goal**: Make the resolved ToolDefinition the sole canonical operation/input/connector/result-policy association and provision mock result policies before cutover.  
**Dependencies**: T021.  
**Independent test**: Planner fields cannot redirect operations; validated structured arguments and versioned ToolDefinition policies fail closed when invalid or absent.

- [x] T022 [RED] [US5] Add failing generic candidate and canonical-operation tests in `test/unit/assistant-planning.service.spec.ts` and proposed `test/unit/query-task-decomposer.spec.ts`.
  - Files: The existing planning suite and proposed decomposer suite.
  - Depends on: T021.
  - Validation: Assert persisted candidates are `{ key, arguments, reason }`, a legacy `operation` field is ignored, and canonical identity is re-derived after ToolDefinition resolution.
  - Guard: `PLANNER_OPERATION_AUTHORITY=NO`; exclude connectorContextRef, credentials, adapter keys, endpoints, SQL, paths, query strings, and free-form commands from planned arguments.

- [x] T023 [GREEN] [US5] Generalize planned candidates in `src/assistant/planning/assistant-planning.types.ts`, `src/assistant/planning/assistant-planning.service.ts`, and `src/query-understanding/query-task-decomposer.ts`.
  - Files: The three listed production files.
  - Depends on: T022.
  - Validation: Make T022 pass; rerun `test/integration/query-understanding-persistence.spec.ts` and `npm run typecheck`.
  - Guard: Do not persist an independent operation authority or add new Prisma fields.

- [x] T024 [RED] [US5] Add failing structured-input and prohibited-command tests in `test/unit/tool-registry.service.spec.ts` and `test/unit/assistant-readonly-runtime.service.spec.ts`.
  - Files: The two listed existing unit suites.
  - Depends on: T023.
  - Validation: Cover missing/malformed/excessive arguments, arbitrary or model-generated SQL, URLs, HTTP paths, forwarded queries, commands, Browser operation code, native credentials, and connectorContextRef.
  - Guard: Invalid input must block before registry eligibility, connector invocation, or business-data access.

- [x] T025 [GREEN] [US5] Implement canonical resolution, structured validation, and pre-start safe input summary in `src/tools/tool-registry.service.ts`, `src/tools/tool-registry.types.ts`, `src/assistant/runtime/assistant-readonly-runtime.service.ts`, and `src/assistant/runtime/tool-call.service.ts`.
  - Files: The four listed existing files.
  - Depends on: T024.
  - Validation: Make T024 pass; assert validated arguments → input allowlist/redaction/minimization → safe input summary → ToolCall start.
  - Guard: `TOOL_DEFINITION_OPERATION_AUTHORITY=YES`; safe input excludes full arbitrary arguments, unapproved sensitive values, credentials, and transient context.

- [x] T026 [RED] [US5] Add failing ToolDefinition result-policy tests in `test/unit/tool-registry.service.spec.ts` and `test/integration/customer-tool-policy.spec.ts`.
  - Files: The two listed existing suites.
  - Depends on: T025.
  - Validation: Cover versioned valid policy parsing plus missing/invalid policy default denial through `ToolDefinition.outputSchema`.
  - Guard: Do not add an adapter-owned allowlist, parallel policy registry, database table, or alternate policy source.

- [x] T027 [GREEN] [US5] Implement trusted ToolDefinition result-policy interpretation in `src/tools/tool-registry.service.ts` and `src/tools/tool-registry.types.ts`.
  - Files: The two listed existing production files and only already-approved narrowly participating ToolDefinition contract types if compilation requires them.
  - Depends on: T026.
  - Validation: Make T026 pass by interpreting versioned `ToolDefinition.outputSchema`, validating required policy structure, and returning a typed policy result that the later AdapterResultProjector can consume; missing or malformed policy must default-deny.
  - Guard: `RESULT_POLICY_SINGLE_AUTHORITY=ToolDefinition.outputSchema`; do not implement AdapterResultProjector, seed data, adapter-owned policy, a second policy registry, raw SQL, or a Prisma migration.

- [x] T028 [DATA] [US5] Provision approved mock result policies in `scripts/seed.ts` and mirror them in `test/support/us1-test-app.helper.ts`.
  - Files: The two listed existing files.
  - Depends on: T027.
  - Validation: Provision all current mock operations with policies accepted by T027 through the existing `prisma.toolDefinition.upsert` model and confirm the test fixture mirrors the production definitions.
  - Guard: This task owns policy data only and must not implement or alter policy parsing; no raw SQL, schema edit, migration, new table, credential, Customer endpoint, or second result-policy registry.

- [x] T029 [VERIFY] [US5] Verify ToolDefinition policy parsing and provisioning using `scripts/seed.ts`, `test/support/us1-test-app.helper.ts`, and `prisma/schema.prisma`.
  - Files: The three listed files; schema is inspection-only.
  - Depends on: T028.
  - Validation: Run policy unit/integration suites; compare seed/test fixture policy shape; run `npm run prisma:seed` twice only against a provisioned dev/test database and confirm idempotency.
  - Guard: If no safe database is provisioned, record seed execution as environment-pending rather than targeting production or creating a migration.

- [x] T030 [VERIFY] [US5] Record the Phase 3 checkpoint in `specs/008-generic-host-integration-data-adapter-foundation/tasks.md`.
  - Files: This task file for evidence; Phase 3 files are validation inputs only.
  - Depends on: T029.
  - Validation: Run Phase 3 suites, `npm run typecheck`, and schema/diff inspection.
  - Guard: Report `STRUCTURED_OPERATION_CONTRACT_READY=YES`, `TOOL_DEFINITION_RESULT_POLICY_READY=YES`, `MOCK_TOOL_POLICY_DATA_READY=YES`, and `PRISMA_SCHEMA_CHANGE_REQUIRED=NO` only when all policies needed for cutover exist.

### Phase 3 T022–T030 Execution Evidence — 2026-09-07

- T022 RED observed with both required suites failing because candidates omitted `arguments` and planning persisted legacy operation, connector authority, SQL, and connector-reference sentinels. T023 GREEN completed with 2/2 suites and 10/10 tests passing; query-understanding persistence and typecheck also passed.
- T024 RED observed because canonical named-operation validation was absent and ToolCall start lacked a value-free safe input summary. T025 GREEN completed with 2/2 suites and 37/37 tests passing, followed by a passing typecheck. Structured validation covers declared recursive schema types plus the fixed 32-key, depth-4, 100-item, 512-character, and 16-KiB ceilings.
- T026 RED observed because `ToolRegistryService.resolveResultPolicy` was absent in both the unit and trusted Customer-policy integration paths. T027 GREEN completed with 2/2 suites and 33/33 active tests passing; 6 pre-existing environment-gated tests remained skipped in that narrow run. Missing, malformed, inconsistent, and unsupported-version policies default-deny.
- T028 DATA completed for all six current Mock ToolDefinitions in the production upsert seed and in-memory test fixture. Every policy uses the version-1 `x-assistant-result-policy` extension, explicitly denies `organizationId`, and has no adapter-, Browser-, or parallel-registry authority.
- T029 PASS — the configured target was reconfirmed as the healthy local development `assistant_dev` database. `npm run prisma:seed` succeeded twice. Both read-only checks returned exactly six valid Mock policies and the identical SHA-256 fingerprint `48c656dbd8bba243f7b470fc282fb8a3d47937c8b43bb8a324be273a28d057e1`.
- T030 checkpoint PASS — final Phase 3 unit coverage completed with 4/4 suites and 57/57 tests passing. Query-understanding persistence, fully enabled Customer-policy coverage, and the Phase 1 transient regression completed with 3/3 suites and 11/11 tests passing. Additional authorized, denied, and safe-failure runtime regressions completed with 3/3 suites and 3/3 tests passing.
- Typecheck, modified-file lint, and `git diff --check` passed. The first integration attempt was blocked only by sandbox `listen EPERM`; the identical permitted rerun passed. Prisma schema/migrations, `.specify/feature.json`, Gateway, identity bridge, SDK, Customer SPA, Feature 009, DataAdapter registry wiring, and the direct Mock runtime dependency remain unchanged. No projector file was created and T031 remains unchecked.

```text
STRUCTURED_OPERATION_CONTRACT_READY=YES
PLANNED_CANDIDATE_FIELDS=key,arguments,reason
PLANNER_OPERATION_AUTHORITY=NO
TOOL_DEFINITION_OPERATION_AUTHORITY=YES
STRUCTURED_INPUT_VALIDATION_READY=YES
INVALID_INPUT_BLOCKS_BEFORE_EXECUTION=YES
SAFE_INPUT_SUMMARY_READY=YES
TOOL_DEFINITION_RESULT_POLICY_READY=YES
RESULT_POLICY_SINGLE_AUTHORITY=ToolDefinition.outputSchema
MISSING_RESULT_POLICY_DEFAULT_DENY=YES
INVALID_RESULT_POLICY_DEFAULT_DENY=YES
MOCK_TOOL_POLICY_DATA_READY=YES
MOCK_TOOL_POLICY_KEYS=mock.orders.status.lookup,mock.orders.status.update,mock.orders.cancel,mock.work-orders.progress.lookup,mock.inventory.availability.lookup,mock.business-partner.history.lookup
PRISMA_SCHEMA_CHANGE_REQUIRED=NO
PRISMA_SEED_EXECUTION=PASS
PRISMA_SEED_IDEMPOTENCY=PASS
ADAPTER_RESULT_PROJECTOR_IMPLEMENTED=NO
PHASE4_IMPLEMENTATION_STARTED=NO
T031_STARTED=NO
DIRECT_MOCK_RUNTIME_PATH_STILL_ACTIVE=YES
ASSISTANT_RUNTIME_REGISTRY_CUTOVER_STARTED=NO
```

## Phase 4 — Result Projection and Evidence Boundary

**Goal**: Establish a server-owned, default-deny projected result as the only ToolCall output, evidence, or grounded-answer input.  
**Dependencies**: T030.  
**Independent test**: Unexpected, sensitive, malformed, or oversized adapter data cannot cross the projector boundary.

- [x] T031 [RED] [US6] Add failing projector shape/policy tests in proposed `test/unit/adapter-result-projector.service.spec.ts`.
  - Files: `test/unit/adapter-result-projector.service.spec.ts` (new).
  - Depends on: T030.
  - Validation: Cover valid/invalid raw shape, allowed/denied/nested fields, missing policy, invalid policy, and default-deny empty output.
  - Guard: Only resolved `ToolDefinition.outputSchema` may authorize release; adapter metadata and Browser state cannot add fields.

- [x] T032 [GREEN] [US6] Implement output validation and default-deny projection in proposed `src/connectors/adapter-result-projector.service.ts` with policy types in `src/tools/tool-registry.types.ts`.
  - Files: The proposed projector and existing tool-registry types.
  - Depends on: T031.
  - Validation: Make T031 pass and run `npm run typecheck`.
  - Guard: Keep raw output execution-local and return no released field when policy is absent, invalid, or incomplete.

- [x] T033 [RED] [US6] Extend projector tests for masking and limits in `test/unit/adapter-result-projector.service.spec.ts` and `test/unit/permission-masking.spec.ts`.
  - Files: The two listed unit suites.
  - Depends on: T032.
  - Validation: Cover projection-before-masking order, depth, item count, string length, total projected size, and projection/masking/minimization failures.
  - Guard: Failure must release no partial raw or unapproved field and disclose no internal schema detail.

- [x] T034 [GREEN] [US6] Integrate masking/minimization into the projector through `src/connectors/adapter-result-projector.service.ts`, `src/permissions/llm-input-sanitizer.service.ts`, and `src/permissions/masking.util.ts`.
  - Files: The three listed files.
  - Depends on: T033.
  - Validation: Make T033 pass; verify the output is bounded `SafeProjectedAdapterResult`.
  - Guard: `visibleColumns` is presentation-only and may narrow but never expand the ToolDefinition release policy.

- [x] T035 [RED] [US6] Add failing EvidenceRef and grounded-input boundary tests in `test/unit/evidence-ref.service.spec.ts` and proposed `test/unit/grounded-answer-input.spec.ts`.
  - Files: The existing EvidenceRef suite and proposed grounded-input suite.
  - Depends on: T034.
  - Validation: Accept canonical tool key, EvidenceRef identity/provenance, and projected facts only; reject raw data, transient context, credentials, endpoints, adapter config, Browser records, and unvalidated arguments.
  - Guard: Do not add a Customer LLM answer, RAG redesign, or Browser-selected release path.

- [x] T036 [GREEN] [US6] Implement the projected evidence boundary in `src/evidence/evidence-ref.service.ts`, proposed `src/assistant/runtime/grounded-answer-input.types.ts`, `src/assistant/message/assistant-message.service.ts`, and `src/assistant/page-context/page-context.mapper.ts`.
  - Files: The four listed files.
  - Depends on: T035.
  - Validation: Make T035 pass and rerun `test/integration/authorized-evidence-answer.spec.ts` and `test/integration/field-masking-before-llm.spec.ts`.
  - Guard: EvidenceRef accepts `SafeProjectedAdapterResult`, not raw records plus Browser `visibleColumns`.

### Phase 3 Mock output-contract correction discovered by Phase 4 strict projection — 2026-09-07

- The original Phase 3 parser and `ToolDefinition.outputSchema` policy authority remain valid. T036 strict projection exposed incomplete schema data only for `mock.orders.status.lookup`: its accepted raw result contains string `customerCode` and uses both string and bounded `string[]` status values.
- The production seed and in-memory fixture now declare `customerCode` while excluding it from `allowedFieldPaths` and `evidenceSafeProvenanceFields`; both policies explicitly deny `organizationId` and `customerCode`. The status contract is the closed `string | string[]` union with string items and 1–100 array items. No Mock fixture or adapter behavior changed.
- The focused closed-union RED rejected both valid string and string-array variants before implementation. The corrected projector suite passed 22/22 tests and continues to reject numeric arrays, objects, numbers, undeclared fields, and unsupported schema constructs.
- Final reconciliation validation passed: 5/5 unit suites with 32/32 tests, required T036 evidence/masking integrations with 2/2 suites and 3/3 tests, the fully enabled Customer policy integration with 1/1 suite and 8/8 tests, typecheck, modified-file ESLint, and `git diff --check`. The initial Customer-policy run was blocked only by sandbox `listen EPERM`; the identical permitted rerun passed.
- The confirmed healthy local development `assistant_dev` database was seeded twice. Both post-correction reads returned the same exact six Mock ToolDefinition keys and SHA-256 fingerprint `b81718228dab0be47688f712a67e24b7e82cf8093a8695d273dd16a33ed44eb7`. The historical Phase 3 fingerprint above remains unchanged as original execution evidence.

```text
PHASE3_MOCK_OUTPUT_CONTRACT_CORRECTED=YES
ACTUAL_CUSTOMER_CODE_TYPE=string
ACTUAL_STATUS_VARIANTS=string,string[]
ADDITIONAL_UNDECLARED_MOCK_FIELDS=NONE
CUSTOMER_CODE_DECLARED=YES
CUSTOMER_CODE_ALLOWED=NO
CUSTOMER_CODE_EXPLICITLY_DENIED=YES
CUSTOMER_CODE_EVIDENCE_PROVENANCE=NO
PROJECTOR_CLOSED_TYPE_UNION_SUPPORTED=YES
PROJECTOR_UNKNOWN_FIELD_STRICTNESS_PRESERVED=YES
RESULT_POLICY_SINGLE_AUTHORITY=ToolDefinition.outputSchema
ALL_SIX_MOCK_POLICIES_VALID=YES
PHASE3_CORRECTED_POLICY_FINGERPRINT=b81718228dab0be47688f712a67e24b7e82cf8093a8695d273dd16a33ed44eb7
PRISMA_SCHEMA_MODIFIED=NO
PRISMA_MIGRATION_CREATED=NO
PRISMA_SEED_EXECUTION=PASS
PRISMA_SEED_IDEMPOTENCY=PASS
T036_REQUIRED_INTEGRATIONS=PASS
T037_STARTED=NO
```

- [x] T037 [RED] [US6] Add failing safe-summary and raw-result sink tests in `test/unit/assistant-readonly-runtime.service.spec.ts`, `test/unit/tool-call.service.spec.ts`, and proposed `test/integration/feature008-raw-result-boundary.spec.ts`.
  - Files: The existing runtime suite and two proposed suites.
  - Depends on: T036.
  - Validation: Assert safe input precedes start; safe output derives only from `SafeProjectedAdapterResult`; raw results are absent from ToolCall, evidence, audit/log, telemetry, model, SSE, and responses.
  - Guard: Redaction after ToolCall persistence is insufficient; raw adapter output must never enter ToolCall.

- [x] T038 [GREEN] [US6] Implement separate safe input/output summary paths in `src/assistant/runtime/tool-call.service.ts`, `src/assistant/runtime/assistant-readonly-runtime.service.ts`, and `src/assistant/message/assistant-message.service.ts`.
  - Files: The three listed files.
  - Depends on: T037.
  - Validation: Make T037 pass and preserve existing blocked/started/completed/failed lifecycle assertions.
  - Guard: Safe output summary is created only after projection, masking, and minimization; any later failure transitions the started ToolCall to failed.

### 2026-09-07 T037–T038 execution evidence

- T037 genuine RED was observed before the completion contract changed: the two-unit-suite command failed at TypeScript compilation because `CompleteToolCallInput` did not accept `projectedResult` and still accepted `sanitizedResult`; the initial raw-result-boundary run exposed projected business facts in persisted `ToolCall.outputSummary` (1 failed, 1 passed).
- T038 narrow GREEN passed with 2/2 unit suites and 22/22 tests plus 1/1 raw-result-boundary integration suite and 2/2 tests. Executable starts persist only the safe input summary; successful completion accepts `SafeProjectedAdapterResult` and derives a metadata-only output summary. Connector throw, returned failure, projection throw/failure, and completion failure all use the failed ToolCall lifecycle with bounded codes.
- Phase 4 core regression validation passed with 6/6 unit suites and 53/53 tests, 4/4 evidence/masking/transient/raw-boundary integration suites and 7/7 tests, and the fully enabled Customer-policy suite with 1/1 suite and 8/8 tests. The sandboxed Customer-policy attempt hit only the known local-listener `EPERM`; the identical permitted rerun passed.
- `npm run typecheck`, ESLint over all changed Phase 4 TypeScript files, and `git diff --check` passed. `AssistantMessageService` required no T038 change because its accepted projected-result evidence and grounded-input path was reused unchanged.
- T039 validation then exposed a pre-existing regression assertion in `test/integration/authorized-tool-execution.spec.ts` that requires business fact values in `ToolCall.outputSummary`. That expectation conflicts with the approved metadata-only T038 contract and is outside the authorized T037 test files. The other two failure-path integrations passed, and the Assistant message/SSE contract passed with 1/1 suite and 6/6 tests. T039 remains incomplete pending human scope reconciliation; T040 was not started.

```text
T037_RED_OBSERVED=YES
T037_STATUS=PASS
T038_STATUS=PASS
COMPLETE_TOOLCALL_ACCEPTS_ONLY_PROJECTED_RESULT=YES
METADATA_ONLY_OUTPUT_SUMMARY=YES
PROJECTED_FACT_VALUES_IN_TOOLCALL=NO
RAW_RESULT_IN_TOOLCALL=NO
CONNECTOR_THROW_POST_START_FAILED=YES
PROJECTION_THROW_POST_START_FAILED=YES
PROJECTION_FAILURE_POST_START_FAILED=YES
COMPLETION_FAILURE_POST_START_FAILED=YES
RAW_RESULT_BOUNDARY_INTEGRATION=PASS
TYPECHECK=PASS
MODIFIED_FILE_LINT=PASS
T039_STATUS=FAIL
T039_BLOCKER=AUTHORIZED_TOOL_EXECUTION_TEST_REQUIRES_PROHIBITED_BUSINESS_VALUES_IN_TOOLCALL_OUTPUT_SUMMARY
T040_STARTED=NO
```

### Phase 4 T039 authorized-tool-execution stale assertion reconciliation — 2026-09-07

- Human review authorized one test-only correction in `test/integration/authorized-tool-execution.spec.ts`; production implementation, test fixtures, seed data, Prisma, and public contracts were unchanged.
- The old integration assertion required `availableQuantity: 36` and `incomingQuantity: 120` inside `ToolCall.outputSummary`. The approved T038 contract instead persists only canonical tool/schema identity, projected field names/count, and evidence-provenance field names.
- The reconciled assertion verifies the exact metadata-only inventory summary and explicitly excludes quantities, `SKU-DEMO-RED`, and `WH-DEMO-TPE`. Authorized business execution remains verified through EvidenceRef facts/provenance and the unchanged final deterministic answer/SSE path.
- The reconciled integration passed alone with 1/1 suite and 1/1 test. The complete checkpoint passed with 6/6 unit suites and 53/53 tests, 7/7 integration suites and 10/10 tests, the fully enabled Customer-policy suite with 1/1 suite and 8/8 tests, and the Assistant messages/SSE contract with 1/1 suite and 6/6 tests. The sandboxed Customer-policy attempt hit only local-listener `EPERM`; the identical permitted rerun passed.
- `npm run typecheck`, ESLint over all changed Phase 4 TypeScript files, and `git diff --check` passed. Final inspection confirmed direct `MockConnectorAdapter` injection remains active, no `DataAdapterRegistry` runtime cutover exists, and T040 remains unstarted.

```text
AUTHORIZED_TOOL_EXECUTION_STALE_ASSERTION_RECONCILED=YES
PUBLIC_CONTRACT_CHANGED=NO
PUBLIC_ASSISTANT_CONTRACT_CHANGED=NO
PRODUCTION_CODE_MODIFIED_BY_RECONCILIATION=NO
TEST_FIXTURE_MODIFIED_BY_RECONCILIATION=NO
TOOLCALL_OUTPUT_SUMMARY_MODE=METADATA_ONLY
PROJECTED_FACT_VALUES_IN_TOOLCALL=NO
BUSINESS_RESULT_VERIFIED_AT=EvidenceRef_and_final_deterministic_answer
SERVER_OWNED_PROJECTION_READY=YES
RAW_RESULT_TRANSIENT_ONLY=YES
EVIDENCE_BOUNDARY_READY=YES
RESULT_POLICY_SINGLE_AUTHORITY=ToolDefinition.outputSchema
SAFE_TOOL_INPUT_SUMMARY_READY=YES
SAFE_TOOL_OUTPUT_SUMMARY_READY=YES
RAW_RESULT_IN_TOOLCALL=NO
RAW_RESULT_IN_EVIDENCE=NO
RAW_RESULT_IN_AUDIT=NO
RAW_RESULT_IN_LOGS=NO
RAW_RESULT_IN_TELEMETRY=NO
RAW_RESULT_IN_MODEL_INPUT=NO
RAW_RESULT_IN_SSE=NO
RAW_RESULT_IN_PUBLIC_RESPONSE=NO
POST_START_FAILURE_TOOLCALL_FAILED=YES
DIRECT_MOCK_RUNTIME_PATH_STILL_ACTIVE=YES
ASSISTANT_RUNTIME_REGISTRY_CUTOVER_STARTED=NO
T039_STATUS=PASS
T040_STARTED=NO
```

- [x] T039 [VERIFY] [US6] Record the Phase 4 checkpoint in `specs/008-generic-host-integration-data-adapter-foundation/tasks.md`.
  - Files: This task file for evidence; Phase 4 files are validation inputs only.
  - Depends on: T038.
  - Validation: Run all Phase 4 suites, relevant masking/evidence integrations, and `npm run typecheck`.
  - Guard: Report `SERVER_OWNED_PROJECTION_READY=YES`, `RAW_RESULT_TRANSIENT_ONLY=YES`, and `EVIDENCE_BOUNDARY_READY=YES` only when all negative surfaces pass.

## Phase 5 — Mock Migration and Atomic Runtime Cutover

**Goal**: Move deterministic mock behavior onto the generic registry/projector path and remove direct mock injection only after equivalence passes.  
**Dependencies**: T014, T021, T030, and T039.  
**Independent test**: Existing mock operations produce compatible public behavior only through exact trusted registration and the standard projection path.

- [x] T040 [RED] [US7] Extend mock DataAdapter contract tests in `test/unit/mock-connector-adapter.spec.ts` and `test/unit/data-adapter-contract.spec.ts`.
  - Files: The two listed unit suites.
  - Depends on: T014, T021, T030, T039.
  - Validation: Cover canonical ToolDefinition operation, validated arguments, metadata/capability compatibility, deterministic results, exact registration, no wildcard, and no fallback.
  - Guard: The mock adapter cannot own result release or receive Browser-selected connector/operation authority.

- [x] T041 [GREEN] [US7] Adapt mock implementation and registration in `src/connectors/mock/mock-connector.adapter.ts`, `src/connectors/mock/mock-connector.module.ts`, and `src/connectors/connectors.module.ts`.
  - Files: The three listed files.
  - Depends on: T040.
  - Validation: Make T040 pass and rerun existing mock fixture/adapter tests.
  - Guard: Preserve deterministic lookups; add no global registration, wildcard, special selection branch, or fallback behavior.

- [x] T042 [RED] [US7] Extend runtime ordering and lifecycle tests in `test/unit/assistant-readonly-runtime.service.spec.ts` and `test/unit/tool-permission-precheck.service.spec.ts`.
  - Files: The two listed unit suites.
  - Depends on: T041.
  - Validation: Assert permission denial touches neither registry eligibility nor adapter; allowed/valid input starts ToolCall before registry/readiness/execution/projection; every later failure fails the started ToolCall.
  - Guard: Do not fetch business data before authorization or introduce a new lifecycle/public decision.

- [x] T043 [GREEN] [US7] Cut the readonly runtime over to registry/projector orchestration in `src/assistant/runtime/assistant-readonly-runtime.service.ts` while retaining obsolete direct mock wiring until equivalence is proven.
  - Files: The listed runtime service only, plus required existing runtime types already approved.
  - Depends on: T042.
  - Validation: Make T042 pass and run `npm run typecheck`.
  - Guard: No `if customer`, `if hostApp`, mock connector-key branch, fallback adapter, or transient-reference registry input.

- [x] T044 [RED] [US7] Add end-to-end runtime failure/equivalence cases in proposed `test/integration/feature008-runtime-cutover.spec.ts`.
  - Files: `test/integration/feature008-runtime-cutover.spec.ts` (new).
  - Depends on: T043.
  - Validation: Cover missing/ambiguous registration, incompatibility, unhealthy readiness, timeout, throw, malformed result, projection or masking/minimization failure, no evidence, success, no fallback, and public safe mappings.
  - Guard: Use deterministic doubles and mock fixtures only; no real Customer endpoint, credential, network, or data.

- [x] T045 [GREEN] [US7] Complete runtime composition in `src/assistant/assistant.module.ts`, `src/connectors/connectors.module.ts`, `src/connectors/mock/mock-connector.module.ts`, and `test/support/us1-test-app.helper.ts`.
  - Files: The four listed files.
  - Depends on: T044.
  - Validation: Make T044 pass; run module/provider tests and relevant authorized/denied/failure integrations.
  - Guard: Keep one Assistant runtime and one connector domain; no Customer/host/source-specific core branching or second Assistant API.

- [x] T046 [VERIFY] [US7] Prove generic-path equivalence through `test/integration/authorized-tool-execution.spec.ts`, `test/integration/authorized-evidence-answer.spec.ts`, `test/integration/tool-execution-failed-sse.spec.ts`, `test/integration/tool-failure-safe-response.spec.ts`, and `test/contract/assistant-messages-sse.contract.spec.ts`.
  - Files: The five listed suites; no source edits in this task.
  - Depends on: T045.
  - Validation: Verify deterministic mock output, ToolCall lifecycle, NoAnswerGate, AnswerDecision, EvidenceRef, SSE, unknown/ambiguous failure, and no mock fallback.
  - Guard: T047 is blocked unless every equivalence and public-contract assertion passes unchanged.

- [x] T047 [REFACTOR] [US7] Remove obsolete direct MockConnectorAdapter runtime injection from `src/assistant/runtime/assistant-readonly-runtime.service.ts`, `src/assistant/assistant.module.ts`, and `src/connectors/mock/mock-connector.module.ts`.
  - Files: The three listed production files.
  - Depends on: T046.
  - Validation: Rerun T046 suites, provider-resolution tests, `npm run typecheck`, and `npm run build`.
  - Guard: Remove only obsolete direct wiring; do not add a temporary fallback, feature flag, alternate path, or behavior change.

- [x] T048 [VERIFY] [US7] Record the Phase 5 checkpoint in `specs/008-generic-host-integration-data-adapter-foundation/tasks.md`.
  - Files: This task file for evidence; Phase 5 files are validation inputs only.
  - Depends on: T047.
  - Validation: Run all Phase 5 unit/integration/contract suites and inspect constructor/module wiring for direct mock injection.
  - Guard: Report `MOCK_GENERIC_REGISTRY_PATH=PASS`, `DIRECT_MOCK_RUNTIME_INJECTION_REMOVED=YES`, `TOOLCALL_LIFECYCLE_REGRESSION=PASS`, and `PUBLIC_MOCK_BEHAVIOR_COMPATIBLE=YES` only after equivalence remains green.

### 2026-09-08 Phase 5 T040–T048 execution evidence

- T040 genuine RED was observed with 2/2 suites failing TypeScript compilation because `MockConnectorAdapter` lacked the required DataAdapter metadata/compatibility contract and exact registration exports. T041 GREEN passed with 2/2 suites and 8/8 tests; the unchanged mock fixture suite subsequently passed with 1/1 suite and 3/3 tests.
- T042 genuine RED was observed with the runtime suite failing compilation because `AssistantReadonlyRuntimeService` still accepted five constructor dependencies and had no `DataAdapterRegistry` seam; the independent permission-precheck suite passed 3/3. T043 GREEN passed with 2/2 suites and 24/24 tests plus typecheck. The direct Mock provider remained temporarily injectable but runtime execution used only the selected adapter.
- T044 genuine RED was observed after test authoring because `Us1TestAppOptions` had no `dataAdapterRegistrations` override seam. T045 GREEN completed single-module composition and passed the final cutover integration with 1/1 suite and 13/13 tests. It covers exact success, missing/ambiguous/incompatible/unhealthy selection, permission and invalid-input short circuits, returned/thrown/malformed failures, result-policy/projection/completion failures, safe evidence/answer success, and transient-reference isolation.
- T046 passed unchanged with 5/5 equivalence/public-contract suites and 11/11 tests before direct injection removal. After T047 removed the readonly runtime constructor dependency and AssistantModule direct import, the permitted local-listener regression rerun passed with 7/7 suites and 35/35 tests; typecheck and build passed.
- T048 final validation passed with 7/7 required unit suites and 57/57 tests, 8/8 required integration suites and 23/23 tests, and the Assistant messages/SSE contract with 1/1 suite and 6/6 tests. Typecheck, build, ESLint over every changed Phase 5 TypeScript file, and `git diff --check` passed. The sandboxed post-T047 listener run encountered only `listen EPERM`; the identical permitted rerun passed.
- A supplemental regression for the compile-required approval caller initially exposed Jest spy leakage between separately created test applications because the production mock is now an exported singleton. The approved test composition helper now supplies one isolated mock instance per test app and a frozen copy of the same two exact bindings. Both approval/idempotency regressions then passed with 2/2 suites and 7/7 tests; production registration and approval behavior were unchanged.
- The mock DataAdapter is shared by two frozen exact registrations (`customer-a` and `customer-b`, both `integration-erp / erp / mock`). Registration records contain only the six approved fields. No wildcard, default, fallback, Browser authority, duplicate production provider, or Assistant customer/host/mock branch was introduced. The side-effect approval caller received only a compile-required trusted input-shape update; approval behavior and public contracts were not redesigned.

```text
T040_RED_OBSERVED=YES
T040_STATUS=PASS
T041_STATUS=PASS
T042_RED_OBSERVED=YES
T042_STATUS=PASS
T043_STATUS=PASS
T044_RED_OBSERVED=YES
T044_STATUS=PASS
T045_STATUS=PASS
T046_STATUS=PASS
T047_STATUS=PASS
T048_STATUS=PASS
MOCK_GENERIC_REGISTRY_PATH=PASS
DIRECT_MOCK_RUNTIME_PROVIDER_PRESENT_AFTER_T043=YES
DIRECT_MOCK_RUNTIME_EXECUTION_USED_AFTER_T043=NO
DIRECT_MOCK_RUNTIME_INJECTION_REMOVED=YES
PERMISSION_BEFORE_REGISTRY=YES
STRUCTURED_INPUT_BEFORE_REGISTRY=YES
TOOLCALL_START_BEFORE_REGISTRY=YES
REGISTRY_BEFORE_ADAPTER_EXECUTION=YES
READINESS_BEFORE_EXECUTION=YES
PROJECTOR_AFTER_EXECUTION=YES
MOCK_FALLBACK_PRESENT=NO
CUSTOMER_BRANCH_PRESENT=NO
HOSTAPP_BRANCH_PRESENT=NO
CONNECTOR_CONTEXT_REF_USED_FOR_SELECTION=NO
CONNECTOR_CONTEXT_REF_REACHES_SELECTED_ADAPTER_ONLY=YES
TOOLCALL_LIFECYCLE_REGRESSION=PASS
PUBLIC_MOCK_BEHAVIOR_COMPATIBLE=YES
TIMEOUT_SEAM_PRESENT=NO
SECOND_TIMEOUT_SUBSYSTEM_ADDED=NO
PRISMA_SCHEMA_MODIFIED=NO
PRISMA_MIGRATION_CREATED=NO
SEED_POLICY_DATA_MODIFIED=NO
TYPECHECK=PASS
BUILD=PASS
MODIFIED_FILE_LINT=PASS
DIFF_CHECK=PASS
T049_STARTED=NO
PHASE6_IMPLEMENTATION_STARTED=NO
PHASE5_STATUS=PASS
```

### Phase 5 trusted ToolDefinition timeout correction discovered by human review — 2026-09-08

- Human review confirmed that the core registry cutover remained valid but T044 originally omitted its required adapter-execution timeout case. The original Phase 5 evidence above is preserved verbatim; this corrected checkpoint supersedes only its timeout conclusion and final T048 result.
- A genuine timeout RED was observed with 1/1 cutover suite failing its new case (13 passed, 1 failed): trusted `timeoutMs=5` was dropped by `RegisteredToolDefinition`, so the runtime waited approximately 52 ms for a delayed adapter and completed the ToolCall successfully.
- `ToolDefinition.timeoutMs` is now carried unchanged through `ToolRegistryService` as required `RegisteredToolDefinition.timeoutMs` and is the single timeout authority. The readonly runtime starts the timer only after ToolCall start and registry selection/readiness, directly around selected-adapter execution. Invalid non-positive/non-safe values fail closed after ToolCall start. No environment, Browser, Customer, registration, adapter-owned, or fallback timeout source was added.
- The corrected timeout case passed with 1/1 suite and 14/14 tests. It proves the started ToolCall fails with bounded `TOOL_EXECUTION_FAILED`, creates no EvidenceRef or `GroundedAnswerInput`, retains the existing public `no_answer` / `tool_failure` mapping, and ignores a delayed private success after logical timeout without any later state or response mutation.
- Corrected full validation passed with 8/8 unit suites and 90/90 tests (the seven required Phase 5 suites plus ToolRegistry), 8/8 required integration suites and 24/24 tests, approval/idempotency regressions with 2/2 suites and 7/7 tests, projector/side-effect-contract compile fixtures with 2/2 suites and 25/25 tests, and the Assistant messages/SSE contract with 1/1 suite and 6/6 tests. Typecheck, build, changed-file ESLint, and `git diff --check` passed.
- The readonly Assistant runtime remains registry-only. Existing direct `MockConnectorAdapter` use in `SideEffectExecutionGuardService` remains present and unchanged as the accepted out-of-scope approval/write path; Feature 008 did not migrate it.

```text
CORRECTION=FEATURE008_PHASE5_TRUSTED_TIMEOUT
T044_TIMEOUT_RED_OBSERVED=YES
T044_TIMEOUT_STATUS=PASS
TIMEOUT_SINGLE_AUTHORITY=ToolDefinition.timeoutMs
TRUSTED_TOOL_TIMEOUT_READY=YES
TIMEOUT_SEAM_PRESENT=YES
SECOND_TIMEOUT_CONFIG_AUTHORITY_PRESENT=NO
TIMEOUT_AFTER_TOOLCALL_START_FAILED=YES
TIMEOUT_CREATES_EVIDENCE=NO
TIMEOUT_CREATES_GROUNDED_INPUT=NO
TIMEOUT_PUBLIC_MAPPING_SAFE=YES
LATE_ADAPTER_COMPLETION_CHANGES_RESULT=NO
DIRECT_MOCK_READONLY_RUNTIME_INJECTION_REMOVED=YES
SIDE_EFFECT_APPROVAL_DIRECT_MOCK_PATH_PRESENT=YES
SIDE_EFFECT_APPROVAL_PATH_MIGRATED_BY_FEATURE008=NO
SIDE_EFFECT_APPROVAL_SCOPE_RECONCILIATION=PASS
MOCK_GENERIC_REGISTRY_PATH=PASS
TOOLCALL_LIFECYCLE_REGRESSION=PASS
PUBLIC_MOCK_BEHAVIOR_COMPATIBLE=YES
TYPECHECK=PASS
BUILD=PASS
MODIFIED_FILE_LINT=PASS
DIFF_CHECK=PASS
T048_CORRECTED_STATUS=PASS
T049_STARTED=NO
PHASE5_CORRECTED_STATUS=PASS
```

## Phase 6 — Grounded Answer, Security, and Public Closeout

**Goal**: Complete the generic grounded-answer seam and prove Feature 008 security and compatibility end to end.  
**Dependencies**: T048.  
**Independent test**: Only projected evidence reaches deterministic answering; all prohibited inputs/surfaces and public-contract regressions fail the release gate.

- [ ] T049 [RED] [US7] Add failing final answer-generation wiring tests in `test/unit/answer-decision.service.spec.ts`, `test/unit/grounded-answer-input.spec.ts`, and `test/integration/authorized-evidence-answer.spec.ts`.
  - Files: The existing answer-decision and evidence suites plus the proposed grounded-input suite established in Phase 4.
  - Depends on: T048.
  - Validation: Fail until existing deterministic answer generation/`AnswerDecisionService` consumes the generic `GroundedAnswerInput`; prove canonical ToolDefinition key, projected facts, and EvidenceRef provenance reach answering only through that input, while raw adapter results, connectorContextRef, Browser raw records, and legacy raw connector-result shapes cannot bypass it.
  - Guard: This RED covers final answer wiring, not Phase 4's already-established structural boundary; preserve expected deterministic mock semantics and do not introduce a real Customer LLM answer, RAG/prompt redesign, Customer adapter, or new AnswerDecision.

- [ ] T050 [GREEN] [US7] Complete generic grounded-answer wiring in `src/assistant/runtime/grounded-answer-input.types.ts`, `src/assistant/message/assistant-message.service.ts`, and `src/assistant/answer/answer-decision.service.ts`.
  - Files: The three listed files.
  - Depends on: T049.
  - Validation: Make T049 pass; rerun answer-decision, evidence, masking-before-LLM, and deterministic mock tests.
  - Guard: Preserve existing AnswerDecision values and no-answer mapping; no raw adapter data or connectorContextRef may reach answer generation.

- [ ] T051 [VERIFY] [US7] Run focused Feature 008 security verification across `test/integration/feature008-transient-boundary.spec.ts`, `test/integration/feature008-raw-result-boundary.spec.ts`, `test/integration/feature008-runtime-cutover.spec.ts`, `test/integration/secret-redaction.spec.ts`, and `test/integration/tool-permission-denied.spec.ts`.
  - Files: The five listed integration suites; no source edits in this task.
  - Depends on: T050.
  - Validation: Verify permission order, cross-Customer isolation, Browser non-authority, native-credential exclusion, transient-reference isolation, raw Browser/result exclusion, canonical ToolDefinition authority, and outputSchema-only release.
  - Guard: Any prohibited-surface observation is a release blocker; do not downgrade it to a warning.

- [ ] T052 [VERIFY] [US7] Run public compatibility guards in `test/contract/assistant-sessions.contract.spec.ts`, `test/contract/assistant-messages-sse.contract.spec.ts`, `test/contract/feedback.contract.spec.ts`, `test/contract/approval-requests.contract.spec.ts`, and `test/contract/gateway-internal-identity.contract.spec.ts`.
  - Files: The five listed contract suites; no expected updates.
  - Depends on: T051.
  - Validation: Run the focused files and then `npm run test:contract -- --runInBand`.
  - Guard: No new/breaking Assistant API mode, endpoint, SSE shape, AnswerDecision, SDK API, or Gateway identity authority is permitted.

- [ ] T053 [VERIFY] [US7] Execute full repository validation using `package.json` scripts.
  - Files: `package.json` is command reference only; do not modify it.
  - Depends on: T052.
  - Validation: Run `npm run test:unit -- --runInBand`, `npm run test:integration -- --runInBand`, `npm run test:contract -- --runInBand`, `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run test`.
  - Guard: Do not invent scripts, rewrite snapshots merely to pass, or run Prisma migration commands.

- [ ] T054 [VERIFY] [US7] Inspect final scope and historical-feature isolation through `prisma/schema.prisma`, `prisma/migrations/`, `src/assistant/`, `src/connectors/`, `.specify/feature.json`, and optional `specs/002-host-integration-gateway-and-data-adapter-contract/`.
  - Files: The listed areas are read-only inspection targets; the historical directory may be absent, and `spec.md`, `design.md`, `plan.md`, `.specify/feature.json`, and historical Feature 002 must remain unchanged by Feature 008.
  - Depends on: T053.
  - Validation: Use `git diff --check`, `git diff --name-only`, `git status`, active-feature metadata inspection, targeted `rg` checks for direct mock injection/wildcards/fallbacks/prohibited Customer terms, and schema/migration diff inspection; verify Feature 008 did not recreate, restore, modify, activate, or newly point metadata back to historical Feature 002. Treat the currently absent historical tree and any unchanged pre-existing metadata value as baseline state, not as a reason to create or modify it.
  - Guard: The previously incorrect historical path reference must remain absent; do not require the historical tree to exist or inspect historical commit `e5e7a7c` except for optional read-only comparison. No Prisma migration, Feature 002 activation, Feature 009 implementation, real Customer endpoint/data/credential, write operation, generic SQL/HTTP proxy, or production deployment task may remain.

- [ ] T055 [VERIFY] [US7] Record the final Feature 008 acceptance report in `specs/008-generic-host-integration-data-adapter-foundation/tasks.md`.
  - Files: This task file for acceptance evidence only.
  - Depends on: T054.
  - Validation: Confirm every task/checkpoint and required full command is green, or report the exact unresolved blocker without claiming completion.
  - Guard: Implement no new behavior; completion requires the full machine-readable report defined below and `FEATURE008_SECURITY_CLOSEOUT=PASS`, `FEATURE008_PUBLIC_COMPATIBILITY=PASS`, and `FEATURE008_IMPLEMENTATION_READY_FOR_ACCEPTANCE=YES`.

## Dependencies and Story Traceability

```text
T001–T005  Phase 0 baseline
  ↓
T006–T014  Phase 1 trusted/transient context
  ↓
T015–T021  Phase 2 adapter contract/registry
  ↓
T022–T030  Phase 3 canonical operation/policy data
  ↓
T031–T039  Phase 4 projection/evidence boundary
  ↓
T040–T048  Phase 5 atomic mock cutover
  ↓
T049–T055  Phase 6 security/public closeout
```

Phase 5 is blocked until T014, T021, T030, and T039 prove:

```text
HOST_CONTEXT_READY=YES
TRUSTED_REGISTRY_READY=YES
TOOL_DEFINITION_RESULT_POLICY_READY=YES
MOCK_TOOL_POLICY_DATA_READY=YES
SERVER_OWNED_PROJECTION_READY=YES
```

| User story | Primary task coverage | Independent completion evidence |
| --- | --- | --- |
| US1 Trusted host context | T006–T007, T014, T051 | Verified identity is the only authority; mismatches fail closed |
| US2 Transient connector context | T010–T014, T051 | Reference reaches runtime/selected adapter only and no prohibited surface |
| US3 Safe normalized PageContext | T008–T009, T014, T051 | Only bounded non-authoritative hints survive |
| US4 Registered generic adapter | T015–T021, T040–T048 | Exact unique registration, capability, readiness, and no fallback |
| US5 Structured named operations | T022–T030, T042–T048 | Canonical ToolDefinition identity and validated arguments only |
| US6 Safe projected evidence | T031–T039, T044–T051 | OutputSchema-only projection and raw-result isolation |
| US7 One generic Assistant path | T040–T055 | Mock uses the generic path with public compatibility |

## Parallel Opportunities

- T002, T003, and T004 may run concurrently after T001 because they are read-only checks over disjoint suites.
- No later `[RED]`, `[GREEN]`, `[DATA]`, `[REFACTOR]`, or checkpoint task is marked parallel: contract types, shared fixtures, runtime composition, and phase gates create direct dependencies.
- Phase 5 never overlaps unfinished Phases 1–4, and T047 never starts before T046 equivalence passes.

## Final Acceptance Report

T055 may be checked only when it can record:

```text
HOST_CONTEXT_IMPLEMENTED=YES
TRANSIENT_CONTEXT_ISOLATION_PASS=YES
PAGE_CONTEXT_NORMALIZATION_PASS=YES

DATA_ADAPTER_CONTRACT_IMPLEMENTED=YES
TRUSTED_REGISTRATION_REGISTRY_PASS=YES
MULTI_CUSTOMER_ISOLATION_PASS=YES

STRUCTURED_OPERATION_ARGS_PASS=YES
CANONICAL_OPERATION_FROM_TOOL_DEFINITION_PASS=YES

TOOL_DEFINITION_RESULT_POLICY_PASS=YES
MOCK_TOOL_POLICY_PROVISIONED=YES

SERVER_OWNED_PROJECTION_PASS=YES
RAW_RESULT_NEGATIVE_SURFACE_PASS=YES

MOCK_GENERIC_REGISTRY_PATH_PASS=YES
DIRECT_MOCK_INJECTION_REMOVED=YES

TOOLCALL_LIFECYCLE_PASS=YES
GROUNDED_ANSWER_INPUT_BOUNDARY_PASS=YES

PUBLIC_API_CONTRACT_PASS=YES
SSE_CONTRACT_PASS=YES
ANSWER_DECISION_CONTRACT_PASS=YES

NO_NATIVE_CREDENTIAL_CENTRAL_PASS=YES
NO_CONNECTOR_CONTEXT_REF_PERSISTENCE_PASS=YES

PRISMA_SCHEMA_CHANGE_REQUIRED=NO

REAL_SHINMONE_DATA_USED=NO
FEATURE009_IMPLEMENTED=NO

FEATURE008_IMPLEMENTATION_STATUS=PASS
```

## Task-List Generation Summary

```text
TASKS_FILE=specs/008-generic-host-integration-data-adapter-foundation/tasks.md
TASKS_ONLY=YES

SPEC_MODIFIED=NO
DESIGN_MODIFIED=NO
PLAN_MODIFIED=NO
IMPLEMENTATION_STARTED=NO

TOTAL_TASKS=55

PHASE0_TASKS=5
PHASE1_TASKS=9
PHASE2_TASKS=7
PHASE3_TASKS=9
PHASE4_TASKS=9
PHASE5_TASKS=9
PHASE6_TASKS=7

TEST_FIRST_STRUCTURE=YES
EVERY_PHASE_HAS_CHECKPOINT=YES

REGISTRATION_OPERATION_AUTHORITY=NO

TOOL_POLICY_DATA_BEFORE_CUTOVER=YES
PROJECTOR_BEFORE_CUTOVER=YES
REGISTRY_BEFORE_CUTOVER=YES
HOST_CONTEXT_BEFORE_CUTOVER=YES

DIRECT_MOCK_REMOVAL_AFTER_EQUIVALENCE=YES

PRISMA_MIGRATION_TASK_PRESENT=NO
REAL_CUSTOMER_TASK_PRESENT=NO
FEATURE009_TASK_PRESENT=NO

OPEN_TASK_BLOCKERS=0
NEXT_ACTION=REVIEW_FINAL_FEATURE008_TASKS
```
