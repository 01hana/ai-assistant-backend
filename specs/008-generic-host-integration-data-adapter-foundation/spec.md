# Feature Specification: Generic Host Integration and Data Adapter Foundation

**Feature Branch**: `008-generic-host-integration-data-adapter-foundation`  
**Created**: 2026-09-03  
**Status**: Draft  
**Input**: Create a customer-neutral Assistant backend foundation for trusted host integration and safe business-data adapters, without delivering any Customer-specific connector.

## Product Context and Boundary

Feature 008 establishes the reusable platform boundary through which the Internal AI Assistant can safely use read-oriented business-data adapters for many Customer host systems, including future SCM, MES, ERP, CRM, WMS, and custom enterprise applications.

The existing real Customer identity, session, message, and streaming path is accepted product behavior. This feature does not redesign the Identity Bridge, Gateway identity authority, internal identity credential, frontend SDK authentication, session API, message API, or SSE contract.

The platform must retain one Assistant core runtime. Future Customer onboarding must normally be limited to an adapter implementation or configuration, named-operation mapping, field/evidence policy, and connector deployment configuration. It must not require Customer-specific branching in the Assistant core.

Feature 008 establishes generic extension points and security guarantees only. It does not implement any Customer connector, Customer API mapping, Customer business intent routing, or Customer-specific answer.

For every business-data request, the required conceptual order is: trusted identity → successful permission pre-check → trusted adapter eligibility and selection → adapter business-data access → server-owned result projection → permission-aware masking and minimization → evidence or grounded-answer input. The system must not fetch Customer business data and apply permission filtering afterward.

## Authority Ownership

| Concern | Authoritative owner | Feature 008 requirement |
| --- | --- | --- |
| Customer, integration, host application, organization, actor, roles, and permission scopes | Already-verified Backend identity | Build request context only from trusted identity; never accept browser replacement values. |
| Request correlation | Trusted Gateway, Backend, or tracing mechanism | Preserve correlation through the generic execution path; never treat it as identity authority. |
| Browser page context | Customer Host and SDK | Allow only non-authoritative presentation hints after normalization. |
| Permission to access a named operation | Existing trusted Backend permission infrastructure | Complete authorization successfully before adapter selection eligibility, connector invocation, or Customer business-data access. |
| Adapter availability and selection | Trusted Backend registration and configuration | Select adapters server-side and fail closed. |
| Named operations and input/output policy | Trusted Backend contracts | Validate operation arguments and enforce operation-specific result projection. |
| Customer-native connector access context | Customer-local connector environment | Refer to it only with transient opaque `connectorContextRef`; never centralize native credentials. |
| Evidence truth | Authorized, projected adapter result | Never derive final evidence authority from browser UI state. |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Construct a Trusted Host Integration Context (Priority: P1)

An authorized internal user sends an existing Assistant request from a registered host application, and the Backend constructs one trusted, request-scoped integration context before any adapter or tool decision is made.

**Why this priority**: Every future connector relies on a trustworthy platform boundary; a browser-controlled boundary could expose another Customer's business data.

**Independent Test**: Submit otherwise identical requests with valid and conflicting trusted and browser values, then verify the resulting context uses only verified Backend identity and rejects invalid authority combinations.

**Acceptance Scenarios**:

1. **Given** a request with a valid verified identity, **When** the Assistant begins processing, **Then** its host integration context preserves the semantic authority of Customer, integration, host application, organization, actor, roles, permission scopes, and request correlation.
2. **Given** a browser page context that supplies Customer, integration, organization, actor, role, scope, host application, connector, adapter, or source-system values, **When** it conflicts with or attempts to supplement trusted identity, **Then** none of those browser values establish or override authority.
3. **Given** an identity that is missing, disabled, incompatible, or mismatched for the requested Customer, integration, or host application, **When** processing begins, **Then** processing fails closed without selecting an adapter or exposing whether another scope exists.
4. **Given** two Customers with otherwise identical organization, actor, and host-application identifiers, **When** each sends a request, **Then** their contexts and subsequent adapter decisions remain isolated by Customer.
5. **Given** a requested named operation, **When** its permission pre-check has not completed successfully, **Then** no adapter is eligible to execute, no connector is invoked, and no Customer business data is accessed.

---

### User Story 2 - Carry Transient Connector Context Safely (Priority: P1)

A Customer Host can provide an opaque `connectorContextRef` that lets a later Customer-local connector locate short-lived access context without sending Customer-native credentials to central Assistant services.

**Why this priority**: Real Customer systems need local access context, but that context must not become a durable central credential or an identity substitute.

**Independent Test**: Send a valid opaque reference through the existing sanitized host/page-context transport and inspect all persisted, streamed, logged, audited, evidence, and model-facing surfaces.

**Acceptance Scenarios**:

1. **Given** a permitted opaque `connectorContextRef`, **When** it arrives with a request, **Then** the Backend handles it only as transient request state and does not treat it as identity, permission, Customer, integration, organization, connector-selection, adapter-selection, or source-system authority.
2. **Given** a request containing `connectorContextRef`, **When** messages, context state, page context, history, audit events, evidence, logs, telemetry, prompts, model input, SSE events, and public responses are inspected, **Then** the reference is absent from each surface.
3. **Given** a missing, expired, malformed, revoked, mismatched, or unusable `connectorContextRef`, **When** an adapter would require it, **Then** the request fails safely without fallback to another connector, adapter, identity, or data source.
4. **Given** a browser supplies a reference intended for a different Customer, integration, organization, actor, or host application, **When** it is used, **Then** no business data is returned and no cross-scope condition is disclosed.

---

### User Story 3 - Use Safe Normalized Page Context (Priority: P1)

An internal user can retain useful page awareness, such as route, entity type, entity identifier, selected-row identifiers or safe summaries, while the Backend keeps page context separate from security and evidence authority.

**Why this priority**: Page context improves Assistant relevance, but raw browser business payloads and browser assertions must not determine access or truth.

**Independent Test**: Provide permitted presentation hints, raw business payloads, and authority-like fields through page context; verify the first is normalized while the latter inputs are rejected, ignored, or safely excluded.

**Acceptance Scenarios**:

1. **Given** permitted presentation context, **When** it is normalized, **Then** the Assistant may use it as a non-authoritative hint for the current interaction.
2. **Given** raw browser or Host-supplied business entity payload, **When** the request is processed, **Then** it is not adapter-execution authority, connector-operation input authority, EvidenceRef, grounded-answer input, prompt/model input, audit payload, log payload, or evidence truth; Customer business truth is obtained only from an authorized Backend adapter result.
3. **Given** page-context values that claim Customer, integration, organization, actor, permissions, connector, adapter, source system, endpoint, or evidence truth, **When** they are received, **Then** they cannot influence authorization, adapter selection, or result authorization.
4. **Given** route, entity type, entity identifier, selected identifiers, or approved safe summaries, **When** they are present in PageContext, **Then** they may remain non-authoritative normalized hints and raw entity records are not required to answer a business-data question.

---

### User Story 4 - Select a Registered Generic Data Adapter (Priority: P1)

The Assistant can select a safe, compatible, read-oriented data adapter for an authorized business-data capability using trusted Backend state.

**Why this priority**: Future Customer integrations must be reusable platform extensions rather than Assistant-core exceptions.

**Independent Test**: Register compatible and incompatible adapter capabilities, then exercise selection using different trusted Customer, integration, host-application, and tool configurations.

**Acceptance Scenarios**:

1. **Given** a trusted request, a successful permission pre-check, and an active compatible adapter capability, **When** an authorized named operation is selected, **Then** the Backend selects the registered adapter using trusted Customer, integration, host-application, capability, and tool configuration before any Customer business-data access.
2. **Given** an unknown, inactive, missing, ambiguous, or incompatible adapter, **When** a named operation is requested, **Then** selection fails closed and does not expose adapter configuration or data-source details.
3. **Given** a browser attempts to choose a connector key, adapter key, source system, endpoint, or data source, **When** processing occurs, **Then** that value cannot select or redirect an adapter.
4. **Given** a future Customer adapter, **When** it is onboarded, **Then** it can declare stable identity, source-system identity, supported host applications/capabilities, compatibility behavior, named-operation execution, validated arguments, health/readiness behavior, and safe failures without creating an unrelated connector runtime.

---

### User Story 5 - Execute Trusted Structured Named Operations (Priority: P1)

An authorized user can invoke a named, read-oriented business operation with structured validated arguments rather than being limited to mock-specific or single-identifier inputs.

**Why this priority**: Real business queries require precise safe inputs while prohibiting unconstrained connector execution.

**Independent Test**: Exercise a representative registered operation with valid structured input and invalid, unapproved, arbitrary, or browser-defined inputs.

**Acceptance Scenarios**:

1. **Given** a trusted named operation, valid structured arguments, and a successful permission pre-check, **When** execution begins, **Then** the selected adapter receives only the operation and arguments allowed by its trusted Backend contract after authorization and trusted selection eligibility have completed.
2. **Given** malformed, missing, excessive, unapproved, or incompatible arguments, **When** execution is requested, **Then** execution fails before the adapter accesses business data.
3. **Given** arbitrary SQL, model-generated SQL, arbitrary URL/path/query forwarding, free-form connector commands, or browser-defined operation code, **When** it is submitted or generated, **Then** it is not executed or forwarded to any adapter.
4. **Given** existing mock behavior, **When** it executes through the generic path, **Then** its currently supported user-visible behavior remains compatible.

---

### User Story 6 - Produce Safe Projected Evidence (Priority: P1)

An authorized user receives a grounded Assistant outcome based only on server-approved, permission-aware, minimized adapter data.

**Why this priority**: Raw enterprise payloads can contain data that is unnecessary, unauthorized, or unsafe for evidence, models, streams, and logs.

**Independent Test**: Return an adapter payload containing both allowed and denied fields, then inspect the projected output and every downstream Assistant surface.

**Acceptance Scenarios**:

1. **Given** an adapter returns raw business data, **When** it is prepared for Assistant use, **Then** an operation-specific server-owned allowlist/projection is applied before permission-aware masking and size/data minimization.
2. **Given** browser visible columns or UI state allow a field, **When** that field is not authorized by the operation-specific output policy, **Then** it remains unavailable to evidence, grounded-answer input, and user-facing output.
3. **Given** raw adapter output, **When** audit records, logs, prompts/model input, evidence, SSE events, public answers, or responses are inspected, **Then** the raw payload is absent.
4. **Given** an operation has no approved result projection, **When** it completes, **Then** no result field is released downstream by default.

---

### User Story 7 - Preserve One Generic Assistant Execution Path (Priority: P2)

The Assistant uses the same generic selection and execution path for the existing mock connector and future Customer adapters while retaining compatible execution plans and a safe grounded-answer input boundary.

**Why this priority**: One path prevents hidden Customer exceptions and makes future adapters testable under the same controls.

**Independent Test**: Run existing mock scenarios through generic selection and compare their public session, message, streaming, decision, feedback, and approval behavior with the accepted baseline.

**Acceptance Scenarios**:

1. **Given** an existing mock operation, **When** it is executed after Feature 008, **Then** it is selected through the same generic adapter-selection path used by future adapters rather than a universally direct mock-adapter dependency.
2. **Given** an execution plan containing a named operation and structured validated arguments, **When** tool execution begins, **Then** the plan can carry that generic information without requiring mock-prefixed semantics.
3. **Given** safely projected evidence from any adapter, **When** an answer is prepared, **Then** it crosses a generic grounded-answer input boundary and no raw adapter output reaches answer generation.
4. **Given** an existing public Assistant client, **When** it uses sessions, messages, streaming, feedback, or approvals, **Then** its public contract remains unchanged and no second chat API is required.

### Edge Cases

- A trusted identity is missing a required authority, refers to a disabled integration, or conflicts with registered host capability: fail closed before adapter selection.
- An adapter is unavailable, unhealthy, times out, returns malformed output, has a safe connector dependency failure, or cannot safely project an output: stop the operation, preserve existing tool/audit lifecycle and public safe-outcome semantics, provide no raw result, introduce no new public AnswerDecision value, and disclose no internal endpoint, connector configuration, network detail, credential, or another Customer's existence.
- More than one adapter is eligible, or none is uniquely eligible: fail closed rather than choosing by browser input, incidental ordering, or mock fallback.
- A `connectorContextRef` is absent, blank, expired, revoked, malformed, replayed, mismatched, or otherwise unusable: do not substitute another identity or source.
- A result exceeds allowed size, contains unapproved fields, or cannot be fully masked/minimized: release no unapproved data.
- Existing mock tool definitions, plans, or safe public outcomes are encountered during migration: preserve compatible behavior through the generic path; do not add Customer-specific core-runtime branches.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST construct a trusted, request-scoped host integration context from already-verified Backend identity and trusted request correlation before adapter selection or execution.
- **FR-002**: The trusted context MUST preserve Customer, integration, host application, organization, actor, roles, permission scopes, and request-correlation semantics without accepting browser values as authority.
- **FR-003**: The system MUST enforce Customer as the outer data-isolation boundary and MUST fail closed for missing, mismatched, inactive, ambiguous, or incompatible Customer, integration, or host-application authority.
- **FR-004**: The system MUST normalize permitted page-context hints as non-authoritative presentation context and MUST prevent page context from establishing Customer, integration, organization, actor, permissions, connector, adapter, source system, endpoint, or evidence truth.
- **FR-005**: After extracting any transient `connectorContextRef` accepted through compatible transport, normalized PageContext MAY contain only explicitly permitted non-authoritative hints, including route, entity type, entity identifier, selected identifiers, and approved safe summaries. Browser or Host-supplied raw business entity payload MUST NOT become adapter-execution authority, connector-operation input authority, EvidenceRef, grounded-answer input, prompt/model input, audit payload, log payload, or evidence truth; raw entity records MUST NOT be required to answer business-data questions.
- **FR-006**: The system MUST complete the existing permission authorization/pre-check successfully before adapter execution, Customer business-data access, or Customer connector invocation. It MUST NOT fetch business data first and apply permission filtering afterward.
- **FR-007**: The system MUST support an opaque `connectorContextRef` as transient request state. The reference MUST be non-authoritative by itself and MUST NOT establish identity, permission, Customer, integration, organization, connector selection, adapter selection, or source-system authority.
- **FR-008**: The system MUST ensure `connectorContextRef` never appears in AssistantMessage persistence, AssistantContextState persistence, persisted page context, conversation/history, AuditEvent metadata, general or structured logs, telemetry, EvidenceRef, prompts, model input, SSE events, or public API responses.
- **FR-009**: Customer-native credentials or tokens MUST NOT be accepted or transported as part of any generic central Feature 008 contract. They MUST NOT enter Host Integration Context, PageContext, `connectorContextRef`, data-adapter arguments, named-operation arguments, ExecutionPlan operation arguments, ToolCall input, EvidenceRef, grounded-answer input, prompt/model input, logs, or audit.
- **FR-010**: `connectorContextRef` MUST be an opaque reference only. It MUST NOT embed, encode, wrap, or serialize a Customer-native credential or token.
- **FR-011**: The system MUST provide one reusable read-oriented data-adapter capability that extends the existing connector domain rather than creating a second unrelated connector runtime.
- **FR-012**: Every data adapter MUST declare stable adapter identity, source-system identity, supported host applications/capabilities, compatibility behavior, named operation behavior, structured argument validation, health/readiness behavior, and safe failure behavior.
- **FR-013**: The system MUST select an adapter only from trusted Backend state, including verified Customer, integration, host application, registered capability, and trusted tool/connector configuration, and only after the permission pre-check has completed successfully.
- **FR-014**: The Browser MUST NOT directly choose or override connector key, adapter key, source system, endpoint, data source, operation, or adapter configuration.
- **FR-015**: The system MUST fail closed for unknown, inactive, missing, ambiguous, or incompatible adapters and MUST NOT silently fall back to the MockConnectorAdapter or another source.
- **FR-016**: The system MUST support named connector operations with structured, trusted, validated arguments and MUST remove the architectural assumption that every connector request consists only of an entity identifier or mock-specific input.
- **FR-017**: Operation and input schemas MUST be governed by trusted Backend contracts. The system MUST prohibit arbitrary SQL, LLM-generated SQL execution, arbitrary URL invocation, arbitrary HTTP path forwarding, arbitrary query-string forwarding, free-form connector commands, and Browser-defined connector operation code.
- **FR-018**: The system MUST apply the following mandatory boundary to every adapter result before it reaches any downstream Assistant surface: server-owned operation-specific allowlist/projection, permission-aware masking, and size/data minimization.
- **FR-019**: Result authorization MUST be default-deny. Browser-visible columns, browser UI state, or page-context values MUST NOT define final adapter-result field authorization.
- **FR-020**: Raw adapter payloads MUST NOT enter EvidenceRef, model input, prompts, audit records, logs, SSE events, public answers, or public responses.
- **FR-021**: Every operation that can release result data MUST have an operation-specific output policy. If no approved policy exists or safe projection cannot complete, no result field may be released downstream.
- **FR-022**: For adapter timeout, unavailable or unhealthy adapter, malformed adapter response, projection failure, or connector-safe dependency failure, the system MUST fail safely, release no unauthorized or raw adapter data, preserve existing tool/audit lifecycle semantics, and map the result into existing public Assistant safe-outcome semantics. It MUST NOT introduce a new public AnswerDecision value for connector degraded or unavailable state, or expose internal endpoint, connector configuration, network details, credentials, or another Customer's existence.
- **FR-023**: The existing MockConnectorAdapter MUST execute through the same generic adapter-selection path as future adapters, while preserving its accepted user-visible behavior and without Customer-specific core-runtime branching.
- **FR-024**: ExecutionPlan and tool execution MUST support a generic named operation plus structured validated arguments without requiring mock-prefixed operation semantics.
- **FR-025**: The system MUST provide a generic grounded-answer input boundary that accepts only safely projected, permission-aware, minimized evidence. This feature MUST NOT require a Customer-specific prompt, real Customer routing, or a completed Customer answer.
- **FR-026**: The system MUST preserve the accepted public behavior and contracts of existing Assistant session creation, message submission, SSE events, public AnswerDecision values, feedback, approvals, Gateway identity, and frontend SDK integration.
- **FR-027**: The system MUST NOT create a second public Assistant or chat API for generic adapter execution.

### Security Requirements

- **SR-001**: Trusted Backend identity is the only authority for Customer, integration, host application, organization, actor, roles, and permission scopes; no browser, SDK, Customer Host, or model-generated value may replace it.
- **SR-002**: `connectorContextRef` is capability-like sensitive context and must be bounded to its intended request use. It is useless without separately verified trusted identity and authorized server-side adapter selection.
- **SR-003**: The platform MUST demonstrate negative security guarantees that browser/Host raw business payload and `connectorContextRef` cannot reach adapter authority, connector-operation authority, persistence, history, audit, logs, telemetry, evidence, model/prompt input, streaming, or public output.
- **SR-004**: Customer-native credentials and tokens MUST remain outside central generic Feature 008 contracts. `connectorContextRef` must remain opaque and must never carry embedded, encoded, wrapped, or serialized native credential material.
- **SR-005**: Customer-specific host-system behavior, endpoint details, credentials, and business payloads MUST remain outside the generic Assistant core and must not be introduced by Customer or host-application conditional branches in that core.
- **SR-006**: Adapter failures, validation failures, compatibility failures, and projection failures MUST fail closed without exposing unauthorized data, raw payloads, internal adapter configuration, network details, credentials, or the existence of another Customer's data; they must preserve existing public safe-outcome and AnswerDecision semantics.

### Explicit Non-Goals

- A Shinmone or any other Customer SCM, MES, ERP, CRM, WMS, or custom-system adapter.
- Customer-native credential ownership or binding, connector deployment, connector service authentication, endpoint provisioning, or business-system changes. These belong to the future Productized Business Connector Runtime.
- Customer-specific operation mapping, field/evidence policy, intent routing, prompts, answer text, or business payload schemas.
- Redesign of the Identity Bridge, Gateway identity, internal identity credential, frontend SDK authentication, session API, message API, SSE event contract, feedback contract, or approval contract.
- A new public Assistant/chat API, arbitrary query capability, generic SQL executor, generic HTTP proxy, or browser-selected connector route.
- Revival, modification, or activation of historical Feature 002.

### Key Entities

- **Host Integration Context**: Trusted, request-scoped representation of the verified Customer, integration, host application, organization, actor, roles, permission scopes, and request correlation used for safe adapter decisions.
- **Normalized Page Context**: Reduced non-authoritative presentation hints, limited to explicitly permitted route, entity, selected-identifier, and safe-summary context; it cannot grant access, carry raw business records, or establish evidence truth.
- **Connector Context Reference**: Opaque short-lived, capability-like pointer to Customer-local connector access context; it is transient, non-authoritative by itself, and never contains Customer-native credential material.
- **Data Adapter Capability**: A registered safe read-oriented business-data capability with stable identity, source system, supported host capabilities, named operations, compatibility behavior, readiness behavior, and safe failure behavior.
- **Named Operation Contract**: Trusted Backend definition of one permitted operation, its structured argument requirements, its authorization expectations, and its result-release policy.
- **Projected Adapter Result**: The minimal server-authorized result produced after operation-specific allowlisting, masking, and minimization; the only adapter-derived data eligible for evidence or grounded-answer input.
- **Grounded-Answer Input**: Safe, projected, permission-aware evidence supplied to answer generation without exposing raw adapter output.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001 — TRUSTED_HOST_CONTEXT_READY**: 100% of context-construction tests use only verified Backend identity for Customer, integration, host application, organization, actor, roles, and permission scopes; all missing or mismatched authority cases fail closed.
- **SC-002 — CUSTOMER_ISOLATION_READY**: 100% of cross-Customer, cross-integration, and cross-host isolation tests deny mismatched requests, including cases with identical organization, actor, and host-application identifiers across Customers.
- **SC-003 — TRANSIENT_CONNECTOR_CONTEXT_READY**: 100% of negative inspection tests confirm `connectorContextRef` is absent from all prohibited persistence, history, audit, log, telemetry, evidence, model, streaming, and public-output surfaces, and that it never embeds, encodes, wraps, or serializes a Customer-native credential.
- **SC-004 — GENERIC_ADAPTER_SELECTION_READY**: 100% of selection tests confirm successful permission pre-check occurs before adapter eligibility, connector invocation, or Customer business-data access, and choose only a uniquely compatible registered adapter from trusted Backend state; unknown, inactive, missing, ambiguous, and incompatible cases fail without mock fallback.
- **SC-005 — STRUCTURED_OPERATION_SAFETY_READY**: 100% of operation tests accept only approved named operations and validated structured arguments; all arbitrary SQL, arbitrary forwarding, free-form commands, Browser-defined operation attempts, and browser/Host raw business payload attempts are rejected before data access or evidence/model use.
- **SC-006 — RESULT_PROJECTION_BOUNDARY_READY**: 100% of result-boundary tests demonstrate default-deny operation-specific projection, masking, and minimization before evidence or grounded-answer input; raw adapter payloads and Customer-native credential values are absent from prohibited central contracts and surfaces.
- **SC-007 — MOCK_PATH_COMPATIBILITY_READY**: 100% of established mock connector regression scenarios preserve their public session, message, SSE, AnswerDecision, feedback, and approval contract behavior while executing through generic selection.
- **SC-008 — PUBLIC_CONTRACT_COMPATIBILITY_READY**: 100% of compatibility tests for existing session creation, message submission, SSE consumption, feedback, approvals, Gateway identity, and SDK integration pass without requiring a second public Assistant API; timeout, unavailable/unhealthy adapter, malformed-response, projection-failure, and connector-safe dependency-failure cases preserve existing public safe-outcome semantics without a new public AnswerDecision value.

## Assumptions and Compatibility Assessment

- Feature 008 is a generic Backend foundation. The next planned platform feature, Feature 009, owns reusable Customer-side connector infrastructure; routine Customer onboarding after Features 008 and 009 normally adds adapter/configuration, operation mappings, field/evidence policies, and deployment/integration configuration rather than a new platform feature.
- Existing trusted Gateway identity/customer scope, ToolDefinition/ToolRegistry, customer tool policy, permission pre-check, ToolCall and audit lifecycle, EvidenceRef persistence mechanics, ExecutionPlan persistence, masking utilities, and SSE lifecycle are reused rather than redesigned.
- `connectorContextRef` may initially travel through the existing sanitized host/page-context transport for compatibility, but its transient treatment and non-disclosure requirements are mandatory from first implementation.
- The exact internal type shapes, dependency composition, storage-free transient handling mechanism, adapter discovery mechanism, and result-projection implementation are design decisions, provided they meet this specification's authority, isolation, safety, and compatibility requirements.
- The existing direct MockConnectorAdapter dependency is a migration target, not an accepted permanent generic-runtime pattern.
- No new `specs/002-host-integration-gateway-and-data-adapter-contract` artifact is created or changed. Historical Feature 002 may be consulted only as architectural background.

## Future Platform Handoff *(non-normative)*

Feature 009 is the next planned platform feature:

```text
NEXT_PLATFORM_FEATURE=009-productized-business-connector-runtime
FIRST_REAL_REFERENCE_INTEGRATION=Shinmone SCM
FUTURE_CUSTOMER_ONBOARDING_MODEL=reuse Features 008 + 009; normally adapter/configuration, operation mappings, field/evidence policies, and deployment/integration work, not one new platform feature per Customer
```

Feature 009 is expected to provide reusable Customer-side connector infrastructure, including Customer-local Connector Runtime, `connectorContextRef` binding lifecycle, credential isolation, identity-proof contract, central-to-connector service authentication, replay protection, operation registry/manifest, network safety policies, and deployment/integration configuration. Shinmone SCM is the first real reference integration for that platform capability; it must not define a Customer-specific Assistant runtime architecture.

A future platform feature is needed only when onboarding exposes a reusable platform capability that Features 008 and 009 do not support. This handoff does not specify Feature 009 implementation.

### Responsibility Review

| Feature | Overlap | Classification | Resolution |
| --- | --- | --- | --- |
| Feature 002 | YES | HISTORICAL_ARCHITECTURAL_SOURCE | Its related concepts inform this feature but it remains inactive and unchanged. |
| Feature 003–006 | NO | CONTRACT_PRESERVATION | Their accepted identity, Gateway, and Customer-scoping responsibilities remain unchanged. |
| Feature 007 | YES | COMPATIBILITY_DEPENDENCY | Its proven identity/session/message/SSE path remains the unchanged entry path for this generic foundation. |
| Feature 009 Productized Business Connector Runtime | YES | PLANNED_PLATFORM_EXTENSION | It supplies reusable Customer-side connector infrastructure; Shinmone SCM is its first real reference integration. |
| Future Customer onboarding | YES | PLATFORM_REUSE | It normally reuses Features 008 and 009 with adapter/configuration, operation, policy, and deployment work; it does not by itself require another platform feature. |

No unresolved `ACTUAL_DUPLICATE_RESPONSIBILITY` exists: Feature 008 owns the generic Backend host-integration and data-adapter foundation; Feature 009 owns reusable Customer-side connector infrastructure; routine Customer onboarding reuses those platform capabilities.

```text
FEATURE008_SPEC_READY=YES
GENERIC_HOST_INTEGRATION_CONTEXT_REQUIRED=YES
CONNECTOR_CONTEXT_REF_TRANSIENT_REQUIRED=YES
BACKEND_OWNED_ADAPTER_SELECTION_REQUIRED=YES
SERVER_OWNED_RESULT_PROJECTION_REQUIRED=YES
MOCK_CONNECTOR_GENERIC_PATH_REQUIRED=YES
CUSTOMER_SPECIFIC_ADAPTER_IMPLEMENTATION_INCLUDED=NO
PUBLIC_ASSISTANT_API_CHANGE_REQUIRED=NO
IDENTITY_SESSION_MESSAGE_SSE_REDESIGN_REQUIRED=NO
HISTORICAL_FEATURE002_MODIFICATION_REQUIRED=NO
PERMISSION_BEFORE_ADAPTER_ACCESS_REQUIRED=YES
BROWSER_RAW_BUSINESS_PAYLOAD_TO_MODEL_FORBIDDEN=YES
BROWSER_RAW_BUSINESS_PAYLOAD_AS_EVIDENCE_FORBIDDEN=YES
CUSTOMER_NATIVE_CREDENTIAL_IN_CENTRAL_CONTRACT_FORBIDDEN=YES
CONNECTOR_CONTEXT_REF_NATIVE_CREDENTIAL_EMBEDDING_FORBIDDEN=YES
SAFE_ADAPTER_FAILURE_MAPPING_REQUIRED=YES
NEW_PUBLIC_ANSWER_DECISION_FOR_CONNECTOR_FAILURE_FORBIDDEN=YES
FEATURE009_EXPLICITLY_NAMED=YES
SHINMONE_FIRST_REFERENCE_INTEGRATION_NOTED=YES
ONE_PLATFORM_FEATURE_PER_CUSTOMER_MODEL_REJECTED=YES
```
