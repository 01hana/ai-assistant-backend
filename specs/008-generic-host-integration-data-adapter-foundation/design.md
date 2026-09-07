# Technical Design: Generic Host Integration and Data Adapter Foundation

**Feature Branch**: `008-generic-host-integration-data-adapter-foundation`  
**Created**: 2026-09-03  
**Source Spec**: [spec.md](./spec.md)  
**Status**: Draft

## 1. Design Summary

Feature 008 replaces the readonly runtime's direct mock-connector dependency with one generic, trusted adapter path. It adds a narrow host-integration boundary that consumes the existing verified identity, separates wire PageContext from normalized PageContext, extracts `connectorContextRef` before any durable branch, and makes adapter result release server-owned.

The design preserves the existing Assistant controller, session/message routes, SSE event shapes, AnswerDecision values, feedback, approval, Gateway identity, and SDK contract. It adds no Customer integration, transport, credential binding, public API, Prisma model, or migration.

The non-negotiable execution order is:

```text
verified Backend identity
  -> HostIntegrationContext + transient connector context extraction
  -> normalized PageContext
  -> plan/tool resolution
  -> successful permission pre-check
  -> adapter eligibility and selection
  -> adapter business-data access
  -> output validation and server-owned projection
  -> permission-aware masking and minimization
  -> EvidenceRef / GroundedAnswerInput
  -> existing AnswerDecision and SSE lifecycle
```

## 2. Current Runtime Baseline

### Current execution path

```text
POST /assistant/sessions/:id/messages
  -> src/assistant/assistant.controller.ts
  -> src/identity/identity.guard.ts and identity-context extractor
  -> src/assistant/dto/assistant.dto.ts / PageContextDto
  -> src/assistant/message/assistant-message.service.ts
     -> AssistantMessageRepository persists supplied PageContext
     -> AssistantPlanningService persists ExecutionPlan
     -> AssistantReadonlyRuntimeService
        -> ToolRegistryService resolves ToolDefinition/customer policy
        -> ToolPermissionPrecheckService
        -> denied/invalid: ToolCallService creates blocked lifecycle
        -> allowed/valid: ToolCallService starts execution lifecycle
        -> direct MockConnectorAdapter.execute(... entityId ...)
        -> LlmInputSanitizerService using visibleColumns
        -> ToolCallService completes safe output summary or records failed lifecycle
     -> EvidenceRefService
     -> AnswerDecisionService deterministic projection
     -> AssistantSseEventBuilder
```

The relevant current files are:

| Concern | Current files and behavior |
| --- | --- |
| Message ingress and identity | `src/assistant/assistant.controller.ts`; `src/identity/identity.guard.ts`; `src/identity/identity-context.types.ts` |
| Request DTO/validation | `src/assistant/dto/assistant.dto.ts`; `src/assistant/page-context/page-context.dto.ts`; global strict validation in `src/main.ts` |
| Page context persistence/audit helpers | `src/assistant/page-context/page-context.mapper.ts`; `src/assistant/message/assistant-message.repository.ts`; `src/assistant/context/assistant-context-state.service.ts` |
| Message orchestration | `src/assistant/message/assistant-message.service.ts` |
| Planning and persistence | `src/assistant/planning/assistant-planning.service.ts`; `src/assistant/planning/assistant-planning.types.ts`; `src/query-understanding/query-task-decomposer.ts` |
| Tool and permission resolution | `src/tools/tool-registry.service.ts`; `src/tools/customer-tool-policy.service.ts`; `src/permissions/tool-permission-precheck.service.ts` |
| Current connector coupling | `src/assistant/runtime/assistant-readonly-runtime.service.ts`; `src/connectors/mock/mock-connector.adapter.ts`; `src/connectors/connector-adapter.interface.ts` |
| Lifecycle/evidence/answer/SSE | `src/assistant/runtime/tool-call.service.ts`; `src/permissions/llm-input-sanitizer.service.ts`; `src/permissions/masking.util.ts`; `src/evidence/evidence-ref.service.ts`; `src/assistant/answer/answer-decision.service.ts`; `src/assistant/answer/no-answer-gate.service.ts`; `src/assistant/sse/assistant-sse-event.builder.ts` |

The current runtime correctly resolves Customer tool policy and runs the permission pre-check before `MockConnectorAdapter.execute`. Denied or invalid requests create an existing blocked ToolCall; allowed and valid requests start a ToolCall before invoking the mock adapter, then complete it with the sanitized output summary or fail it when connector execution fails. The runtime still injects the adapter directly, assumes `{ entityId }` input, and uses browser `visibleColumns` as the final result-field selector. `ToolDefinition.connectorKey` is persisted and loaded but is not used to select an adapter. Current candidate tools and answer projection are mock-specific.

## 3. Target Runtime Architecture

Feature 008 adds one path, not a parallel Assistant or connector runtime.

```text
AssistantController
  -> HostIntegrationRequestFactory
       verified RequestIdentityContext -> HostIntegrationContext
       wire PageContext -> { normalizedPageContext, transientConnectorContext }
  -> AssistantMessageService
       persists normalizedPageContext only
  -> AssistantPlanningService
       persists generic candidate operation JSON only
  -> AssistantReadonlyRuntimeService
       ToolRegistry/customer policy -> permission pre-check
       -> denied: existing blocked ToolCall / permission-safe lifecycle
       -> allowed + validated arguments: existing started ToolCall with safe input summary
       -> DataAdapterRegistry.select(... trusted context ...)
       -> readiness -> selected DataAdapter.execute(... transient in-memory context ...)
       -> AdapterResultProjector -> permission masking/minimization
       -> completed ToolCall with safe output summary, or failed ToolCall on any later failure
  -> EvidenceRefService from projected result only
  -> GroundedAnswerInput from projected evidence only
  -> existing AnswerDecisionService and AssistantSseEventBuilder
```

`HostIntegrationModule` is justified because trusted context construction, page-context normalization, and transient extraction are request-boundary concerns shared by session and message entry points. It imports identity-facing types but does not own identity verification. Adapter contracts, registry, projection, and mock registration remain in `src/connectors` because they extend the existing connector domain.

## 4. Authority and Trust Boundaries

| Value | Source | Permitted use | Prohibited use |
| --- | --- | --- | --- |
| Customer, integration, host app, organization, actor, roles, scopes, request ID | `RequestIdentityContext` after IdentityGuard verification | Context construction, policy, permission, registry eligibility, audit correlation | Browser override, PageContext authority, adapter self-assertion |
| Normalized PageContext | Customer Host through validated wire DTO | Non-authoritative routing/entity hints | Authorization, adapter/source selection, result field authority, evidence truth |
| `connectorContextRef` | Compatible wire transport | In-memory adapter execution context only | Identity, permission, selection, persistence, plans, ToolCall summary, evidence, prompt, SSE, response |
| ToolDefinition and CustomerToolPolicy | Trusted Backend persistence | Tool enablement, input schema, connector key, result policy, permission requirements | Browser mutation or adapter replacement |
| DataAdapterRegistration | Backend application/deployment composition | Exact Customer, integration, host-app, connector-key, and active deployment eligibility | Browser registration/selection, metadata-derived Customer authority, or implicit wildcard fallback |
| Raw adapter result | Adapter process memory | Validation, projection, masking, minimization | Durable/public/model surfaces |

Customer is always the outer boundary. A matching organization, actor, or host application never compensates for a mismatched Customer.

## 5. HostIntegrationContext

### Internal contracts

```ts
interface HostIntegrationContext {
  readonly customerId: string;
  readonly integrationId: string;
  readonly hostApp: string;
  readonly organizationId: string;
  readonly actorId: string;
  readonly roles: readonly string[];
  readonly permissionScopes: readonly string[];
  readonly requestId: string;
}

interface TransientConnectorContext {
  readonly connectorContextRef?: string;
}

interface HostIntegrationRequestContext {
  readonly host: HostIntegrationContext;
  readonly pageContext?: NormalizedPageContext;
  readonly transient: TransientConnectorContext;
}
```

`HostIntegrationContext` is constructed once at controller ingress after `getRequiredIdentityContext`. Its fields are copied only from `RequestIdentityContext`: `customer.customerId`, `customer.integrationId`, `hostApp.hostApp`, `organization.organizationId`, actor fields, and `requestId`. It contains no browser values, no source system, and no connector selection.

`HostIntegrationRequestContext` is an ingress-only carrier, not request-global state, a Nest request mutation, or a Prisma value. The controller splits it into separate semantic inputs: `HostIntegrationContext` and `NormalizedPageContext` pass to session/message/planning inputs; `TransientConnectorContext` passes only to the readonly runtime input. Query understanding, `AssistantPlanningService`, `QueryTaskDecomposer`, ExecutionPlan construction, ToolRegistry argument validation, EvidenceRef, and GroundedAnswerInput never receive it. The factory validates nonblank trusted fields and the existing session/customer scope before the runtime begins. Any mismatch between the trusted context, visible session, tool policy, or adapter registration yields the existing not-found or safe denial path without describing another scope.

## 6. `connectorContextRef` Transient Lifecycle

### Wire and extraction contract

`PageContextDto` becomes the wire type and gains optional `connectorContextRef`. Strict global DTO whitelisting therefore continues to reject unknown properties. The reference must be a bounded opaque identifier in the platform format `ccr_<base64url-id>`; it cannot contain whitespace, a credential prefix, JWT separators, serialized objects, or arbitrary nested data. Feature 008 validates only this safe syntax/presence and transient handling. String syntax does not prove identity, scope, expiry, revocation, binding, or credential safety; Feature 009's Customer-local binding/runtime owns those semantic checks before real business-data access.

At the start of both `AssistantController.createSession` and `AssistantController.postMessage`, `HostIntegrationRequestFactory.create(identityContext, body.pageContext)` performs this exact order:

1. Validate and extract the optional reference from wire PageContext.
2. Remove the reference from the value handed to the normalizer.
3. Normalize the remaining PageContext to a persistable/runtime-safe form.
4. Return the explicit `HostIntegrationRequestContext`.

Session creation discards the transient reference after normalization because no adapter can execute there. Message handling passes only `TransientConnectorContext` to `AssistantReadonlyRuntimeService`; the registry does not inspect or select on it and passes it only after trusted selection to the selected adapter's invocation context. An adapter-reported unusable reference fails through the existing safe failure path without fallback.

```text
wire PageContext { hints, connectorContextRef }
  -> extraction
     -> transientConnectorContextRef ----------------> selected adapter invocation only
     -> PageContext without ref -> normalizer -> normalized PageContext
                                             -> message/context/plan/audit-safe summaries

transientConnectorContextRef never branches to:
  AssistantMessage | AssistantContextState | ExecutionPlan | ToolCall inputSummary
  AuditEvent | EvidenceRef | log/telemetry | prompt/model | SSE | public response
```

No Prisma model receives this value. ToolCall summaries record only an approved operation name, schema version, safe argument summary, and safe result summary; they never record the reference. Feature 008 does not resolve, bind, authenticate, transport, or issue the reference. That is Feature 009's responsibility.

## 7. PageContext Normalization

### Types and behavior

`WirePageContext` is the DTO-facing type. `NormalizedPageContext` is a separate internal type used by Assistant message persistence, context state, planning context, runtime hints, and audit metadata.

The normalizer allows only:

- `module`, `route`, `screenId`, `entityType`, and `entityId` as bounded strings;
- `selectedRows` reduced to nonblank identifiers and Backend-normalizer-defined safe summary fields;
- `activeFilters` with Backend-allowlisted generic presentation keys and bounded shallow scalar values only;
- bounded `visibleColumns` as presentation metadata; and
- `userVisibleState` with Backend-allowlisted presentation keys and only bounded shallow scalars or specifically defined safe shapes.

`activeFilters`, `userVisibleState`, and selected-row summaries are never arbitrary `Record<string, unknown>` containers. The normalizer rejects authority-like keys (`customer`, `integration`, `organization`, `actor`, `role`, `scope`, `connector`, `adapter`, `sourceSystem`, `endpoint`), credentials, raw entity objects, arbitrary nested payloads, and Browser-declared "safe" business fields. Invalid or authority-like values do not become fallback hints. The normalizer produces safe omission or a request validation failure when the value attempts authority/selection; it never derives a trusted value from it.

`visibleColumns`, route, entity ID, selected rows, and all other normalized hints may help create validated operation arguments, but cannot authorize business-data access or enlarge the adapter output allowlist. Business truth comes only from a selected adapter's projected result.

Existing `toPageContextPersistence`, `toPageContextAuditMetadata`, and `getPageEntityRef` are retained but accept only `NormalizedPageContext`; `getVisibleColumns` is removed from data-release authority and remains presentation-only.

## 8. DataAdapter Contract

### Relationship decision

`DataAdapter` **extends `ConnectorAdapter`**. This is the smallest compatible choice: the current interface already owns key identity, execution, tool capability, and health. Feature 008 enriches that same domain rather than adding a second connector runtime or a composition wrapper.

`ConnectorExecuteInput` is generalized to carry a typed `HostIntegrationContext`, trusted named operation, validated arguments, and optional transient connector context. It replaces the runtime's ad-hoc organization/actor plus hard-coded `entityId` invocation while preserving those values through the host context. Existing MockConnectorAdapter implements the extended contract.

```ts
interface DataAdapter extends ConnectorAdapter {
  readonly metadata: {
    adapterKey: string;
    sourceSystem: string;
    supportedHostApps: readonly string[];
    supportedCapabilities: readonly string[];
  };
  isCompatible(input: DataAdapterCompatibilityInput): DataAdapterCompatibilityResult;
}

interface DataAdapterRegistration {
  readonly adapter: DataAdapter;
  readonly connectorKey: string;
  readonly customerId: string;
  readonly integrationId: string;
  readonly hostApp: string;
  readonly active: boolean;
}

interface DataAdapterCompatibilityInput {
  host: HostIntegrationContext;
  tool: RegisteredToolDefinition;
  operation: ValidatedNamedOperation;
}

interface ValidatedNamedOperation {
  canonicalToolKey: string;
  arguments: Record<string, unknown>;
  schemaVersion: string;
}

interface DataAdapterExecuteInput extends ConnectorExecuteInput {
  host: HostIntegrationContext;
  operation: ValidatedNamedOperation;
  transientConnectorContext?: TransientConnectorContext;
}
```

`canonicalToolKey` is derived only after the ToolRegistry resolves the trusted ToolDefinition stable key/name. There is no independently authoritative operation string. `DataAdapter` describes reusable implementation capability; `DataAdapterRegistration` describes one exact trusted deployment binding. The same adapter instance may appear in multiple registrations for distinct Customers or integrations without duplicating the adapter class. Adapter metadata, including `supportedHostApps`, remains capability information and never establishes Customer or integration deployment authority. The adapter returns a raw in-memory result plus a typed execution status. It does not decide what fields may become evidence or user/model content. It has no generic SQL, URL, HTTP-path, query-string, or free-form-command interface.

## 9. DataAdapterRegistry and Selection

`DataAdapterRegistry` is a `src/connectors` provider receiving `readonly DataAdapterRegistration[]` through the explicit `DATA_ADAPTER_REGISTRATIONS` injection token. The connectors composition root explicitly assembles and provides this trusted registration array from application/deployment configuration. Feature 008 provides no database registry, control-plane CRUD, Browser registration, dynamic plugin download, or Customer code execution. This design does not assume Angular-style `multi: true` provider behavior in NestJS.

### Selection algorithm

1. `ToolRegistryService.resolveToolForCustomer` resolves an active ToolDefinition and enabled CustomerToolPolicy using trusted Customer scope.
2. `ToolPermissionPrecheckService.checkResolvedCustomerTool` must succeed. A denial blocks ToolCall and ends before registry eligibility, connector invocation, or business-data access.
3. The runtime derives the canonical operation identity from `tool.key` and validates its structured arguments against `tool.inputSchema`; it blocks on failure.
4. The registry matches active `DataAdapterRegistration` entries by exact equality on `tool.connectorKey`, `host.customerId`, `host.integrationId`, and `host.hostApp`.
5. Registration metadata does not use wildcards or global fallback. Inactive, Customer-mismatched, integration-mismatched, and host-mismatched registrations are ineligible. Browser data does not participate.
6. The registry applies the registered adapter's declared tool capability and `isCompatible(host, tool, operation)` check to the exactly scoped registrations.
7. Exactly one eligible registration is required. Zero candidates yield a safe failed ToolCall with a non-sensitive internal code; more than one yields a safe ambiguous-selection failure.
8. The registry runs the selected registration's adapter readiness check before business-data execution. A non-healthy result fails safely; it is not a fallback signal.
9. Only the single healthy compatible registered adapter executes.

One resolved ToolDefinition establishes one canonical named-operation contract: its stable key/name is the canonical operation identity, `inputSchema` is its input contract, `connectorKey` is its trusted registration lookup key, and `outputSchema` is its result-release contract. Those trusted ToolDefinition values combine with exact `HostIntegrationContext.customerId`, `integrationId`, and `hostApp` values to select a `DataAdapterRegistration`, which supplies the adapter implementation. Adapter capability metadata alone cannot grant deployment eligibility. Browser input never participates in registration, adapter key, connector key, source system, endpoint, candidate ordering, or operation identity.

## 10. Structured Operation Arguments

The persisted `ExecutionPlan.candidateTools` JSON changes from mock-only `{ key, reason }` entries to the backward-compatible generic shape:

```ts
interface PlannedOperationCandidate {
  key: string;                 // ToolDefinition name
  arguments: Record<string, unknown>;
  reason: string;
}
```

Planning may use normalized entity hints to propose a ToolDefinition key, structured arguments, and reason, but it has no authority over an independent operation identity. `ToolRegistryService` resolves the key, derives the canonical operation identity from the resolved ToolDefinition, and validates the final arguments before adapter execution. A legacy persisted `operation` field, if encountered, is ignored and the canonical identity is re-derived; it cannot select a different operation. The planner must not include `connectorContextRef`, native credentials, adapter keys, endpoints, arbitrary SQL, paths, query strings, or free-form commands in `arguments`.

No new column is required: `candidateTools`, `inputSchema`, `outputSchema`, ToolCall `inputSummary`, and `outputSummary` are existing JSON fields. ToolCall persists a safe summary only: tool/operation identity, schema version, permitted argument keys and count, and separately approved non-sensitive values where the tool audit contract allows them. It never persists the full input object by default.

**PRISMA_SCHEMA_CHANGE_REQUIRED=NO**. Existing generic JSON fields and the versioned `ToolDefinition` contract represent the required generic data without a schema change. `connectorContextRef` is explicitly excluded from all persistence.

## 11. Result Projection and Raw-Result Lifetime

### Single policy authority

`ToolDefinition.outputSchema` is the sole trusted authority for the resolved ToolDefinition's canonical operation result release. Its versioned contract carries both the expected result shape and an Assistant result-policy extension containing:

- allowed field paths and allowed nested shapes;
- denied/masked field paths and permission-mask rules;
- maximum depth, item count, string length, and total projected size; and
- evidence-safe provenance fields.

No adapter metadata, browser visible column, PageContext, or second registry policy can expand this policy. Adapters may report capability, but ToolDefinition governs release.

### Projection pipeline

```text
raw adapter result (execution-local only)
  -> validate against ToolDefinition output contract
  -> default-deny projection to policy allowlist
  -> permission-aware field masking
  -> depth/item/string/total-size minimization
  -> SafeProjectedAdapterResult
  -> ToolCall safe outputSummary / EvidenceRef / GroundedAnswerInput
```

Missing policy, invalid policy, schema violation, masking failure, or minimization overflow is a projection failure: no fields are released, the already-started ToolCall transitions to failed with a safe error code, and the existing safe answer/SSE path runs.

`LlmInputSanitizerService` and `masking.util.ts` are reused after the server-owned projection. Their input changes from browser `visibleColumns` to the ToolDefinition policy's already-authorized field set plus applicable permission mask. `visibleColumns` can affect client presentation after authorization but cannot add fields.

Raw result data exists only between adapter return and completion/failure of the projection pipeline. It is never persisted, audited as payload, logged, included in ToolCall output, added to EvidenceRef, emitted in SSE, returned publicly, or sent to an LLM/model. ToolCall begins after permission and argument validation but before registry selection; registry, readiness, execution, validation, projection, masking, and minimization failures all transition that started lifecycle to failed. ToolCall input/output summaries remain safe summaries only and never include raw results, `connectorContextRef`, native credentials, or full unminimized arguments.

## 12. Mock Adapter Migration

`MockConnectorModule` changes from exporting a directly injected `MockConnectorAdapter` to contributing one or more explicit trusted `DataAdapterRegistration` entries to the `DATA_ADAPTER_REGISTRATIONS` array. Each entry binds the mock adapter to one exact connector key, Customer, integration, and host app with an active state. `MockConnectorAdapter` adds the required metadata/compatibility implementation and accepts generic validated operations while preserving its present mock lookups. It receives no registry special case or fallback behavior.

`AssistantReadonlyRuntimeService` removes its `MockConnectorAdapter` constructor dependency and receives `DataAdapterRegistry` plus the result projector. It never tests Customer, host app, or connector name to decide a code path. Mock remains one registered adapter selected by its trusted ToolDefinition `connectorKey` and the same permission/registry/projection path as future adapters.

## 13. Grounded-Answer Input Boundary

`GroundedAnswerInput` is constructed after safe projection and EvidenceRef attachment:

```ts
interface GroundedAnswerInput {
  readonly toolCallId: string;
  readonly canonicalToolKey: string;
  readonly evidence: readonly {
    evidenceRefId: string;
    sourceType: string;
    sourceId: string;
    projectedFacts: Record<string, unknown>;
  }[];
}
```

Its canonical operation identity is the resolved ToolDefinition stable key/name. It contains only projected, masked, minimized facts and EvidenceRef provenance. It cannot contain raw result data, `connectorContextRef`, native credentials, adapter configuration, endpoints, browser raw records, or unvalidated arguments.

`EvidenceRefService.attachStructuredRecordEvidence` changes to accept `SafeProjectedAdapterResult`, not a raw record plus browser-selected visible fields. Existing deterministic mock answer behavior remains compatible by consuming the same safe evidence summaries; Feature 008 does not introduce a real Customer prompt, LLM answer, or RAG redesign.

## 14. Failure / Safe Outcome Mapping

| Internal condition | Tool lifecycle | Existing public safe outcome | Disclosure rule |
| --- | --- | --- | --- |
| Permission denied | blocked | `permission_denied` | Existing safe permission response only |
| Adapter not found, ambiguous, incompatible, or unhealthy | started then failed | existing `no_answer` with tool-failure reason | No connector/endpoint/configuration detail |
| Timeout or connector-safe dependency failure | started then failed | existing `no_answer` with tool-failure reason | No network topology, credential, or retry detail |
| Malformed raw result or projection failure | started then failed | existing `no_answer` with tool-failure reason | No raw fields or schema detail |
| No projected evidence | completed with no evidence | existing `no_answer` | No hidden result disclosure |

Internal failure codes remain bounded and safe for ToolCall/audit correlation. `NoAnswerGateService` remains the public mapping authority for failed and blocked runtime outcomes. No `degraded`, `connector_failure`, or other AnswerDecision value is added. Existing `tool_call_blocked`, `tool_call_failed`, `answer_delta`, and `final` SSE event shapes remain unchanged.

## 15. Module and Dependency Architecture

```text
identity (verified context types/guard)
  -> host-integration (context factory, normalizer, transient extraction)
  -> assistant (controller/message/planning/runtime orchestration)
     -> tools (ToolDefinition/customer policy)
     -> permissions (pre-check and masking)
     -> connectors (DataAdapter contract, registry, projector, mock registration)
     -> evidence (EvidenceRef from safe projected result)
     -> audit / observability
     -> query-understanding
```

Likely new internal files are:

- `src/host-integration/host-integration.module.ts`, context/request-context types, `host-integration-request.factory.ts`, and `page-context-normalizer.service.ts`;
- `src/connectors/data-adapter.interface.ts`, `data-adapter-registry.service.ts`, result-projection types/service, and explicit `DataAdapterRegistration`/`DATA_ADAPTER_REGISTRATIONS` token types; and
- focused tests for the new seams.

Likely modified files are the existing PageContext DTO/mapper, Assistant controller/message/runtime/planning types, connector interface and mock module/adapter, ToolRegistry validation/policy interpretation, ToolCall summary handling, EvidenceRef input, and Assistant module imports/providers.

Identity verification modules, Gateway, public controller routes, SDK, Prisma schema/migrations, retrieval, feedback, approvals, and Customer-specific transport modules are explicitly not changed by this feature. Dependency direction remains acyclic: host integration depends on identity types; connectors depend on host-integration types and tools types; Assistant orchestrates all three; neither connectors nor host integration depends on Assistant services.

## 16. Persistence / Migration Impact

No database tables, columns, indexes, migrations, ToolDefinition model changes, or ExecutionPlan model changes are required.

`ToolDefinition.inputSchema`, `ToolDefinition.outputSchema`, `ExecutionPlan.candidateTools`, and ToolCall safe JSON summaries are existing versioned storage locations. Feature 008 constrains their content and uses them more generally; it does not need new storage. `DataAdapterRegistration` is trusted static application/deployment composition, not a Prisma entity. The transient connector context and raw result have no persistence representation.

```text
PRISMA_SCHEMA_CHANGE_REQUIRED=NO
```

## 17. Security Threat Model

| Threat | Trust boundary | Mitigation | Fail-closed behavior | Test implication |
| --- | --- | --- | --- | --- |
| Browser selects adapter/source or registration | Browser to Backend | Ignore/reject authority-like PageContext; registry uses trusted ToolDefinition and exact trusted registrations | No adapter selected | Supply adapter/source/registration fields and verify no selection change |
| Browser sends raw business record | Browser to normalizer | Drop/reject raw records; only approved hints survive | No evidence/model/operation authority from record | Inspect persistence, runtime, evidence, and model inputs |
| Stolen `connectorContextRef` | Browser transport to adapter | Feature 008 validates only opaque syntax; Feature 009 binding validates semantic use | Adapter-safe failure, no fallback | Reuse ref with wrong actor/scope |
| Cross-Customer reference | Customer boundary | Registry and future connector use trusted Customer/integration/host context | No data and no existence disclosure | Same org/actor/host across two Customers |
| Native credential reaches central input | Browser to DTO | Reject credential-shaped/unapproved values; only opaque reference accepted | Request safely rejected/omitted | Test tokens in all contract fields |
| Unknown connector key | ToolDefinition to registry | Exact registered adapter key required | Failed ToolCall/safe no-answer | Unregistered key fixture |
| Multiple eligible adapters | Registry | Require exactly one candidate | Failed ToolCall/safe no-answer | Two matching deterministic adapters |
| Sensitive raw adapter fields | Adapter to projector | ToolDefinition default-deny result policy then masking/minimization | No field release | Allowed/denied field fixture |
| Unexpected adapter schema | Adapter to projector | Validate before projection | Failed ToolCall/safe no-answer | Missing/wrong-type result fixture |
| Permission denial | Tool policy to runtime | Pre-check before registry eligibility/execution | Blocked ToolCall/permission denied | Assert adapter double was never invoked |
| Adapter timeout | Adapter dependency | Bounded execution deadline and safe failure mapping | Failed ToolCall/safe no-answer | Deterministic timeout double |
| Logging transient/raw data | Internal observability | Explicit safe summaries and negative-surface tests | No raw/reference log event | Capture audit/log/telemetry sinks |
| Customer branch in Assistant core | Assistant orchestration | Registry registration/capability policy only | Review/test rejects conditional branch | Regression test with multiple registrations |

## 18. Testability Seams

Later implementation must provide injectable deterministic doubles for HostIntegrationRequestFactory, DataAdapterRegistry, DataAdapter, readiness/timeout behavior, result projector, permission pre-check, and audit/log sink capture.

Required tests include:

- unit construction/validation of HostIntegrationContext and normalized PageContext;
- the same adapter implementation registered for two distinct Customers without duplicating its class;
- two-Customer isolation with deliberately identical organization, actor, and host app;
- transient-reference negative inspection across every durable/public/model branch and an assertion that planning/query understanding receive no transient-reference parameter;
- assertion that a denied pre-check means the adapter double is never invoked;
- canonical operation derivation from the resolved ToolDefinition and legacy independent-operation-field ignoring;
- wrong-Customer, wrong-integration, wrong-host, inactive, zero, exactly-one, multiple/ambiguous, incompatible, and unhealthy registration selection through an explicit `DATA_ADAPTER_REGISTRATIONS` array fixture;
- Mock selection only through an exact trusted registration and proof that Browser input cannot alter registration selection;
- validated structured operation arguments and rejection of arbitrary execution forms;
- PageContext rejection/drop behavior for nested arbitrary presentation payloads and Browser-declared selected-row safe fields;
- ToolCall blocked/start/complete/fail behavior around registry, readiness, execution, schema, projection, masking, and minimization outcomes;
- projection default-deny, denied field, shape, depth, item-count, and size-limit behavior;
- mock adapter execution through the registry path;
- timeout/malformed/projection failure mapping through existing ToolCall, no-answer, and SSE behavior; and
- contract regressions for existing session/message/SSE, feedback, approval, Gateway identity, and SDK behavior.

No Feature 008 test uses real Shinmone data, endpoint, credential, or Customer connector runtime.

## 19. Feature 009 Extension Boundary

Feature 009, `009-productized-business-connector-runtime`, is out of scope. Feature 008 exposes only the central extension seam: typed trusted context, opaque transient reference, registered adapter contract, validated named operation, registry selection, and projected-result boundary.

Feature 009 will later provide the two-sided reusable connector capability: central transport, service authentication/signing, endpoint resolution, and network safety; plus Customer-local runtime, reference binding, native credential isolation, identity proof, replay protection, operation manifest/execution, and safe Customer API access. It can supply real Customer deployment configuration through the same Feature 008 `DataAdapterRegistration` contract and may later add a richer deployment/control-plane lifecycle. Feature 008 requires neither persistence nor CRUD for registrations. Shinmone SCM is Feature 009's first real reference integration, not a Feature 008 runtime branch.

## 20. Historical Feature 002 Compatibility

| Historical decision | Status | Feature 008 resolution |
| --- | --- | --- |
| Separate host-integration boundary | REUSED | Add narrow typed host-integration context and normalizer that consume verified identity. |
| Data-adapter/registry concepts near connector domain | REUSED | Extend ConnectorAdapter with one DataAdapter registry path. |
| Admin Orders/Inventory reference adapters | SUPERSEDED | Preserve generic Mock migration; do not add an Admin or Customer reference adapter. |
| Host-derived source-system routing | SUPERSEDED | Source-system metadata is adapter-owned and registry-selected, never browser-provided. |
| Historical Feature 002 delivery artifact | NOT_APPLICABLE | Feature 002 remains inactive and unmodified. |

## 21. Rejected Alternatives

- **Directly inject MockConnectorAdapter and add conditionals for future adapters**: rejected because it keeps Customer/connector branching in Assistant core and cannot fail closed on registry ambiguity.
- **Create an unrelated DataAdapter runtime**: rejected because it duplicates connector health, execution, audit, and failure semantics.
- **Use browser `visibleColumns` as result authorization**: rejected because presentation state is not field authority.
- **Persist `connectorContextRef` in PageContext, ExecutionPlan, or ToolCall to make it available later**: rejected because it violates the transient credential boundary.
- **Add a new connector-degraded AnswerDecision or SSE contract**: rejected because existing safe outcomes and SSE lifecycle already represent denied and failed reads.
- **Use a separate database registry/migration in Feature 008**: rejected because existing ToolDefinition JSON and trusted static `DataAdapterRegistration` composition safely support the generic foundation; Customer connector control-plane lifecycle belongs to Feature 009.
- **Infer Customer deployment eligibility from adapter metadata or use wildcard registrations**: rejected because capability metadata is not deployment authority and implicit wildcard fallback could cross Customer boundaries.

## 22. Open Questions

None. The approved specification, current source, and accepted Feature 009 boundary resolve the architectural decisions required for a later implementation plan.

```text
CURRENT_RUNTIME_PATH_DOCUMENTED=YES
TARGET_RUNTIME_PATH_DOCUMENTED=YES
HOST_INTEGRATION_CONTEXT_DESIGNED=YES
CONNECTOR_CONTEXT_REF_EXTRACTION_POINT_DEFINED=YES
CONNECTOR_CONTEXT_REF_TRANSIENT_STORAGE_DEFINED=YES
CONNECTOR_CONTEXT_REF_PERSISTENCE_PATH_EXISTS=NO
PAGE_CONTEXT_NORMALIZATION_DESIGNED=YES
DATA_ADAPTER_RELATIONSHIP_DECIDED=EXTENDS_CONNECTOR_ADAPTER
DATA_ADAPTER_REGISTRY_DESIGNED=YES
TRUSTED_ADAPTER_SELECTION_ALGORITHM_DEFINED=YES
AMBIGUOUS_ADAPTER_FAIL_CLOSED=YES
STRUCTURED_OPERATION_ARGS_DESIGNED=YES
CONNECTOR_CONTEXT_REF_IN_OPERATION_ARGS=NO
RESULT_POLICY_SINGLE_AUTHORITY_DEFINED=YES
RAW_RESULT_TRANSIENT_ONLY=YES
MOCK_ADAPTER_REGISTRY_MIGRATION_DESIGNED=YES
GROUNDED_ANSWER_INPUT_BOUNDARY_DESIGNED=YES
REAL_CUSTOMER_LLM_ANSWER_IMPLEMENTED=NO
SAFE_FAILURE_MAPPING_DESIGNED=YES
NEW_PUBLIC_ANSWER_DECISION_REQUIRED=NO
PRISMA_SCHEMA_CHANGE_REQUIRED=NO
FEATURE009_EXTENSION_BOUNDARY_DEFINED=YES
REAL_SHINMONE_IMPLEMENTATION_INCLUDED=NO
OPEN_QUESTIONS_COUNT=0
PLANNER_OPERATION_AUTHORITY=NO
TOOL_DEFINITION_OPERATION_AUTHORITY=YES
CANONICAL_OPERATION_IDENTITY_SOURCE=ToolDefinition stable key/name
INDEPENDENT_OPERATION_STRING_PERSISTED=NO
CONNECTOR_CONTEXT_REF_AVAILABLE_TO_PLANNING=NO
CONNECTOR_CONTEXT_REF_AVAILABLE_TO_QUERY_UNDERSTANDING=NO
CONNECTOR_CONTEXT_REF_AVAILABLE_ONLY_TO_SELECTED_ADAPTER_EXECUTION=YES
TOOLCALL_LIFECYCLE_WRAPS_ADAPTER_EXECUTION=YES
RAW_ADAPTER_RESULT_IN_TOOLCALL=NO
CONNECTOR_CONTEXT_REF_IN_TOOLCALL=NO
REGISTRY_PROVIDER_MODEL=EXPLICIT_ARRAY_TOKEN
ANGULAR_STYLE_MULTI_PROVIDER_ASSUMED=NO
USER_VISIBLE_STATE_ARBITRARY_NESTED_OBJECT_ALLOWED=NO
SELECTED_ROWS_BROWSER_DECLARED_SAFE_FIELDS_ALLOWED=NO
RESULT_POLICY_SINGLE_AUTHORITY=ToolDefinition.outputSchema
CURRENT_TOOLCALL_BASELINE_CORRECTED=YES
TARGET_TOOLCALL_LIFECYCLE_CHANGED=NO
ADAPTER_IMPLEMENTATION_SEPARATE_FROM_DEPLOYMENT_REGISTRATION=YES
REGISTRATION_TYPE=DataAdapterRegistration
REGISTRATION_PROVIDER_TOKEN=DATA_ADAPTER_REGISTRATIONS
REGISTRATION_HAS_CUSTOMER_BINDING=YES
REGISTRATION_HAS_INTEGRATION_BINDING=YES
REGISTRATION_HAS_HOSTAPP_BINDING=YES
REGISTRATION_HAS_ACTIVE_STATE=YES
ADAPTER_METADATA_USED_AS_CUSTOMER_AUTHORITY=NO
SAME_ADAPTER_MULTI_CUSTOMER_REGISTRATION_SUPPORTED=YES
CROSS_CUSTOMER_WILDCARD_FALLBACK_ALLOWED=NO
TRUSTED_REGISTRATION_SELECTION_DEFINED=YES
ZERO_REGISTRATION_FAIL_CLOSED=YES
AMBIGUOUS_REGISTRATION_FAIL_CLOSED=YES
MOCK_REGISTERED_THROUGH_GENERIC_REGISTRATION=YES
```
