# Tasks: Feature 009 — Productized Business Connector Runtime

**Input**: Accepted `spec.md`, `design.md`, and `plan.md` approved for Phase 1 implementation.
**Status**: Accepted — Approved for Phase 1 implementation. `PHASE1_EXECUTED=NO`; all tasks remain unchecked.
**Scope**: Implement the reusable two-sided connector runtime, executable Synthetic Customer B portability fixture, removable Shinmone reference slice, and Shinmone-removal gate through the existing Feature 008 path. Feature 007 is a completed read-only predecessor; Phase 8 is `FEATURE009_IMPLEMENTATION_CONSUMING_ACCEPTED_FEATURE007_AMENDMENT`, never Feature 007 reimplementation.
**Test rule**: Every meaningful new contract or behavior starts with an authentic RED against current code, followed by the narrow GREEN and the phase checkpoint. Never manufacture RED by breaking production code.

## Execution and Stop Rules

- Complete phases through their checkpoint chain. A later phase cannot start while its predecessor checkpoint is incomplete.
- Each RED task preserves its initial failure output; each GREEN reruns the focused RED suite plus named adjacent regressions.
- `[P]` appears only on disjoint read-only baseline work and independent shared-contract RED authoring. All other work is sequential because it shares contracts, configuration, composition, fixtures, or authority.
- Feature 007 `spec.md`, `design.md`, `plan.md`, `tasks.md`, and historical evidence are read-only. Preserve the truthful history: original identity implementation, later incompatibility discovery, accepted amendment, then Feature 009 Stage 2 implementation.
- The accepted Feature 007 amendment changes only the native credential's allowed post-admission Customer-local destination; it does not reclassify Feature 007 as incomplete or authorize predecessor reimplementation.
- MenuDetail and `IdentityAdmissionService` must both succeed before Shinmone Stage 2. Stage 1 remains SPA → Identity Bridge → exact MenuDetail → `IdentityAdmissionService`; only after success may Shinmone Stage 2 send the same AccessToken once to the exact authenticated Customer-local binding route. This is one provider profile, not the generic bootstrap model.
- Bridge-side Feature 009 Stage 2 changes are narrowly limited to `apps/identity-bridge/src/connector-binding/**`, `apps/identity-bridge/src/exchange/**`, and approved narrow Bridge configuration/module composition.
- Generic Customer-local receipt and minting belongs to `apps/customer-connector-runtime/**`, including the exact `POST /v1/internal/connector-bindings` endpoint, registered binding-bootstrap profiles/providers, provider-owned credential handles/metadata, credential profiles/application strategies, and closed request profiles; this does not make Feature 007 SDD or historical evidence mutable.
- Connector Runtime gains no identity, permission, Customer, HostApp, Entry, or Gateway authority.
- MenuDetail remains native validity and permission authority. Feature 007/Gateway retains identity; IntegrationBinding retains Customer; allowedHostApp retains HostApp; ToolDefinition retains operation/output/timeout; Feature 008 retains permission, ToolCall, projection, evidence, answer, and SSE authority.
- Every binding mint uses an exact registered Customer-local bootstrap service profile and bounded sensitive `providerPayload`; central invocation proofs, Feature 007 user tokens, Browser calls, and cross-profile acceptance are rejected. `BRIDGE_BINDING_TRANSPORT_V1` is solely Shinmone's Stage 2 profile: exact HTTPS destination, separate `assistant-connector-binding+jwt` domain, fixed 2,000 ms lifecycle, and no proxy, redirect, retry, alternate destination, or second bearer send.
- Generic manifests use only `credentialProfileRef`; registered `CredentialProvider` and `CredentialApplicationStrategy` implementations own credential source/application. Generic binding records contain no mandatory `acceptedEntry`, `nativeAccessToken`, bearer, or JWT-exp assumption.
- V1 operation execution is limited to read-only `GET_QUERY_V1` and `POST_QUERY_JSON_V1`; adding a Customer is configuration-only when profiles suffice, otherwise a Customer-local provider/plugin extension, and never a Customer branch in Assistant core, central adapter/transport, or generic runtime orchestration.
- RefreshToken handoff, central native credentials, Browser-selected context/destination/profile, and rewriting Feature 007 evidence are stop conditions requiring `HUMAN_REQUIRED`. The same stop applies to generic URL/SQL/command execution, arbitrary POST bodies/headers, projection bypass, public Assistant/SSE/SDK change, central Prisma change, Customer-specific Assistant or generic-runtime routing, HTTP production/staging fallback, shared/cross-accepted service profiles, or real Shinmone access before T126 passes.

## Phase 1 — Baseline and Predecessor-Contract Protection

**Goal**: Freeze current Feature 007/008 behavior and distinguish accepted amendment authority from original implementation history.  
**Dependencies**: None.  
**Independent test**: Existing identity, transient-context, tool, projection, evidence, mock, public, and SSE suites pass without production or test edits.

- [ ] T001 [VERIFY] [P] [IDENTITY-BRIDGE] Capture the current Feature 007 runtime baseline without rewriting its history.
  - Files: `apps/identity-bridge/test/exchange/**`, `apps/identity-bridge/test/idx/**`, `apps/identity-bridge/test/signing/**`, `apps/identity-bridge/test/jwks/**`, `test/integration/gateway-integration-binding.persistence.spec.ts`, `test/e2e/gateway-backend-trust-chain.e2e-spec.ts`.
  - Depends on: none.
  - Validation: Run focused Bridge MenuDetail, admission, permission, canonical JWT/JWKS, redaction, and existing session bootstrap suites; record current pass/fail output only in this task's later evidence.
  - Stop: Do not edit Feature 007 source, tests, documents, task checkboxes, or historical evidence.

- [ ] T002 [VERIFY] [P] [BACKEND] Capture Feature 008 trusted/transient/tool authority baselines.
  - Files: `test/unit/host-integration-request.factory.spec.ts`, `test/integration/feature008-transient-boundary.spec.ts`, `test/unit/data-adapter-registry.service.spec.ts`, `test/unit/tool-registry.service.spec.ts`, `test/unit/tool-permission-precheck.service.spec.ts`, `test/unit/tool-call.service.spec.ts`.
  - Depends on: none.
  - Validation: Run the listed suites and record HostIntegrationContext, transient reference, exact registry, ToolDefinition, arguments, permission, lifecycle, and timeout behavior.
  - Stop: Do not change fixtures or assertions to make the baseline pass.

- [ ] T003 [VERIFY] [P] [BACKEND] Capture Feature 008 projection, evidence, mock, answer, and public compatibility baselines.
  - Files: `test/unit/adapter-result-projector.service.spec.ts`, `test/unit/evidence-ref.service.spec.ts`, `test/unit/grounded-answer-input.spec.ts`, `test/unit/mock-connector-adapter.spec.ts`, `test/integration/authorized-evidence-answer.spec.ts`, `test/integration/tool-failure-safe-response.spec.ts`, `test/contract/assistant-messages-sse.contract.spec.ts`.
  - Depends on: none.
  - Validation: Run the listed suites and record outputSchema projection, masking, EvidenceRef, GroundedAnswerInput, mock, no-answer/tool-failure, and SSE behavior.
  - Stop: No public response, AnswerDecision, SSE, evidence, or mock contract change is permitted.

- [ ] T004 [VERIFY] [P] [BACKEND] Capture protected hashes, repository scope, and prohibited-data surface baseline.
  - Files: Feature 009 `spec.md`, `design.md`, `plan.md`; Feature 007 `spec.md`, `design.md`, `plan.md`, `tasks.md`; `specs/.DS_Store`; `prisma/schema.prisma`; `prisma/migrations/`; `test/integration/secret-redaction.spec.ts`.
  - Depends on: none.
  - Validation: Record hashes/status and run existing redaction checks for native credential and `connectorContextRef`; preserve all pre-existing worktree state.
  - Stop: This task may update only later evidence in this Feature 009 `tasks.md`.

- [ ] T005 [CHECKPOINT] [BACKEND] Verify and record the Phase 1 predecessor baseline gate.
  - Files: `specs/009-productized-business-connector-runtime/tasks.md` evidence only.
  - Depends on: T001, T002, T003, T004.
  - Validation: Confirm all baseline commands completed without mutation and record both `PREDECESSOR_CONTRACT_BASELINE_RESULT=PASS` and `PHASE1_EXECUTED=YES` when T005 completes. Until then, the document-level gate metadata remains `PHASE1_EXECUTED=NO`.
  - Stop: Do not proceed if Feature 007 history is rewritten or any Feature 008 authority differs from the accepted baseline.

## Phase 2 — Shared Connector-Runtime Contracts

**Goal**: Define one strict internal contract package before either runtime side implements behavior.  
**Dependencies**: T005.  
**Independent test**: Valid V1 vectors parse identically while unknown or unsafe fields fail closed and generic execution inputs are structurally impossible.

- [ ] T006 [RED] [P] [BACKEND] Add failing invocation and generic binding-bootstrap envelope contract tests.
  - Files: `packages/connector-runtime-contract/test/wire/invocation.contract.spec.ts`, `packages/connector-runtime-contract/test/wire/binding.contract.spec.ts`.
  - Depends on: T005.
  - Validation: Run package tests and preserve failures caused only by absent V1 validators; require a bounded sensitive `providerPayload`, exact authenticated bootstrap profile/context, provider-dispatched result semantics, opaque reference response, and rejection of central/user/cross-profile proofs.
  - Stop: Neither generic contract may require `nativeAccessToken`, `acceptedEntry`, MenuDetail, Bridge-only bootstrap, bearer application, or JWT-exp parsing.

- [ ] T007 [GREEN] [BACKEND] Implement strict invocation and binding V1 wire contracts.
  - Files: `packages/connector-runtime-contract/src/wire/**`, package configuration and exports under `packages/connector-runtime-contract/**`.
  - Depends on: T006.
  - Validation: Make T006 pass; verify 16,384-byte requests, 16,384-byte invocation responses, 4,096-byte binding responses, versions, request IDs, trusted context, exact registered bootstrap profile, bounded provider payload, operation, and opaque reference.
  - Stop: Do not expose these types through the public Assistant or SDK API.

- [ ] T008 [RED] [P] [BACKEND] Add failing service-proof, safe-error, and limit contract tests.
  - Files: `packages/connector-runtime-contract/test/service-auth/service-proof.contract.spec.ts`, `packages/connector-runtime-contract/test/errors/safe-errors.contract.spec.ts`, `packages/connector-runtime-contract/test/limits/limits.contract.spec.ts`.
  - Depends on: T005.
  - Validation: Preserve RED for absent central and registered binding-bootstrap claim types, provider/profile isolation, closed error codes, body/provider-payload/JSON/budget bounds, and unknown-field rejection.
  - Stop: Do not select a new algorithm, wire version, error family, or timeout authority.

- [ ] T009 [GREEN] [BACKEND] Implement service-proof claims, safe errors, and shared limits.
  - Files: `packages/connector-runtime-contract/src/service-auth/**`, `src/errors/**`, `src/limits/**`, and package exports.
  - Depends on: T008, T007.
  - Validation: Make T008 pass; prove the central profile and multiple exact binding-bootstrap profiles have separate issuer/audience/provider/key domains and closed code-only failures; include the Shinmone Bridge and Customer B fixture profiles.
  - Stop: Never place private keys, credentials, endpoints, raw exceptions, or caller-controlled budgets in shared values.

- [ ] T010 [RED] [P] [BACKEND] Add failing closed manifest V1 schema tests.
  - Files: `packages/connector-runtime-contract/test/manifest/manifest-v1.contract.spec.ts`.
  - Depends on: T005.
  - Validation: Preserve RED for absent versioned schema, `credentialProfileRef`, `GET_QUERY_V1`, `POST_QUERY_JSON_V1`, exact operation/version, fixed mappings, read-only agreement, response extraction, limits, and strict unknown-key rejection.
  - Stop: Do not permit callbacks, arbitrary templates, wildcard operations, or executable configuration.

- [ ] T011 [GREEN] [BACKEND] Implement the versioned closed manifest schema and validator.
  - Files: `packages/connector-runtime-contract/src/manifest/**` and package exports.
  - Depends on: T010, T007, T009.
  - Validation: Make T010 pass with immutable startup validation, generic bootstrap/provider/credential/profile/application interfaces, and the two closed read-request profile schemas.
  - Stop: No Customer endpoint, credential value, policy decision, or ToolDefinition registration belongs in the shared package.

- [ ] T012 [RED] [BACKEND] Add structural-negative tests for all prohibited generic inputs.
  - Files: `packages/connector-runtime-contract/test/wire/prohibited-inputs.contract.spec.ts`, `test/manifest/closed-dsl-negative.contract.spec.ts`.
  - Depends on: T007, T009, T011.
  - Validation: Demonstrate RED if accepted generic types can require Shinmone/Feature 007 token/Entry/JWT fields or represent arbitrary URL/method/path/query/header/body/credential, executable template/callback/script, SQL, shell, generic command, or side effect.
  - Stop: Do not weaken the test through type casts or permissive unknown records.

- [ ] T013 [GREEN] [BACKEND] Close shared validators and exports against prohibited input representation.
  - Files: `packages/connector-runtime-contract/src/wire/**`, `src/manifest/**`, `src/limits/**`, package root exports.
  - Depends on: T012.
  - Validation: Make T012 pass and rerun T006, T008, and T010 suites.
  - Stop: Shinmone `nativeAccessToken`, `acceptedEntry`, bearer, MenuDetail, and JWT-exp semantics belong only to its later integration provider, never the generic contract package.

- [ ] T014 [VERIFY] [BACKEND] Verify shared-package build, deterministic vectors, and dependency isolation.
  - Files: `packages/connector-runtime-contract/**`, root package build wiring if required by the accepted package layout.
  - Depends on: T013.
  - Validation: Run package tests/build/typecheck and verify no Nest/Prisma/Assistant/Customer integration import; source guards reject Shinmone paths/result fields/IDs and mandatory native-token/Entry/Bridge/bearer/JWT assumptions.
  - Stop: Do not begin central or Customer-local network behavior in this phase.

- [ ] T015 [CHECKPOINT] [BACKEND] Verify and record the Phase 2 contract gate.
  - Files: `specs/009-productized-business-connector-runtime/tasks.md` evidence only.
  - Depends on: T007, T009, T011, T013, T014.
  - Validation: Record a machine-readable evidence block with `CONNECTOR_RUNTIME_CONTRACT_READY=YES` only when all contract and structural-negative suites pass.
  - Stop: Phase 3 cannot start with a permissive field, unresolved contract, or failing package build.

## Phase 3 — Customer-Local Configuration, Service Authentication, and Replay

**Goal**: Establish a dark, fail-closed Connector Runtime foundation with separate central invocation and registered binding-bootstrap verifier profiles.
**Dependencies**: T015.  
**Independent test**: Only fresh, exact, correctly signed bytes are accepted; no credential-bearing binding route is active.

- [ ] T016 [RED] [CONNECTOR-RUNTIME] Add failing standalone app, configuration, health, and readiness tests.
  - Files: `apps/customer-connector-runtime/test/bootstrap.spec.ts`, `test/config/configuration.spec.ts`, `test/health/readiness.spec.ts`.
  - Depends on: T015.
  - Validation: Preserve RED caused by the absent Nest app, immutable configuration parser, `/health`, and fail-closed `/ready`.
  - Stop: Do not activate invocation, binding, manifest, credential, or upstream routes.

- [ ] T017 [GREEN] [CONNECTOR-RUNTIME] Create the standalone Nest application and configuration/readiness shell.
  - Files: `apps/customer-connector-runtime/package.json`, Nest/TypeScript/Jest configuration, `src/main.ts`, root module, `src/config/**`, `src/health/**`.
  - Depends on: T016.
  - Validation: Make T016 pass and run the independent app build; readiness remains false for unavailable later capabilities.
  - Stop: No database dependency, shared Gateway runtime, business route, or production-ready claim.

- [ ] T018 [RED] [CONNECTOR-RUNTIME] Add failing tests for central and registered binding-bootstrap RS256 verifier profiles.
  - Files: `apps/customer-connector-runtime/test/service-auth/verifier-profiles.spec.ts`.
  - Depends on: T017.
  - Validation: Cover central, Shinmone Bridge, and Customer B fixture profiles plus unsigned, wrong algorithm/type/issuer/audience/provider/context, shared-key-domain attempts, unknown/retired key, and full cross-acceptance matrix; preserve intended RED.
  - Stop: No profile may accept Feature 007 user tokens, central proof on bootstrap, bootstrap proof on invocation, or another provider's key/profile.

- [ ] T019 [GREEN] [CONNECTOR-RUNTIME] Implement profile-specific service-proof verification and key lifecycle.
  - Files: `apps/customer-connector-runtime/src/service-auth/**`.
  - Depends on: T018.
  - Validation: Make T018 pass using a startup registry of exact provider-bound `typ`/issuer/audience/context/key profiles, five-second tolerance, and published/active/retiring rules.
  - Stop: No private signing key or native credential may enter verifier configuration.

- [ ] T020 [RED] [CONNECTOR-RUNTIME] Add failing exact raw-body digest and request-bound tests.
  - Files: `apps/customer-connector-runtime/test/service-auth/raw-body-proof.spec.ts`.
  - Depends on: T019.
  - Validation: Cover both route classes, altered bytes, digest mismatch, JSON reserialization difference, absent/invalid content type, content encoding, body over 16,384 bytes, and providerPayload bounds.
  - Stop: Do not compare reserialized objects or parse before raw-body proof and bounds.

- [ ] T021 [GREEN] [CONNECTOR-RUNTIME] Implement raw-body capture, exact SHA-256 verification, and preparse bounds.
  - Files: `apps/customer-connector-runtime/src/service-auth/**`, app bootstrap/body handling.
  - Depends on: T020.
  - Validation: Make T020 pass and rerun profile tests; constant-time digest comparison precedes parsing.
  - Stop: Raw request bytes and service JWT must not reach logs, audit, diagnostics, or errors.

- [ ] T022 [RED] [CONNECTOR-RUNTIME] Add failing freshness, replay, and rotation lifecycle tests.
  - Files: `apps/customer-connector-runtime/test/replay/replay-cache.spec.ts`, `test/service-auth/key-lifecycle.spec.ts`.
  - Depends on: T021.
  - Validation: Cover early/expired proofs, reused `jti`, atomic claim, capacity, cleanup, restart, active/retiring/unknown keys, and failed-request nonrelease.
  - Stop: Do not make replay entries durable or reusable after downstream failure.

- [ ] T023 [GREEN] [CONNECTOR-RUNTIME] Implement bounded in-memory replay protection and lifecycle checks.
  - Files: `apps/customer-connector-runtime/src/replay/**`, `src/service-auth/**`.
  - Depends on: T022.
  - Validation: Make T022 pass with one accepted `jti` use, TTL/cap cleanup, and restart invalidation.
  - Stop: V1 remains single-replica; do not introduce Redis, database, or horizontal readiness.

- [ ] T024 [RED] [CONNECTOR-RUNTIME] Add failing redaction, readiness, and inactive-binding-route tests.
  - Files: `apps/customer-connector-runtime/test/observability/redaction.spec.ts`, `test/health/readiness.spec.ts`, `test/service-auth/route-activation.spec.ts`.
  - Depends on: T023.
  - Validation: Require proofs/raw bytes/key/provider-payload data absent from captures and prove `/v1/internal/connector-bindings` is not active in Phase 3.
  - Stop: Do not claim ready while bindings, manifest, upstream, or required trust/configuration are incomplete.

- [ ] T025 [GREEN] [CONNECTOR-RUNTIME] Complete safe observability and foundational readiness composition.
  - Files: `apps/customer-connector-runtime/src/observability/**`, `src/health/**`, root module composition.
  - Depends on: T024.
  - Validation: Make T024 pass; expose only safe health/readiness metadata and keep credential route inactive.
  - Stop: No proof, endpoint topology, private material, or sensitive context in health, logs, audit, or telemetry.

- [ ] T026 [CHECKPOINT] [CONNECTOR-RUNTIME] Verify and record the Phase 3 service-auth/replay gate.
  - Files: `specs/009-productized-business-connector-runtime/tasks.md` evidence only.
  - Depends on: T017, T019, T021, T023, T025.
  - Validation: Run the full app foundational suites/build and record `SERVICE_AUTH_REPLAY_PROTECTION=READY`, `BINDING_CREDENTIAL_ROUTE_ACTIVE=NO`, and `BINDING_BOOTSTRAP_PROFILE_ISOLATION=PASS`.
  - Stop: Do not proceed if central/bootstrap or bootstrap-provider profiles overlap, raw-body checks occur late, or replay protection is incomplete.

## Phase 4 — Customer-Local Binding Lifecycle

**Goal**: Create, resolve, lease, revoke, and expire context-bound volatile bindings holding provider-owned handles/metadata without implementing any bootstrap initiator transport.
**Dependencies**: T026.  
**Independent test**: One valid reference resolves locally within its exact tuple and lifetime; every mismatch fails before credential access.

- [ ] T027 [RED] [US1] [CONNECTOR-RUNTIME] Add failing reference generation, hashed lookup, and TTL tests.
  - Files: `apps/customer-connector-runtime/test/bindings/binding-store.spec.ts`.
  - Depends on: T026.
  - Validation: Cover 256-bit `ccr_` references, SHA-256 lookup key, no raw-reference storage, 120-second max, optional provider expiry cap minus 15 seconds, 60-second absent-cap fallback, 15-second minimum, and no generic JWT parsing.
  - Stop: Do not persist/embed credential material, `acceptedEntry`, or `nativeAccessToken` in the reference or generic binding.

- [ ] T028 [GREEN] [US1] [CONNECTOR-RUNTIME] Implement the bounded in-memory binding store and lifetime calculation.
  - Files: `apps/customer-connector-runtime/src/bindings/**`.
  - Depends on: T027.
  - Validation: Make T027 pass with injected clock/randomness, provider key, opaque credential handle, bounded provider metadata, binding/credential generations, and optional actor/organization constraints.
  - Stop: No durable store, reversible reference key, Customer-specific mandatory field, RefreshToken, cookie, or central state.

- [ ] T029 [RED] [US1] [CONNECTOR-RUNTIME] Add failing exact context and single-generation tests.
  - Files: `apps/customer-connector-runtime/test/bindings/binding-context.spec.ts`.
  - Depends on: T028.
  - Validation: Vary Customer, integration, HostApp, connector instance, optional organization/actor constraints, bootstrap/credential provider, binding generation, and credential generation independently.
  - Stop: Errors must not disclose which dimension mismatched.

- [ ] T030 [GREEN] [US1] [CONNECTOR-RUNTIME] Implement exact binding context checks and atomic generation replacement.
  - Files: `apps/customer-connector-runtime/src/bindings/**`.
  - Depends on: T029.
  - Validation: Make T029 pass; successful remint revokes the prior generation before it can lease.
  - Stop: Browser, Assistant session ID, or reference possession must not establish context authority.

- [ ] T031 [RED] [US1] [CONNECTOR-RUNTIME] Add failing concurrency, revoke, cleanup, and restart tests.
  - Files: `apps/customer-connector-runtime/test/bindings/binding-lifecycle.spec.ts`.
  - Depends on: T030.
  - Validation: Cover four leases, fifth busy before provider resolution, finally-release, expiry, administrative/provider rejection, bounded sweep, provider-handle teardown, and restart invalidation.
  - Stop: Do not exceed four leases or leave a provider handle/credential accessible after revoke/expiry.

- [ ] T032 [GREEN] [US1] [CONNECTOR-RUNTIME] Implement lease, revocation, cleanup, and shutdown lifecycle.
  - Files: `apps/customer-connector-runtime/src/bindings/**` and local shutdown composition.
  - Depends on: T031.
  - Validation: Make T031 pass under deterministic timers and concurrent access.
  - Stop: Do not add cross-replica semantics or claim horizontal readiness.

- [ ] T033 [RED] [US1] [CONNECTOR-RUNTIME] Add failing Customer-local binding server-route, leak, and cross-boundary tests.
  - Files: `apps/customer-connector-runtime/test/bindings/connector-binding-route.spec.ts`, `test/bindings/binding-security.spec.ts`, `test/observability/redaction.spec.ts`.
  - Depends on: T032.
  - Validation: Preserve store/leak/tuple coverage and prove the absent exact `POST /v1/internal/connector-bindings`; require POST, JSON/no encoding, 16,384-byte cap, one exact registered bootstrap `typ`/issuer/audience/provider/key profile, raw-byte SHA-256 before JSON trust, freshness/replay, signed context equality, strict generic schema with bounded sensitive `providerPayload`, provider-owned handle/cap/metadata result, and rejection of Feature 007 user JWTs, central proofs, and other bootstrap profiles. Require order raw method/content/bounds → profile proof/digest → freshness/replay/context → parse/schema → profile/config equality → selected `BindingBootstrapProvider` closed validation/create → `ConnectorBindingService.mint()` → only version/requestId/reference/expiresIn within 4,096 bytes; failures are safe and all sensitive values are redacted.
  - Stop: Never satisfy through post-storage redaction; no Browser/profile override, cross-profile provider dispatch, identity authority, generic JWT parse, or credential field in the binding.

- [ ] T034 [GREEN] [US1] [CONNECTOR-RUNTIME] Implement and compose the generic Customer-local binding-bootstrap endpoint.
  - Files: `apps/customer-connector-runtime/src/bindings/connector-binding.controller.ts`, `src/bindings/connector-binding-request.service.ts`, existing `src/bindings/**`, `src/observability/**`, and narrow runtime module/root composition.
  - Depends on: T033.
  - Validation: Make T033 pass by composing Phase 3 exact bootstrap-profile verification/replay with `BindingBootstrapProviderRegistry` and `ConnectorBindingService`; activate the route only after foundations validate, preserve processing order/bounds, return no provider handle/metadata, and prove credential resolution/upstream seams remain untouched for invalid requests.
  - Stop: Do not implement any initiator/Bridge client, add identity/permission/Customer/HostApp/Entry/Gateway authority, call upstream, expose centrally, parse generic JWT expiry, or permit Browser minting.

- [ ] T035 [CHECKPOINT] [US1] [CONNECTOR-RUNTIME] Verify and record the Phase 4 binding gate.
  - Files: `specs/009-productized-business-connector-runtime/tasks.md` evidence only.
  - Depends on: T028, T030, T032, T034.
  - Validation: Run all binding/route suites and record `NATIVE_CREDENTIAL_CENTRAL=NO`, `CONNECTOR_CONTEXT_REF_PERSISTED=NO`, all cross-dimension reuse denied, `BINDING_CREDENTIAL_ROUTE_ACTIVE=YES`, `BINDING_ROUTE_PROFILE=BINDING_BOOTSTRAP_ONLY`, `BINDING_ROUTE_PROFILE_ISOLATION=PASS`, `BINDING_ROUTE_NATIVE_TOKEN_CENTRAL=NO`, and `BINDING_ROUTE_SERVICE_AUTH_ORDER=PASS`; Shinmone's separate profile marker is recorded in T080.
  - Stop: Phase 5 cannot start if the Customer-local binding endpoint is inactive or insecure, or if raw reference storage, credential egress, profile confusion, ordering failure, or context ambiguity exists.

## Phase 5 — Closed Operation Manifest and Credential Boundary

**Goal**: Resolve only startup-approved read operations and keep provider-handle resolution plus credential application behind every trust and validation gate.
**Dependencies**: T035.  
**Independent test**: One exact fixture operation maps safely; every unknown, dynamic, executable, or excessive entry fails before credential access.

- [ ] T036 [RED] [US3] [CONNECTOR-RUNTIME] Add failing closed startup manifest-schema tests.
  - Files: `apps/customer-connector-runtime/test/manifest/manifest-loader.spec.ts`.
  - Depends on: T035.
  - Validation: Cover duplicate key/version, unknown fields, wildcard, callback/template/script, dynamic URL/method/path/query/header/body, traversal, SQL/shell/command, non-read-only classification, unsupported request profile, and cap violations.
  - Stop: Do not relax the shared schema or allow runtime-generated executable configuration.

- [ ] T037 [GREEN] [US3] [CONNECTOR-RUNTIME] Implement immutable startup manifest loading and readiness failure.
  - Files: `apps/customer-connector-runtime/src/manifest/**`, `src/health/**`.
  - Depends on: T036.
  - Validation: Make T036 pass using read-only absolute manifest files and strict shared validation.
  - Stop: No hot reload, callbacks, wildcard operation, or partially valid registry.

- [ ] T038 [RED] [US3] [CONNECTOR-RUNTIME] Add failing exact operation/version and validated-argument mapping tests.
  - Files: `apps/customer-connector-runtime/test/manifest/operation-manifest-registry.spec.ts`.
  - Depends on: T037.
  - Validation: Cover exact success for `GET_QUERY_V1` and `POST_QUERY_JSON_V1`, missing/ambiguous/inactive/version mismatch, bad arguments, fixed literals, schema-bound named mappings, unrestricted expansion, and destination/method/path/query/header/body overrides.
  - Stop: Caller arguments may select only explicitly declared bounded values.

- [ ] T039 [GREEN] [US3] [CONNECTOR-RUNTIME] Implement `OperationManifestRegistry` and closed request mapping.
  - Files: `apps/customer-connector-runtime/src/manifest/**`.
  - Depends on: T038.
  - Validation: Make T038 pass with exact immutable entries and safe failures; include generic fixture manifests for GET and Synthetic Customer B `inventory.stock-on-hand` using `POST_QUERY_JSON_V1 /inventory/stock/query`, only named `sku`, and a `credentialProfileRef`.
  - Stop: No fallback to another operation, version, service reference, or generic transport.

- [ ] T040 [RED] [US3] [CONNECTOR-RUNTIME] Add failing credential-provider/profile/strategy ordering and override tests.
  - Files: `apps/customer-connector-runtime/test/credentials/credential-profile-registry.spec.ts`, `test/credentials/credential-providers.spec.ts`, `test/manifest/execution-order.spec.ts`.
  - Depends on: T039.
  - Validation: Prove provider remains uncalled until service auth, replay/context, binding, manifest/profile/read-only/arguments pass; reject unknown/incompatible/overridden profile, handle/provider, and application strategy. Cover removable Shinmone bearer and fixture-only Customer B API-key registrations.
  - Stop: Never expose material/handle to manifest, caller, errors, health, or central code; no manifest-selected header.

- [ ] T041 [GREEN] [US3] [CONNECTOR-RUNTIME] Implement registered credential providers, profiles, and fixed application strategies behind validated bindings.
  - Files: `apps/customer-connector-runtime/src/credentials/**`, manifest execution composition.
  - Depends on: T040.
  - Validation: Make T040 pass with `CredentialProvider`, `CredentialProfileRegistry`, and `CredentialApplicationStrategy`; include provider-owned handle semantics, bearer fixture, and fixed allowlisted `X-Inventory-Key` fixture strategy without leaking material.
  - Stop: No credential-returning public interface, bearer-only generic contract, caller/header injection, Customer identity call, or generic RefreshToken support.

- [ ] T042 [RED] [US3] [CONNECTOR-RUNTIME] Add failing response declaration, extraction pointer, limit, and readiness tests.
  - Files: `apps/customer-connector-runtime/test/manifest/response-contract.spec.ts`, `test/health/readiness.spec.ts`.
  - Depends on: T041.
  - Validation: Cover bad JSON Pointer, unsupported/incompatible credential profile or request profile, invalid response schema, excessive limit, missing provider/strategy/manifest, and incomplete readiness.
  - Stop: Readiness cannot be true with an invalid or incomplete manifest/credential boundary.

- [ ] T043 [GREEN] [US3] [CONNECTOR-RUNTIME] Complete manifest response declarations, caps, and readiness composition.
  - Files: `apps/customer-connector-runtime/src/manifest/**`, `src/health/**`.
  - Depends on: T042.
  - Validation: Make T042 pass and rerun T036, T038, and T040 suites.
  - Stop: This phase does not perform an upstream connection or release a result.

- [ ] T044 [CHECKPOINT] [US3] [CONNECTOR-RUNTIME] Verify and record the Phase 5 exact-manifest gate.
  - Files: `specs/009-productized-business-connector-runtime/tasks.md` evidence only.
  - Depends on: T037, T039, T041, T043.
  - Validation: Record `MANIFEST_OPERATION_EXACT_MATCH=YES`, `CREDENTIAL_PROFILE_ISOLATION=PASS`, `CLOSED_READ_REQUEST_PROFILES=GET_QUERY_V1,POST_QUERY_JSON_V1`, and all generic URL/SQL/command/body/header gates as `NO` only after the full suite passes.
  - Stop: Phase 6 cannot start if credential resolution is reachable through an invalid request.

## Phase 6 — Safe Upstream Network, Execution, and Result Extraction

**Goal**: Execute a fixed manifest request over a pinned safe HTTPS connection and return only a validated bounded business envelope.  
**Dependencies**: T044.  
**Independent test**: A deterministic HTTPS fixture succeeds; every unsafe destination, response, timeout, and extraction case fails without raw release or retry.

- [ ] T045 [RED] [US6] [CONNECTOR-RUNTIME] Add failing closed GET/POST-query construction and HTTPS destination-policy tests.
  - Files: `apps/customer-connector-runtime/test/upstream/destination-policy.spec.ts`.
  - Depends on: T044.
  - Validation: Cover exact `GET_QUERY_V1` query and `POST_QUERY_JSON_V1` object assembly from fixed literals/schema-bound named mappings, read-only agreement, exact scheme/host/port/base path, address modes, URI rejection, and no caller method/path/query/body/header/credential override.
  - Stop: Do not authorize HTTP, a broad private-network grant, or a generic proxy.

- [ ] T046 [GREEN] [US6] [CONNECTOR-RUNTIME] Implement closed read-request builders, `ConnectorDestinationPolicy`, and immutable origin validation.
  - Files: `apps/customer-connector-runtime/src/upstream/connector-destination-policy.ts`, local config integration.
  - Depends on: T045.
  - Validation: Make T045 pass and keep readiness false for unsafe destinations.
  - Stop: Destination comes only from manifest serviceRef/config; POST cannot accept an unrestricted object, template, script, or side effect.

- [ ] T047 [RED] [US6] [CONNECTOR-RUNTIME] Add failing DNS resolution, address normalization, and rebinding tests.
  - Files: `apps/customer-connector-runtime/test/upstream/dns-pinning.spec.ts`.
  - Depends on: T046.
  - Validation: Cover A/AAAA, all-address checks, IPv4-mapped IPv6, mixed answers, metadata, loopback, link-local, multicast, unspecified, public/private mode mismatch, and changed resolution.
  - Stop: No first-address-only acceptance or DNS fallback is allowed.

- [ ] T048 [GREEN] [US6] [CONNECTOR-RUNTIME] Implement all-address validation and connection-time pinned lookup.
  - Files: `apps/customer-connector-runtime/src/upstream/address-validator.ts`, `src/upstream/pinned-lookup.adapter.ts`.
  - Depends on: T047.
  - Validation: Make T047 pass with injected DNS and exact validated-address pinning.
  - Stop: Test loopback requires explicit enforced test mode and cannot satisfy staging readiness.

- [ ] T049 [RED] [US6] [CONNECTOR-RUNTIME] Add failing TLS, redirect, proxy, compression, and retry tests.
  - Files: `apps/customer-connector-runtime/test/upstream/safe-upstream-http-client.spec.ts`.
  - Depends on: T048.
  - Validation: Cover wrong hostname/certificate, redirect, proxy, compression, retry, fixed runtime-owned content headers, provider/strategy compatibility, code-owned bearer and `X-Inventory-Key` slots, and caller/manifest credential-header denial.
  - Stop: Do not disable certificate verification or inherit system/environment proxies.

- [ ] T050 [GREEN] [US6] [CONNECTOR-RUNTIME] Implement the one-shot pinned `SafeUpstreamHttpClient` transport shell.
  - Files: `apps/customer-connector-runtime/src/upstream/safe-upstream-http-client.ts` and module composition.
  - Depends on: T049.
  - Validation: Make T049 pass with TLS verification, redirects/retries/proxy disabled, `Accept-Encoding: identity`, and credential strategy applied only to the already fixed request.
  - Stop: Do not yet parse or extract unbounded response data.

- [ ] T051 [RED] [US6] [CONNECTOR-RUNTIME] Add failing bounded JSON and application-response tests.
  - Files: `apps/customer-connector-runtime/test/upstream/bounded-json-response.spec.ts`.
  - Depends on: T050.
  - Validation: Cover 256 KiB raw cap, UTF-8, depth 8, 100 items, 64 keys, string 1,024, malformed/truncated JSON, wrong content type/encoding, HTTP failure, and application failure.
  - Stop: Do not buffer beyond the cap or return partial/raw bodies.

- [ ] T052 [GREEN] [US6] [CONNECTOR-RUNTIME] Implement bounded streaming response validation.
  - Files: `apps/customer-connector-runtime/src/upstream/bounded-json-response.ts`, `src/upstream/safe-upstream-http-client.ts`.
  - Depends on: T051.
  - Validation: Make T051 pass and prove rejected bodies never reach extraction.
  - Stop: Raw upstream bodies must not enter logs, errors, central responses, or diagnostics.

- [ ] T053 [RED] [US6] [CONNECTOR-RUNTIME] Add failing response extraction and safe-error normalization tests.
  - Files: `apps/customer-connector-runtime/test/upstream/response-extractor.spec.ts`, `test/upstream/upstream-errors.spec.ts`.
  - Depends on: T052.
  - Validation: Cover missing pointer, wrong type, Shinmone noninteger/negative count, Customer B invalid sku/quantity, provider-specific auth rejection/revocation, unavailable/application failures, and code-only responses.
  - Stop: Do not expose endpoint, status body, exception, credential, or raw result.

- [ ] T054 [GREEN] [US6] [CONNECTOR-RUNTIME] Implement manifest-bound extraction and safe upstream error mapping.
  - Files: `apps/customer-connector-runtime/src/upstream/response-extractor.ts`, `src/upstream/upstream-errors.ts`, binding revocation integration.
  - Depends on: T053.
  - Validation: Make T053 pass; provider credential rejection revokes its handle/binding generation and only bounded declared fields survive.
  - Stop: Local minimization must not claim Feature 008 projection authority.

- [ ] T055 [RED] [US6] [CONNECTOR-RUNTIME] Add failing Customer-local invocation route, orchestration, timeout, and cleanup tests.
  - Files: `apps/customer-connector-runtime/test/invocation/connector-invocation-route.spec.ts`, `test/upstream/timeout-cancellation.spec.ts`.
  - Depends on: T054.
  - Validation: Preserve budget/cancellation/lease RED coverage and require exact `POST /v1/connector/invocations` order: (1) method/content/encoding/raw cap, (2) central proof/digest, (3) signed claims/context, (4) atomic replay claim, (5) strict parse/schema, (6) body/config equality, (7) reference lookup, (8) binding dimensions/lease, (9) manifest operation/version/read-only/arguments/request profile, (10) compatible credential profile/provider handle resolution, (11) fixed GET or POST-query construction plus code-owned strategy application, (12) destination/DNS/pinning, (13) bounded upstream execution, (14) response validation/extraction, (15) bounded envelope, (16) lease release. Reject every bootstrap/user/cross profile and ensure no early provider/upstream call or raw reference/payload/handle/credential/upstream result release.
  - Stop: Local limits may narrow but never extend the signed remaining budget; no early credential/upstream access or unsafe response is permitted.

- [ ] T056 [GREEN] [US6] [CONNECTOR-RUNTIME] Implement and compose the Customer-local central-only invocation endpoint and generic readiness.
  - Files: `apps/customer-connector-runtime/src/invocation/connector-invocation.controller.ts`, `src/invocation/connector-invocation.service.ts`, existing `src/upstream/**`, binding lease integration, and narrow runtime module/readiness composition.
  - Depends on: T055.
  - Validation: Make T055 pass with a thin controller composing `ConnectorServiceProofVerifier`, replay, bindings, manifests, `CredentialProfileRegistry`, providers/strategies, closed request builders, destination/client, and extraction. Return only accepted envelopes; generic readiness becomes true only with valid central/bootstrap profiles, provider/profile/strategy/request-profile registries, bindings, manifests, network/upstream, and both routes. Test loopback cannot satisfy staging/production readiness.
  - Stop: Do not duplicate component logic in the controller, add permission or ToolDefinition authority, accept Browser destinations, create generic HTTP behavior, retry/redirect, return raw exception/endpoint/credential/reference/proof/claims/upstream payload, or leak a lease.

- [ ] T057 [CHECKPOINT] [US6] [CONNECTOR-RUNTIME] Verify and record the Phase 6 safe-upstream gate.
  - Files: `specs/009-productized-business-connector-runtime/tasks.md` evidence only.
  - Depends on: T046, T048, T050, T052, T054, T056.
  - Validation: Record `DNS_REBINDING_PROTECTION=READY`, `REDIRECTS=DENIED`, `RAW_CUSTOMER_API_RESPONSE_CENTRAL=NO`, `BOUNDED_LOCAL_RESULT_ONLY=YES`, `CLOSED_READ_REQUEST_PROFILES=GET_QUERY_V1,POST_QUERY_JSON_V1`, `INVOCATION_ROUTE_ACTIVE=YES`, `INVOCATION_ROUTE_PROFILE=CENTRAL_SERVICE_ONLY`, `INVOCATION_PROCESSING_ORDER=PASS`, `INVOCATION_RAW_RESULT_RELEASE=NO`, and `CONNECTOR_RUNTIME_GENERIC_READINESS=PASS`.
  - Stop: Do not proceed if the invocation route is inactive or misordered, generic dark-runtime readiness is false, an unsafe address can connect, or any raw body can escape.

## Phase 7 — Central Deployment, Service Authentication, and Transport

**Goal**: Build the central productized transport as an exact, bounded, signed, dark module without Assistant execution reachability.  
**Dependencies**: T057.  
**Independent test**: Trusted fixture configuration produces one exact signed round-trip; ambiguity and unsafe input fail before transport.
**Route relationship**: The dark-mode signed round trip consumes the Phase 6 Customer-local `POST /v1/connector/invocations` endpoint by hosting the actual runtime app or its accepted route-level harness; Phase 7 does not create or emulate a second server contract.

- [ ] T058 [RED] [US2] [BACKEND] Add failing exact `ConnectorDeploymentRegistry` tests.
  - Files: `test/unit/connector-deployment.registry.spec.ts`.
  - Depends on: T057.
  - Validation: Cover exact Customer/integration/HostApp/connector/instance success, duplicate, wildcard, blank, inactive, wrong instance, unsafe URI/policy, and invalid bounds.
  - Stop: Do not add Browser/model lookup input, fallback, database registry, or wildcard selection.

- [ ] T059 [GREEN] [US2] [BACKEND] Implement startup-validated immutable deployment lookup.
  - Files: `src/connectors/productized-business/connector-deployment.registry.ts`, central configuration integration.
  - Depends on: T058.
  - Validation: Make T058 pass using `ASSISTANT_CONNECTOR_DEPLOYMENTS_JSON` and exact tuple resolution, including a distinct Synthetic Customer B fixture tuple/instance without a source branch.
  - Stop: No Prisma schema, runtime CRUD, or Customer-specific source constant.

- [ ] T060 [RED] [US2] [BACKEND] Add failing central signer and exact-byte proof tests.
  - Files: `test/unit/connector-service-auth.signer.spec.ts`.
  - Depends on: T059.
  - Validation: Cover RS256, `kid`, exact type/claims/audience/context/operation/request ID, 30-second proof, fresh UUID `jti`, body mutation, key lifecycle, and raw-byte identity.
  - Stop: Do not reuse user/Bridge signing keys or serialize after hashing.

- [ ] T061 [GREEN] [US2] [BACKEND] Implement `ConnectorServiceAuthSigner` and immutable key loading.
  - Files: `src/connectors/productized-business/connector-service-auth.signer.ts`, central service-auth configuration.
  - Depends on: T060.
  - Validation: Make T060 pass with one serialization, exact SHA-256, active file-backed key, and public lifecycle metadata.
  - Stop: Private keys, proofs, and raw request bytes stay out of logs/audit/telemetry.

- [ ] T062 [RED] [US2] [BACKEND] Add failing bounded central HTTPS transport tests.
  - Files: `test/unit/connector-transport.client.spec.ts`, `test/unit/connector-network-policy.spec.ts`.
  - Depends on: T061.
  - Validation: Cover HTTPS, exact destination, address policy/pinning, TLS, 16 KiB bounds, absent request encoding, redirect/proxy/retry denial, response envelopes, abort, and mismatched request ID.
  - Stop: No generic HTTP surface, credential field, ref persistence, or raw response pass-through.

- [ ] T063 [GREEN] [US2] [BACKEND] Implement central network policy and `ConnectorTransportClient`.
  - Files: `src/connectors/productized-business/connector-network-policy.ts`, `connector-transport.client.ts`.
  - Depends on: T062.
  - Validation: Make T062 pass with deterministic DNS/TLS fixtures and cancellation.
  - Stop: No adapter registration or Assistant module import in this task.

- [ ] T064 [RED] [US2] [BACKEND] Add failing safe-failure, readiness, and dark-module tests.
  - Files: `test/unit/productized-business-connector.module.spec.ts`, `test/integration/productized-transport-dark.spec.ts`.
  - Depends on: T063.
  - Validation: Require code-only normalized failures, fail-closed readiness, a valid configuration round trip through the already implemented Customer-local invocation route/app harness, and zero `DataAdapterRegistry` reachability.
  - Stop: Do not create a ToolCall, ToolDefinition, adapter execution, or public failure shape.

- [ ] T065 [GREEN] [US2] [BACKEND] Compose the central productized transport module in dark mode.
  - Files: `src/connectors/productized-business/productized-business-connector.module.ts`, local module providers/readiness.
  - Depends on: T064.
  - Validation: Make T064 pass; the unregistered module signs and exchanges a bounded fixture envelope with the real Phase 6 route/app harness rather than a second fake server contract.
  - Stop: No native credential, raw reference storage, Prisma, or Assistant execution wiring.

- [ ] T066 [VERIFY] [US2] [BACKEND] Verify central transport isolation and prohibited-surface scans.
  - Files: `src/connectors/productized-business/**`, `test/integration/secret-redaction.spec.ts`, `prisma/schema.prisma`, `prisma/migrations/`, `src/connectors/connectors.module.ts`.
  - Depends on: T065.
  - Validation: Run central focused suites/typecheck and confirm no native credential type/value, reference persistence, schema change, registration, or sensitive observability.
  - Stop: Do not mark dark-mode isolation passing if Assistant can resolve the module.

- [ ] T067 [CHECKPOINT] [US2] [BACKEND] Verify and record the Phase 7 central transport gate.
  - Files: `specs/009-productized-business-connector-runtime/tasks.md` evidence only.
  - Depends on: T059, T061, T063, T065, T066.
  - Validation: Record a machine-readable evidence block with exact signed bounded round-trip `PASS` and `ASSISTANT_EXECUTION_REACHABILITY=NO`.
  - Stop: Phase 8 cannot start with unsafe config, unsigned bytes, or active Assistant wiring.

## Phase 8 — Feature 009 Shinmone Stage 2 Identity Bridge Integration

**Classification**: `FEATURE009_IMPLEMENTATION_CONSUMING_ACCEPTED_FEATURE007_AMENDMENT`  
**Goal**: Add Shinmone's sole post-admission native-bearer handoff and IDX bootstrap-provider path without making it the generic product model or reopening Feature 007.
**Dependencies**: T067.  
**Independent test**: Stage 2 is impossible before MenuDetail/admission and sends the exact bearer once over the fixed secure binding transport afterward; every failure returns no reference safely.
**Route relationship**: `ConnectorBindingClient` consumes the Phase 4 Customer-local `POST /v1/internal/connector-bindings` endpoint; Phase 8 owns only the Bridge HTTPS client and exchange composition and must not implement another binding mint service.

- [ ] T068 [RED] [US4] [IDENTITY-BRIDGE] Add the outer failing amended Stage 2 acceptance regression.
  - Files: `apps/identity-bridge/test/connector-binding/stage2-acceptance.spec.ts`, existing exchange fixtures read-only unless the test requires additive setup.
  - Depends on: T067.
  - Validation: Run against current code and preserve failure caused by the absent post-admission Connector Runtime handoff, while existing Stage 1 continues passing.
  - Stop: Do not edit Feature 007 documents/tasks/history or manufacture failure by breaking MenuDetail/admission.

- [ ] T069 [RED] [US4] [IDENTITY-BRIDGE] Add failing immutable binding destination and test-mode configuration tests.
  - Files: `apps/identity-bridge/test/connector-binding/binding-config.spec.ts`, `test/connector-binding/binding-destination-policy.spec.ts`.
  - Depends on: T068.
  - Validation: Cover the `BRIDGE_BINDING_TRANSPORT_V1` exact HTTPS URI/host/port/path/query, explicit address policy, HTTP/userinfo/fragment/blank/wildcard/caller URI rejection, production loopback denial, and test-only loopback TLS.
  - Stop: No Browser/native claim/request/reference field may change any destination component.

- [ ] T070 [GREEN] [US4] [IDENTITY-BRIDGE] Implement immutable binding configuration and exact address policy.
  - Files: `apps/identity-bridge/src/connector-binding/**`, narrow `src/config/bridge-config.service.ts` integration, environment examples only if required by accepted deployment config.
  - Depends on: T069.
  - Validation: Make T069 pass; enforce `BRIDGE_BINDING_REQUEST_TIMEOUT_MS=2000` and reject test policy outside enforced test mode.
  - Stop: No HTTP fallback, generic proxy, Customer authentication redesign, or staging-ready test fixture.

- [ ] T071 [RED] [US4] [IDENTITY-BRIDGE] Add failing Bridge binding service-proof and exact-body tests.
  - Files: `apps/identity-bridge/test/connector-binding/binding-service-auth.spec.ts`.
  - Depends on: T070.
  - Validation: Cover Shinmone `assistant-connector-binding+jwt`, RS256, dedicated issuer/audience/provider/key, 30-second proof, one-use `jti`, exact raw-body SHA-256, altered bytes, wrong context, shared-key rejection, and incompatibility with central/Customer-B profiles.
  - Stop: Do not reuse canonical identity/JWKS keys or central invocation keys.

- [ ] T072 [GREEN] [US4] [IDENTITY-BRIDGE] Implement the separate binding signer and single-serialization proof builder.
  - Files: `apps/identity-bridge/src/connector-binding/**`.
  - Depends on: T071.
  - Validation: Make T071 pass with file-backed active key and exact bytes preserved for send.
  - Stop: Service proof supplies authentication/integrity only; HTTPS confidentiality remains mandatory.

- [ ] T073 [RED] [US4] [IDENTITY-BRIDGE] Add failing HTTPS binding client success and bounds tests.
  - Files: `apps/identity-bridge/test/connector-binding/binding-client.spec.ts`.
  - Depends on: T072.
  - Validation: Use deterministic TLS against the Phase 4 binding route/app harness to require `BRIDGE_BINDING_TRANSPORT_V1`, exact route, JSON, absent content encoding, 16,384-byte request, 4,096-byte response, and one successful reference response.
  - Stop: HTTP must remain rejected even under test mode.

- [ ] T074 [GREEN] [US4] [IDENTITY-BRIDGE] Implement the bounded HTTPS-only `ConnectorBindingClient` success path.
  - Files: `apps/identity-bridge/src/connector-binding/**`, narrow Bridge module composition.
  - Depends on: T073.
  - Validation: Make T073 pass with exact configured URI, pinned connection, TLS certificate/hostname verification, and response validation.
  - Stop: Do not call the client from `/identity/exchange` yet or implement a duplicate Bridge-side binding mint service.

- [ ] T075 [RED] [US4] [IDENTITY-BRIDGE] Add failing binding transport attack, timeout, and cancellation tests.
  - Files: `apps/identity-bridge/test/connector-binding/binding-transport-security.spec.ts`.
  - Depends on: T074.
  - Validation: Cover A/AAAA/all addresses, mapped IPv6, rebinding, wrong hostname/cert, redirect, proxy env, 2,000 ms timeout, socket/body abort, retry/alternate endpoint/second-send counters, and bearer sentinel capture.
  - Stop: Do not weaken TLS, inherit a proxy, resend, redirect, or use another endpoint.

- [ ] T076 [GREEN] [US4] [IDENTITY-BRIDGE] Implement fail-closed binding transport cancellation and egress controls.
  - Files: `apps/identity-bridge/src/connector-binding/**`.
  - Depends on: T075.
  - Validation: Make T075 pass with `AbortController`, socket destruction, zero retry/redirect/proxy/fallback/alternate destination/second bearer send.
  - Stop: Timeout must yield no accepted response or `connectorContextRef`.

- [ ] T077 [RED] [US4] [IDENTITY-BRIDGE] Add failing exchange ordering, authority, RefreshToken, failure, and negative-surface tests.
  - Files: `apps/identity-bridge/test/exchange/exchange.service.spec.ts`, `test/exchange/exchange.controller.spec.ts`, `test/exchange/redaction.spec.ts`, `test/connector-binding/stage2-acceptance.spec.ts`.
  - Depends on: T076.
  - Validation: Require MenuDetail/admission first; exact same AccessToken once; no RefreshToken; Shinmone IDX provider payload/profile carrying accepted Entry/native expiry evidence; provider-owned volatile handle state; Browser non-authority; safe failure/no reference; and no generic-binding/central/evidence/model/SSE leakage.
  - Stop: Connector Runtime cannot become identity, Entry, permission, Customer, HostApp, or Gateway authority.

- [ ] T078 [GREEN] [US4] [IDENTITY-BRIDGE] Compose the post-admission Stage 2 handoff and additive exchange response.
  - Files: `apps/identity-bridge/src/exchange/**`, `src/connector-binding/**`, narrow `src/bridge.module.ts` composition.
  - Depends on: T077.
  - Validation: Make T077 and outer T068 pass; return the unchanged canonical JWT plus reference metadata only after a successful mint.
  - Stop: No Feature 007 claim/permission/JWKS/session redesign and no native bearer outside the two allowed destinations.

- [ ] T079 [VERIFY] [US4] [IDENTITY-BRIDGE] Verify Feature 007 compatibility and immutable historical evidence.
  - Files: Existing Bridge MenuDetail/admission/permission/signing/JWKS/exchange suites, Gateway/session regressions, Feature 007 documents and `tasks.md` read-only.
  - Depends on: T078.
  - Validation: Run all Bridge tests/build and focused Gateway/session suites; compare protected hashes; scan central, reference, EvidenceRef, GroundedAnswerInput, model, SSE, public, log, audit, and telemetry surfaces.
  - Stop: `FEATURE007_HISTORICAL_TASKS_REWRITTEN` must remain `NO`; any authority drift is `HUMAN_REQUIRED`.

- [ ] T080 [CHECKPOINT] [US4] [IDENTITY-BRIDGE] Verify and record the Phase 8 accepted-amendment gate.
  - Files: `specs/009-productized-business-connector-runtime/tasks.md` evidence only.
  - Depends on: T070, T072, T074, T076, T078, T079.
  - Validation: Record every Feature 007 amendment and `BRIDGE_BINDING_*` marker plus `SHINMONE_BINDING_BOOTSTRAP_PROFILE=BRIDGE_BINDING_TRANSPORT_V1` and `GENERIC_BINDING_ROUTE_PROFILE=BINDING_BOOTSTRAP_ONLY`.
  - Stop: Phase 9 cannot start unless MenuDetail remains authority, the handoff is exact/secure/one-shot, no RefreshToken or central credential exists, and Feature 007 history is untouched.

## Phase 9 — ProductizedBusinessConnectorAdapter Through Feature 008

**Goal**: Register one productized adapter only through the existing Feature 008 runtime and release boundaries.  
**Dependencies**: T080.  
**Independent test**: Permission and exact ToolDefinition/registry selection precede transport; only projected safe fields reach evidence and mocks never serve as fallback.

- [ ] T081 [RED] [US8] [BACKEND] Add failing productized adapter contract and compatibility tests.
  - Files: `test/unit/productized-business-connector.adapter.spec.ts`, `test/unit/data-adapter-contract.spec.ts`.
  - Depends on: T080.
  - Validation: Preserve RED for absent adapter identity/capability/readiness while `DataAdapterExecuteInput` remains unchanged.
  - Stop: Do not add timeout, operation, destination, or credential authority to the adapter input.

- [ ] T082 [GREEN] [US8] [BACKEND] Implement the unregistered `ProductizedBusinessConnectorAdapter` shell.
  - Files: `src/connectors/productized-business/productized-business-connector.adapter.ts`.
  - Depends on: T081.
  - Validation: Make T081 pass for capability/compatibility/readiness without module registration.
  - Stop: No Assistant execution, public contract, or mock fallback.

- [ ] T083 [RED] [US8] [BACKEND] Add failing permission, exact ToolDefinition re-resolution, budget, and abort tests.
  - Files: `test/unit/productized-business-connector.adapter.spec.ts`, `test/unit/assistant-readonly-runtime.service.spec.ts`.
  - Depends on: T082.
  - Validation: Require permission before transport, exact key/version lookup, 5,000 ms authority, 250 ms reserve, max 4,500 ms signed budget, elapsed subtraction, exhaustion failure, and abort propagation.
  - Stop: No second timeout authority or transport before permission.

- [ ] T084 [GREEN] [US8] [BACKEND] Implement adapter execution using existing ToolDefinition timeout authority.
  - Files: `src/connectors/productized-business/productized-business-connector.adapter.ts`, narrow `src/tools/tool-registry.service.ts` exact-version lookup if required.
  - Depends on: T083.
  - Validation: Make T083 pass without changing `DataAdapterExecuteInput` or Feature 008 ordering.
  - Stop: Local/deployment limits may narrow but never extend `ToolDefinition.timeoutMs`.

- [ ] T085 [RED] [US8] [BACKEND] Add failing transport-failure, projection, and evidence boundary tests.
  - Files: `test/integration/productized-adapter-projection.spec.ts`, `test/integration/tool-failure-safe-response.spec.ts`, `test/unit/adapter-result-projector.service.spec.ts`.
  - Depends on: T084.
  - Validation: Require started ToolCall failure mapping, extra bounded fields rejected/minimized, raw local result absent, and projected facts only in EvidenceRef/GroundedAnswerInput.
  - Stop: Do not bypass outputSchema, masking, minimization, or existing failure decisions.

- [ ] T086 [GREEN] [US8] [BACKEND] Complete adapter response normalization through the existing projector/evidence path.
  - Files: `src/connectors/productized-business/productized-business-connector.adapter.ts`, approved Feature 008 composition only where necessary.
  - Depends on: T085.
  - Validation: Make T085 pass and rerun Feature 008 raw-result/evidence regressions.
  - Stop: No new projector, EvidenceRef type, AnswerDecision, or SSE event.

- [ ] T087 [RED] [US8] [BACKEND] Add failing exact registration and zero-fallback composition tests.
  - Files: `test/unit/connectors-module.spec.ts`, `test/integration/productized-adapter-registration.spec.ts`, existing mock adapter tests.
  - Depends on: T086.
  - Validation: Require one exact Customer/integration/HostApp/connector registration, duplicate failure, deployment mismatch failure, and no mock fallback.
  - Stop: No wildcard or operation authority in registration.

- [ ] T088 [GREEN] [US8] [BACKEND] Add exact productized registration beside unchanged mocks.
  - Files: `src/connectors/connectors.module.ts`, `src/connectors/productized-business/productized-business-connector.module.ts`, test app provider composition.
  - Depends on: T087.
  - Validation: Make T087 pass and rerun mock/runtime Feature 008 suites.
  - Stop: Do not remove or rewrite mock behavior in this phase.

- [ ] T089 [CHECKPOINT] [US8] [BACKEND] Verify and record the Phase 9 Feature 008 integration gate.
  - Files: `specs/009-productized-business-connector-runtime/tasks.md` evidence only.
  - Depends on: T082, T084, T086, T088.
  - Validation: Record a machine-readable evidence block with `FEATURE008_PROJECTION_BYPASS=NO`, `FEATURE008_TIMEOUT_SINGLE_AUTHORITY=ToolDefinition.timeoutMs`, and `MOCK_FALLBACK=NO`.
  - Stop: Phase 10 cannot start with any alternate execution, projection, or timeout path.

## Phase 10 — Generic ToolDefinition Discovery Migration

**Goal**: Replace hard-coded mock candidate routing with Customer-policy-filtered metadata discovery while preserving all mock behavior.  
**Dependencies**: T089.  
**Independent test**: Active permitted read-only tools are discovered generically; ambiguity clarifies; mocks remain equivalent before old branches are removed.

- [ ] T090 [RED] [US7] [BACKEND] Add failing metadata-driven discovery contract tests.
  - Files: `test/unit/tool-discovery.service.spec.ts`, `test/unit/tool-registry.service.spec.ts`.
  - Depends on: T089.
  - Validation: Preserve RED for absent `x-assistant-discovery-v1` parsing, policy filtering, active/read-only filtering, required groups, deterministic scoring, and ties.
  - Stop: No Customer/HostApp/Shinmone/endpoint/credential/full-question branch.

- [ ] T091 [GREEN] [US7] [BACKEND] Implement discovery metadata parsing, catalog filtering, and scoring.
  - Files: `src/tools/tool-discovery.service.ts`, `src/tools/tool-registry.service.ts`, `src/tools/tool-registry.types.ts`, `src/tools/tools.module.ts`.
  - Depends on: T090.
  - Validation: Make T090 pass with exact Customer policy, active read-only tools, required concept groups, deterministic score, and clarification result.
  - Stop: Discovery returns candidates only; ToolDefinition re-resolution remains canonical authority.

- [ ] T092 [DATA] [US7] [BACKEND] Add equivalent discovery metadata to all existing mock ToolDefinitions.
  - Files: `scripts/seed.ts`, `test/support/us1-test-app.helper.ts`, existing mock ToolDefinition fixtures.
  - Depends on: T091.
  - Validation: Run seed idempotency and metadata-schema tests for every existing mock operation; add the Synthetic Customer B fixture definition/policy for `inventory.stock-on-hand` with generic inventory/stock/lookup concepts and a distinct `{sku, quantity}` output policy.
  - Stop: Do not add the Shinmone reference ToolDefinition yet, change Prisma, or add Customer-specific discovery logic.

- [ ] T093 [VERIFY] [US7] [BACKEND] Prove existing mock questions through `ToolDiscoveryService` before branch removal.
  - Files: Existing mock/query-understanding unit, integration, and eval suites plus new discovery tests.
  - Depends on: T092.
  - Validation: Run all current mock query cases and record equivalent candidate, arguments, permission, adapter, and answer behavior.
  - Stop: Old hard-coded branches remain until this task is green.

- [ ] T094 [RED] [US7] [BACKEND] Add failing generic planner integration and ambiguity/argument-binding tests.
  - Files: `test/unit/query-understanding.service.spec.ts`, `test/unit/query-understanding-pipeline-wiring.spec.ts`, `test/integration/clarification-required.spec.ts`.
  - Depends on: T093.
  - Validation: Cover normalized resource/metric/intent/time concepts, missing groups, tied/low scores, invalid argumentBindings, and no execution on clarification.
  - Stop: Do not match complete phrases or inject Customer/HostApp data into the lexicon.

- [ ] T095 [GREEN] [US7] [BACKEND] Integrate `ToolDiscoveryService` into generic Query Understanding/Planning.
  - Files: `src/query-understanding/**`, `src/tools/tools.module.ts`.
  - Depends on: T094.
  - Validation: Make T094 pass while the old branches remain available only for the controlled equivalence step.
  - Stop: Candidate text may not replace ToolDefinition key/version/argument validation.

- [ ] T096 [RED] [US7] [BACKEND] Add failing source guards for obsolete and forbidden routing branches.
  - Files: `test/unit/query-understanding-generic-routing.guard.spec.ts`.
  - Depends on: T095.
  - Validation: Require absence of old mock-key branches and Customer/HostApp/complete-question literals in routing; add generic-source guards for Shinmone paths/result fields/IDs, `acceptedEntry`, mandatory `nativeAccessToken`, MenuDetail/Bridge-only bootstrap, bearer-only application, and JWT-exp assumptions while exempting explicit integration/compatibility areas; preserve RED from obsolete branches or leakage.
  - Stop: Do not delete branches before T093 and T095 are green.

- [ ] T097 [GREEN] [US7] [BACKEND] Remove obsolete hard-coded candidate branches after proven metadata equivalence.
  - Files: `src/query-understanding/**` where T096 identifies routing plus generic contract/central/runtime files identified by the guard; explicit `apps/customer-connector-runtime/integrations/shinmone/**` remains exempt.
  - Depends on: T096.
  - Validation: Make T096 pass by removing obsolete routing and moving any reference-specific assumption behind the Shinmone integration registry; rerun mock discovery/query/runtime and generic-source guard suites.
  - Stop: Do not remove generic lexicon, clarification, or existing non-tool understanding behavior.

- [ ] T098 [VERIFY] [US7] [BACKEND] Run full query-understanding and no-answer/eval regressions.
  - Files: `test/unit/query-*.spec.ts`, `test/integration/assistant-planning.spec.ts`, `test/integration/clarification-required.spec.ts`, `test/eval/**`.
  - Depends on: T097.
  - Validation: Run unit/integration/eval suites; confirm policy-denied tools are absent and ambiguous/insufficient queries never execute.
  - Stop: Do not accept a regression hidden by fallback routing.

- [ ] T099 [CHECKPOINT] [US7] [BACKEND] Verify and record the Phase 10 generic-discovery gate.
  - Files: `specs/009-productized-business-connector-runtime/tasks.md` evidence only.
  - Depends on: T091, T092, T093, T095, T097, T098.
  - Validation: Record a machine-readable evidence block with `CUSTOMER_BRANCH_IN_ASSISTANT_CORE=NO`, `SHINMONE_FULL_QUERY_BRANCH=NO`, and `MOCK_DISCOVERY_COMPATIBILITY=PASS`.
  - Stop: Phase 11 cannot start if any Customer-specific branch or mock regression survives.

## Phase 11 — First Shinmone Reference Configuration

**Goal**: Configure `work-orders.monthly-new-count` through existing data/policy/configuration surfaces and the closed local manifest.  
**Dependencies**: T099.  
**Independent test**: The actual Chinese question resolves generically and a fixture returns exactly the bounded three-field result through Feature 008 projection.

- [ ] T100 [RED] [US7] [BACKEND] Add failing Shinmone ToolDefinition, Customer policy, discovery metadata, output policy, and seed-idempotency tests.
  - Files: `test/integration/customer-tool-policy.spec.ts`, `test/integration/customer-tool-idempotency.spec.ts`, `test/unit/tool-discovery.service.spec.ts`, seed test fixtures.
  - Depends on: T099.
  - Validation: Require key `work-orders.monthly-new-count`, contract `1.0.0`, read-only policy, generic work-order/new-count/this-month concepts, and only metric/period/count output.
  - Stop: No Prisma schema/migration, Customer routing branch, complete-question literal, endpoint, or credential in discovery metadata.

- [ ] T101 [GREEN] [US7] [BACKEND] Seed the reference ToolDefinition, Customer policy, discovery metadata, and output policy idempotently.
  - Files: `scripts/seed.ts`, `test/support/us1-test-app.helper.ts` and approved test fixtures.
  - Depends on: T100.
  - Validation: Make T100 pass and run seed twice without duplicate/change drift.
  - Stop: Do not declare any live Shinmone HTTP destination ready.

- [ ] T102 [RED] [US7] [CONNECTOR-RUNTIME] Add failing Shinmone IDX bootstrap, bearer-profile, manifest, and response fixture tests.
  - Files: `apps/customer-connector-runtime/test/integrations/shinmone-bootstrap-provider.spec.ts`, `test/integrations/shinmone-manifest.spec.ts`, fixture upstream responses.
  - Depends on: T101.
  - Validation: Require Shinmone-only provider schema for same accepted token/Entry, provider-owned handle storage, native JWT-exp cap and rejection/remint semantics, `shinmone-idx-bearer-v1`, exact `GET_QUERY_V1 /Dashboard/KPIStats?TimeRange=thisMonth`, `/data/newOrders/current`, and exactly three bounded fields.
  - Stop: No alternate API, dynamic query/path, raw envelope, or checked-in HTTP origin.

- [ ] T103 [GREEN] [US7] [CONNECTOR-RUNTIME] Add the removable Shinmone IDX provider, bearer profile, and closed V1 manifest.
  - Files: `apps/customer-connector-runtime/integrations/shinmone/**` and runtime integration configuration fixtures.
  - Depends on: T102.
  - Validation: Make T102 pass through the generic manifest and upstream executor.
  - Stop: Native token/accepted Entry/JWT-exp/bearer/remint assumptions stay inside this integration provider/profile; the manifest contains only `credentialProfileRef`, closed GET profile data, and no credential/header/callback/Assistant-core logic.

- [ ] T104 [RED] [US7] [BACKEND] Add failing exact reference deployment and adapter configuration tests.
  - Files: `test/integration/shinmone-connector-deployment.spec.ts`, `test/unit/connectors-module.spec.ts`, central deployment fixtures.
  - Depends on: T103.
  - Validation: Require one exact Customer/integration/HostApp/connector instance, operation/version availability, HTTPS-only destination, and inactive/no-match failure.
  - Stop: No wildcard, database registry, real credential, or live HTTP endpoint.

- [ ] T105 [GREEN] [US7] [BACKEND] Compose the exact reference deployment and productized adapter registration fixtures/configuration.
  - Files: `src/connectors/connectors.module.ts`, central deployment fixtures/configuration, approved test app helper.
  - Depends on: T104.
  - Validation: Make T104 pass and preserve all mock registrations.
  - Stop: Do not hard-code Customer/Shinmone behavior in the adapter or Query Understanding.

- [ ] T106 [VERIFY] [US7] [BACKEND] Prove the fixture vertical slice from natural language through projected evidence.
  - Files: `test/integration/shinmone-monthly-new-count.fixture.spec.ts`, query/evidence/public contract regressions, `prisma/schema.prisma`, `prisma/migrations/` read-only.
  - Depends on: T105.
  - Validation: Start with `這個月新增幾張工單？`; prove generic unique discovery, canonical ToolDefinition, permission, adapter, fixed manifest, bounded result, outputSchema projection, and evidence; scan for forbidden branches and schema changes.
  - Stop: Direct operation invocation alone is insufficient and no fixture may claim live staging readiness.

- [ ] T107 [CHECKPOINT] [US7] [BACKEND] Verify and record the Phase 11 reference-configuration gate.
  - Files: `specs/009-productized-business-connector-runtime/tasks.md` evidence only.
  - Depends on: T101, T103, T105, T106.
  - Validation: Record a machine-readable evidence block with `GENERIC_REAL_QUESTION_RESOLUTION=PASS`, `REFERENCE_MANIFEST_FIXTURE=PASS`, and `CENTRAL_PRISMA_SCHEMA_CHANGE=NO`.
  - Stop: Phase 12 cannot start if the question uses a specific branch or the manifest/result differs from the accepted mapping.

## Phase 12 — Shinmone SPA Transient Reference Delivery

**Goal**: Carry the canonical token and opaque binding reference in memory through the existing PageContext provider without SDK or public API changes.  
**Dependencies**: T107.  
**Independent test**: The provider reacquires and attaches a valid reference transiently, with no browser persistence or public/history leakage.

- [ ] T108 [RED] [US7] [SHINMONE-SPA] Add failing in-memory identity/reference bundle and separate-expiry tests.
  - Files: `/Users/evalin/Documents/ideaxpress proj/idx-shinmone-scm-frontend/tests/unit/assistantIdentityTokenProvider.spec.ts`.
  - Depends on: T107.
  - Validation: Run `npm run test:unit -- tests/unit/assistantIdentityTokenProvider.spec.ts` in the Shinmone repository; preserve RED for absent reference acquisition/cache/expiry behavior.
  - Stop: No localStorage, sessionStorage, cookie, IndexedDB, log, or RefreshToken ownership change.

- [ ] T109 [GREEN] [US7] [SHINMONE-SPA] Implement the in-memory canonical-token/reference provider bundle.
  - Files: `/Users/evalin/Documents/ideaxpress proj/idx-shinmone-scm-frontend/composables/assistant/assistantIdentityTokenProvider.ts`.
  - Depends on: T108.
  - Validation: Make T108 pass with separate expiries, 15-second refresh window, missing/expired reacquisition, and memory-only values.
  - Stop: Do not change Customer authentication, read RefreshToken, or persist either bearer/reference.

- [ ] T110 [RED] [US7] [SHINMONE-SPA] Add failing existing-PageContext delivery tests.
  - Files: `/Users/evalin/Documents/ideaxpress proj/idx-shinmone-scm-frontend/tests/integration/assistantSdkHandoff.spec.ts`.
  - Depends on: T109.
  - Validation: Require the current provider callback to attach only `connectorContextRef` to existing PageContext immediately before send/retry, with no new request type.
  - Stop: Do not edit the SDK repository or add an Assistant public field outside existing PageContext.

- [ ] T111 [GREEN] [US7] [SHINMONE-SPA] Attach the valid transient reference through the existing widget provider.
  - Files: `/Users/evalin/Documents/ideaxpress proj/idx-shinmone-scm-frontend/composables/assistant/assistantWidget.ts`.
  - Depends on: T110.
  - Validation: Make T110 pass; omit the field safely when no valid bundle exists.
  - Stop: Browser possession remains non-authoritative and cannot choose destination/context.

- [ ] T112 [RED] [US7] [SHINMONE-SPA] Add failing refresh, native-token-change invalidation, and non-persistence/security tests.
  - Files: `/Users/evalin/Documents/ideaxpress proj/idx-shinmone-scm-frontend/tests/unit/assistantIdentityTokenProvider.spec.ts`, `tests/contract/assistantSecurityGuards.spec.ts`.
  - Depends on: T111.
  - Validation: Cover remint, simultaneous invalidation, missing/expired reference, exchange failure, no ref in storage/log/history/public request/response, and no SDK-visible contract change.
  - Stop: Do not weaken sanitization or retain a reference across native credential generation changes.

- [ ] T113 [GREEN] [US7] [SHINMONE-SPA] Complete safe invalidation/remint and transient-delivery handling.
  - Files: The two allowed Shinmone composables only.
  - Depends on: T112.
  - Validation: Make T112 pass and rerun unit/integration/contract Assistant suites.
  - Stop: No broad SPA, Auth, business client, proxy, or UI modification.

- [ ] T114 [VERIFY] [US7] [SDK-READ-ONLY] Verify the SDK and Assistant public contracts remain byte- and behavior-compatible.
  - Files: `/Users/evalin/Documents/my proj/F2E/internal-ai-assistant/packages/assistant-sdk/src/types/public.ts`, `src/context/**`, `src/request/pageContext.ts`, `src/request/hostIntegrationRequestAdapter.ts`; Backend public/SSE contracts.
  - Depends on: T113.
  - Validation: Compare SDK status/hashes and run relevant existing SDK/Backend contract tests without edits.
  - Stop: Any SDK implementation or public type change is `HUMAN_REQUIRED`.

- [ ] T115 [CHECKPOINT] [US7] [SHINMONE-SPA] Verify and record the Phase 12 transient-delivery gate.
  - Files: `specs/009-productized-business-connector-runtime/tasks.md` evidence only.
  - Depends on: T109, T111, T113, T114.
  - Validation: Record a machine-readable evidence block with `SDK_PUBLIC_API_CHANGE=NO`, `ASSISTANT_PUBLIC_API_CHANGE=NO`, and `TRANSIENT_REF_DELIVERY=PASS`.
  - Stop: Phase 13 cannot start if the reference persists, becomes authority, or requires SDK/public changes.

## Phase 13 — Isolation, Portability, Removal, and Compatibility Closeout

**Goal**: Execute isolation, Customer B portability, Shinmone-removal, generic-source, security, and predecessor/public gates before real staging access.
**Dependencies**: T115.  
**Independent test**: Two-Customer and hostile transport/manifest fixtures cannot cross any boundary or leak prohibited material while all existing contracts remain green.

- [ ] T116 [VERIFY] [US5] [BACKEND] Execute two-Customer discovery, deployment, policy, adapter, and evidence isolation.
  - Files: `test/integration/feature009-customer-isolation.spec.ts`, existing Customer isolation fixtures/suites.
  - Depends on: T115.
  - Validation: Use identical organization/actor/HostApp/reference-shaped values across Customers and prove Customer remains the outer boundary; this task is isolation-only and does not substitute for executable reuse.
  - Stop: No cross-Customer existence detail or shared registration/binding/evidence.

- [ ] T117 [VERIFY] [US5] [CONNECTOR-RUNTIME] Execute service replay and every cross-binding-dimension attack.
  - Files: Runtime service-auth/replay/binding security suites and composed binding/invocation route suites.
  - Depends on: T116.
  - Validation: Reuse signed bytes/reference while varying context/provider/generation/expiry/revocation/leases; invoke both routes and prove central, Shinmone Bridge, Customer B, and other bootstrap profiles cannot cross-accept. Also execute duplicate/wildcard/dynamic URL/method/path/query/header/body/credential/traversal/callback/template/script/SQL/shell/command/bad-pointer/cap/write-classification manifest attacks. Record both route/profile isolation markers.
  - Stop: Credential resolver/upstream must remain uncalled on every rejection.

- [ ] T118 [VERIFY] [CONNECTOR-RUNTIME] Execute Synthetic Customer B vertical portability and Shinmone-removal verification.
  - Files: Customer B fixture integration/provider/profile/manifest suites, generic/shared/central build targets, Shinmone-removal topology, and Feature 008 discovery/projection harness.
  - Depends on: T117.
  - Validation: Execute `inventory.stock-on-hand` for tuple `customer-b` / `inventory-b` / `customer-b-inventory` and instance `customer-b-inventory-connector-1` using generic inventory/stock/lookup discovery, the same contract/adapter/registry/runtime/service-auth/Feature 008 path, fixed `POST_QUERY_JSON_V1 /inventory/stock/query`, strict `sku` body, fixture provider-owned API-key handle, fixed allowlisted code-owned `X-Inventory-Key`, and exact `{sku, quantity}` projection. Then disable/remove every Shinmone provider/profile/manifest/deployment/ToolDefinition-policy/SPA fixture and prove generic builds plus Customer B still pass.
  - Stop: No Customer-B/Shinmone conditional in Assistant core, central adapter/transport, or generic runtime; fixture API-key strategy is not production approval.

- [ ] T119 [VERIFY] [BACKEND] Execute all three network-profile security matrices.
  - Files: Central connector transport, Bridge binding transport, runtime upstream network/TLS/DNS suites, and composed Bridge → binding-route and central → invocation-route harnesses.
  - Depends on: T118.
  - Validation: Exercise Bridge → `POST /v1/internal/connector-bindings` and central → `POST /v1/connector/invocations` in composed mode while covering HTTPS, profile isolation, address modes, all A/AAAA/mapped/mixed results, rebinding, TLS, redirect, proxy, compression, limits, cancellation, zero retry, and test-only loopback isolation.
  - Stop: No HTTP staging/production fallback or broad Customer-private access.

- [ ] T120 [VERIFY] [BACKEND] Execute credential, reference, proof, raw-body, raw-response, and pre-projection leak scans.
  - Files: `test/integration/secret-redaction.spec.ts`, composed binding/invocation endpoint harnesses, runtime/Bridge redaction suites, and captured log/audit/telemetry/model/SSE/public/persistence fixtures.
  - Depends on: T119.
  - Validation: Place unique sentinels in every prohibited class and inspect complete binding/invocation paths; also scan non-exempt generic contract, central adapter/transport, runtime orchestration, and Query Understanding sources for Shinmone paths/results/IDs, `acceptedEntry`, mandatory `nativeAccessToken`, MenuDetail/Bridge-only bootstrap, bearer-only application, JWT-exp parsing, or Customer branching.
  - Stop: Hashes or reversible encodings do not count as safe unless explicitly approved one-way binding verifiers.

- [ ] T121 [VERIFY] [IDENTITY-BRIDGE] Re-run complete Feature 007 identity/session/JWKS compatibility.
  - Files: All Identity Bridge tests/build and focused Gateway/session trust-chain suites; Feature 007 artifacts read-only.
  - Depends on: T120.
  - Validation: Confirm MenuDetail/admission/Entry/permission/JWT/JWKS/session semantics unchanged and accepted Stage 2 additive behavior only.
  - Stop: Never edit or retroactively complete Feature 007 historical tasks.

- [ ] T122 [VERIFY] [BACKEND] Re-run complete Feature 008 permission, lifecycle, projection, evidence, answer, and mock compatibility.
  - Files: Feature 008 unit/integration/eval suites and existing mock fixtures.
  - Depends on: T121.
  - Validation: Confirm permission precedes transport, ToolCall states remain exact, outputSchema is final release authority, evidence is projected, and mocks have zero fallback role.
  - Stop: No new Assistant execution path or competing timeout authority.

- [ ] T123 [VERIFY] [BACKEND] Re-run public API, SSE, history, feedback, approval, and failure-semantics contracts.
  - Files: `test/contract/**` relevant Assistant suites, history/feedback/approval integrations, no-answer/tool-failure tests.
  - Depends on: T122.
  - Validation: Run unchanged contracts and confirm connector failures collapse into existing failed ToolCall and answer/SSE behavior.
  - Stop: No new endpoint, request mode, decision, event, public error, or connector-specific client contract.

- [ ] T124 [VERIFY] [BACKEND] Execute composed timeout, disconnect, abort, cleanup, and readiness-loss races.
  - Files: Feature 009 central/runtime/Bridge timeout suites and integration harness.
  - Depends on: T123.
  - Validation: Prove 2,000 ms binding domain separation, 5,000/250/4,500/250/3,500 ms business hierarchy, monotonic elapsed handling, socket abort, lease release, and zero retry.
  - Stop: Binding timeout must never become or extend ToolDefinition timeout authority.

- [ ] T125 [CHECKPOINT] [BACKEND] Verify and record the complete pre-staging security gate matrix.
  - Files: `specs/009-productized-business-connector-runtime/tasks.md` evidence only.
  - Depends on: T116, T117, T118, T119, T120, T121, T122, T123, T124.
  - Validation: Record every Section 9 gate plus `SECOND_CUSTOMER_REUSE_PROOF=PASS`, `SHINMONE_REMOVAL_GENERIC_RUNTIME_PASS=YES`, `CUSTOMER_SPECIFIC_ASSISTANT_CORE_BRANCH=NO`, `CUSTOMER_SPECIFIC_GENERIC_RUNTIME_BRANCH=NO`, and `FEATURE009_PRE_STAGING_SECURITY_CLOSEOUT=PASS` only when all evidence is green.
  - Stop: Any omitted/failing gate blocks Phase 14 and is not eligible for silent waiver.

## Phase 14 — Live Shinmone Staging Vertical Slice

**Goal**: Prove the actual natural-language question through the real approved Customer staging path.  
**Dependencies**: T125 and explicit T126 human/deployment approval.  
**Independent test**: `這個月新增幾張工單？` produces an existing evidence-backed answer/SSE response from the approved HTTPS Shinmone API with safe negative behavior.

- [ ] T126 [OPS] [US7] [STAGING] Obtain and verify the mandatory HUMAN_REQUIRED live-staging prerequisite set.
  - Files: `specs/009-productized-business-connector-runtime/tasks.md` operator worksheet/evidence only; deployment systems are read-only until approval.
  - Depends on: T125.
  - Validation: Approve `APPROVED_SHINMONE_HTTPS_ORIGIN`, trust/key material, exact deployment, ready single runtime, admitted user, Customer tool policy, and deployed provider.
  - Stop: Do not continue with `http://59.125.138.139/APIs/SCM/`, mocks, local fixtures, direct-operation substitution, missing approval, or recorded secrets.

- [ ] T127 [OPS] [US7] [STAGING] Deploy/configure and prove Bridge, Connector Runtime, trust, manifest, provider, and central readiness.
  - Files: Approved deployment configuration/secrets outside source; `tasks.md` receives only safe evidence.
  - Depends on: T126.
  - Validation: Check exact HTTPS/TLS/address policy, separate proof profiles, single replica, manifest hash/version, central deployment, policy, provider version, health/readiness, and rotation state.
  - Stop: Do not source-code staging values or proceed while any readiness gate is false.

- [ ] T128 [VERIFY] [US7] [STAGING] Prove real Stage 1 followed by the exact secure Stage 2 binding mint.
  - Files: Running staging Bridge/Connector Runtime and safe correlated evidence in this `tasks.md` only.
  - Depends on: T127.
  - Validation: Authorized user completes MenuDetail/admission, then one HTTPS binding handoff yields a transient reference without revealing native material.
  - Stop: No credential, reference, proof, claims, or endpoint detail may be recorded in evidence.

- [ ] T129 [VERIFY] [US7] [US8] [STAGING] Execute the primary natural-language live vertical slice.
  - Files: Running staging Assistant/Bridge/runtime/Shinmone/provider; safe evidence in this `tasks.md` only.
  - Depends on: T128.
  - Validation: Start at `這個月新增幾張工單？`; prove generic discovery, ToolDefinition, permission, adapter, signed transport, binding, fixed HTTPS GET, `newOrders.current`, bounded result, projection, EvidenceRef, GroundedAnswerInput, and existing answer/SSE.
  - Stop: Direct named-operation invocation, mock data, or fixture API is not primary acceptance.

- [ ] T130 [VERIFY] [US7] [STAGING] Execute expired/revoked binding and permission-denial live negatives.
  - Files: Running staging components and safe evidence only.
  - Depends on: T129.
  - Validation: Prove no local credential/upstream access for invalid binding and no connector transport after permission denial; retain safe existing outcomes.
  - Stop: Do not record foreign-resource existence or raw identifiers beyond approved correlation.

- [ ] T131 [VERIFY] [US8] [STAGING] Execute native-auth rejection, upstream failure, timeout, and readiness-loss live negatives.
  - Files: Running staging components and safe evidence only.
  - Depends on: T130.
  - Validation: Use approved reversible staging controls to prove revocation, failed ToolCall/no-answer behavior, abort/zero retry, no partial release, and restored readiness.
  - Stop: Do not make destructive Customer changes, expose secrets, or leave staging unhealthy.

- [ ] T132 [CHECKPOINT] [US7] [US8] [STAGING] Verify and record the Phase 14 live gate.
  - Files: `specs/009-productized-business-connector-runtime/tasks.md` safe evidence only.
  - Depends on: T127, T128, T129, T130, T131.
  - Validation: Record a machine-readable evidence block with `SHINMONE_LIVE_VERTICAL_SLICE_READY=YES` only when primary and negative proofs pass and approved configuration is restored healthy.
  - Stop: A mock, fixture, HTTP endpoint, or manual direct operation cannot complete this checkpoint.

## Phase 15 — Final Compatibility and Rollback Closeout

**Goal**: Establish full quality, scope, reversibility, and final acceptance evidence.  
**Dependencies**: T132.  
**Independent test**: Full suites pass, rollback restores predecessor/mock behavior without migration rollback, staging is safely restored, and every machine-readable gate is satisfied.

- [ ] T133 [VERIFY] [BACKEND] Run the complete Backend unit, integration, contract, e2e, and eval suites.
  - Files: Root `package.json` scripts and all `test/**` suites.
  - Depends on: T132.
  - Validation: Run `npm run test:unit`, `test:integration`, `test:contract`, `test:e2e`, and `test:eval` with required test DB preparation only under established safe commands.
  - Stop: Do not update snapshots or skip failures to obtain green.

- [ ] T134 [VERIFY] [CONNECTOR-RUNTIME] Run the complete Connector Runtime suite and build.
  - Files: `apps/customer-connector-runtime/**`.
  - Depends on: T133.
  - Validation: Run its full tests, typecheck/lint where configured, and independent build.
  - Stop: No skipped security suite, multi-replica claim, or test-mode production readiness.

- [ ] T135 [VERIFY] [IDENTITY-BRIDGE] Run complete Identity Bridge, Gateway, and session regressions.
  - Files: `apps/identity-bridge/**`, `apps/gateway/**`, focused Backend trust/session suites.
  - Depends on: T134.
  - Validation: Run full Bridge tests/build, Gateway build/tests, and canonical session chain regressions.
  - Stop: Feature 007 artifacts/history remain read-only and identity authority unchanged.

- [ ] T136 [VERIFY] [SHINMONE-SPA] Run external focused tests and verify SDK read-only state.
  - Files: The two Shinmone composables and three focused test files; SDK provider/request/public type paths read-only.
  - Depends on: T135.
  - Validation: Run Shinmone unit/integration/contract/typecheck/lint/build and compare SDK hashes/status.
  - Stop: No SDK implementation, unrelated SPA edit, or uncommitted secret/reference artifact.

- [ ] T137 [VERIFY] [BACKEND] Run full typecheck, lint, build, aggregate test, and diff-format checks.
  - Files: Root, shared package, Connector Runtime, Identity Bridge, and Gateway build configurations.
  - Depends on: T136.
  - Validation: Run root/package/app typechecks, lint, builds, aggregate tests, and `git diff --check`; classify only demonstrably pre-existing failures.
  - Stop: Do not auto-fix unrelated files or hide a Feature 009 failure as pre-existing.

- [ ] T138 [VERIFY] [BACKEND] Audit final repository scope, Prisma, protected docs, public contracts, and prohibited material.
  - Files: Repository status/diff, `prisma/schema.prisma`, migrations, Feature 007 artifacts, Feature 009 artifacts, `.specify/`, `AGENTS.md`, SDK/SPA status, log/audit/telemetry/evidence fixtures.
  - Depends on: T137.
  - Validation: Prove no central schema/migration, hook/context, predecessor-history, SDK public, Assistant public/SSE, or secret/reference/raw-result leak outside authorized implementation scope.
  - Stop: Any unexplained drift is a release blocker.

- [ ] T139 [OPS] [STAGING] Rehearse rollback of Customer policy/tool availability and exact productized adapter/deployment activation.
  - Files: Reversible staging configuration and safe evidence in this `tasks.md`; no schema/data migration.
  - Depends on: T138.
  - Validation: Disable Customer tool availability, remove/disable exact registration and ConnectorDeployment entry, and confirm no productized invocation can start.
  - Stop: Do not delete Customer data, alter Feature 007 trust, or affect unrelated Customers/tools.

- [ ] T140 [OPS] [STAGING] Rehearse SPA reference withholding and Connector Runtime restart rollback behavior.
  - Files: Reversible Shinmone provider/deployment settings and safe evidence.
  - Depends on: T139.
  - Validation: Withhold `connectorContextRef`, restart the runtime, prove volatile state invalidation, Feature 007 identity/session continuity, Feature 008 mock operation, and unchanged public/SSE behavior.
  - Stop: No migration rollback, native-token exposure, or permanent staging disablement.

- [ ] T141 [OPS] [STAGING] Restore the approved staging configuration and revalidate readiness/live smoke behavior.
  - Files: Approved staging configuration and safe evidence only.
  - Depends on: T140.
  - Validation: Restore policy, exact registration/deployment, provider delivery, and runtime; confirm readiness and rerun the natural-language smoke proof without recording sensitive values.
  - Stop: Do not finish with staging partially restored or using different authority/configuration.

- [ ] T142 [CHECKPOINT] [BACKEND] Record the final Feature 009 implementation acceptance report.
  - Files: `specs/009-productized-business-connector-runtime/tasks.md` evidence only.
  - Depends on: T133, T134, T135, T136, T137, T138, T139, T140, T141.
  - Validation: After gate approval and execution, record every marker below including all portability gates and end with `FEATURE009_IMPLEMENTATION_STATUS=PASS`; this unchecked Draft task records no current pass.
  - Stop: Do not mark complete with a failing/unknown gate, rewritten Feature 007 history, unapproved scope, or unavailable live proof.

## Dependencies and Execution Order

```text
T005 → T015 → T026 → T035 → T044 → T057 → T067 → T080
     → T089 → T099 → T107 → T115 → T125 → T132 → T142
```

- T001–T004 are the only parallel baseline tasks.
- T006, T008, and T010 may be authored in parallel after T005 because their RED files are disjoint; their GREEN implementations and shared exports are sequential.
- No other task is marked `[P]`. Shared module composition, seed data, query-understanding, Bridge exchange, external provider state, security gates, and staging controls require their declared order.
- Each phase's first task depends on the preceding checkpoint, and every checkpoint depends on all required tasks in its phase.

## User Story Traceability

| Story | Primary tasks | Independent completion evidence |
| --- | --- | --- |
| US1 Customer-local binding | T027–T035, T116–T117 | Exact valid resolution; expiry, revoke, generation, lease, and every context mismatch fail before credentials |
| US2 authenticated service transport | T016–T026, T058–T067 | Valid exact proof succeeds; altered, stale, replayed, wrong-audience/context requests fail first |
| US3 fixed named operations | T036–T044, T100–T107 | Exact manifest operation runs; arbitrary HTTP/SQL/command/credential input cannot execute |
| US4 native credential isolation | T027–T035, T068–T080, T120 | Credential is Customer-local, sent only in ordered Stage 1/2, and absent from all prohibited surfaces |
| US5 Customer/integration/host isolation | T029–T035, T116–T117 | Two Customers with identical subordinate IDs cannot cross any trusted dimension |
| US6 bounded network/failure behavior | T045–T067, T119, T124 | Unsafe network, limits, replay, timeout, and dependency failures normalize safely without retry/release |
| US7 Shinmone monthly question | T090–T115, T126–T132 | Actual question resolves generically and invokes only the configured monthly-count operation |
| US8 grounded existing answer | T081–T089, T122–T123, T129–T132 | Only projected facts reach evidence/grounded input and existing answer/SSE behavior |

## Final Acceptance Report

T080 and T142 must preserve the predecessor-amendment markers; T142 must report the complete gate set:

```text
FEATURE007_AMENDMENT_PRESERVED=YES
FEATURE007_IDENTITY_AUTHORITY_CHANGED=NO
NATIVE_CREDENTIAL_ALLOWED_DESTINATION_CHANGED=YES
MENUDDETAIL_REMAINS_VALIDITY_AUTHORITY=YES
CUSTOMER_LOCAL_CONNECTOR_HANDOFF_ALLOWED=YES
CENTRAL_NATIVE_CREDENTIAL_ALLOWED=NO
REFRESH_TOKEN_HANDOFF_ALLOWED=NO

FEATURE008_AUTHORITIES_PRESERVED=YES
NATIVE_CREDENTIAL_CENTRAL=NO
CONNECTOR_CONTEXT_REF_PERSISTED=NO
BROWSER_AUTHORITY=NO
SERVICE_AUTH_REPLAY_PROTECTION=READY
BINDING_CREDENTIAL_ROUTE_ACTIVE=YES
BINDING_ROUTE_PROFILE=BINDING_BOOTSTRAP_ONLY
BINDING_ROUTE_PROFILE_ISOLATION=PASS
SHINMONE_BINDING_BOOTSTRAP_PROFILE=BRIDGE_BINDING_TRANSPORT_V1
INVOCATION_ROUTE_ACTIVE=YES
INVOCATION_ROUTE_PROFILE_ISOLATION=PASS
INVOCATION_PROCESSING_ORDER=PASS
CONNECTOR_RUNTIME_GENERIC_READINESS=PASS

BRIDGE_BINDING_TRANSPORT_PROFILE=BRIDGE_BINDING_TRANSPORT_V1
BRIDGE_BINDING_TRANSPORT_HTTPS=YES
BRIDGE_BINDING_HTTPS_ONLY=YES
BRIDGE_BINDING_DESTINATION_TRUSTED_CONFIG_ONLY=YES
BRIDGE_BINDING_DESTINATION_BROWSER_OVERRIDE=NO
BRIDGE_BINDING_TLS_HOSTNAME_VERIFY=YES
BRIDGE_BINDING_RETRY=NO
BRIDGE_BINDING_REDIRECT=NO
BRIDGE_BINDING_PROXY_INHERITANCE=NO
BRIDGE_BINDING_NATIVE_CREDENTIAL_CONFIDENTIALITY=PASS
BRIDGE_BINDING_NATIVE_TOKEN_LEAK=NO
BRIDGE_BINDING_TIMEOUT_MS=2000

GENERIC_HTTP_PROXY=NO
GENERIC_SQL=NO
GENERIC_COMMAND_EXECUTION=NO
CLOSED_READ_REQUEST_PROFILES=GET_QUERY_V1,POST_QUERY_JSON_V1
CREDENTIAL_PROFILE_ISOLATION=PASS
CROSS_CUSTOMER_BINDING_REUSE=DENIED
CROSS_INTEGRATION_REUSE=DENIED
CROSS_HOSTAPP_REUSE=DENIED
CROSS_CONNECTOR_INSTANCE_REUSE=DENIED
CROSS_ACTOR_REUSE=DENIED
MANIFEST_OPERATION_EXACT_MATCH=YES
DESTINATION_BROWSER_OVERRIDE=NO
DNS_REBINDING_PROTECTION=READY
REDIRECTS=DENIED

RAW_CUSTOMER_API_RESPONSE_CENTRAL=NO
BOUNDED_LOCAL_RESULT_ONLY=YES
FEATURE008_PROJECTION_BYPASS=NO
FEATURE008_TIMEOUT_SINGLE_AUTHORITY=ToolDefinition.timeoutMs
MOCK_FALLBACK=NO

CUSTOMER_BRANCH_IN_ASSISTANT_CORE=NO
SHINMONE_FULL_QUERY_BRANCH=NO
SECOND_CUSTOMER_REUSE_PROOF=PASS
SHINMONE_REMOVAL_GENERIC_RUNTIME_PASS=YES
CUSTOMER_SPECIFIC_ASSISTANT_CORE_BRANCH=NO
CUSTOMER_SPECIFIC_GENERIC_RUNTIME_BRANCH=NO
PUBLIC_API_CHANGE=NO
SSE_CONTRACT_CHANGE=NO
SDK_PUBLIC_API_CHANGE=NO
CENTRAL_PRISMA_SCHEMA_CHANGE=NO

OPEN_IMPLEMENTATION_BLOCKERS=0
SHINMONE_LIVE_VERTICAL_SLICE_READY=YES
FEATURE007_HISTORICAL_TASKS_REWRITTEN=NO
FEATURE009_IMPLEMENTATION_STATUS=PASS
```

## Task-List Generation Summary

```text
TASKS_FILE=specs/009-productized-business-connector-runtime/tasks.md
TASKS_ONLY=YES
TOTAL_TASKS=142
PHASES_REPRESENTED=15
PHASE_CHECKPOINTS=15
RED_GREEN_PAIRS_PRESENT=YES
SECURITY_GATE_TASKS_COMPLETE=YES
BRIDGE_BINDING_TRANSPORT_TASKS_PRESENT=YES
PHASE14_STAGING_GATE_EXPLICIT=YES
SDK_IMPLEMENTATION_TASKS_PRESENT=NO
FEATURE007_HISTORICAL_TASKS_REWRITTEN=NO
OPEN_TASK_DESIGN_BLOCKERS=0
PHASE1_EXECUTED=NO
IMPLEMENTATION_GATE_APPROVED=YES
HUMAN_IMPLEMENTATION_GATE_REVIEW=PASS
READY_FOR_HUMAN_GATE_REVIEW=NO
NEXT_ACTION=EXECUTE_PHASE1
```
