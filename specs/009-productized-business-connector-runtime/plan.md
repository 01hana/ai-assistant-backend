# Implementation Plan: Feature 009 — Productized Business Connector Runtime

**Status**: Accepted — Approved for Phase 1 implementation
**Date**: 2026-09-09  
**Branch context**: `009-productized-business-connector-runtime` (this plan does not perform branch operations)
**Spec**: `specs/009-productized-business-connector-runtime/spec.md`  
**Design**: `specs/009-productized-business-connector-runtime/design.md`  
**Authority order**: Constitution → accepted Feature 007 credential-boundary amendment → accepted Feature 008 contracts → accepted Feature 009 `spec.md` → accepted Feature 009 `design.md` → this accepted plan → approved Phase 1 implementation gate.

## 1. Summary

Feature 009 adds one reusable two-sided business-connector runtime behind the existing Feature 008 `DataAdapter` seam. The central side selects an exact trusted deployment, signs and bounds an internal invocation, and normalizes the Customer-local response. The independently deployed Customer-local side authenticates that invocation, resolves a context-bound volatile binding containing only an opaque provider handle, resolves execution-scoped material through a registered `CredentialProvider`, applies it through a compatible fixed `CredentialApplicationStrategy`, executes one closed read-only manifest request profile, validates the upstream response, and returns only a bounded business result. Feature 008 remains the sole path from that result through output validation, projection, masking, evidence, grounded answer, and existing public/SSE behavior.

V1 supports only closed read-only `GET_QUERY_V1` and `POST_QUERY_JSON_V1`. The first configuration-driven slice is Shinmone SCM operation `work-orders.monthly-new-count`; its Bridge, MenuDetail/Entry, native bearer/JWT expiry, endpoint/result, and SPA details are removable integration code/configuration rather than generic assumptions. Synthetic Customer B must execute `inventory.stock-on-hand` through the same contracts, central adapter/registry, generic runtime, Feature 008 path, service-auth protocol, and discovery algorithm using a fixture API-key provider and fixed allowlisted `X-Inventory-Key` strategy. Removing all Shinmone artifacts must leave generic builds and Customer B execution passing.

Implementation is divided into fifteen dependency-ordered phases. Phases 1–13 use deterministic fixtures or local test infrastructure. Phase 14 is the first phase that requires an approved Shinmone HTTPS staging/UAT origin. Phase 15 closes compatibility and rollback evidence. No second Assistant runtime, public API, SSE contract, SDK public API, central Prisma migration, durable Customer-local store, generic HTTP proxy, generic SQL, or command executor is introduced.

## 2. Technical Context

**Language/Version**: TypeScript 6.0.3 on the repository-supported Node.js runtime  
**Primary Dependencies**: NestJS 11, `jose` 5, existing Feature 007 Identity Bridge modules, existing Feature 008 tool/adapter/projection services  
**Storage**: Existing PostgreSQL/Prisma models only for current ToolDefinition and Customer policy records; no schema or migration change. Customer-local bindings and replay entries are bounded in-memory state only. Bindings retain provider keys/handles/metadata, not mandatory native tokens or accepted Entry values.
**Testing**: Jest 30 unit, contract, integration, e2e, and eval suites; standalone application tests for the Connector Runtime and focused external Shinmone SPA integration tests in its later implementation scope  
**Target Platform**: Independently deployable Linux-based Nest services plus the existing central Backend, Customer-local Identity Bridge, and Shinmone SPA integration  
**Project Type**: Backend monorepo containing shared packages, central modules, and independently deployable Nest applications; external SPA integration remains repository-owned by Shinmone  
**Performance/Deadline Goal**: A 5,000 ms reference ToolDefinition deadline, including central and local cleanup reserves, with cancellation propagated across every asynchronous boundary  
**Security Constraints**: Exact Customer/integration/HostApp/connector-instance/actor binding; native credential Customer-local only; replay-resistant service proofs; fixed operations; fail-closed destination policy; bounded data; final Feature 008 projection  
**Scale/Scope**: V1 uses one Customer-local Connector Runtime replica, one active binding generation per tuple, at most four concurrent read leases per binding, two closed read-request profiles, the Shinmone reference operation, and executable Synthetic Customer B portability
**Open Technical Context Items**: None. All nine design questions and generic discovery mechanics are resolved by the accepted design; human implementation-gate review has passed.

## 3. Constitution Check — Pre-Implementation Gate

The plan passes the Constitution v2.0.0 gate before implementation planning:

| Principle | Plan compliance |
| --- | --- |
| C1 Maintainable architecture | Shared contracts, central transport, Customer-local runtime, Identity Bridge handoff, discovery, and Feature 008 release remain separate bounded contexts. Customer-specific mapping stays in manifest/configuration, outside Assistant core. |
| C2 Test-first and regression | Every behavior phase starts with executable failing coverage where behavior changes, then preserves RED → GREEN evidence. Failure, replay, SSRF, cross-Customer, timeout, and compatibility paths are mandatory. |
| C3 Trusted identity boundary | Gateway/Feature 007 remains identity authority. Browser and `connectorContextRef` establish no identity or scope. Central trusted context is authenticated and compared with Customer-local binding state. |
| C4 API consistency and embeddability | Existing Assistant request, PageContext transient handling, AnswerDecision, SSE, and SDK public contracts are unchanged. New routes are internal service contracts. |
| C5 Measurable tool quality | Discovery is Customer-policy filtered and clarification-safe; ToolDefinition remains canonical. Approved projected tool facts remain evidence-bearing. |
| C6 End-to-end auditability | Existing ToolCall/audit correlation is retained. Only safe identifiers, operation metadata, outcome, and duration are observable; credentials, references, proofs, raw responses, and pre-projection results are excluded. |
| C7 Human approval | The Feature 009 slice is read-only and introduces no side-effecting operation or approval bypass. |

**Pre-implementation document result**: PASS with no constitutional exception or complexity waiver. Phase 1 implementation is approved but has not executed.

## 4. Accepted Authority and Compatibility Boundaries

### 4.1 Feature 007 two-stage credential rule for the Shinmone provider

The Shinmone/IDX implementation must preserve exactly two permitted native-bearer destinations; this is not the generic binding-bootstrap contract:

1. Stage 1: SPA → Customer-local Identity Bridge → exact configured MenuDetail → native validity and identity admission.
2. Stage 2, only after Stage 1 acceptance and `IdentityAdmissionService` success: Identity Bridge → exact authenticated Customer-local Connector Runtime binding endpoint → volatile native AccessToken binding.

Stage 2 is one attempt with no retry, fallback, alternate connector, or alternate destination. It hands off the same accepted native AccessToken, never a RefreshToken. The accepted amendment changes only this post-admission Customer-local destination. It does not change MenuDetail validity authority, Feature 007 identity authority, `sub`/`UUID_User`, `UUID_Company`, `UUID_Entry`, permission semantics, canonical JWT claims, IntegrationBinding Customer authority, allowedHostApp authority, Gateway trust, or session behavior. The Connector Runtime gains no identity, Customer, HostApp, permission, or operation authority. Other Customers use an exact registered binding-bootstrap service profile/provider and bounded provider payload without inheriting MenuDetail, Entry, native-token, bearer, or JWT-exp semantics.

### 4.2 Feature 008 authority

Feature 008 remains solely responsible for permission precheck, canonical `ToolDefinition` resolution, structured argument validation, exact `DataAdapterRegistry` selection, ToolCall lifecycle, `ToolDefinition.timeoutMs`, output-schema release, permission masking/minimization, `SafeProjectedAdapterResult`, `EvidenceRef`, `GroundedAnswerInput`, answer decisions, and existing SSE/public behavior. Feature 009 must not create an alternate tool runner, permission path, projection path, evidence path, or answer path.

### 4.3 End-to-end data flow

```text
這個月新增幾張工單？
  → existing Query Understanding / Planning
  → Customer-policy-filtered x-assistant-discovery-v1 catalog match
  → exact active read-only ToolDefinition work-orders.monthly-new-count
  → Feature 008 argument validation and permission precheck
  → exact DataAdapterRegistry selection
  → ProductizedBusinessConnectorAdapter
  → trusted ConnectorDeploymentRegistry resolution
  → signed POST /v1/connector/invocations
  → Customer-local central-profile proof/replay/context/binding checks
  → exact Shinmone manifest GET_QUERY_V1 operation and credential profile
  → fixed HTTPS GET /Dashboard/KPIStats?TimeRange=thisMonth
  → validate and extract /data/newOrders/current
  → bounded { metricKey, period, count }
  → Feature 008 outputSchema projection/masking
  → SafeProjectedAdapterResult → EvidenceRef → GroundedAnswerInput
  → existing answer decision and SSE/public response
```

## 5. Internal Contracts and Data Boundaries

### 5.1 Internal interfaces

- `POST /v1/connector/invocations` accepts at most 16 KiB of exact-byte-signed JSON with version, request ID, bounded remaining budget, trusted context, canonical operation/version/validated arguments, and opaque `connectorContextRef`. It contains no caller-selected URL, method, path, query, headers, credential, SQL, or command.
- `POST /v1/internal/connector-bindings` is Customer-local and binding-bootstrap-profile-only. It accepts exact-byte-signed JSON containing version, request ID, authenticated deployment context, exact registered `bootstrapProfileKey`, and bounded sensitive `providerPayload`; the selected `BindingBootstrapProvider` validates that payload against its closed schema and returns a protected provider-owned credential handle/cap/metadata to `ConnectorBindingService`. Central invocation proofs, Feature 007 user tokens, Browser calls, profile selection outside trusted configuration, and cross-profile acceptance are rejected. The response exposes only the opaque reference and bounded expiry metadata.
- `BRIDGE_BINDING_TRANSPORT_V1` is Shinmone's binding-bootstrap transport instance: HTTPS to the exact immutable Bridge deployment-configured hostname, port, route path, query, and allowed-address policy; TLS certificate/hostname verification; `Content-Type: application/json`; absent `Content-Encoding`; 16,384-byte request and 4,096-byte response caps; `typ=assistant-connector-binding+jwt`; exact raw-body SHA-256; fixed 2,000 ms complete timeout; and no Browser override, proxy inheritance, redirect, retry, alternate destination, or second bearer send. Only its provider payload contains the just-verified native AccessToken and accepted Entry/context.
- Manifests reference only `credentialProfileRef`. `CredentialProfileRegistry` maps it to one registered `CredentialProvider` and compatible closed `CredentialApplicationStrategy`; neither manifest nor caller supplies credential source/header behavior.
- `GET_QUERY_V1` fixes GET, relative path, fixed query, and schema-bound allowlisted argument mappings. `POST_QUERY_JSON_V1` fixes POST, relative path, and a bounded JSON object assembled only from fixed literals and schema-bound named mappings. Both require read-only ToolDefinition and manifest classification and prohibit arbitrary methods, URLs, headers, bodies, templates, callbacks, scripts, SQL, shell, redirects, and generic fetch.
- The existing Bridge exchange success may add `connectorContextRef` and `connectorContextExpiresIn`; legacy consumers may ignore them. The canonical JWT fields and semantics remain unchanged.
- The Shinmone provider attaches the opaque reference to the existing transient PageContext field. The SDK contract and Assistant request schema do not change.
- `ToolDefinition.inputSchema["x-assistant-discovery-v1"]` carries Customer-neutral concepts used only for candidate discovery. The exact re-resolved ToolDefinition remains operation, schema, risk, policy, output, and timeout authority.

### 5.2 Persistence and observability

Central Prisma schema and migrations remain unchanged. Customer-local V1 binding and replay stores are hash-keyed, bounded, single-replica, volatile memory with TTL cleanup and restart invalidation. Generic bindings hold trusted context, optional actor/organization constraints, binding/credential generations, expiry/revocation/lease state, provider key, opaque credential handle, and bounded provider metadata; they contain no mandatory `acceptedEntry`, token, or Customer-specific claim. Provider secret state remains separate behind the handle. Raw reference, provider payload/handle/metadata, execution-scoped credentials, native AccessToken/API key, service proof/private key, exact signed bytes, raw Customer response, and bounded pre-projection result are prohibited from persistence/log/audit/telemetry/model/evidence/SSE/public surfaces. Existing Feature 008 projected evidence remains allowed and unchanged.

### 5.3 Timeout model

`ToolDefinition.timeoutMs` is the sole central deadline authority. For the reference operation:

```text
Feature 008 outer deadline                         5,000 ms
  central completion/normalization reserve          250 ms
  maximum signed remainingBudgetMs                4,500 ms
    Customer-local response/cleanup reserve          250 ms
    Shinmone manifest upstream cap                 3,500 ms
```

The adapter subtracts elapsed central time before signing the budget. The local runtime uses the smaller of its received budget after reserve and the manifest cap. Deployment or manifest configuration may narrow a deadline but never extend the ToolDefinition deadline. Abort/cancellation propagation is mandatory; V1 does not retry.

Each bootstrap profile has an independent Customer-local identity/binding transport budget outside Feature 008. For Shinmone, `BRIDGE_BINDING_REQUEST_TIMEOUT_MS=2000` covers the complete request/response, is not Browser/request/reference/operation supplied, and cannot extend or govern business execution. On expiry the Bridge aborts/destroys the request, sends no retry or alternate request, returns no reference, and maps the connector-enabled exchange to `IDENTITY_EXCHANGE_UNAVAILABLE` without exposing the bearer.

### 5.4 Network model

Feature 009 governs three separate HTTPS-only hops: Backend → Connector Runtime business invocation, trusted Customer-local bootstrap initiator → Connector Runtime binding mint, and Connector Runtime → Customer API upstream execution. Each uses an exact deployment-owned destination, preconnection A/AAAA resolution, IPv4-mapped IPv6 normalization, all-address validation, connection pinning, and TLS certificate/hostname verification. Redirects, retries, proxy inheritance, and caller-selected destinations are denied. Shinmone selects Identity Bridge and `BRIDGE_BINDING_TRANSPORT_V1` for hop 2; that selection is not universal.

The central invocation and Customer upstream profiles retain their accepted `public_only` or explicit `allowlisted_networks` rules and bounded JSON behavior. `BRIDGE_BINDING_TRANSPORT_V1` instead uses an exact Customer-local service-to-service destination policy because the runtime may be on a private Customer network. Every resolved address must match that immutable policy; production/staging reject loopback, link-local, metadata, multicast, unspecified, broad private-network grants, and DNS fallback. No Browser field, native claim, request body, operation, or connector reference can alter the configured scheme, hostname, port, path, query, or destination. Only explicit enforced test mode may allow deterministic loopback TLS fixtures; it never permits HTTP or satisfies staging readiness.

## 6. Repository and Module Ownership

```text
packages/connector-runtime-contract/         # shared strict internal contracts and validators
src/connectors/productized-business/         # central registry, signer, transport, adapter, readiness
src/connectors/connectors.module.ts           # additive exact adapter registrations
src/tools/                                    # ToolDefinition re-resolution and discovery metadata
src/query-understanding/                      # generic concepts and ToolDiscoveryService integration
scripts/seed.ts                               # reference ToolDefinition/policy/metadata records
apps/customer-connector-runtime/src/          # standalone generic runtime/provider registries/request profiles
apps/customer-connector-runtime/integrations/ # removable Shinmone integration and Customer B fixture
apps/identity-bridge/src/connector-binding/   # Bridge-specific signer and bounded local client
apps/identity-bridge/src/exchange/            # post-admission handoff and additive response fields
```

The Backend monorepo owns the shared contract package, central productized connector module, Connector Runtime application, Bridge binding client, discovery service, and seed/policy additions. `prisma/schema.prisma`, migrations, Gateway identity contracts, and Feature 008 projection/evidence/runtime contracts remain read-only.

The SDK repository is read-only. Later Shinmone repository work is limited to `composables/assistant/assistantIdentityTokenProvider.ts`, `composables/assistant/assistantWidget.ts`, and focused Assistant integration tests. Its authentication, business client, proxy, and unrelated UI remain read-only.

## 7. Dependency-Ordered Implementation Phases

### Phase 1 — Baseline and predecessor-contract protection

- **Purpose**: Establish reproducible Feature 007/008 behavior and file/contract boundaries before new behavior is introduced.
- **Architecture/components**: Existing Identity Bridge exchange/admission tests, Gateway/session tests, Feature 008 tool/adapter/projection/evidence tests, mock tools, public Assistant/SSE contracts, repository safety inventory, and prohibited-data scan harness.
- **Predecessor**: Accepted Feature 007 amendment and Feature 008 implementation.
- **Allowed scope**: Test fixtures and regression harnesses during later implementation; no runtime behavior change in this phase.
- **Explicit non-goals**: No connector contracts, runtime, adapter, discovery, schema, SDK, or SPA implementation.
- **Test/verification**: Capture passing baselines; add contract snapshots/assertions that demonstrate unchanged identity, PageContext, ToolCall, answer, and SSE shapes. Where a later phase intentionally changes an internal contract, preserve a real failing-before/fixed-after RED → GREEN record.
- **Infrastructure dependency**: No real Shinmone infrastructure or native credential.
- **Exit gate**: After approval and execution, record `PREDECESSOR_CONTRACT_BASELINE_RESULT=PASS` and mechanically prove unchanged public contracts.

Current planning state: Phase 1 is approved but not started; `PHASE1_EXECUTED=NO`. Completing its checkpoint records `PHASE1_EXECUTED=YES`.

### Phase 2 — Shared connector-runtime contracts

- **Purpose**: Establish one versioned, closed vocabulary shared by central and Customer-local services before either side implements behavior.
- **Architecture/components**: `packages/connector-runtime-contract` invocation and generic bootstrap envelopes, provider payload/handle/metadata types, bootstrap/credential/profile/application interfaces, proof claims, trusted-context types, safe errors, `credentialProfileRef`, `GET_QUERY_V1`/`POST_QUERY_JSON_V1`, manifest schema, bounds, and strict validators.
- **Predecessor**: Phase 1.
- **Allowed scope**: New isolated package, package-local build/tests, and additive monorepo build wiring.
- **Explicit non-goals**: No network client, key loading, binding storage, generic proxy fields, application registration, or public contract export.
- **Test/verification**: Golden/negative invocation and bootstrap vectors; profile/handle compatibility; both closed read profiles; unknown fields, invalid versions, oversized/sensitive payloads, unsafe dynamic URL/method/path/query/header/body/credential fields, invalid budgets/context, response bounds, and code-only failures.
- **Infrastructure dependency**: None; deterministic bytes and fixtures only.
- **Exit gate**: `CONNECTOR_RUNTIME_CONTRACT_READY=YES`, with generic URL/method/path/query/header/credential/SQL/command inputs structurally impossible.

### Phase 3 — Customer-local configuration, service authentication, and replay foundation

- **Purpose**: Create a dark-deployable Connector Runtime whose trust and configuration fail closed before business execution exists.
- **Architecture/components**: `apps/customer-connector-runtime` Nest bootstrap, immutable environment/file configuration, health/readiness, raw-body bound, one central-invocation verifier and registry of exact binding-bootstrap RS256 profiles, provider-key/context association, exact-body SHA-256, clock/freshness, `kid` lifecycle, bounded `jti` replay cache, redacted observability, and shutdown hooks. The Shinmone Bridge profile is one testable registration; the credential-bearing route is not active.
- **Predecessor**: Phase 2.
- **Allowed scope**: Standalone local app, central-invocation verifier, binding-bootstrap profile registry, Shinmone Bridge fixture profile, Customer B fixture profile, and distinct `typ`/issuer/audience/provider/key sets.
- **Explicit non-goals**: No shared key domain, user-JWT authentication, hot reload, durable replay store, active credential-bearing binding endpoint, binding mint, upstream call, or business readiness claim.
- **Test/verification**: Valid central and multiple bootstrap vectors plus unsigned, altered-byte, digest mismatch, wrong typ/issuer/audience/provider/context/request/operation, early, expired, duplicate `jti`, unknown/retired key, oversized raw body, secret redaction, and complete central/Bridge/Customer-B cross-profile rejection.
- **Infrastructure dependency**: No Shinmone infrastructure; file fixtures and deterministic clocks/keys suffice.
- **Exit gate**: `SERVICE_AUTH_REPLAY_PROTECTION=READY`; malformed trust/configuration keeps readiness false.

### Phase 4 — Customer-local binding lifecycle

- **Purpose**: Bind the opaque transient reference to trusted deployment context and optional actor/organization constraints while keeping all credential state exclusively Customer-local and provider-owned.
- **Architecture/components**: `ConnectorBindingService`, `BindingBootstrapProviderRegistry`, provider-dispatched bootstrap route, hash-keyed in-memory store, opaque provider handle/bounded metadata, cryptographic reference generation, mint/resolve/revoke, TTL cleanup, generation replacement, optional provider expiry-cap narrowing, four-lease concurrency, provider teardown, and restart invalidation.
- **Predecessor**: Phase 3.
- **Allowed scope**: Registered binding-bootstrap endpoint orchestration, provider dispatch, generic binding state, and provider-owned fixture state only.
- **Explicit non-goals**: No initiator/Bridge HTTPS client, Browser/central minting, generic JWT parsing or Customer-token refresh, native token/Entry fields in generic records, durable store, session redesign, upstream call, or authority from reference possession.
- **Test/verification**: Closed payload dispatch, unknown/cross-profile rejection, maximum 120-second TTL, provider-expiry-minus-15 narrowing, 60-second missing-cap fallback, one active generation, four leases/fifth busy, revocation/provider teardown, mismatch, cleanup, restart, collision handling, processing order, and reference/provider-payload/handle/credential leak tests.
- **Infrastructure dependency**: No Shinmone infrastructure; synthetic provider profiles, handles, metadata, expiry caps, and credential fixtures only.
- **Exit gate**: All cross-Customer, integration, HostApp, connector-instance, actor, and generation reuse cases are denied; `NATIVE_CREDENTIAL_CENTRAL=NO` and `CONNECTOR_CONTEXT_REF_PERSISTED=NO` are demonstrated.

### Phase 5 — Closed operation manifest and credential boundary

- **Purpose**: Ensure only startup-approved named read operations can resolve a compatible provider handle and credential application strategy.
- **Architecture/components**: Versioned JSON-schema manifest loader, exact key/version registry, `CredentialProvider`, `CredentialProfileRegistry`, `CredentialApplicationStrategy`, bearer and fixed API-key fixtures, `credentialProfileRef`, closed `GET_QUERY_V1`/`POST_QUERY_JSON_V1` declarations, response extraction, and readiness integration.
- **Predecessor**: Phase 4.
- **Allowed scope**: Generic manifest/profile/strategy registries plus removable Shinmone bearer and Customer B API-key fixtures; no live endpoint.
- **Explicit non-goals**: No executable callbacks/templates/scripts, caller-selected method/destination/header/body/credential, bearer-only contract, wildcard operation, SQL/shell/command, or credential lookup before manifest/profile validation.
- **Test/verification**: Missing/duplicate/inactive/version mismatch; unknown/dynamic fields; traversal; unknown/cross-provider/incompatible credential profile; arbitrary GET/POST input; write classification; invalid extraction/bounds; and startup-readiness failure.
- **Infrastructure dependency**: No live Shinmone infrastructure; fixtures suffice.
- **Exit gate**: `MANIFEST_OPERATION_EXACT_MATCH=YES`, and credential acquisition is unreachable until service, replay, context, binding, and manifest checks pass.

### Phase 6 — Safe upstream execution and result extraction

- **Purpose**: Complete a locally testable fixed-operation runtime that returns only a validated bounded business envelope.
- **Architecture/components**: `GET_QUERY_V1` and `POST_QUERY_JSON_V1` fixed request builders, compatible credential-strategy application, destination policy, DNS resolver/pinning, bounded HTTPS client, TLS/abort, JSON structural bounds, response validation/extraction, safe errors, lease release, composed invocation route, and runtime readiness.
- **Predecessor**: Phase 5.
- **Allowed scope**: Generic safe network executor and fixed fixture servers; the reference mapping may be validated against fixtures.
- **Explicit non-goals**: No HTTP endpoint allowance, redirects, retries, compressed response, raw-response return, raw exception exposure, permissive DNS fallback, or central access to native credentials.
- **Test/verification**: Exact GET query and POST JSON construction; strict named mappings/literals; no undeclared body/header/method; provider/strategy application only after all checks; public/allowlisted address matrices; mixed DNS/mapped IPv6/rebinding; TLS/redirect/proxy/compression denial; bounded malformed responses; cancellation/timeout; extraction; route processing order; and result-envelope bounds.
- **Infrastructure dependency**: No real Shinmone infrastructure. Local deterministic HTTPS/DNS fixtures establish dark deployment and readiness behavior.
- **Exit gate**: `DNS_REBINDING_PROTECTION=READY`, `REDIRECTS=DENIED`, `RAW_CUSTOMER_API_RESPONSE_CENTRAL=NO`, and `BOUNDED_LOCAL_RESULT_ONLY=YES`.

### Phase 7 — Central deployment registry, service proof, and bounded transport

- **Purpose**: Build the central half of the productized transport without yet activating it for tool execution.
- **Architecture/components**: `ConnectorDeploymentRegistry`, environment-backed typed configuration, exact tuple lookup, duplicate/wildcard rejection, central RS256 signer, exact raw-byte serializer/digest, replay-proof claims, bounded HTTPS transport, abort handling, response validator, safe failure mapper, and readiness.
- **Predecessor**: Phases 2, 3, and 6.
- **Allowed scope**: `src/connectors/productized-business` and configuration tests, initially unregistered/dark.
- **Explicit non-goals**: No Browser endpoint input, native credential, central binding/ref persistence, Prisma model, generic HTTP client exposure, adapter registration, ToolDefinition creation, or retry.
- **Test/verification**: Exact Customer/integration/HostApp/connector/instance selection; duplicate/inactive/unsafe entries; proof vectors shared with local verifier; body mutation; TLS/DNS/redirect/bounds; safe-error mapping; elapsed-budget subtraction; cancellation; and secret/reference/result redaction.
- **Infrastructure dependency**: No live Shinmone infrastructure; local Connector Runtime fixtures suffice.
- **Exit gate**: Exact deployment resolution and signed bounded round-trip pass while the central module remains unreachable from Assistant execution.

### Phase 8 — Shinmone Feature 007 Identity Bridge post-admission binding integration

- **Purpose**: Implement the accepted Feature 007 Stage 2 handoff after successful Stage 1 MenuDetail validation and identity admission.
- **Architecture/components**: `BRIDGE_BINDING_TRANSPORT_V1`, immutable exact binding-endpoint and allowed-address configuration, startup URI validation, separate service-proof signer/key domain, HTTPS-only bounded client, DNS/address validation and connection pinning, TLS hostname/certificate verification, `AbortController` plus socket/body destruction, exchange orchestration, rejection-driven revocation handling, additive response projection, and readiness.
- **Predecessor**: Phases 3–4 and the existing accepted Feature 007 exchange path.
- **Allowed scope**: `apps/identity-bridge/src/connector-binding` and narrow post-admission exchange composition.
- **Explicit non-goals**: No change to MenuDetail, identity admission, canonical JWT claims, Gateway, IntegrationBinding, allowedHostApp, Customer/permission authority, Customer authentication, Browser destination, RefreshToken, HTTP fallback, proxy inheritance, retry, redirect, alternate endpoint, or third native-token destination.
- **Test/verification**: With deterministic local TLS fixtures, prove HTTPS success; startup rejection of HTTP, malformed URI, userinfo, fragment, blank/wildcard host, and caller-derived endpoint; wrong TLS hostname and untrusted certificate; all-address policy and pinning; redirect denial; ignored proxy environment; exact 2,000 ms timeout; cancellation closes the request/socket; timeout causes zero retry, alternate destination, or second bearer send; Browser/request fields cannot replace the endpoint; Stage 2 is unreachable before MenuDetail/admission; the exact same bearer is sent once only after admission; mint timeout/failure returns no reference and maps to `IDENTITY_EXCHANGE_UNAVAILABLE`; and bearer sentinels are absent from exceptions, logs, audit, and telemetry.
- **Infrastructure dependency**: No live Shinmone infrastructure; explicit enforced test mode and deterministic loopback TLS Bridge/Connector Runtime fixtures suffice. Test-only loopback cannot enable production/staging configuration or readiness.
- **Exit gate**: `FEATURE007_AMENDMENT_PRESERVED=YES`, `FEATURE007_IDENTITY_AUTHORITY_CHANGED=NO`, `BRIDGE_BINDING_HTTPS_ONLY=YES`, `BRIDGE_BINDING_DESTINATION_TRUSTED_CONFIG_ONLY=YES`, `BRIDGE_BINDING_TIMEOUT_MS=2000`, `BRIDGE_BINDING_RETRY=NO`, `BRIDGE_BINDING_REDIRECT=NO`, and `BRIDGE_BINDING_NATIVE_TOKEN_LEAK=NO`; connector-enabled exchange returns an opaque reference without changing existing identity/session semantics.

### Phase 9 — ProductizedBusinessConnectorAdapter through Feature 008

- **Purpose**: Make the central transport selectable only through the accepted Feature 008 adapter registry and lifecycle.
- **Architecture/components**: `ProductizedBusinessConnectorAdapter`, exact registration wiring, ToolDefinition key/version re-resolution, elapsed-time/budget calculation, transport invocation, bounded error normalization, and Feature 008 projection/evidence integration tests.
- **Predecessor**: Phases 7–8.
- **Allowed scope**: Additive central adapter and exact registry registration beside existing mock adapters.
- **Explicit non-goals**: No `DataAdapterExecuteInput` change, second timeout, permission check, ToolCall implementation, projection implementation, raw-result release, mock fallback, AnswerDecision, SSE event, or public endpoint.
- **Test/verification**: Permission denial before transport; exact adapter match; missing/mismatch fail closed; ToolDefinition re-resolution; 5,000/250/4,500 ms budget math; abort propagation; failed ToolCall mapping; extra local fields rejected by output schema; only projected facts entering evidence/model/SSE; and existing mocks unchanged.
- **Infrastructure dependency**: No live Shinmone infrastructure; deterministic central/local fixtures suffice.
- **Exit gate**: `FEATURE008_PROJECTION_BYPASS=NO`, `FEATURE008_TIMEOUT_SINGLE_AUTHORITY=ToolDefinition.timeoutMs`, and `MOCK_FALLBACK=NO`.

### Phase 10 — Generic ToolDefinition discovery migration

- **Purpose**: Replace key-specific mock candidate routing with reusable, Customer-neutral catalog discovery before adding the real operation.
- **Architecture/components**: `ToolDiscoveryService`, ToolDefinition metadata parser, Customer policy filter, active/read-only filter, normalized resource/metric/intent/time concepts, deterministic scoring/tie handling, Query Understanding/Planning integration, and eval dataset.
- **Predecessor**: Phase 1 baseline and existing Feature 008 ToolDefinition/policy resolution; adapter availability from Phase 9.
- **Allowed scope**: `src/tools`, `src/query-understanding`, equivalent metadata for existing mocks, and regression/eval coverage.
- **Explicit non-goals**: No Customer, HostApp, Shinmone, endpoint, credential, operation-result, or complete-question literal branch; discovery does not grant permission or replace canonical ToolDefinition resolution.
- **Test/verification**: First add equivalent metadata and prove all existing mock queries stay green; then remove old hard-coded branches. Test policy exclusion, inactive/write tool exclusion, required concept failure, synonym handling, tied/low-score clarification with no execution, and source scans for forbidden routing constants.
- **Infrastructure dependency**: No Shinmone infrastructure; catalog fixtures suffice.
- **Exit gate**: `CUSTOMER_BRANCH_IN_ASSISTANT_CORE=NO`, `SHINMONE_FULL_QUERY_BRANCH=NO`, and existing mock compatibility remains green through generic discovery.

### Phase 11 — Shinmone removable provider, profile, ToolDefinition, manifest, and deployment configuration

- **Purpose**: Configure the first real read-only operation without adding Customer-specific Assistant behavior.
- **Architecture/components**: Shinmone-only IDX `BindingBootstrapProvider`, provider-owned accepted Entry/native-token state and JWT-exp cap, bearer credential profile/application strategy, seeded ToolDefinition/policy/discovery metadata, exact deployment, `GET_QUERY_V1` manifest, output policy, and startup/readiness fixtures under the explicit integration boundary.
- **Predecessor**: Phases 6, 7, 9, and 10.
- **Allowed scope**: Removable Shinmone integration provider/profile/configuration and existing JSON-backed seed/policy fields; operation `work-orders.monthly-new-count` version selected by the Draft design.
- **Explicit non-goals**: No Prisma schema/migration, broad Shinmone API coverage, write operation, HTTP origin, dynamic path/query, phrase branch, raw response release, or Shinmone/native/Entry/bearer/JWT-exp assumption in shared contracts, Assistant core, central adapter/transport, or generic runtime orchestration.
- **Test/verification**: Generic concepts resolve `這個月` to `this_month`, `新增` to `new_count`, and the count intent to a unique canonical tool. Manifest fixes `GET /Dashboard/KPIStats?TimeRange=thisMonth`, validates HTTP/application success, extracts `/data/newOrders/current`, and emits only `{ metricKey, period: "thisMonth", count }` with a non-negative integer. Output projection releases only approved fields and provenance constants.
- **Infrastructure dependency**: No live Shinmone infrastructure; schema, registry, and fixture-server tests suffice. A placeholder HTTP origin may not be enabled or declared ready.
- **Exit gate**: The real question resolves generically, the exact mapping passes fixture tests, and `CENTRAL_PRISMA_SCHEMA_CHANGE=NO` remains true.

### Phase 12 — Shinmone SPA in-memory connectorContextRef delivery

- **Purpose**: Deliver the locally minted reference through the existing provider/PageContext path without changing SDK or Assistant contracts.
- **Architecture/components**: Shinmone `assistantIdentityTokenProvider.ts`, `assistantWidget.ts`, in-memory canonical-token/reference bundle, separate expiry tracking, invalidation/remint flow, and focused integration tests.
- **Predecessor**: Phases 8 and 11; connector-enabled Bridge exchange available in the target Customer environment.
- **Allowed scope**: The two named Shinmone composables and focused Assistant integration tests in the external repository during later implementation.
- **Explicit non-goals**: No SDK source/public API change, local/session storage, cookie persistence, native auth redesign, broad SPA refactor, Browser authority, custom Assistant request mode, or new proxy route.
- **Test/verification**: Acquire after successful exchange, attach to existing transient PageContext, independently expire, invalidate canonical token/reference together when required, reacquire after refresh, omit on failure, and prove absence from storage/logging/history/public response.
- **Infrastructure dependency**: No live Shinmone business API is required; a staged Bridge/Connector Runtime or controlled fixtures suffice.
- **Exit gate**: `SDK_PUBLIC_API_CHANGE=NO`, `ASSISTANT_PUBLIC_API_CHANGE=NO`, and a valid transient reference reaches Feature 008 extraction without persistence.

### Phase 13 — Cross-boundary security, failure, and compatibility validation

- **Purpose**: Establish isolation, executable portability, Shinmone removability, and regression evidence before any real Customer endpoint is enabled.
- **Architecture/components**: Customer A/B isolation harness; Synthetic Customer B `inventory.stock-on-hand` fixture using tuple `customer-b` / `inventory-b` / `customer-b-inventory`, instance `customer-b-inventory-connector-1`, generic inventory/stock/lookup discovery, `POST_QUERY_JSON_V1 /inventory/stock/query`, validated `sku`, fixture API-key provider handle, fixed allowlisted `X-Inventory-Key`, and `{ sku, quantity }`; proof/binding/registry/manifest/network/adapter composition; Shinmone-removal build topology; generic-source guards; Feature 007/008/public regression suites.
- **Predecessor**: Phases 1–12.
- **Allowed scope**: Test and deployment-validation harnesses only; fixes remain within the owning module established by earlier phases.
- **Explicit non-goals**: No weakening of failures for test convenience, shared Customer state, production secrets, Internet dependency, or staging success claim.
- **Test/verification**: Separately (1) deny every Customer A/B cross-Customer, integration, HostApp, connector-instance, actor, binding, policy, deployment, and evidence attempt; (2) execute Customer B through the same shared contract, deployment registry, adapter, generic runtime, service-auth protocol, Feature 008 path, and discovery algorithm; (3) disable/remove all Shinmone provider/profile/manifest/deployment/ToolDefinition-policy/SPA fixtures and re-run generic builds plus Customer B; and (4) scan non-exempt generic sources for Shinmone paths/results/IDs, `acceptedEntry`, mandatory `nativeAccessToken`, Bridge-only bootstrap, bearer-only application, or JWT-exp assumptions. Also exercise safe errors, cancellation/replay/leak scans, projection bypass, predecessor/mocks/public/SSE regressions.
- **Infrastructure dependency**: No real Shinmone infrastructure; deterministic fixtures only.
- **Exit gate**: All security-gate values in Section 9 pass, including `SECOND_CUSTOMER_REUSE_PROOF=PASS`, `SHINMONE_REMOVAL_GENERIC_RUNTIME_PASS=YES`, `CUSTOMER_SPECIFIC_ASSISTANT_CORE_BRANCH=NO`, and `CUSTOMER_SPECIFIC_GENERIC_RUNTIME_BRANCH=NO`; predecessor/public suites remain green.

### Phase 14 — Live Shinmone staging vertical slice

- **Purpose**: Prove the accepted architecture end to end against a real approved Customer staging/UAT deployment.
- **Architecture/components**: Staging trust/key configuration, exact deployment registry entry, Connector Runtime readiness, Identity Bridge handoff, Shinmone provider, Feature 008 tool path, approved Shinmone HTTPS origin, and operational evidence capture.
- **Predecessor**: Phase 13 plus the deployment prerequisites in Section 11.
- **Allowed scope**: Configuration-controlled staging activation of the one reference operation.
- **Explicit non-goals**: No use of the checked-in HTTP endpoint, production activation, broad API support, retries, fallback mocks, manual operation invocation as the primary proof, or bypass of natural-language planning.
- **Test/verification**: Start with `這個月新增幾張工單？`; observe generic unique discovery, canonical ToolDefinition, permission precheck, exact adapter, signed transport, binding/context validation, fixed HTTPS GET, bounded extraction, Feature 008 projection/evidence, and existing answer/SSE. Also prove revoked/expired binding, permission denial, upstream auth/failure, timeout, and readiness-loss behavior safely fail with no raw leakage.
- **Infrastructure dependency**: This is the first phase requiring `APPROVED_SHINMONE_HTTPS_ORIGIN`, approved trust/key material, an admitted staging user, and deployment configuration. Missing HTTPS blocks this phase only.
- **Exit gate**: `SHINMONE_LIVE_VERTICAL_SLICE_READY=YES`, supported by correlated safe staging evidence and no contract/security exception.

### Phase 15 — Final compatibility closeout and rollback evidence

- **Purpose**: Establish that the feature is releasable, reversible, and leaves predecessor behavior intact.
- **Architecture/components**: Full monorepo and external focused test inventory, deployment/readiness evidence, rollback controls, repository diff, schema check, artifact/security scans, and final acceptance report.
- **Predecessor**: Phase 14.
- **Allowed scope**: Verification, release evidence, and configuration-controlled enable/disable rehearsal.
- **Explicit non-goals**: No additional operation, architecture redesign, migration, SDK release, public contract change, or unresolved waiver.
- **Test/verification**: Re-run all unit/contract/integration/e2e/eval/security/staging suites. Disable Customer policy/ToolDefinition availability and adapter/deployment registration, withhold SPA reference delivery, and confirm Feature 007 identity/session, Feature 008 mocks, public API, and SSE return to prior behavior without data rollback. Confirm restart invalidates local state safely.
- **Infrastructure dependency**: Uses the Phase 14 staging environment for final live proof; repository and rollback checks remain locally executable.
- **Exit gate**: When implementation is later authorized and performed, `OPEN_PLAN_BLOCKERS=0`, all completion markers pass, rollback is evidenced, and release review may begin. This Draft plan does not satisfy or approve that gate.

## 8. Rollout and Dependency Order

```text
baseline
  → shared generic invocation/bootstrap/provider/request-profile contracts
  → Customer-local dark runtime and multi-profile proof/replay foundations
  → provider-handle binding lifecycle
  → manifest/credential profile/provider/strategy boundary
  → safe GET/POST-query execution and local readiness
  → central deployment/signing/transport dark readiness
  → Identity Bridge additive binding integration
  → Feature 008 adapter registration
  → generic discovery migration
  → Shinmone ToolDefinition/policy/manifest/deployment configuration
  → Shinmone transient provider delivery
  → Customer A/B isolation, Customer B portability, Shinmone-removal, and generic-source validation
  → approved HTTPS live staging proof
  → closeout and rollback evidence
```

Activation remains configuration controlled. The local runtime is deployed dark before central selection exists. Trust material and provider/profile registrations are published before activation and retained through rolling-restart overlap. Each Customer follows exactly one path: configuration-only reuse of existing profiles, an explicit Customer-local provider/plugin for a genuinely new credential mechanism, or rejection if it requires Customer branching in Assistant core, central adapter/transport, or generic orchestration. Shinmone's Bridge/provider/profile/manifest/deployment/SPA assets can be disabled independently; Customer B and generic builds remain valid. Rollback requires no database migration or public-client downgrade.

## 9. Security and Compatibility Gate Matrix

| Gate | Required value | Established by |
| --- | --- | --- |
| `NATIVE_CREDENTIAL_CENTRAL` | `NO` | Phases 4, 8, 13 |
| `CONNECTOR_CONTEXT_REF_PERSISTED` | `NO` | Phases 4, 12, 13 |
| `BROWSER_AUTHORITY` | `NO` | Phases 4, 8, 12 |
| `BRIDGE_BINDING_TRANSPORT_HTTPS` | `YES` | Phases 3, 8, 13 |
| `BRIDGE_BINDING_DESTINATION_BROWSER_OVERRIDE` | `NO` | Phases 8, 13 |
| `BRIDGE_BINDING_RETRY` / `BRIDGE_BINDING_REDIRECT` | `NO` / `NO` | Phases 8, 13 |
| `BRIDGE_BINDING_PROXY_INHERITANCE` | `NO` | Phases 8, 13 |
| `BRIDGE_BINDING_TLS_HOSTNAME_VERIFY` | `YES` | Phases 8, 13 |
| `BRIDGE_BINDING_NATIVE_CREDENTIAL_CONFIDENTIALITY` | `PASS` | Phases 8, 13 |
| `BRIDGE_BINDING_TIMEOUT_MS` | `2000` | Phases 8, 13; identity/binding domain only |
| `GENERIC_HTTP_PROXY` / `GENERIC_SQL` / `GENERIC_COMMAND_EXECUTION` | `NO` / `NO` / `NO` | Phases 2, 5, 13 |
| `CLOSED_READ_REQUEST_PROFILES` | `GET_QUERY_V1,POST_QUERY_JSON_V1` | Phases 2, 5–6, 13 |
| `BINDING_BOOTSTRAP_PROFILE_ISOLATION` / `CREDENTIAL_PROFILE_ISOLATION` | `PASS` / `PASS` | Phases 3–5, 13 |
| `SERVICE_AUTH_REPLAY_PROTECTION` | `READY` | Phase 3 |
| `CROSS_CUSTOMER_BINDING_REUSE` | `DENIED` | Phases 4, 13 |
| `CROSS_INTEGRATION_REUSE` / `CROSS_HOSTAPP_REUSE` | `DENIED` / `DENIED` | Phases 4, 13 |
| `CROSS_CONNECTOR_INSTANCE_REUSE` / `CROSS_ACTOR_REUSE` | `DENIED` / `DENIED` | Phases 4, 13 |
| `MANIFEST_OPERATION_EXACT_MATCH` | `YES` | Phase 5 |
| `DESTINATION_BROWSER_OVERRIDE` | `NO` | Phases 5–7 |
| `REDIRECTS` | `DENIED` | Phases 6–7 |
| `DNS_REBINDING_PROTECTION` | `READY` | Phases 6–7 |
| `RAW_CUSTOMER_API_RESPONSE_CENTRAL` | `NO` | Phases 6, 9, 13 |
| `BOUNDED_LOCAL_RESULT_ONLY` | `YES` | Phases 2, 6 |
| `FEATURE008_PROJECTION_BYPASS` | `NO` | Phases 9, 13–14 |
| `FEATURE008_TIMEOUT_SINGLE_AUTHORITY` | `ToolDefinition.timeoutMs` | Phases 7, 9, 13 |
| `MOCK_FALLBACK` | `NO` | Phases 9, 13–14 |
| `CUSTOMER_BRANCH_IN_ASSISTANT_CORE` / `SHINMONE_FULL_QUERY_BRANCH` | `NO` / `NO` | Phases 10–11 |
| `SECOND_CUSTOMER_REUSE_PROOF` | `PASS` | Phase 13 |
| `SHINMONE_REMOVAL_GENERIC_RUNTIME_PASS` | `YES` | Phase 13 |
| `CUSTOMER_SPECIFIC_ASSISTANT_CORE_BRANCH` | `NO` | Phases 10, 13 |
| `CUSTOMER_SPECIFIC_GENERIC_RUNTIME_BRANCH` | `NO` | Phases 2–7, 13 |
| `PUBLIC_API_CHANGE` / `SSE_CONTRACT_CHANGE` / `SDK_PUBLIC_API_CHANGE` | `NO` / `NO` / `NO` | Phases 1, 9, 12–15 |
| `CENTRAL_PRISMA_SCHEMA_CHANGE` | `NO` | Phases 1, 11, 15 |

No phase may advance when its gate is failing. A security or predecessor-authority conflict is not eligible for a waiver inside Feature 009; implementation stops and records the exact blocker for human review.

## 10. Test Strategy and Evidence Policy

- **Unit**: Configuration, validation, scoring, exact lookup, TTL/generation/lease state, budgets, normalization, mapping, extraction, and redaction.
- **Contract**: Exact raw-byte proof vectors; generic invocation/bootstrap envelopes; provider handle/profile/application contracts; `GET_QUERY_V1`/`POST_QUERY_JSON_V1`; manifest schema; additive Shinmone Bridge response; existing Assistant/SSE snapshots; and shared central/local compatibility.
- **Integration**: Bridge-to-binding, central-to-runtime, runtime-to-fixture upstream, Feature 008 adapter/projection/evidence, Query Understanding-to-discovery, and SPA provider-to-PageContext.
- **Service-auth/replay**: Signature, digest, claims, key lifecycle, time boundaries, central plus multiple registered bootstrap profiles, complete cross-profile rejection, one-use `jti`, and cache cleanup.
- **Bridge binding transport**: Deterministic local TLS success, HTTP/startup URI rejection, wrong hostname/untrusted certificate, address-policy/pinning failure, redirect denial, ignored proxy environment, 2,000 ms timeout, socket cancellation, zero retry/alternate destination/second bearer send, endpoint non-overridability, post-admission ordering, exact bearer equality, and bearer-sentinel leak capture.
- **Binding lifecycle**: TTL/provider expiry cap, provider-owned handle/metadata, replacement, revocation, concurrency, restart, mismatch, and integration-owned remint.
- **Credential/request profile**: Provider/profile/strategy compatibility, Shinmone bearer and Customer B API-key fixtures, fixed credential slots, exact GET query and POST JSON construction, read-only agreement, and injection rejection.
- **Manifest/network**: Closed DSL, exact operation, SSRF address matrices, DNS rebinding, TLS, redirect, compression, response structure, and size/depth/item/string bounds.
- **Timeout/cancellation**: Central elapsed time, reserve arithmetic, low-budget rejection, local narrowing, upstream abort, disconnect, cleanup, and absence of retry.
- **Leak prevention**: Captured logs, audit, traces, errors, diagnostics, persistence, prompts, evidence, SSE, and snapshots contain none of the prohibited raw values.
- **Customer isolation**: Two Customers with deliberately identical subordinate identifiers prove `customerId` is the outer boundary at discovery, registry, binding, adapter, and evidence stages.
- **Customer B portability**: `inventory.stock-on-hand` executes through generic discovery and all shared modules using its distinct fixture provider/profile, fixed `POST_QUERY_JSON_V1` body/header behavior, and separate output policy.
- **Shinmone removal/source guards**: Remove or disable all Shinmone integration/configuration/SPA fixtures, build generic/shared/central modules, execute Customer B, and scan non-exempt generic source for Shinmone paths/results/IDs, Entry/native-token, Bridge-only, bearer-only, and JWT-exp assumptions.
- **Regression**: Feature 007 identity/session, Feature 008 permission/ToolCall/projection/evidence, mocks, no-answer/tool-failure, public API, SSE, history, feedback, and approval remain green.
- **Eval**: The Chinese reference question and Customer-neutral paraphrases resolve uniquely; missing or tied concepts clarify and do not execute.
- **Live proof**: Staging begins at the actual Assistant question and ends at an evidence-backed existing answer/SSE response. Direct canonical-operation tests remain lower-level coverage only.

For changed behavior, the implementing work must retain observable RED → GREEN evidence: first demonstrate that the new contract or scenario fails for the expected reason, then implement the owning phase and record the same focused test passing. Existing green baselines do not count as RED evidence, and temporarily weakening an assertion is prohibited.

## 11. Deployment Prerequisites and Readiness

Phases 1–13 do not require a real Shinmone business endpoint. When implementation is approved, they use deterministic keys, clocks, DNS, HTTPS fixture servers, registered bootstrap/credential/profile fixtures, two-Customer configurations, mock Bridge/runtime processes, both closed request profiles, and manifests. Generic readiness requires every enabled provider/profile/request-profile dependency to validate, but never requires Shinmone to be enabled. Phase 1 has not executed.

Before Phase 14, deployment owners must provide:

- An approved Shinmone HTTPS scheme/hostname/port/base path; the checked-in HTTP endpoint is ineligible.
- A destination mode and explicit CIDRs when private addressing is required.
- Separate active/published/retiring Bridge-binding and central-invocation RS256 trust sets, private file mounts, issuer/audience/typ values, and rolling-restart rotation evidence.
- An immutable exact HTTPS Bridge binding URI, exact Customer-local allowed-address policy, trusted TLS certificate/hostname configuration, disabled proxy/redirect/retry behavior, and the fixed `BRIDGE_BINDING_REQUEST_TIMEOUT_MS=2000` setting.
- Exact Customer, integration, HostApp, connector key, connector instance, and upstream configuration.
- A valid Customer-local manifest and ready single-replica Connector Runtime.
- An admitted staging user whose native token remains Customer-local and whose Customer policy permits the canonical read-only tool.
- Shinmone provider deployment carrying the transient reference through existing PageContext.

`APPROVED_SHINMONE_HTTPS_ORIGIN` is therefore an explicit staging/UAT gate, not an open architecture blocker and not a dependency for earlier implementation.

Production and staging readiness reject loopback or test fixture policies for the Bridge binding route. Deterministic loopback TLS is permitted only under explicit enforced test configuration; it does not authorize HTTP fallback and cannot satisfy either Connector Runtime or Bridge staging readiness.

## 12. Constitution Check — Post-Phase-Design Gate

The phased design remains compliant after implementation decomposition:

- Bounded contexts and ownership stay separate; no Controller or prompt becomes a security authority.
- Test-first coverage includes failures, cross-Customer isolation, query-understanding evals, authorization, replay, projection, no-answer, and tool failure.
- Trusted central claims and exact deployment configuration constrain every invocation; Browser data and the opaque reference remain non-authoritative.
- Internal contracts are versioned and bounded while public Assistant, SDK, and SSE contracts remain unchanged.
- Tool discovery is measurable, policy-filtered, and clarification-safe; output remains evidence-backed through Feature 008.
- Safe audit correlation remains possible without persisting prohibited secrets or pre-projection data.
- The only operation is read-only and creates no approval-path exception.

**Post-phase-design document result**: PASS. Complexity tracking is not required because there is no constitutional violation or unresolved technical design exception. Human implementation-gate review has passed.

## 13. Final Completion Criteria

Feature 009 implementation may become ready for release review only when all fifteen phase exit gates pass; Customer B portability and Shinmone removal pass before staging; the Phase 14 live proof starts from `這個月新增幾張工單？`; rollback is demonstrated; and repository inspection confirms no unplanned Prisma, SDK, public Assistant, SSE, Feature 007 authority, or Feature 008 authority change. Current state is accepted for Phase 1 implementation, which has not yet executed.

The expected plan-level conclusion is:

```text
FEATURE007_AMENDMENT_PRESERVED=YES
FEATURE008_AUTHORITIES_PRESERVED=YES
NATIVE_CREDENTIAL_CENTRAL_ALLOWED=NO
CONNECTOR_CONTEXT_REF_PERSISTENCE_ALLOWED=NO
TOOLDEFINITION_TIMEOUT_SINGLE_AUTHORITY=YES
FEATURE008_TIMEOUT_SINGLE_AUTHORITY=ToolDefinition.timeoutMs
GENERIC_DISCOVERY_PLAN_INCLUDED=YES
SHINMONE_SPECIFIC_ASSISTANT_BRANCH_ALLOWED=NO
CENTRAL_PRISMA_SCHEMA_CHANGE_REQUIRED=NO
SDK_PUBLIC_API_CHANGE_REQUIRED=NO
ASSISTANT_PUBLIC_API_CHANGE_REQUIRED=NO
HTTPS_STAGING_PREREQUISITE_EXPLICIT=YES
HTTPS_PREREQUISITE_BLOCKS_EARLY_IMPLEMENTATION=NO
BRIDGE_BINDING_TRANSPORT_PROFILE=BRIDGE_BINDING_TRANSPORT_V1
BRIDGE_BINDING_TRANSPORT_HTTPS=YES
BRIDGE_BINDING_HTTPS_ONLY=YES
BRIDGE_BINDING_EXACT_CONFIG_DESTINATION=YES
BRIDGE_BINDING_DESTINATION_BROWSER_OVERRIDE=NO
BRIDGE_BINDING_RETRY=NO
BRIDGE_BINDING_REDIRECT=NO
BRIDGE_BINDING_PROXY_INHERITANCE=NO
BRIDGE_BINDING_TLS_HOSTNAME_VERIFY=YES
BRIDGE_BINDING_NATIVE_CREDENTIAL_CONFIDENTIALITY=PASS
BRIDGE_BINDING_TIMEOUT_MS=2000
OPEN_PLAN_BLOCKERS=0
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
