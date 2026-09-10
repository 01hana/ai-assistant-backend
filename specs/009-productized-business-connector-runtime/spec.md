# Feature 009 — Productized Business Connector Runtime

**Feature Branch**: `009-productized-business-connector-runtime`
**Created**: 2026-09-09
**Status**: Accepted — Approved for Phase 1 implementation
**Input**: Productize the reusable central transport and Customer-local Connector Runtime needed to access real Customer business systems without allowing Customer-native credentials, Customer-specific routing, or arbitrary execution into the central Assistant platform. Shinmone SCM is the first reference integration.

## Problem Statement

Feature 008 established a generic, trusted data-adapter seam inside the central Assistant, but intentionally did not define the Customer-local runtime, credential ownership, binding lifecycle, authenticated service transport, or fixed mapping from a canonical operation to a real Customer API.

Without that second side, the Assistant cannot complete a production-shaped real-data request. Solving the gap separately for each Customer would create Customer-specific branches, duplicate security mechanisms, and risk turning the central platform into a credential store or arbitrary network proxy.

Feature 009 supplies one reusable two-sided runtime boundary. The central side invokes a uniquely selected Feature 008 adapter and an authenticated Customer-local Connector Runtime. The Customer-local side resolves an opaque, short-lived binding, obtains Customer-native access material locally, executes only a fixed named operation, and returns a bounded business response. Feature 008 remains responsible for final server-owned projection, evidence creation, and grounded answer input.

The product boundary is portable by construction: removing or disabling the complete Shinmone reference integration—including its bootstrap provider, credential profile, manifest, deployment/tool configuration, and SPA delivery—must leave the shared contracts, generic Customer-local runtime, central productized connector modules, and a differently configured Customer integration valid, buildable, and testable without an Assistant-core change.

The required end-to-end path is:

```text
Assistant
→ Feature 008 permission/precheck
→ Feature 008 trusted adapter selection
→ central Feature 009 transport adapter
→ authenticated Customer-local Connector Runtime
→ fixed named Customer operation
→ real Customer API
→ bounded operation result
→ Feature 008 server-owned projection
→ EvidenceRef
→ GroundedAnswerInput
→ existing Assistant answer/SSE behavior
```

There is no second Assistant runtime path.

## Goals

- Enable read-oriented access to real Customer business data through the accepted Feature 008 execution path.
- Keep all Customer-native credentials and session material within the Customer environment.
- Define a reusable, independently deployable Customer-local Connector Runtime and its security boundary.
- Define the required lifecycle and security properties of `connectorContextRef` without prematurely selecting persistence technology.
- Require authenticated, integrity-protected, fresh, replay-resistant central-to-connector requests.
- Restrict execution to trusted, fixed named operations and configuration-owned upstream destinations.
- Preserve Feature 008 result projection, evidence, ToolCall, answer, and SSE authority.
- Prove the platform with the first narrow Shinmone SCM read operation without adding Shinmone-specific branches to Assistant core.
- Make later Customer onboarding primarily configuration, adapter, operation-mapping, field-policy, and Customer-local integration work rather than a new platform feature.
- Prove that a second Customer with a different binding bootstrap, credential mechanism, read-request profile, endpoint mapping, and result policy can use the same generic runtime and Feature 008 path after every Shinmone artifact is disabled.

## Non-Goals

- Redesigning or replacing Feature 007 identity, Customer authentication, session bootstrap, or Gateway trust.
- Redesigning Feature 008 host integration, adapter registration/selection, permission precheck, projection, evidence, grounded-answer, or ToolCall contracts.
- Creating a generic arbitrary HTTP proxy, URL fetcher, SQL connector, shell runner, or free-form command runtime.
- Storing or processing Customer-native credentials in the central Assistant platform.
- Adding a second Assistant execution, answer, or streaming path.
- Adding a new public Assistant endpoint, request mode, SSE shape, or AnswerDecision.
- Implementing broad document RAG, a new LLM orchestration architecture, or a generic connector/plugin marketplace.
- Supporting side-effecting or write operations; such operations require separate approval and risk design.
- Covering all Shinmone APIs or generalizing Shinmone-specific endpoint details into Assistant architecture.
- Treating Shinmone/IDX `nativeAccessToken`, `acceptedEntry`, MenuDetail, bearer application, native JWT expiry, or refresh/remint behavior as generic Feature 009 contracts.
- Performing production deployment as part of the specification work.

## Existing Accepted Architecture / Dependencies

Feature 007 owns the first Customer identity and session path. Browser identity claims do not become platform authority. The central Gateway accepts only the existing trusted identity flow, resolves Customer and allowed HostApp through accepted bindings, and supplies verified identity context to the Backend. Feature 009 consumes that result; it neither authenticates the user anew nor replaces Feature 007.

The Shinmone reference integration depends on the accepted Feature 007 native-credential boundary amendment. For that provider only, the exact native bearer first goes from the Customer-local Identity Bridge to the configured MenuDetail endpoint for validity and identity admission. Only after both succeed may the Bridge hand the same bearer and bounded provider-owned admission data to the exact deployment-owned, authenticated Customer-local Connector Runtime binding endpoint. This changes the permitted Customer-local credential destination, not Feature 007 identity/admission authority. No third destination, retry, fallback, RefreshToken handoff, Browser-selected context, or central native-credential path is permitted. Other Customer integrations may use another registered trusted Customer-local binding-bootstrap provider and credential source without adopting MenuDetail or Feature 007 token semantics.

Feature 008 is complete and accepted. Feature 009 consumes these contracts without redesigning them:

| Accepted Feature 008 contract | Feature 009 use |
| --- | --- |
| `HostIntegrationContext` | Supplies verified Customer, integration, HostApp, organization, actor, permission, and request-correlation context. |
| `TransientConnectorContext` and `connectorContextRef` | Carry only the transient opaque Customer-local binding reference to the selected adapter execution. |
| `DataAdapter` | Provides the central integration point for the Feature 009 transport adapter. |
| `DataAdapterRegistry` and exact `DataAdapterRegistration` | Select one active compatible adapter from trusted Customer, integration, HostApp, and connector registration. |
| Canonical `ToolDefinition` | Remains the operation and input/output contract authority. |
| Structured arguments | Remain the only permitted operation arguments after validation. |
| `ToolDefinition.outputSchema` | Remains final result-release authority. |
| `SafeProjectedAdapterResult` | Remains the only adapter-derived fact set eligible for downstream use. |
| `EvidenceRef` and `GroundedAnswerInput` | Remain the evidence and grounded-answer boundaries. |
| Existing ToolCall lifecycle | Remains `blocked`, `started`, `completed`, or `failed`. |
| `ToolDefinition.timeoutMs` | Remains the central operation deadline authority. |

Feature 009 may add the reusable transport adapter, Customer-local runtime, and deployment/integration configuration needed behind this seam. It must not introduce parallel identity, operation, adapter-selection, projection, evidence, or public-response authority.

## Trust and Authority Model

| Semantic | Authority | Explicitly not authoritative |
| --- | --- | --- |
| User identity | Accepted Gateway/Feature 007 trusted identity context | Browser claims, Customer-local request fields, `connectorContextRef` |
| Customer | Existing `IntegrationBinding` and accepted trusted context | Browser, connector endpoint, manifest, native credential, `connectorContextRef` |
| Host application | Existing trusted binding/context | Browser `hostApp`, adapter metadata alone, manifest, `connectorContextRef` |
| Organization and actor | Accepted verified identity context | Browser `organizationId`/`userId`, native API response, `connectorContextRef` |
| Permission to invoke | Existing Customer Tool policy and Feature 008 permission precheck | Connector Runtime, Browser, model, native Customer API |
| Canonical operation and argument contract | Resolved `ToolDefinition` | Browser URL/path/method, model-generated command, connector manifest |
| Adapter selection | Feature 008 `DataAdapterRegistry` using exact trusted registration | Browser, model, `connectorContextRef`, Customer API |
| Central connector destination | Trusted deployment configuration | Browser/model input, operation arguments, response data |
| Customer-local operation mapping | Trusted Feature 009 operation manifest | Browser/model URL, arbitrary request headers, arbitrary method/path/query |
| Customer credential validity and use | Registered Customer-local bootstrap/credential provider, application strategy, and Customer API | Central Assistant, generic runtime assumptions about token type, Browser-supplied operation arguments |
| Final business-field release | `ToolDefinition.outputSchema` through Feature 008 projection | Customer-local minimization alone, Browser visible fields, raw Customer response |
| Evidence truth | `SafeProjectedAdapterResult` attached through existing evidence flow | Raw Customer payload, `connectorContextRef`, Browser page data |

Browser authority for every row above is none. `connectorContextRef` authority for every row above is none.

## Central Platform Responsibilities

The central Feature 009 side must:

- Integrate only through the selected Feature 008 `DataAdapter` and the existing runtime sequence.
- Resolve the Customer-local Connector Runtime destination only from trusted deployment configuration associated with the exact Customer, integration, HostApp, connector registration, and connector instance.
- Authenticate every server-to-server invocation and protect its integrity, freshness, replay boundary, and intended Customer/integration/connector audience.
- Carry trusted correlation/request identifiers for safe end-to-end tracing without using them as identity or authorization authority.
- Send only the canonical named operation, validated structured arguments, the transient opaque `connectorContextRef`, the minimum trusted binding claims needed for local comparison, and transport-security proof.
- Enforce `ToolDefinition.timeoutMs` and configured bounded request/response sizes.
- Reject any Browser-, model-, or argument-supplied destination, scheme, host, port, path, query, method, header, or credential.
- Apply a fail-closed redirect and destination policy and prevent the adapter from becoming SSRF infrastructure.
- Normalize network, authentication, binding, replay, timeout, upstream, and malformed-response failures into bounded internal failure categories without disclosing topology, credentials, raw responses, or another Customer's existence.
- Keep Customer-native credentials, native sessions, credential refresh, and Customer API authentication entirely outside the central platform.

## Customer-local Connector Responsibilities

The Customer-local Feature 009 side must:

- Be independently deployable within a Customer-controlled environment and separately configurable from the central Assistant.
- Possess a unique connector instance identity bound to exactly one approved deployment context or an explicitly enumerated set of approved contexts.
- Authenticate the central caller and validate integrity, freshness, replay status, Customer, integration, HostApp, and connector audience before resolving local context or contacting a Customer API.
- Resolve `connectorContextRef` only within the exact intended Customer/integration/HostApp and, where required by the binding model, actor/session context.
- Enforce binding existence, expiry, revocation, and the approved replay/reuse model.
- Resolve a protected provider-owned credential handle through a registered Customer-local `CredentialProvider`, then apply execution-scoped material through a registered closed `CredentialApplicationStrategy`; credential lookup, use, refresh coordination if needed, and revocation remain entirely within the Customer environment.
- Accept binding creation only from an exact deployment-configured `BindingBootstrapProvider` service profile whose bounded provider payload passes its registered closed schema; Feature 007 Identity Bridge is the Shinmone provider, not a universal runtime dependency.
- Resolve only a manifest-declared operation and map it to a fixed, trusted upstream behavior.
- Obtain a closed read-request profile, upstream destination, fixed path/query/body mapping, required safe headers, credential profile, extraction rule, and limits only from trusted Customer-local configuration.
- Validate upstream content type, status, response shape, and size; minimize the result to the bounded business response required by the named operation.
- Return only the bounded operation response or a safe normalized error, never a native credential, raw session material, arbitrary upstream headers, or unrestricted upstream body.
- Expose health and readiness signals that disclose no Customer data, credential, binding reference, operation arguments, or sensitive topology.

## connectorContextRef Lifecycle Requirements

`connectorContextRef` is opaque, short-lived, Customer-local binding reference data with capability-like sensitivity. It is not an identity, Customer, integration, HostApp, actor, permission, adapter-selection, operation, or native-credential authority.

Feature 009 explicitly permits the minimal additive Customer-side integration needed to request or mint a trusted Customer-local connector binding, obtain the resulting opaque `connectorContextRef`, and attach that reference to the already accepted Feature 008 transient request field. A deployment must select an exact registered `BindingBootstrapProvider` and service-authentication profile. The provider validates a bounded sensitive provider payload under a closed provider-owned schema and creates a protected credential handle without exposing the payload to the central platform, manifest, generic operation arguments, or observability. The accepted Feature 007 Bridge and amendment are the selected Shinmone bootstrap implementation only. This allowance does not redesign Feature 007 identity/admission authority, grant the Browser identity or authorization authority, change the Assistant public API, broaden the SDK public contract, or alter Feature 008 transient handling.

Its required lifecycle is:

1. A deployment-configured trusted Customer-local bootstrap provider creates or binds the reference only after it has an already trusted Customer-local user/session context; no particular identity product, token type, or bootstrap participant is universal.
2. The generic binding records or cryptographically represents the exact Customer, integration, HostApp, connector instance, required actor/organization constraints, binding and credential generations, expiry/revocation/lease state, provider key, protected opaque credential handle, and bounded provider-owned metadata. Customer-specific attributes such as Shinmone `acceptedEntry` remain inside the owning provider representation rather than mandatory generic fields.
3. The raw reference contains no AccessToken, RefreshToken, session cookie, native JWT, API key, Customer signing secret, or reversibly encoded form of such material.
4. Feature 008 carries the reference only as transient request state to the one selected adapter execution.
5. The central transport conveys it only to the trusted Connector Runtime selected from deployment configuration and never uses it to select a Customer, endpoint, connector, adapter, or operation.
6. The Customer-local runtime accepts it only after central service authentication and exact trusted-context comparison succeed.
7. The binding expires after a bounded lifetime, can be shortened by a provider-supplied credential-expiry cap, can be revoked before expiry, and cannot be used outside its approved one-shot, TTL-reuse, or session-bound model. The generic runtime does not parse a native JWT or assume a refresh model.
8. Replay outside the selected validity model, including duplicate one-shot use or use after expiry/revocation, fails closed before credential resolution or Customer API access.
9. A reference cannot resolve across Customer, integration, HostApp, connector instance, actor, or session boundaries that form part of its binding.
10. Missing, blank, malformed, unknown, expired, revoked, replayed, mismatched, or otherwise unusable references fail safely without fallback to another binding, identity, credential, adapter, connector, or source.
11. The raw reference must not be logged, placed in general business persistence, written to audit events, included in telemetry or snapshots, or exposed through `ToolCall`, `EvidenceRef`, `GroundedAnswerInput`, model input, prompts, SSE, history, or public responses. A Customer-local binding mechanism may retain only the minimum protected state or one-way verifier needed to resolve and revoke a binding; the exact state model is a design decision.

## Service Authentication Requirements

Every central-to-connector business invocation must be an authenticated server-to-server request. The accepted mechanism must provide:

- Strong proof that the caller is an approved central Assistant service.
- Request integrity covering the canonical operation, validated arguments, binding context, audience, correlation data, and freshness/replay data.
- A bounded validity window and verifiable freshness.
- Replay detection or protocol semantics that prevent reuse outside the approved request and binding validity model.
- Exact Customer, integration, connector instance, and intended audience binding; HostApp must also be bound where one connector deployment can serve more than one HostApp.
- Rotation of trust material without accepting unknown, retired, or wrong-context material.
- Fail-closed rejection of unsigned, altered, expired, premature, replayed, wrong-audience, wrong-Customer, wrong-integration, wrong-HostApp, and wrong-connector requests before binding resolution or upstream access.
- No authentication secret, proof-generation key, or service credential exposure to the Browser.

The specification does not select mTLS, signed JWT, message signing, or another mechanism. The design must choose one mechanism that proves all properties above and does not duplicate Feature 007 user authentication.

## Operation Manifest Requirements

The Customer-local Connector Runtime must use a trusted fixed operation manifest or registry. A manifest entry represents one canonical operation and must define, directly or through trusted references:

- The exact canonical operation key and supported contract version.
- The permitted structured argument contract and any mapping from approved arguments to upstream values.
- The configured upstream service/destination reference.
- One closed read-request profile: `GET_QUERY_V1` or `POST_QUERY_JSON_V1`; a fixed relative path; fixed values; and only schema-bound allowlisted argument mappings into query values or a bounded JSON object as permitted by that profile.
- A `credentialProfileRef` resolved at startup through the Customer-local `CredentialProfileRegistry`; the referenced profile binds one registered `CredentialProvider` to one registered compatible `CredentialApplicationStrategy` without embedding credential material or caller-controlled header behavior.
- The expected upstream status, content type, and response shape.
- The extraction/minimization rule for the bounded business response.
- Request, response, item, string, and operation timeout limits that cannot exceed central policy.
- Safe local error mappings and readiness dependencies.

The runtime must require an exact manifest match for the canonical operation received from the selected Feature 008 path. It must reject unknown versions, missing or ambiguous entries, unapproved arguments, and any attempt to override configured behavior.

`GET_QUERY_V1` derives GET semantics from the profile and permits no body. `POST_QUERY_JSON_V1` derives POST semantics from the profile and constructs a JSON object only from declared fixed literals and named values already validated by the ToolDefinition and manifest schemas. Both are read-only, versioned, bounded, and fail closed. Neither authorizes an arbitrary method, free-form body, template, URL, header, redirect, callback, or side effect.

The manifest must never authorize arbitrary Browser or model-supplied URLs, methods, headers, paths, queries, generic `fetch(url)`, SQL, shell commands, free-form connector commands, or Customer credentials supplied as operation arguments. Adding another request or credential-application mechanism requires a reusable versioned profile or Customer-local provider extension, never a Customer-specific branch in Assistant core, the central adapter, generic transport, or generic runtime orchestration.

## Network Safety Requirements

- Central connector destinations must originate only from trusted deployment configuration and must be bound to the exact registered Customer, integration, HostApp, connector, and instance.
- Customer-local outbound destinations must originate only from trusted connector configuration and the selected manifest entry.
- Callers must not inject or override destination IPs, hosts, ports, schemes, paths, methods, redirects, proxy behavior, or name-resolution results.
- Only explicitly supported secure schemes are permitted.
- Redirects are denied by default; any future exception requires an explicitly trusted destination policy that revalidates every hop and cannot be enabled by operation input.
- Loopback, link-local, metadata-service, private, reserved, and other sensitive address ranges must be denied unless the deployment explicitly requires and authorizes the exact destination class. A broad private-network allowance is insufficient.
- Destination validation must remain effective across name resolution and connection so that DNS rebinding or equivalent resolution changes cannot bypass the configured destination policy.
- Unexpected content type, malformed response, unsupported encoding, oversized request/response, excessive nesting/items/strings, timeout, connection failure, and partial response must fail closed.
- V1 redirects and retries are denied. Any later exception requires a separately approved reusable profile that remains within `ToolDefinition.timeoutMs`, preserves replay/idempotency safety, and never broadens destination or operation.
- Safe failures must reveal no internal hostname, address, upstream path, credential, request signature, raw payload, or another Customer's existence.

## Credential Isolation Requirements

The following Customer-native material must never cross into the central Assistant platform:

- AccessToken
- RefreshToken
- session cookie
- native JWT
- API key
- Customer signing secret

Native material must remain Customer-side during creation, lookup, use, refresh, rotation, expiry, revocation, error handling, and operational inspection. It must not appear in `connectorContextRef`, deployment data available centrally, operation arguments, transport errors, ToolCall data, evidence, grounded-answer input, model input, prompts, SSE, public responses, central logs, audit, telemetry, snapshots, or persistence.

The central platform may receive only accepted trusted identity context, the transient opaque `connectorContextRef`, authenticated service-transport data, and a bounded safe Customer connector business response. Browser-supplied token-shaped values or credentials in any operation field must be rejected before connector invocation.

## Result / Evidence Boundary

The Customer-local runtime may validate, extract, and minimize an upstream response to reduce transport risk. That local processing is not final release authorization.

The central transport response remains execution-local adapter output until Feature 008:

1. validates it against the canonical `ToolDefinition.outputSchema` contract;
2. applies the server-owned default-deny output policy;
3. applies permission-aware masking and configured limits;
4. creates `SafeProjectedAdapterResult`; and
5. attaches eligible `EvidenceRef` data and constructs `GroundedAnswerInput`.

If any step fails, no raw, partial, locally minimized but unapproved, or unauthorized field may reach ToolCall output, persistence, audit, logs, evidence, model input, SSE, or a public response.

For the Shinmone reference operation, `newOrders.current` may become a projected fact only when the canonical ToolDefinition output contract and policy explicitly permit it. The public answer is grounded only in the resulting Feature 008 evidence.

## Failure Semantics

Feature 009 preserves the Feature 008 ToolCall lifecycle and existing public outcomes.

| Condition | Business-data access | ToolCall behavior | Existing public behavior |
| --- | --- | --- | --- |
| Permission denied or invalid canonical arguments | None | Existing `blocked` semantics before Feature 009 invocation | Existing `permission_denied` or safe validation/no-answer behavior |
| Connector binding missing, malformed, expired, revoked, replayed, or mismatched | None, unless failure is detected after a safe local lookup; no upstream access | `started` then `failed` | Existing `no_answer` with bounded `tool_failure` semantics |
| Central service authentication invalid, expired, replayed, or wrong-audience | None | Central attempt fails; any existing ToolCall is `failed` safely | Existing `no_answer`/`tool_failure`; no authentication detail |
| Connector unavailable or unhealthy | None | `started` then `failed` | Existing `no_answer`/`tool_failure` |
| Customer API timeout, connection failure, unsafe redirect, or destination-policy rejection | Attempted only after all prior checks | `started` then `failed` | Existing `no_answer`/`tool_failure` |
| Customer API malformed, wrong-content-type, or oversized response | Attempted; raw response remains local/transient | `started` then `failed` | Existing `no_answer`/`tool_failure` |
| Central response validation, projection, masking, or minimization failure | Attempted; raw adapter result remains execution-local | `started` then `failed` | Existing `no_answer`/`tool_failure` |
| Valid projected result without usable evidence | Completed | `completed` with safe summary | Existing `no_answer` behavior |
| Valid projected evidence | Completed | `completed` with safe summary | Existing grounded answer and SSE behavior |

Failure messages and audit metadata may include only approved bounded categories, correlation identifiers, canonical operation identity, safe outcome, and duration. They must not include `connectorContextRef`, credentials, full arguments, signatures, endpoint details, raw or partial upstream bodies, schema internals, or cross-Customer existence signals.

## Reference Integration: Shinmone SCM

Shinmone SCM is the first reference integration, not an Assistant-core or generic-runtime branch. Its Feature 007 Bridge bootstrap, `nativeAccessToken`, `acceptedEntry`, native JWT expiry cap, bearer application, refresh/remint behavior, endpoint, extraction, and SPA delivery are Customer integration/provider details. Removing or disabling all of them must leave the generic Feature 009 runtime usable by another Customer integration.

| Reference item | Configuration-owned value |
| --- | --- |
| Product question | `這個月新增幾張工單？` |
| Canonical operation | `work-orders.monthly-new-count` |
| Upstream method/path | `GET /Dashboard/KPIStats` |
| Fixed query | `TimeRange=thisMonth` |
| Required business value | `newOrders.current` |
| Read-request profile | `GET_QUERY_V1` |
| Credential profile | Shinmone provider-owned bearer profile |

The first live vertical slice must begin with the actual Assistant user question and follow this path:

```text
User: 「這個月新增幾張工單？」
→ existing generic Query Understanding / Planning
→ candidate ToolDefinition key
→ resolved ToolDefinition: work-orders.monthly-new-count
→ Feature 008 permission precheck and DataAdapterRegistry selection
→ Feature 009 central transport adapter
→ authenticated Customer-local Connector Runtime
→ trusted operation manifest
→ GET /Dashboard/KPIStats?TimeRange=thisMonth
→ newOrders.current
→ Feature 008 projection / EvidenceRef / GroundedAnswerInput
→ existing Assistant answer/SSE
```

The existing generic Query Understanding/Planning path, or a reusable Customer-neutral extension of it, must discover the candidate ToolDefinition. A design may use ToolDefinition/catalog-driven discovery, generic tool-mapping configuration, reusable query-understanding registration, or another Customer-neutral mechanism selected after source inspection. Query text proposes a candidate only; the resolved `ToolDefinition` remains canonical operation authority.

The operation manifest maps the canonical operation to the configured endpoint and fixed query. Browser or model input cannot replace the path, query, method, destination, or credential. The first slice does not require broad Shinmone API coverage or side-effecting operations.

The reference integration must prove:

1. `connectorContextRef` resolves only Customer-side.
2. The native Shinmone token remains Customer-side.
3. A valid central service request authenticates successfully.
4. Wrong, replayed, and expired central requests fail before Customer API access.
5. Only `work-orders.monthly-new-count` executes for this slice.
6. The upstream request uses the configured KPI endpoint and `TimeRange=thisMonth` mapping.
7. `newOrders.current` can reach Feature 008 projection and evidence when allowed by the ToolDefinition policy.
8. Cross-Customer, cross-integration, cross-HostApp, cross-connector-instance, and binding-context references fail closed.
9. No Browser-provided API path, URL, query, method, header, or native token can redirect execution.
10. The existing public Assistant answer can use the live projected value without a new public API or SSE contract.

### Productized Portability Acceptance

Synthetic Customer B is a required executable acceptance fixture, not merely an isolation negative. It must differ from Shinmone in Customer/integration/HostApp tuple, connector instance, canonical ToolDefinition, discovery metadata, manifest mapping, endpoint/path/result shape, credential provider and source semantics, credential application, and output policy. Its canonical operation is `inventory.stock-on-hand`; it uses a fixed `POST_QUERY_JSON_V1 /inventory/stock/query` mapping with only a schema-validated `sku`, a provider-owned opaque handle to a fixture API key, a fixed allowlisted strategy that alone writes `X-Inventory-Key`, and a bounded `{ sku, quantity }` result.

Customer B must use the same shared connector-runtime contract package, `ProductizedBusinessConnectorAdapter`, `ConnectorDeploymentRegistry`, generic Connector Runtime modules, service-authentication protocol, Feature 008 execution/projection path, and generic discovery algorithm. It must add no Customer/HostApp conditional to Assistant core or generic runtime, alternate execution path, public API, generic HTTP/SQL/command capability, or caller-selected credential behavior.

The portability gate removes or disables every Shinmone provider, manifest, deployment, ToolDefinition/policy, and SPA fixture, then proves shared contracts, the generic runtime, and central productized modules still build/pass and the complete Customer B fixture still executes without an Assistant-core source change.

## User Stories

### User Story 1 — Manage a Customer-local Connector Binding (Priority: P1)

As trusted Customer-local infrastructure, I can create, expire, revoke, and safely resolve a connector binding for an already trusted user/session so the Assistant can request authorized local data without receiving native credentials.

**Why this priority**: The binding is the core credential-isolation seam.

**Independent Test**: Create one binding, verify valid resolution in its intended context, then verify expiry, revocation, replay violation, and every context mismatch fails before upstream access.

**Acceptance Scenarios**:

1. **Given** an already trusted Customer-local user/session context, **When** trusted local infrastructure creates a binding, **Then** it produces an opaque short-lived reference containing no native credential material and binds it to the intended context.
2. **Given** a valid binding, **When** it is resolved within its approved validity model and exact context, **Then** only the Customer-local runtime can locate the corresponding local access context.
3. **Given** an expired, revoked, replayed, unknown, or mismatched binding, **When** resolution is attempted, **Then** it fails before credential resolution or upstream access and never falls back.

---

### User Story 2 — Invoke a Connector Through Authenticated Service Transport (Priority: P1)

As the central Assistant runtime, I can invoke the configured Customer-local Connector Runtime with authenticated, integrity-protected, fresh, audience-bound request semantics.

**Why this priority**: A remote local runtime cannot be trusted without service identity and replay protection.

**Independent Test**: Send valid, unsigned, altered, expired, replayed, premature, and wrong-audience requests and verify only the valid exact-context request reaches binding resolution.

**Acceptance Scenarios**:

1. **Given** a trusted connector deployment, **When** the central adapter sends a valid request, **Then** the Customer-local runtime verifies caller, integrity, freshness, audience, and context before doing other business work.
2. **Given** an unsigned, altered, expired, premature, replayed, or wrong-audience request, **When** it reaches the runtime, **Then** it is rejected before binding or Customer API access.
3. **Given** trust material rotates, **When** active and retired material are presented, **Then** active approved material works and unknown or retired material fails closed.

---

### User Story 3 — Execute Only a Fixed Named Operation (Priority: P1)

As a platform operator, I can register a fixed Customer-local operation mapping so validated canonical operations reach only their preconfigured upstream behavior.

**Why this priority**: Fixed mappings prevent the connector from becoming arbitrary execution infrastructure.

**Independent Test**: Invoke a registered operation and then attempt URL, method, path, header, query, SQL, shell, and credential overrides.

**Acceptance Scenarios**:

1. **Given** one exact manifest entry and valid structured arguments, **When** the canonical operation is invoked, **Then** only its configured upstream behavior executes.
2. **Given** an unknown, missing, ambiguous, or unsupported-version operation, **When** invocation is attempted, **Then** it fails before upstream access.
3. **Given** arbitrary network, SQL, command, or credential material in Browser/model input or structured arguments, **When** validation occurs, **Then** it cannot alter or create an executable operation.

---

### User Story 4 — Keep Native Credentials Customer-side (Priority: P1)

As a Customer security owner, I can keep native credentials and sessions entirely within the Customer environment while allowing the central Assistant to receive safe business results.

**Why this priority**: Native credential isolation is non-negotiable product policy.

**Independent Test**: Place distinct sentinels in every native credential class, execute success and failure paths, and inspect all central ingress, persistence, logs, audit, telemetry, ToolCall, evidence, model, SSE, and response surfaces.

**Acceptance Scenarios**:

1. **Given** a valid local credential, **When** a named operation runs, **Then** the credential is resolved and used only Customer-side.
2. **Given** success or failure, **When** central and public surfaces are inspected, **Then** no native credential or reversible encoding is present.
3. **Given** a credential-shaped operation argument, **When** invocation is attempted, **Then** it is rejected before connector access.

---

### User Story 5 — Enforce Customer, Integration, and Host Isolation (Priority: P1)

As a platform security owner, I can prove that connector destinations and bindings cannot be used across Customer, integration, HostApp, connector-instance, actor, or session boundaries.

**Why this priority**: A binding collision must never cross the platform's outer Customer boundary.

**Independent Test**: Use two Customers with intentionally identical organization, actor, HostApp, and reference-looking values, then vary each trusted boundary independently.

**Acceptance Scenarios**:

1. **Given** a reference bound for one Customer, **When** it is used with another Customer while other identifiers match, **Then** it fails before local credential or data access.
2. **Given** correct Customer but wrong integration, HostApp, connector instance, actor, or required session binding, **When** invocation occurs, **Then** it fails closed without revealing which field mismatched.
3. **Given** Browser claims matching a desired foreign context, **When** they conflict with trusted context, **Then** they establish no authority and cannot redirect selection or resolution.

---

### User Story 6 — Bound Time, Network, Replay, and Error Behavior (Priority: P1)

As an operator, I receive deterministic safe outcomes when the connector, network, binding, or Customer API is unavailable or unsafe.

**Why this priority**: Remote dependencies must not cause unbounded execution, SSRF, information disclosure, or a new public failure protocol.

**Independent Test**: Exercise timeout, oversized payload, redirect, DNS/address-policy violation, unexpected content type, malformed response, unavailable runtime, replay, and normalized-error cases.

**Acceptance Scenarios**:

1. **Given** a configured operation deadline and size bounds, **When** any limit is exceeded, **Then** execution terminates safely with no partial data release.
2. **Given** a redirect, untrusted destination, unsupported scheme, or unsafe resolution, **When** network access is attempted, **Then** it fails closed without following or disclosing the destination.
3. **Given** any transport or upstream failure, **When** the Assistant completes the request, **Then** existing ToolCall and no-answer/tool-failure semantics are preserved.

---

### User Story 7 — Query Shinmone Monthly New Work Orders (Priority: P2)

As an authorized Shinmone SCM user, I can ask `這個月新增幾張工單？` and have the configured reference operation obtain the current monthly new-work-order count from the real Customer API.

**Why this priority**: It proves the generic runtime against the first real integration without expanding scope to all Shinmone APIs.

**Independent Test**: Begin with the actual Assistant question, verify the generic Query Understanding/Planning path discovers and resolves `work-orders.monthly-new-count`, then verify the exact configured KPI mapping returns a bounded value while all attempted overrides fail. Direct named-operation invocation remains valid as separate lower-level coverage but is not sufficient as the end-to-end proof.

**Acceptance Scenarios**:

1. **Given** valid trusted context, permission, binding, service authentication, and Shinmone local credential, **When** the user asks `這個月新增幾張工單？`, **Then** the generic Query Understanding/Planning path discovers the candidate key, resolves canonical ToolDefinition `work-orders.monthly-new-count`, and proceeds through Feature 008 before the local runtime uses `GET /Dashboard/KPIStats?TimeRange=thisMonth` from configuration and extracts the bounded `newOrders.current` result.
2. **Given** the Browser or model supplies another URL, path, query, method, token, or Shinmone operation, **When** the request is processed, **Then** the configured monthly-count behavior cannot be changed.
3. **Given** no manifest entry for another Shinmone API, **When** it is requested, **Then** the runtime rejects it without generic fallback.

---

### User Story 8 — Produce an Existing Grounded Assistant Answer (Priority: P2)

As an authorized Customer user, I receive an answer grounded in the real projected business result through the existing Assistant message and SSE experience.

**Why this priority**: The product outcome is an evidence-backed answer, not a transport response.

**Independent Test**: Run the vertical slice and inspect each boundary from permission precheck through final SSE while capturing prohibited raw and transient values.

**Acceptance Scenarios**:

1. **Given** a valid bounded connector result, **When** Feature 008 applies `ToolDefinition.outputSchema`, **Then** only approved facts become `SafeProjectedAdapterResult`, `EvidenceRef`, and `GroundedAnswerInput`.
2. **Given** approved projected `newOrders.current` evidence, **When** the Assistant answers, **Then** the existing public answer and SSE contract reports the grounded monthly count.
3. **Given** projection, masking, minimization, or evidence creation cannot safely complete, **When** the request finishes, **Then** no raw result is released and existing no-answer/tool-failure behavior is used.

### Edge Cases

- The central destination registration is missing, inactive, ambiguous, mismatched, or not ready.
- More than one connector instance appears eligible for the same exact registration.
- The operation exists centrally but is absent, inactive, duplicated, or version-incompatible in the local manifest.
- The binding expires or is revoked between central selection and Customer-local resolution.
- The same authenticated transport request is delivered twice concurrently.
- Trust or signing material rotates while a request is in flight.
- Customer-local credential material is expired, revoked, missing, or refreshed concurrently.
- A provider omits a credential-expiry cap, supplies an already-expired cap, returns an unknown handle, or becomes unavailable after a binding lease is acquired.
- A manifest references an unregistered or provider-incompatible credential profile or attempts to choose an application header.
- A `POST_QUERY_JSON_V1` mapping contains an undeclared field, unrestricted object, template, side-effect classification, or value not validated by both schemas.
- The upstream Customer API returns a success status with the wrong content type or malformed body.
- The upstream response is valid but lacks `newOrders.current`, contains a non-numeric value, or exceeds bounds.
- The connector returns a bounded response that fails the central ToolDefinition output contract or release policy.
- DNS resolution changes between validation and connection, or a redirect targets an unapproved address class.
- Two Customers use identical organization, actor, HostApp, operation, and reference-looking values.
- Shinmone configuration is absent while the generic runtime and Synthetic Customer B remain enabled.
- Health/readiness is reachable but must not expose Customer data, secrets, references, operations, or sensitive topology.

## Functional Requirements

- **FR-001**: The system MUST provide one reusable central transport adapter and one independently deployable Customer-local Connector Runtime behind the accepted Feature 008 `DataAdapter` seam.
- **FR-002**: The system MUST execute real connector reads only through the existing Feature 008 permission precheck, exact `DataAdapterRegistry` selection, ToolCall, projection, evidence, grounded-answer, and public answer/SSE path.
- **FR-003**: The system MUST resolve the central connector destination only from trusted deployment configuration bound to the exact Customer, integration, HostApp, connector, and connector instance.
- **FR-004**: Every central-to-connector business request MUST be authenticated server-to-server and provide integrity, freshness, replay resistance, and exact audience/context binding.
- **FR-005**: The Connector Runtime MUST reject unsigned, altered, expired, premature, replayed, wrong-audience, wrong-Customer, wrong-integration, wrong-HostApp, and wrong-connector requests before binding or Customer API access.
- **FR-006**: Service trust MUST support planned key or secret rotation and MUST fail closed for unknown and retired trust material.
- **FR-007**: Each invocation MUST carry or derive a trusted correlation/request identifier for tracing; that identifier MUST NOT establish identity, permission, binding, operation, or Customer authority.
- **FR-008**: Central requests MUST invoke only the canonical named operation resolved from `ToolDefinition` with structured arguments already validated by Feature 008.
- **FR-009**: Central execution MUST enforce `ToolDefinition.timeoutMs`; both sides MUST enforce configured request and response bounds no weaker than applicable central policy.
- **FR-010**: Central and local network destinations MUST originate only from their respective trusted deployment/connector configuration and MUST enforce the Network Safety Requirements.
- **FR-011**: Both sides MUST normalize failures to bounded safe categories without returning raw payloads, credentials, signatures, topology, or cross-Customer existence information.
- **FR-012**: Customer-native credentials, sessions, refresh behavior, and Customer API authentication MUST remain exclusively Customer-side.
- **FR-013**: The platform MUST NOT provide arbitrary URL, method, path, query, header, SQL, shell, command, or credential forwarding.
- **FR-014**: `connectorContextRef` MUST remain an opaque, short-lived, sensitive transient Customer-local binding reference and MUST establish no authority by itself.
- **FR-015**: Only an exact deployment-configured and service-authenticated Customer-local `BindingBootstrapProvider` MAY mint or bind `connectorContextRef`, and only for an already trusted Customer-local identity/session context; no specific identity product, token type, or participant is universal.
- **FR-016**: Each generic binding MUST be constrained to the exact Customer, integration, HostApp, connector instance, required actor/organization dimensions, binding and credential generations, expiry/revocation/lease state, provider key, and protected credential handle. Customer-specific attributes MUST remain bounded provider-owned state rather than mandatory generic fields.
- **FR-017**: Every binding MUST have a bounded expiry, MAY be shortened by a provider-supplied credential-expiry cap, and MUST support revocation before expiry without requiring the generic runtime to parse a native JWT or implement Customer-specific refresh behavior.
- **FR-018**: Every binding MUST enforce the selected one-shot, TTL-reuse, or session-bound replay model and reject use outside that model.
- **FR-019**: Binding resolution MUST fail closed for missing, blank, malformed, unknown, expired, revoked, replayed, mismatched, or unusable references without fallback.
- **FR-020**: A raw `connectorContextRef` MUST NOT embed native credential material or enter central persistence, logs, audit, telemetry, ToolCall, evidence, grounded-answer, prompt/model, SSE, history, or public-response surfaces.
- **FR-021**: The Customer-local runtime MUST prove that the binding belongs to the already trusted central user/session context by comparing authenticated, integrity-protected context with trusted local binding state; Browser claims MUST provide no proof or authority.
- **FR-022**: The Customer-local runtime MUST use an exact trusted operation manifest/registry and fail closed when an operation entry is missing, ambiguous, inactive, or version-incompatible.
- **FR-023**: Each manifest entry MUST select one supported closed read-request profile, fix or tightly map the permitted upstream destination/path/query/body values, reference one startup-validated `credentialProfileRef`, and define argument mapping, response contract, extraction, limits, and safe errors without caller-selected method, headers, credential behavior, or executable configuration.
- **FR-024**: Validated operation arguments MAY select only values explicitly permitted by the manifest contract and MUST NOT override destination, method, unrestricted path/query/header data, credential, or executable behavior.
- **FR-025**: After service authentication, replay, context, binding, manifest, and argument validation succeed, the Customer-local runtime MUST resolve a protected handle through the registered `CredentialProvider` and apply execution-scoped material only through the compatible registered `CredentialApplicationStrategy`; neither interface may release credential material centrally or to manifest/caller data.
- **FR-026**: The Customer-local runtime MUST validate upstream status, content type, response shape, and configured bounds before returning a minimized business response.
- **FR-027**: Local extraction/minimization MUST NOT replace or weaken final central result authorization through `ToolDefinition.outputSchema` and Feature 008 projection.
- **FR-028**: Raw or locally minimized but unapproved Customer API data MUST NOT bypass `SafeProjectedAdapterResult` into ToolCall, `EvidenceRef`, `GroundedAnswerInput`, model input, SSE, or public response.
- **FR-029**: The Customer-local runtime MUST expose health and readiness behavior that safely represents required dependency state without disclosing sensitive data or configuration.
- **FR-030**: Deployment configuration MUST cover Customer, integration, HostApp, central and binding-bootstrap service trust, connector instance identity, Customer upstream base destination, operation manifest, registered bootstrap provider, credential provider/profile/application strategy, timeouts, limits, health, and readiness.
- **FR-031**: Native credentials and Customer signing secrets MUST NOT appear in central deployment configuration.
- **FR-032**: Connector failures after ToolCall start MUST use the existing failed lifecycle and bounded no-answer/tool-failure mapping; permission denial before invocation MUST retain existing blocked/permission-denied behavior.
- **FR-033**: Feature 009 MUST introduce no public Assistant endpoint, request mode, SSE event shape, AnswerDecision, or connector-specific failure mode.
- **FR-034**: The first reference operation MUST be `work-orders.monthly-new-count` and MUST map through trusted Shinmone-local configuration to `GET /Dashboard/KPIStats?TimeRange=thisMonth`.
- **FR-035**: The Shinmone reference response MUST make `newOrders.current` available only as a bounded adapter result eligible for Feature 008 output validation, projection, masking, evidence, and grounded answer.
- **FR-036**: The first Shinmone slice MUST prove the ten reference-integration outcomes listed in this specification and MUST NOT require broad Shinmone API coverage.
- **FR-037**: Customer onboarding MUST be classified as (1) configuration-only when existing bootstrap, credential, application, and request profiles suffice; (2) a Customer-local provider/plugin extension when a genuinely new credential mechanism is required; or (3) prohibited when it would add Customer/HostApp branching to Assistant core, the central adapter/transport, or generic runtime orchestration.
- **FR-038**: Feature 009 MUST remain read-oriented; no side-effecting Customer operation may be enabled under this feature.
- **FR-039**: Safe operational and audit events MUST correlate the canonical operation, approved trusted context, outcome, and duration while excluding the raw binding reference, credentials, full arguments, raw responses, and sensitive topology.
- **FR-040**: The first real-data vertical slice MUST resolve the user question `這個月新增幾張工單？` to canonical ToolDefinition `work-orders.monthly-new-count` through the existing generic Query Understanding/Planning path or a reusable Customer-neutral extension of that path. It MUST NOT require a Shinmone-, Customer-, HostApp-, endpoint-, credential-, or phrase-specific branch in Assistant core; natural-language text and discovered candidates MUST NOT replace the resolved ToolDefinition as operation authority.
- **FR-041**: Generic Feature 009 binding and credential contracts MUST use registered Customer-local bootstrap, credential-provider, credential-handle, credential-profile, and application-strategy abstractions; Feature 007 Bridge, MenuDetail, `nativeAccessToken`, `acceptedEntry`, bearer application, native JWT expiry, and Shinmone refresh/remint semantics MUST remain reference-provider details.
- **FR-042**: V1 MUST support only `GET_QUERY_V1` and `POST_QUERY_JSON_V1` as closed read-only request profiles. `POST_QUERY_JSON_V1` MUST construct a bounded object solely from fixed literals and schema-validated named argument mappings and MUST NOT enable arbitrary bodies, templates, methods, headers, URLs, or side effects.
- **FR-043**: An executable Synthetic Customer B `inventory.stock-on-hand` fixture MUST use a distinct Customer/integration/HostApp tuple, connector instance, discovery metadata, `POST_QUERY_JSON_V1` manifest, endpoint/result shape, provider-owned API-key handle, fixed `X-Inventory-Key` application strategy, and `{ sku, quantity }` output policy through the same shared contracts, adapter, deployment registry, generic runtime, service-auth protocol, Feature 008 path, and discovery algorithm.
- **FR-044**: Disabling or removing all Shinmone bootstrap-provider, credential-profile, manifest, deployment, ToolDefinition/policy, and SPA artifacts MUST leave shared connector contracts, generic runtime, central productized modules, and the Synthetic Customer B vertical fixture buildable and passing without Assistant-core source modification.

## Security Requirements

- **SR-001**: Customer is the outer isolation boundary. Tests MUST use at least two Customers with intentionally identical subordinate identifiers and prove all cross-Customer access fails closed.
- **SR-002**: Browser, SDK, Customer Host, model, native credential, and `connectorContextRef` values MUST NOT establish or override identity, Customer, integration, HostApp, organization, actor, permission, operation, adapter, destination, or result-release authority.
- **SR-003**: Native AccessToken, RefreshToken, session cookie, JWT, API key, and Customer signing secret MUST never cross into or be observable in the central platform.
- **SR-004**: `connectorContextRef` MUST contain no native credential or reversible credential encoding and MUST be absent from all prohibited surfaces.
- **SR-005**: Service authentication MUST protect caller identity, request integrity, freshness, replay status, and exact Customer/integration/connector audience before local binding resolution.
- **SR-006**: Identity/binding proof MUST be rooted in authenticated central context and trusted Customer-local binding state, never Browser-provided user, organization, role, or permission claims.
- **SR-007**: Binding resolution MUST enforce expiry, revocation, replay/reuse semantics, and every configured context boundary before native credential lookup.
- **SR-008**: Central and Customer-local networking MUST use configuration-owned destinations and fail closed against injection, unsupported schemes, unsafe redirects, DNS/rebinding bypass, and unapproved sensitive address ranges.
- **SR-009**: The runtime MUST reject arbitrary URL, HTTP method, headers, path, query, generic fetch, SQL, shell, command, and credential arguments before Customer API access.
- **SR-010**: Request, response, nesting, item, string, and duration bounds MUST prevent unbounded resource consumption and partial-result release.
- **SR-011**: Raw Customer API payloads and unapproved local results MUST remain transient and MUST never bypass Feature 008 projection.
- **SR-012**: Error normalization MUST prevent disclosure of credentials, references, signatures, full arguments, Customer data, endpoint/network details, schema internals, or another Customer's existence.
- **SR-013**: Health and readiness surfaces MUST provide no business operation capability and expose no Customer data, native credential, binding state, or sensitive topology.
- **SR-014**: No Customer identifier, HostApp, Shinmone endpoint/result/ID, native credential, operation-specific branch, or Customer-, HostApp-, endpoint-, credential-, or phrase-specific query-routing rule may be hard-coded into Assistant core or generic Feature 009 modules. Generic-source guards MUST cover the shared contract package, central productized connector modules, generic Customer-local runtime areas, Query Understanding, and generic Tools while exempting explicitly owned Customer integration directories. They MUST reject Shinmone-only `acceptedEntry` or mandatory `nativeAccessToken` assumptions without banning legitimately reusable connector-security terminology. Query understanding may propose a candidate only; the resolved `ToolDefinition` remains canonical operation authority.
- **SR-015**: All security-sensitive failures MUST be fail-closed; no mock, alternate connector, alternate binding, alternate credential, or unregistered operation fallback is permitted.

## Compatibility Requirements

- **CR-001**: Existing Feature 007 identity/admission authority, Gateway, canonical identity, session bootstrap, IntegrationBinding Customer authority, and allowedHostApp semantics MUST remain unchanged. The accepted Feature 007 compatibility amendment changes only the native credential's permitted Customer-local post-admission destination by allowing the exact authenticated Connector Runtime binding route.
- **CR-002**: Existing Feature 008 `HostIntegrationContext`, `TransientConnectorContext`, `DataAdapter`, `DataAdapterRegistry`, exact `DataAdapterRegistration`, ToolDefinition authority, structured arguments, projection, evidence, grounded-answer, ToolCall, and timeout semantics MUST remain authoritative.
- **CR-003**: Existing Assistant session creation, message submission, history, feedback, approvals, and SDK-facing contracts MUST remain compatible.
- **CR-004**: Existing public answer and SSE event shapes and sequencing MUST remain compatible for successful, permission-denied, no-answer, and tool-failure outcomes.
- **CR-005**: Connector-specific failures MUST map into existing `no_answer`, `tool_failure`, or `permission_denied` behavior as applicable, with no new public request mode or AnswerDecision.
- **CR-006**: Existing mock and other registered adapters MUST continue to use the same Feature 008 registry and projection path; the Feature 009 transport adapter MUST not become a default fallback.
- **CR-007**: Shinmone-specific endpoint, credential/bootstrap provider, `nativeAccessToken`, `acceptedEntry`, native expiry, bearer application, mapping, response, remint, and SPA details MUST remain removable reference integration configuration/provider code outside Assistant core and generic Connector Runtime modules.
- **CR-008**: If later design discovers an unavoidable public contract change, implementation MUST stop and record it as a blocker requiring explicit Feature 007/008 compatibility review; this specification authorizes no such change.
- **CR-009**: Feature 009 MAY include only the minimal additive Customer-side integration needed for an exact registered trusted local bootstrap provider to request or mint a connector binding, obtain its opaque `connectorContextRef`, and attach it to the existing Feature 008 transient request field. Feature 007 Bridge and its accepted post-admission native-token handoff are the Shinmone provider selection, not the universal bootstrap contract. This allowance MUST NOT redesign Customer or Feature 007 identity/admission authority, grant the Connector Runtime or Browser identity, permission, Customer, HostApp, operation, or destination authority, introduce a new Assistant public API, broadly redesign SDK/SPA contracts, expose a native credential centrally, or change Feature 008 transient handling.

```text
MINIMAL_CUSTOMER_INTEGRATION_ALLOWED=YES
CUSTOMER_IDENTITY_REDESIGN_ALLOWED=NO
ASSISTANT_PUBLIC_API_CHANGE_REQUIRED=NO
```

## Key Entities

- **Central Connector Transport Adapter**: The Feature 008 `DataAdapter` implementation that invokes one trusted Customer-local Connector Runtime and returns only an execution-local bounded business response for central projection.
- **Customer-local Connector Runtime**: Independently deployable Customer-side service that authenticates central requests, resolves local bindings and credentials, executes fixed manifest operations, and returns bounded safe outcomes.
- **Connector Deployment Configuration**: Trusted association among Customer, integration, HostApp, connector, connector instance, central and bootstrap-service trust, endpoint, operation manifest, registered provider/profile/strategy, limits, and readiness.
- **Connector Context Binding**: Short-lived, revocable, context-bound Customer-local association addressed through an opaque `connectorContextRef` and linked to local access context without embedding native credentials.
- **Binding Bootstrap Provider**: Registered Customer-local component that validates one bounded provider-specific bootstrap payload under an exact service-authentication profile and creates provider-owned credential state for a generic binding.
- **Credential Handle and Provider**: Opaque Customer-local handle plus its registered resolver; the provider alone translates the handle into execution-scoped credential material and supplies any credential-expiry cap.
- **Credential Profile and Application Strategy**: Startup-validated association from a manifest `credentialProfileRef` to exactly one compatible provider and one closed code-owned strategy that applies credential material to a fixed request without exposing headers or secrets to callers or manifests.
- **Service Authentication Proof**: Mechanism-specific proof that supplies authenticated caller, integrity, freshness, replay, and audience properties without becoming user identity authority.
- **Operation Manifest Entry**: Trusted fixed mapping from one canonical ToolDefinition operation and permitted structured arguments to bounded Customer-local upstream behavior.
- **Bounded Connector Result**: Validated and minimized Customer-local business response that is safe to transport but remains subject to Feature 008 output projection.
- **Safe Connector Failure**: Bounded non-sensitive failure category compatible with existing ToolCall and Assistant public outcome behavior.
- **Shinmone Monthly New Work Order Mapping**: First reference manifest entry mapping `work-orders.monthly-new-count` to the configured KPI endpoint and extracting `newOrders.current`.

## Success Criteria

- **SC-001 — REAL_DATA_PATH_READY**: One authorized live Shinmone staging request beginning with the actual Assistant question `這個月新增幾張工單？` passes through generic Query Understanding/Planning, resolves canonical ToolDefinition `work-orders.monthly-new-count`, completes the required Feature 008/009 path, and produces evidence-backed projected `newOrders.current` data for the existing Assistant answer/SSE behavior.
- **SC-002 — NATIVE_CREDENTIAL_ISOLATION_READY**: 100% of success and failure inspections confirm all native credential classes and reversible encodings are absent from central traffic contracts, configuration, persistence, logs, audit, telemetry, ToolCall, evidence, model, SSE, and public responses.
- **SC-003 — CONTEXT_REFERENCE_LIFECYCLE_READY**: 100% of binding tests enforce creation by trusted local infrastructure, configured binding dimensions, expiry, revocation, selected replay/reuse semantics, and fail-closed unusable-reference behavior; the raw reference is absent from every prohibited surface.
- **SC-004 — SERVICE_AUTH_READY**: 100% of unsigned, altered, expired, premature, replayed, wrong-audience, wrong-Customer, wrong-integration, wrong-HostApp, wrong-connector, unknown-trust, and retired-trust requests fail before binding resolution or Customer API access.
- **SC-005 — ISOLATION_READY**: 100% of cross-Customer, cross-integration, cross-HostApp, cross-connector-instance, actor, and required-session negative cases fail closed, including two-Customer cases with identical subordinate identifiers.
- **SC-006 — FIXED_OPERATION_READY**: 100% of arbitrary URL, method, path, query, header, generic fetch, SQL, shell, command, Browser/model operation, and credential-argument attempts are rejected before Customer API access.
- **SC-007 — NETWORK_AND_LIMIT_SAFETY_READY**: 100% of redirect-policy, destination-injection, unsupported-scheme, sensitive-address, DNS/rebinding, timeout, oversized, malformed, unexpected-content-type, and partial-response cases terminate safely without unauthorized data release.
- **SC-008 — PROJECTION_BOUNDARY_READY**: 100% of result-boundary tests confirm only `SafeProjectedAdapterResult` facts approved by `ToolDefinition.outputSchema` can enter EvidenceRef, GroundedAnswerInput, model input, SSE, or public answers.
- **SC-009 — PUBLIC_COMPATIBILITY_READY**: 100% of existing Assistant session, message, answer, SSE, feedback, approval, permission-denied, no-answer, and tool-failure contract tests pass without a new endpoint, request mode, event shape, or AnswerDecision.
- **SC-010 — PRODUCTIZED_REUSE_READY**: Synthetic Customer B executes `inventory.stock-on-hand` through the same shared contract, deployment registry, central adapter, service-authentication protocol, generic runtime, Feature 008 path, and discovery algorithm using its distinct Customer/integration/HostApp tuple, connector instance, `POST_QUERY_JSON_V1 /inventory/stock/query`, schema-validated `sku`, fixture API-key provider-owned handle, fixed `X-Inventory-Key` application strategy, and `{ sku, quantity }` output policy, with no Customer-specific Assistant-core or generic-runtime branch.
- **SC-011 — SHINMONE_SLICE_READY**: All ten Shinmone reference-integration proofs pass while no other Shinmone API or side-effecting operation is required.
- **SC-012 — BOUNDED_COMPLETION_READY**: 100% of connector executions complete or fail within the applicable `ToolDefinition.timeoutMs` and configured size limits, with no unbounded retry or partial public result.
- **SC-013 — NATURAL_LANGUAGE_TO_TOOL_RESOLUTION_PASS**: 100% of first-slice end-to-end proofs begin with the actual natural-language Assistant question, use a generic Customer-neutral Query Understanding/Planning and tool-discovery path, resolve `work-orders.monthly-new-count` as the canonical ToolDefinition, and contain no Shinmone-, Customer-, HostApp-, endpoint-, credential-, or phrase-specific Assistant-core query branch.
- **SC-014 — SHINMONE_REMOVAL_GENERIC_RUNTIME_PASS**: With all Shinmone bootstrap-provider, credential-profile, manifest, deployment, ToolDefinition/policy, and SPA fixtures disabled or removed, shared contracts and generic central/runtime modules still build and Synthetic Customer B still completes its bounded projected read through the same architecture without an Assistant-core source change.

## Open Questions

These are explicit design-stage decisions rather than unresolved specification placeholders. They do not change the specification's resolved authority, security, isolation, and compatibility requirements. All nine must be decided before implementation planning is approved. Design must also inspect the current Query Understanding, Planning, and ToolDefinition discovery seam and select a reusable Customer-neutral discovery mechanism if current behavior cannot discover the new ToolDefinition generically; this source-inspection obligation does not add a tenth open design topic.

| # | Topic | Specification-level resolution | Design decision still open |
| --- | --- | --- | --- |
| 1 | Initial minting, binding, and delivery | Only an exact registered Customer-local bootstrap profile may invoke a `BindingBootstrapProvider`; Browser claims provide no authority, and only the opaque reference may enter the existing Feature 008 transient request field. | Which trusted Customer-local initiator and provider profile perform each integration's bootstrap and how the resulting opaque `connectorContextRef` reaches the existing Assistant request/provider path. |
| 2 | Binding validity model | The model must be bounded, enforce expiry/revocation, accept an optional provider-supplied credential-expiry cap, and reject replay outside its declared rules without assuming a JWT. | Whether a binding is one-shot, reusable within a TTL, or session-bound, including concurrency semantics and provider-cap handling. |
| 3 | Central-to-connector authentication | Authentication, integrity, freshness, replay resistance, audience/context binding, rotation, and fail-closed rejection are mandatory. | Whether the mechanism is mTLS, signed JWT, message signing, or another design satisfying all properties. |
| 4 | Connector endpoint discovery | Destination authority is resolved: only trusted deployment configuration bound to exact registration context may select it. | The configuration source, lookup lifecycle, caching, and rotation mechanism. |
| 5 | Customer-local credential source | Credential authority and location are resolved: protected handles and native material remain Customer-side, and only a registered provider resolves execution-scoped material after authentication/binding checks. | The provider registry, Customer-local handle store, lookup protocol, provider-specific refresh coordination, and rotation mechanism. |
| 6 | Operation manifest format | Manifest semantics, `credentialProfileRef`, the two closed read-only request profiles, and default-deny authority are resolved by this specification. | File, service, package, schema, versioning, validation, and rollout format. |
| 7 | Binding-state storage | Only minimum protected binding state or a one-way verifier may exist Customer-side; raw references and native credentials remain prohibited from general logs/audit/business persistence. | Stateful local storage, external Customer-local store, or a stateless protected design, including revocation support. |
| 8 | Deployment configuration delivery | The required trusted Customer/integration/HostApp/connector associations and secret-separation rules are resolved. | How an independently deployed runtime receives, validates, rotates, and rolls back that configuration. |
| 9 | Shinmone implementation placement | Shinmone remains a removable reference provider/profile/manifest integration outside generic Assistant core and runtime orchestration. | Whether its integration boundary lives in this repository or a separately deployed Customer-side project while the shared runtime remains independently buildable. |

No current evidence requires a new public contract. Discovery of such a requirement is a blocker requiring explicit review rather than an implicit design choice.

## Assumptions

- Feature 008 is complete and accepted even if predecessor artifact metadata still reports Draft.
- Existing Feature 007 identity/admission and Feature 008 contracts remain compatibility dependencies rather than redesign targets. Feature 007's accepted native-credential destination amendment is the sole predecessor contract change consumed by Feature 009.
- The initial product scope is read-only real business-data access.
- Shinmone is a removable reference integration; its Bridge participant, MenuDetail ordering, accepted Entry, bearer, native-token expiry, and refresh/remint behavior are not generic runtime assumptions.
- Synthetic Customer B's API-key provider and application strategy are deterministic acceptance fixtures and are not approved as production credential infrastructure.
- `POST_QUERY_JSON_V1` is read-only by contract and policy and cannot authorize side effects or arbitrary request bodies.
- The Shinmone Customer environment can provide an approved upstream endpoint and local credential source during later implementation/deployment work.
- Concrete numeric limits are deployment- and operation-controlled within central policy; exact values are set in design/configuration and are always bounded.
- Safe local operation results may contain business data required by the operation, but central release remains default-deny through Feature 008.
- The nine Open Questions are intentionally deferred to design and do not weaken any mandatory requirement in this specification.

## Responsibility Review

| Owner | Feature 009 relationship | Resolution |
| --- | --- | --- |
| Feature 007 / Gateway identity | Accepted identity and first Customer session path | Identity/admission authority is reused unchanged; the accepted credential-boundary amendment permits only the post-admission local binding handoff. Feature 009 does not authenticate users or trust Browser claims. |
| Existing IntegrationBinding/trusted context | Customer and HostApp authority | Reused unchanged; connector configuration and references cannot override it. |
| Feature 008 | Permission, adapter selection, operation contract, ToolCall, projection, evidence, grounded answer, public answer/SSE | Reused unchanged as the only central execution path. |
| Feature 009 central side | Trusted connector endpoint resolution and authenticated bounded transport | New reusable platform responsibility behind a Feature 008 DataAdapter. |
| Feature 009 Customer-local side | Generic bootstrap-provider dispatch, binding lifecycle, credential handles/providers/profiles/strategies, closed manifest request mapping, upstream access, bounded local result | New independently deployable platform responsibility; no Customer-specific orchestration branches. |
| Customer integration configuration | Exact bootstrap profile, endpoint, operation mapping, credential profile, provider-owned state, and deployment-specific limits | Configuration or explicit Customer-local provider/plugin responsibility; not Assistant-core authority. |
| Shinmone SCM reference | First live proof of the reusable runtime and Feature 007 Bridge bootstrap profile | Removable reference integration only; no required generic source assumption or Customer-specific Assistant-core branch. |
| Future Customer onboarding | Reuse Features 008 and 009 | Configuration-only when registered profiles suffice; otherwise a Customer-local provider/plugin extension. Customer branching in Assistant core, central transport/adapter, or generic runtime orchestration is prohibited. |

No actual duplicate responsibility is accepted. Feature 007 owns identity, Feature 008 owns the central generic execution and release boundary, and Feature 009 owns reusable connector transport plus Customer-local execution infrastructure.

## Explicit Out-of-Scope List

- Any modification to Feature 007 beyond the accepted post-admission native-credential destination amendment, or any modification to Feature 008 accepted contracts or artifacts.
- Redesign of Customer IDX/Auth or Backend authentication, Feature 007 identity/admission authority, Gateway identity, canonical JWT/JWKS behavior, IntegrationBinding Customer authority, or allowedHostApp authority.
- New Browser identity/Customer/organization/permission authority, a new Assistant public API, or a broad SDK/Customer SPA public-contract redesign.
- Identity Bridge, Connector Runtime, Customer-side Assistant provider/integration layer, SDK, or Customer SPA changes beyond the minimal binding request/mint, opaque-reference acquisition, and existing Feature 008 transient-field delivery expressly permitted by CR-009; unrelated Customer SPA work remains out of scope.
- Production code, database schema, migration, seed, infrastructure, or deployment changes in this specification task.
- A second Assistant runtime, direct connector public API, or Browser-to-connector business invocation path.
- Arbitrary HTTP forwarding, dynamic Browser/model endpoint selection, generic SQL, generic fetch, shell execution, or free-form connector commands.
- Central storage, refresh, logging, auditing, telemetry, or exposure of Customer-native credentials.
- Raw Customer API payload release to ToolCall, evidence, model, SSE, or public response.
- Write, mutation, approval-triggering, financial, destructive, or other side-effecting connector operations.
- Broad Shinmone API support, Customer-specific Assistant-core conditionals, or `if customer === 'shinmone'` / `if hostApp === 'scm'` behavior.
- A universal Feature 007/Identity Bridge, MenuDetail, `acceptedEntry`, native JWT, bearer-only, or `nativeAccessToken` bootstrap/credential assumption in generic Feature 009 contracts or runtime modules.
- Caller- or manifest-selected credential headers, unrestricted POST bodies, templates, callbacks, scripts, or request methods outside `GET_QUERY_V1` and `POST_QUERY_JSON_V1`.
- Broad document RAG, a new LLM orchestration layer, or an automatic generic plugin marketplace.
- Treating the Synthetic Customer B fixture API-key provider as production-approved infrastructure without a separate review.

## Implementation Gate State

This specification is accepted and approved for Phase 1 implementation. No implementation phase has executed; the block below records the current gate state and retains future acceptance targets separately from execution evidence.

```text
SECOND_CUSTOMER_REUSE_PROOF=PASS
SHINMONE_REMOVAL_GENERIC_RUNTIME_PASS=YES
CUSTOMER_SPECIFIC_ASSISTANT_CORE_BRANCH=NO
CUSTOMER_SPECIFIC_GENERIC_RUNTIME_BRANCH=NO
PHASE1_EXECUTED=NO
IMPLEMENTATION_GATE_APPROVED=YES
HUMAN_IMPLEMENTATION_GATE_REVIEW=PASS
READY_FOR_HUMAN_GATE_REVIEW=NO
NEXT_ACTION=EXECUTE_PHASE1
```
