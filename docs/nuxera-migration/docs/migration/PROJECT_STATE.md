# Project State

## Current program status
Controlled migration preparation started on branch `nuxera-controlled-migration`.

## Brand
Working name: NUXERA.
Descriptor: Financial Intelligence.
Full visible identity: NUXERA Financial Intelligence.

Earlier N&U / NU / NEXUS naming in imported package files is superseded by `docs/nuxera-migration/NUXERA_IDENTITY_ADENDA.md`. Do not mass-rename technical identifiers, storage keys, routes, API contracts, database tables or environment variables.

## Architecture decision
Use dual-view controlled migration. Legacy remains available until each replacement is formally accepted.

## Current stack baseline
- React 18
- Vite
- React Router
- Axios
- i18next
- Recharts
- Vitest
- Playwright
- Sentry
- Stripe
- Express backend
- Supabase auth/database/storage integration

## Active task
NU-BASE-001 - Repository baseline and dependency map.

## Completed decisions
- Four engines approved under NUXERA naming: Finance, Intelligence, Markets and Strategy.
- Compliance remains transversal and central, not discarded.
- Applicants receive goal-oriented language instead of technical jargon.
- Grantors receive a case-decision workspace.
- Admin receives a separated operational console.
- Codex and Claude Code use identical task contracts.
- Existing `DashboardPage.jsx` should become the compatibility host; do not delete it first.
- Existing `classic` and `new` views must remain available while the NUXERA view is introduced behind a feature flag.

## Completed work
- Imported migration control package under `docs/nuxera-migration/`.
- Added `docs/nuxera-migration/NUXERA_IDENTITY_ADENDA.md`.
- Updated package README reading order to prioritize the NUXERA identity addendum.
- Created verified baseline inventory at `docs/nuxera-migration/docs/migration/NU_BASE_001_BASELINE_INVENTORY.md`.

## Validation status
Local structural validation is green as of 2026-07-17:
- Frontend and backend dependencies installed.
- Frontend lint, production build and full test suite pass.
- Backend full test suite passes.
- Local phase checks, RBAC matrix and NUXERA SQL guardrails pass.
- Public applicant, funder, international and security pages are routed and linked.

Production closure still requires controlled Supabase execution and verification evidence, followed by GitHub publication and Vercel deployment with real environment variables. No production write or deployment has been performed from this workspace.

## Handoff
Next action: install dependencies for this checkout or use an environment with npm available, then run the baseline validation commands and update `NU_BASE_001_BASELINE_INVENTORY.md` with results. Do not start runtime shell changes until this baseline is validated or explicitly accepted as documentation-only partial baseline.
## Validation update - 2026-07-16

Dependencies were installed with bundled pnpm only as a temporary validation mechanism because npm is not available on PATH. No pnpm lockfiles are intended to be committed.

Results:
- Frontend unit tests passed: 8 files, 161 tests.
- Backend unit tests passed via direct Vitest: 36 files, 385 tests.
- Frontend build progressed outside sandbox but failed on unresolved `@sentry/browser` import under pnpm strict dependency resolution.
- Lint failed because the root lint script scans backend files and ESLint config discovery fails in `backend/scripts`.

NU-BASE-001 remains open until build/lint are either fixed in dedicated baseline hygiene tasks or accepted as known pre-existing issues.

## Baseline closeout update - 2026-07-16

Baseline hygiene fixes were applied:
- Explicit `@sentry/browser` dependency.
- Root ESLint flat config.
- Root lint script updated for flat config.

Validation now passes for:
- Frontend build.
- Frontend lint.
- Frontend unit tests: 8 files, 161 tests.
- Backend unit tests: 36 files, 385 tests.

E2E remains deferred because Playwright is configured to start `npm run dev`, but npm is not available on PATH in this environment.

Next task after committing baseline hygiene: `NU-SHELL-001`.

## NU-SHELL-001 update - 2026-07-16

Implemented the first reversible NUXERA shell slice behind `VITE_NUXERA_EXPERIENCE_ENABLED=true`.

Changed runtime surface:
- Added experience storage, allowed-experience flags and `ExperienceProvider`.
- Wrapped the app with `ExperienceProvider` without changing authentication or notification provider order.
- Added a feature-flagged NUXERA entry point from `DashboardPage.jsx`.
- Added a NUXERA shell with role-aware navigation for applicant, grantor and admin workspaces.
- Preserved `classic` and `new` dashboard views and added an explicit return path from NUXERA to the current view.
- Kept `nsd_ui_view` as the compatibility storage key; no technical key rename was performed.

Validation:
- Frontend lint: passed with `pnpm run lint`.
- Frontend build: passed with `pnpm run build` using bundled Node and escalated execution due Vite/Rolldown EPERM in the restricted sandbox.
- Frontend unit tests: passed with `pnpm run test:run`, 9 files and 168 tests after adding targeted NUXERA coverage; sandbox attempts can fail at startup with EPERM, elevated runs pass.

Remaining NU-SHELL-001 gaps:
- Manual browser verification with feature flag enabled. Attempted with installed Chrome, but local browser launch is blocked by `spawn EPERM` and no admin/install path is available.
- Screenshots for applicant/grantor/admin shell states.
- E2E remains deferred because the local Playwright webServer command uses `npm run dev`, but npm is unavailable on PATH in this environment.

Next recommended task: `NU-SHELL-002` should connect the first real migrated workspace section while still leaving legacy tabs available.

## NU-SHELL-002 update - 2026-07-16

Connected the first real NUXERA workspace section through a controlled adapter.

Changed runtime surface:
- Added a NUXERA section registry.
- Mounted `/dashboard/nuxera/intelligence` to a wrapper around the existing `DocumentIntelligenceTab`.
- Left all other engine routes as placeholders until their adapters are approved.
- Preserved the legacy dashboard tab and backend/API contracts.

Validation:
- Targeted NUXERA tests: passed, 9 checks.
- Frontend lint: passed with `pnpm run lint`.
- Frontend build: passed with `pnpm run build` using bundled Node and elevated execution due Vite/Rolldown EPERM in the restricted sandbox.
- Frontend unit tests: passed with `pnpm run test:run`, 9 files and 170 tests.

Remaining gaps:
- Manual visual verification and screenshots remain blocked by local browser launch `spawn EPERM`.
- `NUXERA Intelligence` is currently an adapter over document intelligence, not the full future research missions module described in `NU-INT-001`.

Next recommended task: start a small `NU-FIN-ADAPTER-001` or `NU-INT-002` depending on whether the next priority is Finance readiness or deeper Intelligence missions.

## NU-FIN-ADAPTER-001 update - 2026-07-16

Mounted the first role-aware NUXERA Finance adapter by reusing existing modules.

Changed runtime surface:
- `/dashboard/nuxera/finance` now resolves to a Finance adapter.
- Applicant role mounts `FundingReadinessTab`.
- Grantor role mounts `PipelineTab`.
- Admin role mounts `ServiceOrdersPage`.
- Legacy dashboard tabs and backend/API contracts remain untouched.

Validation:
- Targeted NUXERA tests: passed, 12 checks.
- Frontend lint: passed with `pnpm run lint`.
- Frontend build: passed with `pnpm run build` using bundled Node and elevated execution due Vite/Rolldown EPERM in the restricted sandbox.
- Frontend unit tests: passed with `pnpm run test:run`, 9 files and 173 tests.

Remaining gaps:
- Manual visual verification and screenshots remain blocked by local browser launch `spawn EPERM`.
- Finance is currently an adapter over existing role-specific modules, not the final unified Finance workspace.

Next recommended task: choose between `NU-MKT-ADAPTER-001` for a lightweight Markets placeholder-to-adapter path, or `NU-FIN-002` to begin unifying the Finance user journey beyond adapters.

## NU-MKT-ADAPTER-001 update - 2026-07-16

Opened the first NUXERA Markets foundation in line with `NU-MKT-001` from the migration package.

Changed runtime surface:
- `/dashboard/nuxera/markets` now resolves to a Markets workspace.
- Added a local delayed market provider with explicit provenance and no-advice disclaimer.
- Added watchlist, monitored events and monitoring policies for graceful provider degradation.
- Backend/API contracts remain untouched.

Validation:
- Targeted NUXERA tests: passed, 16 checks.
- Frontend lint: passed with `pnpm run lint`.
- Frontend build: passed with `pnpm run build` using bundled Node and elevated execution due Vite/Rolldown EPERM in the restricted sandbox.
- Frontend unit tests: passed with `pnpm run test:run`, 9 files and 177 tests.

Remaining gaps:
- Manual visual verification and screenshots remain blocked by local browser launch `spawn EPERM`.
- Markets uses local controlled data; licensed provider integration remains future work.

Next recommended task: `NU-STR-ADAPTER-001` to open Strategy as a decision-support workspace that references Finance, Intelligence and Markets evidence.

## NU-STR-ADAPTER-001 update - 2026-07-16

Opened the first NUXERA Strategy foundation in line with `NU-STR-001` from the migration package.

Changed runtime surface:
- `/dashboard/nuxera/strategy` now resolves to a Strategy workspace.
- Added guided questions, assumptions, scenario comparison, recommendation uncertainty, evidence links and action plan.
- Strategy links back to Finance, Intelligence and Markets evidence.
- Backend/API contracts remain untouched.

Validation:
- Targeted NUXERA tests: passed, 20 checks.
- Frontend lint: passed with `pnpm run lint`.
- Frontend build: passed with `pnpm run build` using bundled Node and elevated execution due Vite/Rolldown EPERM in the restricted sandbox.
- Frontend unit tests: passed with `pnpm run test:run`, 9 files and 181 tests.

Remaining gaps:
- Manual visual verification and screenshots remain blocked by local browser launch `spawn EPERM`.
- Strategy outputs are local/auditable draft only; persistence and export require a dedicated task.

Next recommended task: consolidate the four engine adapters into a shared engine registry/metadata layer or begin the first true module-deepening task (`NU-FIN-002`, `NU-INT-002`, `NU-MKT-002` or `NU-STR-002`).

## NU-ENGINE-REGISTRY-001 update - 2026-07-16

Centralized NUXERA engine metadata after mounting the four initial engines.

Changed runtime surface:
- Added `src/nuxera/engines/engineRegistry.js` as the source of truth for Finance, Intelligence, Markets and Strategy.
- NUXERA navigation now derives shared engine links from the engine registry.
- Section resolution now derives engine adapters, titles and status from the engine registry.
- Routes and role semantics remain unchanged.

Validation:
- Targeted NUXERA tests: passed, 23 checks.
- Frontend lint: passed with `pnpm run lint`.
- Frontend build: passed with `pnpm run build` using bundled Node and elevated execution due Vite/Rolldown EPERM in the restricted sandbox.
- Frontend unit tests: passed with `pnpm run test:run`, 9 files and 184 tests.

Next recommended task: begin one module-deepening task (`NU-FIN-002`, `NU-INT-002`, `NU-MKT-002` or `NU-STR-002`) now that shell and engine registry are stable.

## NU-FIN-002 update - 2026-07-16

Started unifying the NUXERA Finance journey beyond a raw adapter.

Changed runtime surface:
- Added a role-aware Finance journey model with next action, progress, goals, alerts and evidence links.
- NUXERA Finance now shows guided context above the existing operational module for applicant, grantor and admin roles.
- Existing Finance-related modules remain mounted and unmodified.
- Backend/API contracts remain untouched.

Validation:
- Targeted NUXERA tests: passed, 27 checks.
- Frontend lint: passed with `pnpm run lint`.
- Frontend build: passed with `pnpm run build` using bundled Node and elevated execution due Vite/Rolldown EPERM in the restricted sandbox.
- Frontend unit tests: passed with `pnpm run test:run`, 9 files and 188 tests.

Next recommended task: `NU-INT-002` for research missions with evidence/citations, or continue Finance with persisted progress/action state.

## NU-INT-002 update - 2026-07-16

Started evolving NUXERA Intelligence beyond the document adapter.

Changed runtime surface:
- Added a local research mission model with mission types, subject, plan, sources, findings, evidence ids, confidence and report metadata.
- NUXERA Intelligence now shows a mission layer above the existing `DocumentIntelligenceTab`.
- Existing document intelligence module remains mounted and unmodified.
- Backend/API contracts remain untouched.

Validation:
- Targeted NUXERA tests: passed, 30 checks.
- Frontend lint: passed with `pnpm run lint`.
- Frontend build: passed with `pnpm run build` using bundled Node and elevated execution due Vite/Rolldown EPERM in the restricted sandbox.
- Frontend unit tests: passed with `pnpm run test:run`, 9 files and 191 tests.

Next recommended task: continue `NU-INT-003` with persistence/export approval, or move to `NU-MKT-002` for provider abstraction hardening.

## NU-MKT-002 update - 2026-07-16

Hardened the NUXERA Markets provider layer after the initial watchlist foundation.

Changed runtime surface:
- Added explicit market provider states for local delayed, degraded and unlicensed modes.
- Added a realtime guard so realtime market data is unavailable unless a licensed realtime status is explicitly active.
- Added a provider degradation plan with visible fallback strategy, actions and human-review framing.
- Updated the Markets workspace to show provider health, realtime availability, snapshot time and fallback actions before the watchlist.
- Kept local watchlist context available in degraded mode.
- Backend/API contracts remain untouched.

Validation:
- Targeted NUXERA tests: passed, 33 checks.
- Frontend lint: passed with `pnpm run lint`.
- Frontend build: passed with `pnpm run build` using bundled Node and elevated execution due Vite/Rolldown EPERM in the restricted sandbox.
- Frontend unit tests: passed with `pnpm run test:run`, 9 files and 194 tests.

Remaining gaps:
- Manual visual verification and screenshots remain blocked by local browser launch `spawn EPERM`.
- E2E remains deferred because the local Playwright webServer command uses `npm run dev`, but npm is unavailable on PATH in this environment.

Next recommended task after validation: continue with `NU-STR-002` for deeper strategy decision flows or `NU-INT-003` for Intelligence persistence/export approval.

## NU-STR-002 update - 2026-07-16

Deepened NUXERA Strategy from scenario display into an auditable decision-flow layer.

Changed runtime surface:
- Added decision flow stages with owner, status, gate, evidence ids and rollback condition.
- Added readiness criteria for evidence coverage, human review and reversibility.
- Added a local Strategy decision package with required evidence ids, rollback conditions and audit trail.
- Updated the Strategy workspace to show decision gates before assumptions and scenarios.
- Kept decision output local/auditable only; no approvals, persistence, backend or API changes were introduced.

Validation:
- Targeted NUXERA tests: passed, 35 checks.
- Frontend lint: passed with `pnpm run lint`.
- Frontend build: passed with `pnpm run build` using bundled Node and elevated execution due Vite/Rolldown EPERM in the restricted sandbox.
- Frontend unit tests: passed with `pnpm run test:run`, 9 files and 196 tests.

Remaining gaps:
- Manual visual verification and screenshots remain blocked by local browser launch `spawn EPERM`.
- E2E remains deferred because the local Playwright webServer command uses `npm run dev`, but npm is unavailable on PATH in this environment.

Next recommended task after validation: continue with `NU-INT-003` only if persistence/export is approved, or start a frontend-only applicant guided mission slice.

## NU-APP-002 update - 2026-07-16

Started replacing the applicant NUXERA home placeholder with a guided mission foundation.

Changed runtime surface:
- Added a local applicant guided mission model with financing readiness summary, outcome, progress, next action, steps and guardrails.
- Added mission readiness status with open step ids and human-review requirement.
- Updated applicant home to show mission steps and evidence links to Finance, Intelligence and Strategy.
- Kept grantor/admin home placeholder behavior unchanged.
- Backend/API contracts remain untouched and mission state is not persisted.

Validation:
- Targeted NUXERA tests: passed, 37 checks.
- Frontend lint: passed with `pnpm run lint`.
- Frontend build: passed with `pnpm run build` using bundled Node and elevated execution due Vite/Rolldown EPERM in the restricted sandbox.
- Frontend unit tests: passed with `pnpm run test:run`, 9 files and 198 tests.

Remaining gaps:
- Manual visual verification and screenshots remain blocked by local browser launch `spawn EPERM`.
- E2E remains deferred because the local Playwright webServer command uses `npm run dev`, but npm is unavailable on PATH in this environment.

Next recommended task after validation: add a frontend-only applicant data-room/checklist layer, or pause for backend contract design before persistence.

## NU-APP-003 update - 2026-07-16

Connected the applicant guided mission to a frontend-only data-room/checklist foundation.

Changed runtime surface:
- Reused existing minimum requirements semantics from `src/data/requisitosMinimos.js`.
- Added local applicant checklist summary, categories, data-room folders and next evidence.
- Updated applicant NUXERA home to show data-room readiness, folder visibility and critical missing evidence.
- Kept checklist output local/preparation-only; no persistence, backend/API or permission changes were introduced.
- Legacy requirements and data-room modules remain untouched.

Validation:
- Targeted NUXERA tests: passed, 39 checks.
- Frontend lint: passed with `pnpm run lint`.
- Frontend build: passed with `pnpm run build` using bundled Node and elevated execution due Vite/Rolldown EPERM in the restricted sandbox.
- Frontend unit tests: passed with `pnpm run test:run`, 9 files and 200 tests.

Remaining gaps:
- Manual visual verification and screenshots remain blocked by local browser launch `spawn EPERM`.
- E2E remains deferred because the local Playwright webServer command uses `npm run dev`, but npm is unavailable on PATH in this environment.

Next recommended task after validation: `NU-GRA-002` for a grantor case queue foundation, or design backend contracts for persisted applicant mission/checklist state.

## NU-GRA-002 update - 2026-07-16

Started replacing the grantor NUXERA home placeholder with a local/auditable case queue foundation.

Changed runtime surface:
- Added a local grantor case queue model reusing existing `otorgantePipeline` mapping helpers.
- Added queue priorities, decision signals and evidence links to Finance, Intelligence and Strategy.
- Updated grantor NUXERA home to show summary metrics, prioritized cases and review policies.
- Kept all queue output local and human-review gated; no credit approvals, term sheets, backend/API or permission changes were introduced.
- Existing legacy PipelineTab remains untouched.

Validation:
- Targeted NUXERA tests: passed, 41 checks.
- Frontend lint: passed with `pnpm run lint`.
- Frontend build: passed with `pnpm run build` using bundled Node and elevated execution due Vite/Rolldown EPERM in the restricted sandbox.
- Frontend unit tests: passed with `pnpm run test:run`, 9 files and 202 tests.

Remaining gaps:
- Manual visual verification and screenshots remain blocked by local browser launch `spawn EPERM`.
- E2E remains deferred because the local Playwright webServer command uses `npm run dev`, but npm is unavailable on PATH in this environment.

Next recommended task after validation: deepen grantor case detail or design persistence/contracts for applicant and grantor NUXERA state.

## NU-GRA-003 update - 2026-07-16

Deepened the grantor local queue with a case workbench foundation.

Changed runtime surface:
- Added a local case workbench over the existing grantor queue.
- Added review questions, required evidence, non-binding conditions and audit trail for the selected case.
- Updated grantor NUXERA home to show the workbench under the prioritized queue.
- Kept all output local and human-review gated; no credit approvals, term sheets, backend/API or permission changes were introduced.
- Existing legacy PipelineTab remains untouched.

Validation:
- Targeted NUXERA tests: passed, 42 checks.
- Frontend lint: passed with `pnpm run lint`.
- Frontend build: passed with `pnpm run build` using bundled Node and elevated execution due Vite/Rolldown EPERM in the restricted sandbox.
- Frontend unit tests: passed with `pnpm run test:run`, 9 files and 203 tests.

Remaining gaps:
- Manual visual verification and screenshots remain blocked by local browser launch `spawn EPERM`.
- E2E remains deferred because the local Playwright webServer command uses `npm run dev`, but npm is unavailable on PATH in this environment.

Next recommended task after validation: `NU-ADM-002` for an admin operations foundation, or design persistence/contracts for NUXERA state.

## NU-ADM-002 update - 2026-07-16

Replaced the admin NUXERA home placeholder with a local operations console foundation.

Changed runtime surface:
- Added local admin operations model with operations, security, AI/agents and system lanes.
- Added release gates for feature flag, legacy safety, backend contracts and human review.
- Updated admin NUXERA home to show summary metrics, lanes, release gates, audit trail and policies.
- Kept the console local/read-only; no permissions, backend/API, data-room or automation changes were introduced.
- Existing legacy admin modules remain untouched.

Validation:
- Targeted NUXERA tests: passed, 44 checks.
- Frontend lint: passed with `pnpm run lint`.
- Frontend build: passed with `pnpm run build` using bundled Node and elevated execution due Vite/Rolldown EPERM in the restricted sandbox.
- Frontend unit tests: passed with `pnpm run test:run`, 9 files and 205 tests.

Remaining gaps:
- Manual visual verification and screenshots remain blocked by local browser launch `spawn EPERM`.
- E2E remains deferred because the local Playwright webServer command uses `npm run dev`, but npm is unavailable on PATH in this environment.

Next recommended task after validation: decide whether to design persistence contracts or continue with admin detail slices.

## NU-ADM-003 update - 2026-07-16

Deepened the admin operations console with local readiness, incident controls and compliance evidence.

Changed runtime surface:
- Added rollout readiness for applicant, grantor and admin NUXERA surfaces.
- Added incident controls for known browser/E2E blocker, runtime PATH watch and blocked data contracts.
- Added compliance evidence for identity, feature flag, decision safety and market data guardrails.
- Updated admin NUXERA home to show readiness, incident and compliance panels.
- Kept the console local/read-only; no permissions, backend/API, data-room, telemetry or automation changes were introduced.

Validation:
- Targeted NUXERA tests: passed, 45 checks.
- Frontend lint: passed with `pnpm run lint`.
- Frontend build: passed with `pnpm run build` using bundled Node and elevated execution due Vite/Rolldown EPERM in the restricted sandbox.
- Frontend unit tests: passed with `pnpm run test:run`, 9 files and 206 tests.
- `git diff --check`: passed.

Remaining gaps:
- Manual visual verification and screenshots remain blocked by local browser launch `spawn EPERM`.
- E2E remains deferred because the local Playwright webServer command uses `npm run dev`, but npm is unavailable on PATH in this environment.

Next recommended task after validation: either design persistence contracts for real NUXERA state or continue admin detail slices for rollout controls.

## NU-GRA-004 update - 2026-07-16

Added a local, non-binding grantor decision memo over the existing case workbench.

Changed runtime surface:
- Added `getGrantorDecisionMemo` with thesis, recommendation, evidence snapshot, risk notes, proposed conditions and next actions.
- Updated grantor NUXERA home to show the memo under the workbench.
- Kept the memo local/read-only; no term sheet, approval, permission change, backend/API or persistence change was introduced.
- Existing grantor queue/workbench and legacy grantor modules remain untouched.

Validation:
- Targeted NUXERA tests: passed, 46 checks.
- Frontend lint: passed with `pnpm run lint`.
- Frontend build: passed with `pnpm run build` using bundled Node and elevated execution due Vite/Rolldown EPERM in the restricted sandbox.
- Frontend unit tests: passed with `pnpm run test:run`, 9 files and 207 tests.
- `git diff --check`: passed.

Remaining gaps:
- Manual visual verification and screenshots remain blocked by local browser launch `spawn EPERM`.
- E2E remains deferred because the local Playwright webServer command uses `npm run dev`, but npm is unavailable on PATH in this environment.

Next recommended task after validation: design backend contracts for persisted NUXERA state, or continue frontend-only with applicant/strategy detail slices.

## NU-BE-001 update - 2026-07-16

Designed the first NUXERA persistence contract without applying backend/schema/runtime changes.

Changed documentation surface:
- Added `NUXERA_PERSISTENCE_CONTRACTS.md` as the canonical contract for persisted NUXERA state.
- Proposed additive modules: `nuxera_workspace_states`, `nuxera_evidence_links`, `nuxera_review_artifacts` and `nuxera_admin_controls`.
- Mapped contracts to existing anchors: `service_orders`, `documents`, `document_reviews`, `audit_logs`, data-room shares and backend role permissions.
- Drafted `/nuxera` API route families, additive permissions, role access matrix, required audit events and rollback requirements.
- Updated migration matrix, QA acceptance matrix and rollback plan.

Validation:
- Documentation-only task; runtime tests not required because no executable code changed.
- `git diff --check`: passed.

Remaining gaps:
- No SQL migration exists yet.
- No backend route/service exists yet.
- No UI writes are connected to backend persistence.
- Production schema must be confirmed before `NU-BE-002`.

Next recommended task after validation: `NU-BE-002` SQL draft and read/write backend route skeleton for `nuxera_workspace_states`, starting with applicant checklist only.

## NU-BE-002 update - 2026-07-16

Started the first backend skeleton for NUXERA persisted state, limited to applicant checklist state.

Changed backend surface:
- Added draft SQL for `nuxera_workspace_states` in `backend/sql_migrations_pendientes/2026-07-16_nuxera_workspace_states.sql`.
- Added `nuxeraWorkspaceStateService` with owner-scoped applicant checklist read/upsert.
- Added `/api/nuxera/orders/:orderId/state` read route and `/api/nuxera/orders/:orderId/state/checklist` patch route.
- Mounted the NUXERA backend route in `backend/src/server.js`.
- Added mocked backend tests for default state, ownership rejection, create/update audit metadata and invalid status rejection.

Validation:
- Backend targeted test: passed, 1 file / 5 tests.
- Backend full test suite: passed, 37 files / 390 tests.
- `git diff --check`: passed.

Remaining gaps:
- SQL draft has not been applied to Supabase/production.
- Frontend writes remain disconnected.
- Grantor memo, review artifacts, evidence links and admin controls remain contract-only.
- Production schema/RLS review is still required before applying SQL.

Next recommended task after validation: `NU-BE-003` to add route-level tests and a read-only frontend adapter behind the NUXERA flag, or apply/verify SQL in a controlled Supabase environment before UI writes.

## NU-BE-003 update - 2026-07-16

Added route-level coverage for the first NUXERA backend state endpoints.

Changed backend surface:
- Added `backend/src/routes/nuxera.test.js`.
- Verified auth and permission gates for `GET /api/nuxera/orders/:orderId/state`.
- Verified auth, permission and checklist-only surface gates for `PATCH /api/nuxera/orders/:orderId/state/:surface`.
- Verified route delegation to the applicant checklist state service with order id, user id, status, payload and request context.

Validation:
- Backend targeted route test: passed, 1 file / 6 tests.
- Backend full test suite: passed, 38 files / 396 tests.
- `git diff --check`: passed.

Remaining gaps:
- SQL draft has not been applied to Supabase/production.
- Frontend reads/writes remain disconnected.
- Grantor memo, review artifacts, evidence links and admin controls remain contract-only.

Next recommended task after validation: connect a read-only frontend adapter behind the NUXERA flag, or apply/verify SQL in a controlled Supabase environment before any UI write path.

## NU-FE-BE-001 update - 2026-07-16

Connected the first read-only frontend adapter to the NUXERA applicant checklist state endpoint.

Changed frontend surface:
- Added `nuxeraWorkspaceStateAPI.getOrderState(orderId)` to the shared API client.
- Added `workspaceStateAdapter` to normalize backend state and merge persisted `completedItemIds` into the local checklist view.
- Updated applicant NUXERA home to read backend state only when the NUXERA flag is active and a real order id exists.
- Preserved local fallback for demo mode, missing orders, unavailable endpoint or non-persisted default state.
- Kept UI writes disconnected; no PATCH, persistence action or document permission change was introduced.

Validation:
- Targeted NUXERA frontend test: passed, 1 file / 48 tests.
- Frontend lint: passed with `pnpm run lint`.
- Frontend build: passed with `pnpm run build`.
- Frontend full unit suite: passed, 9 files / 209 tests.
- `git diff --check`: passed.

Remaining gaps:
- SQL draft has not been applied to Supabase/production.
- Applicant checklist writes remain disconnected from UI.
- Grantor memo, review artifacts, evidence links and admin controls remain contract-only.
- Manual browser screenshots remain blocked in this environment by browser launch restrictions.

Next recommended task after validation: apply/verify SQL in a controlled Supabase environment before enabling the first UI write path, or continue with read-only evidence-link adapters.

## NU-DB-VERIFY-001 update - 2026-07-16

Added local guard verification for the NUXERA workspace state SQL draft without applying it to Supabase.

Changed backend/tooling surface:
- Added `backend/scripts/check-nuxera-workspace-state-sql.js`.
- Added backend package script `check:nuxera-sql`.
- The guard checks table creation, `service_orders` FK, role/surface checks, JSON payload, soft archive, active unique index, supporting indexes, RLS enablement and owner-scoped policies.
- The guard rejects destructive operations such as `DROP TABLE`, `TRUNCATE`, legacy table drops and deletes against `service_orders`.

Validation:
- `node --check scripts/check-nuxera-workspace-state-sql.js`: passed.
- `node scripts/check-nuxera-workspace-state-sql.js`: passed.
- `node scripts/check-supabase-schema.js`: blocked because Supabase env vars are not present in this environment.
- `pnpm run check:nuxera-sql`: blocked by pnpm wrapper attempting a non-TTY modules purge/install; direct Node execution passed.

Remaining gaps:
- SQL draft has not been applied to Supabase/production.
- Live schema/RLS verification is still pending in a controlled Supabase environment.
- Applicant checklist writes remain disconnected from UI.
- Grantor memo, review artifacts, evidence links and admin controls remain contract-only.

Next recommended task after validation: run the SQL draft and schema checks in an environment with Supabase credentials, then test GET/PATCH against controlled real rows before enabling UI writes.

## NU-EVID-001 update - 2026-07-16

Added a frontend-only NUXERA evidence ledger to normalize evidence signals before backend evidence persistence exists.

Changed frontend surface:
- Added `src/nuxera/evidence/evidenceLedger.js`.
- Ledger combines applicant checklist requirements, demo document summaries, Intelligence research sources, Strategy evidence links and Finance journey links.
- Applicant NUXERA home now shows a compact read-only ledger panel with source, engine, status and provenance.
- Visibility remains role-scoped metadata only; no document access or data-room permission changes are made.
- No backend/API, SQL, persistence or write path was introduced.

Validation:
- Targeted NUXERA frontend test: passed, 1 file / 50 tests.
- Frontend lint: passed with `pnpm run lint`.
- Frontend build: passed with `pnpm run build`.
- Frontend full unit suite: passed, 9 files / 211 tests.
- `git diff --check`: passed.

Remaining gaps:
- `nuxera_evidence_links` remains contract-only and has no SQL/backend implementation.
- SQL draft for `nuxera_workspace_states` has not been applied to Supabase/production.
- Manual browser screenshots remain blocked by local browser launch restrictions.

Next recommended task after validation: either continue read-only evidence surfaces for grantor/admin, or implement `NU-BE-EVID-001` contract/skeleton for `nuxera_evidence_links` without enabling UI writes.

## NU-GRA-EVID-001 update - 2026-07-16

Added a grantor-safe read-only evidence ledger panel to the NUXERA grantor workspace.

Changed frontend surface:
- Grantor NUXERA home now shows summarized evidence below the case workbench and before the local memo.
- Ledger rows use `authorized-summary-only` visibility metadata.
- Each row preserves a guardrail explaining that it is read-only and does not change data-room permissions.
- No backend/API, SQL, persistence, export or permission change was introduced.

Validation:
- Targeted NUXERA frontend test: passed, 1 file / 51 tests.
- Frontend lint: passed with `pnpm run lint`.
- Frontend build: passed with `pnpm run build`.
- Frontend full unit suite: passed, 9 files / 212 tests.
- `git diff --check`: passed.

Remaining gaps:
- `nuxera_evidence_links` remains contract-only and has no SQL/backend implementation.
- SQL draft for `nuxera_workspace_states` has not been applied to Supabase/production.
- Manual browser screenshots remain blocked by local browser launch restrictions.

Next recommended task after validation: add admin read-only evidence/compliance mapping, or start a dedicated backend contract/skeleton for `nuxera_evidence_links` while keeping UI writes disabled.

## NU-ADM-EVID-001 update - 2026-07-16

Added admin read-only evidence coverage to the NUXERA operations console.

Changed frontend surface:
- Admin console model now derives evidence coverage from the NUXERA evidence ledger.
- Admin home shows coverage by Finance, Intelligence and Strategy with `internal-review` visibility metadata.
- Summary now includes total evidence signals for admin readiness review.
- No backend/API, SQL, persistence, export or permission change was introduced.

Validation:
- Targeted NUXERA frontend test: passed, 1 file / 52 tests.
- Frontend lint: passed with `pnpm run lint`.
- Frontend build: passed with `pnpm run build`.
- Frontend full unit suite: passed, 9 files / 213 tests.
- `git diff --check`: passed.

Remaining gaps:
- `nuxera_admin_controls` remains contract-only and has no SQL/backend implementation.
- `nuxera_evidence_links` remains contract-only and has no SQL/backend implementation.
- SQL draft for `nuxera_workspace_states` has not been applied to Supabase/production.
- Manual browser screenshots remain blocked by local browser launch restrictions.

Next recommended task after validation: stop here for handoff, or start a backend contract/skeleton for `nuxera_evidence_links` only if a dedicated backend task is approved.

## NU-BE-EVID-001 update - 2026-07-17

Added the first backend skeleton for NUXERA evidence links in read-only owner-scoped mode.

Changed backend surface:
- Added draft SQL for `nuxera_evidence_links` in `backend/sql_migrations_pendientes/2026-07-17_nuxera_evidence_links.sql`.
- Added `nuxeraEvidenceLinkService` with owner order verification and read-only mapping of owner-visible links.
- Added `GET /api/nuxera/orders/:orderId/evidence` behind auth and `case:own:read`.
- Added service and route tests with Supabase/service mocks.
- Kept POST/PATCH evidence writes disabled.

Validation:
- Backend targeted tests: passed, 2 files / 12 tests.
- Backend full test suite: passed, 39 files / 402 tests.
- `node --check` on new/changed backend files: passed.
- `git diff --check`: passed.

Remaining gaps:
- SQL drafts have not been applied to Supabase/production.
- Grantor/internal evidence authorization remains contract-only until data-room permissions are reviewed.
- Frontend still uses local evidence ledger; no UI writes are connected.
- `nuxera_admin_controls` and review artifacts remain contract-only.

Next recommended task after validation: add a read-only frontend adapter for `GET /api/nuxera/orders/:orderId/evidence`, or verify/apply SQL drafts in a controlled Supabase environment.

## NU-FE-BE-EVID-001 update - 2026-07-17

Connected the first read-only frontend adapter for owner evidence links.

Changed frontend surface:
- Added `nuxeraEvidenceAPI.getOrderEvidence(orderId)` to the shared API client.
- Added `evidenceBackendAdapter` to normalize backend `evidence.links` into the existing NUXERA ledger row shape.
- Applicant NUXERA home now loads owner evidence links only when the NUXERA flag is active and a real order id exists.
- Persisted backend evidence links are merged ahead of the local ledger, while demo, missing-order and backend-error modes keep the local fallback.
- Kept evidence writes disabled and did not grant document access or change data-room permissions.

Validation:
- Targeted NUXERA frontend test: passed, 1 file / 54 tests.
- Frontend lint: passed.
- Frontend build: passed.
- Frontend full unit suite: passed, 9 files / 215 tests.
- `git diff --check`: passed.

Remaining gaps:
- SQL drafts have not been applied to Supabase/production.
- Grantor/internal evidence authorization remains contract-only until data-room permissions are reviewed.
- UI writes remain disconnected.
- Manual browser screenshots remain blocked by local browser launch restrictions.

Next recommended task after validation: decide between SQL verification in a controlled Supabase environment or an admin-controls contract/skeleton task.
## NU-ADM-CTRL-001 update - 2026-07-17

Added the first backend skeleton for NUXERA admin controls in read-only mode.

Changed backend surface:
- Added draft SQL for `nuxera_admin_controls` in `backend/sql_migrations_pendientes/2026-07-17_nuxera_admin_controls.sql`.
- Added `nuxeraAdminControlService` with guarded defaults and persisted-row validation.
- Added `GET /api/nuxera/admin/controls` behind auth and `nuxera:admin:read`.
- Added service and route tests.
- Kept POST/PATCH/DELETE admin control writes disabled.

Validation:
- Backend targeted tests: passed, 2 files / 14 tests.
- Backend full test suite: passed, 40 files / 408 tests.
- `node --check` on new/changed backend files: passed.
- `git diff --check`: passed.

Remaining gaps:
- SQL drafts have not been applied to Supabase/production.
- Admin control writes remain disabled.
- Internal reviewer read access is not expanded beyond current admin wildcard behavior.
- Manual browser screenshots remain blocked by local browser launch restrictions.

Next recommended task after validation: add frontend read-only admin controls adapter, or verify/apply SQL drafts in a controlled Supabase environment.
## NU-FE-BE-ADM-CTRL-001 update - 2026-07-17

Connected the admin console to the read-only NUXERA admin controls backend adapter.

Changed frontend surface:
- Added `nuxeraAdminControlsAPI.getControls()` to the shared API client.
- Added `adminControlsAdapter` to normalize backend controls and merge them into the local operations console.
- Admin NUXERA home now shows backend/default controls when the NUXERA flag is active, with local fallback on unavailable backend/auth.
- Kept local admin gates, incident controls and policies intact.
- Kept frontend writes disabled; no automation, permissions, feature flag or market data activation was introduced.

Validation:
- Targeted NUXERA frontend test: passed, 1 file / 56 tests.
- Frontend lint: passed.
- Frontend build: passed.
- Frontend full unit suite: passed, 9 files / 217 tests.
- `node --check` on the new adapter: passed.
- `git diff --check`: passed.

Remaining gaps:
- SQL drafts have not been applied to Supabase/production.
- Admin control writes remain disabled.
- Manual browser screenshots remain blocked by local browser launch restrictions.

Next recommended task after validation: verify/apply SQL drafts in a controlled Supabase environment, or design the first low-risk applicant checklist write UX.
## NU-DB-VERIFY-002 update - 2026-07-17

Added a consolidated local SQL guard for current NUXERA draft migrations.

Changed backend/tooling surface:
- Added `backend/scripts/check-nuxera-sql-drafts.js`.
- Updated backend `check:nuxera-sql` to validate workspace state, evidence links and admin controls drafts together.
- Preserved `check:nuxera-workspace-sql` for the older workspace-state-specific guard.
- Guard checks additive table creation, FK anchors, JSON fields, active indexes, RLS, policy counts and read-only boundaries for evidence/admin controls.
- Guard rejects destructive operations against legacy anchor tables.

Validation:
- `node --check scripts/check-nuxera-sql-drafts.js`: passed.
- `node scripts/check-nuxera-sql-drafts.js`: passed.
- `pnpm run check:nuxera-sql`: blocked by the local pnpm wrapper attempting a non-TTY modules purge/install; direct Node execution passed.
- `git diff --check`: passed.

Remaining gaps:
- SQL drafts have not been applied to Supabase/production.
- Live schema/RLS verification still requires controlled Supabase credentials/environment.
- UI writes remain disconnected.

Next recommended task after validation: run the consolidated guard in a Supabase-capable environment, then decide whether applicant checklist writes can be enabled behind a guarded UX.
## NU-FE-WRITE-APP-001 update - 2026-07-17

Added the first guarded frontend write UX for applicant checklist progress.

Changed frontend surface:
- Added `nuxeraWorkspaceStateAPI.updateChecklistState(orderId, payload)`.
- Added `buildApplicantChecklistPatchPayload` and `saveChecklistItem` to `workspaceStateAdapter`.
- Applicant NUXERA home now shows disabled/enabled `Marcar listo` controls for next evidence items.
- Write path is only available when the NUXERA flag is active, a real order exists and remote state was loaded.
- Save failures keep local fallback behavior and show a safe unavailable message.

Validation:
- Targeted NUXERA frontend test: passed, 1 file / 57 tests.
- Frontend lint: passed.
- Frontend build: passed.
- Frontend full unit suite: passed, 9 files / 218 tests.
- `node --check` on the workspace state adapter: passed.
- `git diff --check`: passed.

Remaining gaps:
- SQL drafts have not been applied to Supabase/production.
- Browser/manual screenshot verification remains blocked in this environment.
- Writes are limited to applicant checklist metadata; no document/data-room writes are connected.

Next recommended task after validation: verify the write UX against a controlled Supabase environment with real `nuxera_workspace_states` RLS, or keep writes disabled in production until SQL is applied.
## NU-APP-004 update - 2026-07-17

Added a frontend-only applicant onboarding wizard foundation.

Changed frontend surface:
- Added `getApplicantOnboardingWizard` derived from the local applicant checklist and minimum requirements.
- Applicant NUXERA home now shows a three-stage onboarding sequence for company profile, project/use of funds and risk/impact.
- Each stage exposes owner, objective, evidence readiness, next evidence and an existing NUXERA module link.
- Kept onboarding local preparation-only; no persistence, backend contract, document permission or data-room write changes were introduced.

Validation:
- Targeted NUXERA frontend test: passed, 1 file / 58 tests.
- Frontend lint: passed.
- Frontend build: passed; Vite emitted the existing large chunk warning.
- Frontend full unit suite: passed, 9 files / 219 tests.
- `node --check` on `guidedMission.js`: passed.
- `node --check` on `.jsx`: not applicable in Node 24 because `.jsx` is an unknown extension; covered by Vite/Vitest.
- `git diff --check`: passed.

Remaining gaps:
- Onboarding answers are not persisted.
- SQL drafts have not been applied to Supabase/production.
- Browser/manual screenshot verification remains blocked in this environment.

Next recommended task after validation: connect onboarding to persisted workspace state only after SQL/RLS is verified, or continue with a frontend-only company/project data workspace foundation.
## NU-APP-DATA-001 update - 2026-07-17

Added a frontend-only applicant company/project workspace foundation.

Changed frontend surface:
- Added `projectWorkspace` to normalize existing order metadata into company, project, financing and risk/impact sections.
- Applicant NUXERA home now shows company/project profile, evidence readiness and next evidence per section.
- Workspace links stay within existing NUXERA modules and keep fallback data when no real order exists.
- Kept the surface local-only; no metadata persistence, backend contract, document permission or data-room visibility changes were introduced.

Validation:
- Targeted NUXERA frontend test: passed, 1 file / 60 tests.
- Frontend lint: passed.
- Frontend build: passed; Vite emitted the existing large chunk warning.
- Frontend full unit suite: passed, 9 files / 221 tests.
- `node --check` on `projectWorkspace.js`: passed.
- `git diff --check`: passed.

Remaining gaps:
- Company/project answers are not persisted.
- SQL drafts have not been applied to Supabase/production.
- Browser/manual screenshot verification remains blocked in this environment.

Next recommended task after validation: add a contextual document center foundation, or defer writes until SQL/RLS is verified in Supabase.
## NU-DOC-001 update - 2026-07-17

Added a frontend-only contextual document center foundation for applicants.

Changed frontend surface:
- Added `documentCenter` to group demo document metadata and minimum requirements into contextual folders.
- Applicant NUXERA home now shows identity/KYB, project, financial and risk/impact document folders.
- Active folder rows expose read-only document/requirement status, owner, version and risk context.
- Kept the center local/read-only; no upload, delete, signed URL, backend contract, data-room share or permission change was introduced.

Validation:
- Targeted NUXERA frontend test: passed, 1 file / 61 tests.
- Frontend lint: passed.
- Frontend build: passed; Vite emitted the existing large chunk warning.
- Frontend full unit suite: passed, 9 files / 222 tests.
- `node --check` on `documentCenter.js`: passed.
- `git diff --check`: passed.

Remaining gaps:
- Document center uses local/demo metadata and requirement-derived rows only.
- SQL drafts have not been applied to Supabase/production.
- Browser/manual screenshot verification remains blocked in this environment.

Next recommended task after validation: either add grantor-safe document summary panels, or verify/apply SQL/RLS before connecting real document-center reads/writes.
## NU-GRA-DOC-001 update - 2026-07-17

Added a grantor-safe authorized document summary foundation.

Changed frontend surface:
- Added `getGrantorDocumentSummary` to summarize workbench required evidence without opening files.
- Grantor NUXERA home now shows identity/KYB, project/structure and risk request summary folders before the read-only ledger.
- Summary exposes visible/pending counts and next action only as authorized-summary metadata.
- Kept data-room permissions, document access, downloads, uploads, shares and backend contracts unchanged.

Validation:
- Targeted NUXERA frontend test: passed, 1 file / 62 tests.
- Frontend lint: passed.
- Frontend build: passed; Vite emitted the existing large chunk warning.
- Frontend full unit suite: passed, 9 files / 223 tests.
- `node --check` on `caseQueue.js`: passed.
- `git diff --check`: passed.

Remaining gaps:
- Summary is local and derived from demo/workbench metadata only.
- SQL drafts have not been applied to Supabase/production.
- Browser/manual screenshot verification remains blocked in this environment.

Next recommended task after validation: add admin visibility for grantor document review readiness, or verify SQL/RLS before connecting real document permission reads.

## NU-ADM-DOC-001 update - 2026-07-17

Added admin visibility for grantor document review readiness.

Changed frontend surface:
- Admin operations console now aggregates authorized-summary document readiness from grantor cases.
- Admin NUXERA home shows visible, pending and total document signals per grantor case.
- Policies explicitly keep this as summary-only visibility with no document access grant.
- Kept permissions, data-room access, uploads, downloads, shares, backend contracts and SQL/RLS unchanged.

Validation:
- Targeted NUXERA frontend test: passed, 1 file / 63 tests.
- Frontend lint: passed.
- Frontend build: passed; Vite emitted the existing large chunk warning.
- Frontend full unit suite: passed, 9 files / 224 tests.
- `node --check` on `operationsConsole.js`: passed.
- `git diff --check`: passed.

Remaining gaps:
- Admin readiness is local and derived from demo/workbench metadata only.
- SQL drafts have not been applied to Supabase/production.
- Browser/manual screenshot verification remains blocked in this environment.

Next recommended task after validation: update admin observability/audit packaging, or verify SQL/RLS before connecting real document permission reads.

## NU-ADM-AUD-001 update - 2026-07-17

Added a local admin audit package foundation.

Changed frontend surface:
- Admin operations console now builds an `auditPackage` from release gates, readiness, evidence, grantor document readiness and incident controls.
- Admin NUXERA home shows consolidated audit signals and guardrails for human review.
- Package remains local and read-only; it does not export files, write backend state or create downloads.
- Kept permissions, data-room access, shares, signed URLs, backend contracts and SQL/RLS unchanged.

Validation:
- Targeted NUXERA frontend test: passed, 1 file / 64 tests.
- Frontend lint: passed.
- Frontend build: passed; Vite emitted the existing large chunk warning.
- Frontend full unit suite: passed, 9 files / 225 tests.
- `node --check` on `operationsConsole.js`: passed.
- `git diff --check`: passed.

Remaining gaps:
- Audit package is derived from local/demo signals only.
- SQL drafts have not been applied to Supabase/production.
- Browser/manual screenshot verification remains blocked in this environment.

Next recommended task after validation: update portable Downloads handoff, then continue with admin observability details or verify SQL/RLS before real backend connections.
## NU-ADM-OBS-001 update - 2026-07-17

Added local admin health signals for operational observability.

Changed frontend surface:
- Admin operations console now derives `adminHealthSignals` across rollout governance, runtime tooling, evidence, document visibility, decision safety, AI automation and audit readiness.
- Admin NUXERA home shows monitored domains, watch count and next actions.
- Signals are local/read-only and consolidate existing state only.
- Kept backend contracts, SQL/RLS, permissions, data-room access, exports and AI activation unchanged.

Validation:
- Targeted NUXERA frontend test: passed, 1 file / 65 tests.
- Frontend lint: passed.
- Frontend build: passed; Vite emitted the existing large chunk warning.
- Frontend full unit suite: passed, 9 files / 226 tests.
- `node --check` on `operationsConsole.js`: passed.
- `git diff --check`: passed.

Remaining gaps:
- Health signals are local/demo-derived only.
- SQL drafts have not been applied to Supabase/production.
- Browser/manual screenshot verification remains blocked in this environment.

Next recommended task after validation: continue frontend-only admin details, or pause and verify SQL/RLS before connecting real backend state.
## NU-ADM-ACT-001 update - 2026-07-17

Added a local admin action queue for human follow-up.

Changed frontend surface:
- Admin operations console now derives `adminActionQueue` from health signals and audit-package actions.
- Admin NUXERA home shows open local actions, priority, owner, source and guardrails.
- Queue is informational/read-only and does not execute actions.
- Kept backend contracts, SQL/RLS, permissions, data-room access, exports and AI activation unchanged.

Validation:
- Targeted NUXERA frontend test: passed, 1 file / 66 tests.
- Frontend lint: passed.
- Frontend build: passed; Vite emitted the existing large chunk warning.
- Frontend full unit suite: passed, 9 files / 227 tests.
- `node --check` on `operationsConsole.js`: passed.
- `git diff --check`: passed.

Remaining gaps:
- Action queue is local/demo-derived only.
- SQL drafts have not been applied to Supabase/production.
- Browser/manual screenshot verification remains blocked in this environment.

Next recommended task after validation: continue frontend-only admin details, or pause and verify SQL/RLS before connecting real backend state.
## NU-DB-APPLY-READINESS-001 update - 2026-07-17

Added a documentation-only SQL/RLS readiness checklist before controlled Supabase application.

Changed migration docs:
- Added `NUXERA_SQL_RLS_READINESS_CHECKLIST.md` with pending draft order, local guard, controlled Supabase, RLS, endpoint, feature-flag, go/no-go and rollback gates.
- Updated migration matrix to show SQL guard plus SQL/RLS readiness checklist as local backend-prep progress.
- Updated QA acceptance matrix with live-application readiness evidence.
- Updated rollback plan with SQL/RLS rollback rehearsal requirements.
- Kept SQL drafts unapplied; no backend routes, RLS policies, permissions, UI writes or data-room behavior changed.

Validation:
- Documentation-only task; no runtime behavior changed.
- Direct NUXERA SQL draft guard from `backend/`: passed.
- Literal newline check: passed.
- `git diff --check`: passed.

Remaining gaps:
- Controlled Supabase apply/RLS verification has not been executed.
- SQL drafts remain pending and unapplied to production.
- Browser/manual screenshot verification remains blocked in this environment.

Next recommended task after validation: run controlled SQL/RLS verification in a non-production Supabase environment, or continue frontend-only/admin detail work if credentials are unavailable.
## NU-BE-ERR-001 update - 2026-07-17

Added controlled NUXERA route error mapping for backend readiness.

Changed backend surface:
- NUXERA route service failures now map to sanitized route responses instead of returning raw service messages as 400 errors.
- Ownership/permission unavailable cases return `404` with `NUXERA_RESOURCE_UNAVAILABLE`.
- Invalid NUXERA data returns `422` with `NUXERA_INVALID_DATA`.
- Backend/unapplied-table failures return `503` with `NUXERA_BACKEND_UNAVAILABLE`.
- Route tests cover controlled admin backend failure, applicant access unavailability and invalid checklist payload handling.
- Kept SQL drafts unapplied; no RLS policies, permission grants, schemas, data-room behavior or new write endpoints changed.

Validation:
- `node --check` on `backend/src/routes/nuxera.js`: passed.
- `node --check` on `backend/src/routes/nuxera.test.js`: passed.
- Targeted backend route test: passed, 1 file / 13 tests.

Remaining gaps:
- Controlled Supabase apply/RLS verification has not been executed.
- SQL drafts remain pending and unapplied to production.
- Browser/manual screenshot verification remains blocked in this environment.

Next recommended task after validation: continue backend readiness with controlled Supabase/RLS evidence when credentials are available, or keep hardening local route contracts and tests.
## NU-BE-PAYLOAD-001 update - 2026-07-17

Constrained applicant checklist persistence payloads to approved NUXERA metadata.

Changed backend/frontend contract:
- Backend checklist writes now persist only `completedItemIds`, `lastCompletedItemId` and `source` payload keys.
- Checklist item ids are trimmed, deduplicated and limited to valid string values.
- Malformed checklist metadata is rejected before persistence.
- Frontend checklist patch payloads no longer carry arbitrary previous payload keys forward.
- Kept SQL drafts unapplied; no RLS policies, permission grants, schemas, document permissions, data-room behavior or new write endpoints changed.

Validation:
- `node --check` on `backend/src/services/nuxeraWorkspaceStateService.js`: passed.
- `node --check` on `backend/src/services/nuxeraWorkspaceStateService.test.js`: passed.
- `node --check` on `src/nuxera/applicant/workspaceStateAdapter.js`: passed.
- Targeted backend service test: passed, 1 file / 7 tests.
- Targeted frontend NUXERA test: passed, 1 file / 66 tests.

Remaining gaps:
- Controlled Supabase apply/RLS verification has not been executed.
- SQL drafts remain pending and unapplied to production.
- Browser/manual screenshot verification remains blocked in this environment.

Next recommended task after validation: run a broader frontend/backend test pass when time allows, or continue backend readiness around controlled Supabase/RLS evidence.
## NU-BE-READINESS-001 update - 2026-07-17

Added a read-only backend readiness preflight for NUXERA admin review.

Changed backend/frontend surface:
- Added `nuxeraBackendReadinessService` to check expected NUXERA table visibility as readiness signals.
- Added `GET /api/nuxera/admin/readiness` behind `nuxera:admin:read`.
- Missing/unavailable tables are returned as controlled `unavailable` signals instead of raw backend failures.
- Added `nuxeraBackendReadinessAPI` and `backendReadinessAdapter` on the frontend.
- Admin NUXERA console now displays backend readiness percentage, unavailable table count and per-table signals.
- Kept SQL drafts unapplied; no RLS policies, permission grants, schemas, document permissions, data-room behavior or new write endpoints changed.

Validation:
- `node --check` on backend readiness service/test, NUXERA routes/test and frontend readiness adapter: passed.
- Targeted backend tests: passed, 2 files / 19 tests.
- Targeted frontend NUXERA test: passed, 1 file / 68 tests.
- Backend full suite: passed, 41 files / 419 tests.
- Frontend full suite: passed, 9 files / 229 tests.

Remaining gaps:
- Controlled Supabase apply/RLS verification has not been executed.
- SQL drafts remain pending and unapplied to production.
- Browser/manual screenshot verification remains blocked in this environment.
- Backend readiness confirms table visibility only; it does not replace RLS checks with applicant/grantor/admin identities.

Next recommended task after validation: run broader frontend/backend test pass, then update Downloads handoff if requested or continue controlled Supabase/RLS evidence work when credentials are available.
## NU-ADM-BE-ACT-001 update - 2026-07-17

Connected backend readiness gaps to actionable admin follow-up.

Changed admin surface:
- Backend readiness now contributes a dedicated admin health signal.
- Each unavailable backend readiness signal creates a human-owned admin action queue item.
- Workspace state readiness gaps are prioritized as critical-path because they gate applicant checklist writes.
- Kept readiness actions informational; the console does not apply SQL, change RLS or execute backend mutations.

Validation:
- `node --check` on `src/nuxera/admin/backendReadinessAdapter.js`: passed.
- Targeted frontend NUXERA test: passed, 1 file / 69 tests.
- Frontend full suite: passed, 9 files / 230 tests.

Remaining gaps:
- Controlled Supabase apply/RLS verification has not been executed.
- SQL drafts remain pending and unapplied to production.
- Browser/manual screenshot verification remains blocked in this environment.

Next recommended task after validation: run full frontend test pass if time allows, or continue backend readiness/RLS evidence work.
## NU-ADM-BE-HANDOFF-001 update - 2026-07-17

Added a local backend readiness handoff package for admin review.

Changed admin surface:
- Backend readiness now builds `backendReadinessHandoff` with summary, unavailable tables, required capabilities, next actions and guardrails.
- Admin NUXERA console displays the handoff package next to backend readiness signals.
- Handoff remains local/informational; it does not export files, apply SQL, change RLS or execute admin actions.

Validation:
- `node --check` on `src/nuxera/admin/backendReadinessAdapter.js`: passed.
- Targeted frontend NUXERA test: passed, 1 file / 69 tests.
- Frontend full suite: passed, 9 files / 230 tests.

Remaining gaps:
- Controlled Supabase apply/RLS verification has not been executed.
- SQL drafts remain pending and unapplied to production.
- Browser/manual screenshot verification remains blocked in this environment.
- Handoff package is displayed in-app but not yet written to Downloads as a portable artifact.

Next recommended task after validation: run full frontend test pass, then update Downloads handoff if requested.
## NU-ADM-BE-AUDIT-001 update - 2026-07-17

Included backend readiness evidence in the local admin audit package.

Changed admin surface:
- Backend readiness now adds `backend-readiness` to the merged audit package scope.
- Audit package includes a backend readiness signal with readiness percentage and status.
- Backend readiness next actions are copied into audit package actions with a clear preflight prefix.
- Audit package remains local/read-only; it does not export files, apply SQL, change RLS or execute actions.

Validation:
- `node --check` on `src/nuxera/admin/backendReadinessAdapter.js`: passed.
- Targeted frontend NUXERA test: passed, 1 file / 69 tests.
- Frontend full suite: passed, 9 files / 230 tests.

Remaining gaps:
- Controlled Supabase apply/RLS verification has not been executed.
- SQL drafts remain pending and unapplied to production.
- Browser/manual screenshot verification remains blocked in this environment.

Next recommended task after validation: run full frontend suite, then continue portable handoff/export work when requested.
## NU-ADM-RLS-MATRIX-001 update - 2026-07-17

Added a local RLS verification matrix to the NUXERA admin console.

Changed admin surface:
- Backend readiness now derives `rlsVerificationMatrix` with applicant owner, different applicant, authorized grantor and admin/internal scenarios.
- Each scenario lists required reads/writes, required denials and blockers from backend readiness signals.
- Admin console displays RLS scenario count and blocked scenario count next to backend readiness handoff.
- Matrix remains local/read-only; it does not run Supabase queries, apply SQL, change RLS or execute permissions.

Validation:
- `node --check` on `src/nuxera/admin/backendReadinessAdapter.js`: passed.
- Targeted frontend NUXERA test: passed, 1 file / 69 tests.
- Frontend full suite: passed, 9 files / 230 tests.

Remaining gaps:
- Controlled Supabase apply/RLS verification has not been executed.
- SQL drafts remain pending and unapplied to production.
- Browser/manual screenshot verification remains blocked in this environment.

Next recommended task after validation: run full frontend suite, then continue controlled Supabase/RLS evidence work or portable handoff updates.
## NU-ADM-RLS-MATRIX-002 update - 2026-07-17

Finalized the local RLS verification matrix as an admin-visible readiness artifact.

Changed admin surface:
- Backend readiness now derives four controlled-identity RLS scenarios: applicant owner, different applicant, authorized grantor and admin/internal.
- Each scenario carries expected reads, writes, denials and readiness blockers.
- Admin console displays the matrix next to backend readiness handoff, with scenario and blocked counts.
- Merged admin audit package now includes RLS matrix scope, signal and blocked-scenario actions.
- Matrix remains local/read-only and does not run Supabase queries, apply SQL, change RLS or mutate permissions.

Validation:
- `node --check` on `src/nuxera/admin/backendReadinessAdapter.js`: passed.
- Targeted frontend NUXERA test: passed, 1 file / 69 tests.
- Frontend full suite: passed, 9 files / 230 tests.

Remaining gaps:
- Controlled Supabase apply/RLS verification has not been executed.
- SQL drafts remain pending and unapplied to production.
- Browser/manual screenshot verification remains blocked in this environment.
- Downloads handoff must be updated after this commit.

Next recommended task after validation: update Downloads handoff, then continue with controlled Supabase/RLS evidence when credentials are available.
## NU-DB-RLS-ENDPOINT-VERIFY-001 - Controlled RLS/endpoint verification plan guard

Added a local backend guard for the next controlled Supabase verification step.

Changes made:
- Added `backend/scripts/check-nuxera-controlled-verification-plan.js`.
- Added backend script alias `check:nuxera-verification-plan`.
- Guard verifies readiness checklist coverage, pending SQL drafts, backend readiness service and admin adapter evidence for the RLS/endpoint verification pass.
- Updated SQL/RLS readiness checklist with `GET /api/nuxera/admin/readiness` as a required endpoint check.
- Updated migration and QA matrices to include the controlled verification-plan guard.

Validation:
- `node --check backend/scripts/check-nuxera-controlled-verification-plan.js` passed.
- Direct guard execution from `backend/` passed after checklist/service evidence alignment.

Guardrails:
- No SQL was applied.
- No live RLS checks were executed.
- No production writes, document grants, data-room permissions or admin mutations were enabled.

Next recommended task after validation: run `npm run check:nuxera-verification-plan` together with `npm run check:nuxera-sql` in a Supabase-capable environment, then apply drafts only to a controlled non-production Supabase project and record RLS/endpoint evidence for the four identities.

## NUXERA controlled evidence template

Added a reusable controlled-run evidence template for the next Supabase/RLS verification step.

Changes made:
- Added `docs/nuxera-migration/docs/migration/NUXERA_CONTROLLED_RLS_ENDPOINT_EVIDENCE_TEMPLATE.md`.
- Extended `backend/scripts/check-nuxera-controlled-verification-plan.js` so the guard fails if the evidence template is missing required identities, endpoints, no-go criteria, rollback rehearsal evidence or decision fields.
- Updated `NU-DB-RLS-ENDPOINT-VERIFY-001` and QA acceptance guidance to require the template before production decisions.

Validation:
- Direct controlled verification-plan guard execution from `backend/` passed.
- Existing consolidated SQL draft guard still passed.

Guardrails:
- No SQL was applied.
- No live RLS checks were executed.
- No production writes, data-room grants, document permissions or admin mutations were enabled.

Next recommended task after validation: use the template in a controlled non-production Supabase run, attach the completed evidence to the handoff, and only then decide whether applicant checklist writes can move beyond local fallback.

## NUXERA admin controlled evidence package surface

Promoted the controlled RLS/endpoint evidence plan from docs/guardrail into the admin console model and UI.

Changes made:
- Extended `src/nuxera/admin/backendReadinessAdapter.js` with `controlledVerificationPackage`.
- Package includes required identities, endpoint checks, denied checks, no-go criteria, rollback checks, template path and guardrails.
- Merged the package into the admin audit package under `controlled-rls-endpoint-evidence` with a `controlled-verification-package` signal and human next actions.
- Rendered a new admin section in `src/nuxera/pages/NuxeraHome.jsx` named `Paquete RLS/endpoints`.
- Extended `src/nuxera/styles/shell.css` so the new panel follows existing admin backend-control layout.
- Updated frontend NUXERA tests for the package, endpoint list, template link, summary counters and audit package integration.

Validation:
- `node --check src/nuxera/admin/backendReadinessAdapter.js` passed.
- Targeted frontend NUXERA suite passed: 1 file / 69 tests.
- Initial in-sandbox Vitest run still hit known `spawn EPERM`; rerun outside sandbox passed.

Guardrails:
- No SQL was applied.
- No live endpoint calls were executed.
- No production writes, permission changes, document grants or data-room mutations were enabled.
- The UI panel is a verification/evidence surface only.

Next recommended task after validation: use this admin package with the controlled evidence template in a non-production Supabase run, then attach observed RLS/endpoint results before any production write decision.

## NUXERA controlled evidence operational signals

Connected the admin controlled RLS/endpoint evidence package to operational observability.

Changes made:
- Added `controlled-verification-evidence` admin health signal in `backendReadinessAdapter`.
- Added action queue items for evidence-template completion, denied-path evidence and rollback rehearsal.
- Kept all actions human-review-only with guardrails that prevent endpoint execution, SQL application or permission mutation.
- Extended frontend NUXERA tests to assert the health signal, controlled-verification actions and action source.

Validation:
- `node --check src/nuxera/admin/backendReadinessAdapter.js` passed.
- Targeted frontend NUXERA suite passed: 1 file / 69 tests.

Guardrails:
- No live endpoint calls were executed.
- No SQL was applied.
- No writes, data-room grants, document permissions or admin mutations were enabled.

Next recommended task after validation: run the complete frontend suite, then use the action queue as the admin checklist for a controlled Supabase RLS/endpoint verification run.

## NUXERA controlled verification backend contract

Promoted the controlled RLS/endpoint verification package into a protected read-only backend contract while preserving the local admin fallback.

Changes made:
- Added `nuxeraControlledVerificationService` with required identities, endpoint checks, denied checks, no-go criteria, rollback checks and evidence-template metadata.
- Added `GET /api/nuxera/admin/verification-plan` behind `nuxera:admin:read`.
- Added frontend API and `useControlledVerificationPlan` adapter support so the admin console can consume the backend plan without enabling endpoint execution.
- Kept `mergeBackendReadinessWithConsole` compatible with local packages and remote read-only plans.
- Added backend and frontend tests for route permissions, plan shape, remote normalization and admin-console merge behavior.

Validation:
- Backend targeted route/service tests passed: 2 files / 19 tests.
- Backend full suite passed: 42 files / 422 tests.
- Frontend targeted NUXERA suite passed: 1 file / 70 tests.
- Frontend full suite passed: 9 files / 231 tests.

Guardrails:
- No SQL was applied.
- No live endpoint or RLS checks were executed.
- No production writes, permission changes, document grants or data-room mutations were enabled.

Next recommended task after validation: use the endpoint and evidence template in a controlled non-production Supabase verification pass, then attach observed RLS/endpoint results before any production write decision.
## NUXERA controlled evidence scaffold

Added a generated evidence scaffold to turn the verification plan into an operator-ready Markdown package before the controlled Supabase run.

Changes made:
- Added backend `nuxeraControlledEvidenceScaffoldService`.
- Added protected read-only endpoint `GET /api/nuxera/admin/verification-evidence-scaffold`.
- Added backend CLI alias `scaffold:nuxera-evidence`.
- Added frontend API, normalizer, hook and admin panel for scaffold readiness.
- Added tests for scaffold service output, route permissions and frontend normalization.

Validation:
- Scaffold CLI JSON generation passed.
- Backend targeted route/service tests passed: 3 files / 23 tests.
- Backend full suite passed: 43 files / 426 tests.
- Frontend targeted NUXERA suite passed: 1 file / 71 tests.
- Frontend full suite passed: 9 files / 232 tests.

Guardrails:
- No live endpoint calls were executed.
- No SQL was applied.
- No writes, RLS changes, permissions, document grants or data-room mutations were enabled.

Next recommended task after validation: generate the scaffold with the actual controlled-run metadata, run the non-production Supabase verification, and paste observed evidence into the scaffold before any production write decision.
## NUXERA controlled verification runbook

Added a read-only runbook layer above the evidence scaffold so operators can see whether the controlled non-production Supabase run is ready to start.

Changes made:
- Added backend `nuxeraControlledRunbookService`.
- Added protected endpoint `GET /api/nuxera/admin/verification-runbook`.
- Added frontend API, normalizer, hook and admin panel for runbook readiness.
- Runbook exposes missing metadata, commands, operator steps, acceptance gates, next decision and guardrails.
- Added backend/frontend tests for blocked and ready runbook states.

Validation:
- Backend targeted route/service tests passed: 3 files / 26 tests.
- Backend full suite passed: 44 files / 430 tests.
- Frontend targeted NUXERA suite passed: 1 file / 72 tests.
- Frontend full suite passed: 9 files / 233 tests.

Guardrails:
- No live endpoint calls were executed.
- No SQL was applied.
- No writes, RLS changes, permissions, document grants or data-room mutations were enabled.

Next recommended task after validation: fill controlled-run metadata, generate the scaffold, and use the runbook gates during the non-production Supabase verification pass.
## NUXERA controlled evidence review

Added a read-only review layer for completed controlled-run Markdown evidence before any human approval or production write decision.

Changes made:
- Added backend `nuxeraControlledEvidenceReviewService`.
- Added protected endpoint `POST /api/nuxera/admin/verification-evidence-review`.
- Added backend CLI alias `review:nuxera-evidence`.
- Added frontend API, normalizer, optional hook and admin panel for evidence review status.
- Review detects missing sections, TODO markers, missing decisions and no-go/fail indicators.
- Added backend/frontend tests for missing, incomplete, no-go and ready states.

Validation:
- Empty evidence CLI review blocked as expected.
- Backend targeted route/service tests passed: 3 files / 30 tests.
- Backend full suite passed: 45 files / 436 tests.
- Frontend targeted NUXERA suite passed: 1 file / 73 tests.
- Frontend full suite passed: 9 files / 234 tests.

Guardrails:
- No live endpoint calls were executed.
- No SQL was applied.
- No submitted Markdown is persisted by the review endpoint.
- No writes, RLS changes, permissions, document grants or data-room mutations were enabled.

Next recommended task after validation: run review against a completed controlled-run evidence Markdown file and only route clean evidence to human approval review.
## NUXERA controlled approval package

Added a read-only approval package layer after evidence review so clean evidence can be routed to human release decision without enabling writes automatically.

Changes made:
- Added backend `nuxeraControlledApprovalPackageService`.
- Added protected endpoint `POST /api/nuxera/admin/verification-approval-package`.
- Added backend CLI alias `approval:nuxera-evidence`.
- Added frontend API, normalizer, optional hook and admin panel for approval package state.
- Approval package requires ready evidence review, approver, approval date, approval scope, evidence hash and explicit decision.
- Added backend/frontend tests for blocked and ready states.

Validation:
- Empty approval CLI package blocked as expected.
- Backend targeted route/service tests passed: 3 files / 33 tests.
- Backend full suite passed: 46 files / 441 tests.
- Frontend targeted NUXERA suite passed: 1 file / 74 tests.
- Frontend full suite passed: 9 files / 235 tests.

Guardrails:
- No live endpoint calls were executed.
- No SQL was applied.
- No approvals are persisted by the endpoint.
- No writes, RLS changes, permissions, document grants or data-room mutations were enabled.

Next recommended task after validation: use approval package only after clean evidence review and human release decision; production writes still require separate change control.
## NUXERA controlled write gate

Added a final read-only gate that combines backend readiness, approval package, requested environment and change-control ticket before any controlled write change request.

Changes made:
- Added backend `nuxeraControlledWriteGateService`.
- Added protected endpoint `POST /api/nuxera/admin/verification-write-gate`.
- Added backend CLI alias `gate:nuxera-write`.
- Added frontend API, normalizer, optional hook and admin panel for write gate state.
- Write gate requires backend readiness, ready approval package, requested environment and change ticket.
- Added backend/frontend tests for blocked and ready states.

Validation:
- Syntax checks passed for write gate service, route, backend adapter, route tests, service tests and CLI script.
- Empty write gate CLI blocked as expected.
- Backend targeted route/service tests passed: 3 files / 34 tests.
- Backend full suite passed: 47 files / 446 tests.
- Frontend targeted NUXERA suite passed: 1 file / 75 tests.
- Frontend full suite passed: 9 files / 236 tests.

Guardrails:
- No live endpoint calls were executed.
- No SQL was applied.
- No approvals or change tickets are persisted by the endpoint.
- No writes, RLS changes, permissions, document grants or data-room mutations were enabled.

Next recommended task after validation: use the gate only to prepare a separate controlled change request; write enablement remains a separate reviewed deploy/change-control action.
## NUXERA controlled change request

Added a read-only change request package after the write gate so a ready write gate can be routed into separate deploy/change-control review without enabling writes.

Changes made:
- Added backend `nuxeraControlledChangeRequestService`.
- Added protected endpoint `POST /api/nuxera/admin/verification-change-request`.
- Added backend CLI alias `request:nuxera-change` with JSON/Markdown output.
- Added frontend API, normalizer, optional hook and admin panel for change request package state.
- Change request requires ready write gate, deployment window, rollback owner and release reviewer.
- Added backend/frontend tests for blocked and ready states.

Validation:
- Syntax checks passed for change request service, route, backend adapter, route tests, service tests and CLI script.
- Empty change request CLI blocked as expected.
- Backend targeted route/service tests passed: 3 files / 36 tests.
- Backend full suite passed: 48 files / 451 tests.
- Frontend targeted NUXERA suite passed: 1 file / 76 tests.
- Frontend full suite passed: 9 files / 237 tests.

Guardrails:
- No live endpoint calls were executed.
- No SQL was applied.
- No approvals, change tickets or deployment windows are persisted by the endpoint.
- No writes, RLS changes, permissions, document grants or data-room mutations were enabled.

Next recommended task after validation: submit change request packages only to separate change-control review; write enablement remains a separate reviewed deploy/change-control action.
## NUXERA controlled release dossier

Added a read-only release readiness dossier after the change request package so the full evidence/change-control chain can be reviewed without enabling writes.

Changes made:
- Added backend `nuxeraControlledReleaseDossierService`.
- Added protected endpoint `POST /api/nuxera/admin/verification-release-dossier`.
- Added backend CLI alias `dossier:nuxera-release` with JSON/Markdown output.
- Added frontend API, normalizer, optional hook and admin panel for release dossier state.
- Release dossier requires ready change request, dossier owner, dossier date and final reviewer.
- Added backend/frontend tests for blocked and ready states.

Validation:
- Syntax checks passed for release dossier service, route, backend adapter, route tests, service tests and CLI script.
- Empty release dossier CLI blocked as expected.
- Backend targeted route/service tests passed: 3 files / 38 tests.
- Backend full suite passed: 49 files / 456 tests.
- Frontend targeted NUXERA suite passed: 1 file / 77 tests.
- Frontend full suite passed: 9 files / 238 tests.

Guardrails:
- No live endpoint calls were executed.
- No SQL was applied.
- No approvals, change tickets, deployment windows or dossier metadata are persisted by the endpoint.
- No writes, RLS changes, permissions, document grants or data-room mutations were enabled.

Next recommended task after validation: use the dossier only for final release-readiness review; deployment and write enablement remain separate reviewed change-control actions.
## NUXERA controlled continuation pack

Added a read-only continuation pack to close the current workday and make the migration resumable by Codex or Claude without relying on app chat history.

Changes made:
- Added backend `nuxeraControlledContinuationPackService`.
- Added protected endpoint `GET /api/nuxera/admin/verification-continuation-pack`.
- Added backend CLI alias `pack:nuxera-continuation` with JSON/Markdown output.
- Added frontend API, normalizer, hook and admin `Continuation pack` panel.
- Added night handoff Markdown: `NUXERA_NIGHT_CONTINUATION_HANDOFF_2026-07-17.md`.
- Added backend/frontend tests for route and normalizer coverage.

Validation:
- Syntax checks passed for continuation pack service, route, backend route tests, backend adapter, frontend NUXERA tests and CLI script.
- Continuation pack CLI JSON generation passed.
- Backend targeted route/service tests passed: 2 files / 36 tests.
- Backend full suite passed: 50 files / 460 tests.
- Frontend targeted NUXERA suite passed: 1 file / 78 tests.
- Frontend full suite passed: 9 files / 239 tests.

Guardrails:
- No live endpoint calls were executed.
- No SQL was applied.
- No handoff metadata is persisted by the endpoint.
- No writes, RLS changes, permissions, document grants or data-room mutations were enabled.

Next recommended task after validation: run the first real controlled non-production Supabase verification pass and feed observed evidence back into the read-only chain.

## NUXERA controlled run metadata hardening

The recovered `66769b9` continuation was validated locally before attempting the first controlled Supabase run.

- Verification-plan, SQL-draft and workspace-state SQL guards passed.
- The evidence scaffold was generated for commit `66769b9` with prior known-good commit `3ac37a4`.
- The runbook now rejects provisional metadata such as pending, TBD, unknown and unassigned values.
- Production/prod environments are rejected; the target must explicitly identify a non-production environment.
- No SQL, RLS, endpoint, permission, document-grant, data-room or production write action was executed.

Next recommended task: assign the isolated Supabase project, operator, reviewer, rollback owner and four controlled identities, regenerate the scaffold with real metadata, then execute the non-production evidence run.

## NUXERA recovered environment validation

Dependencies were installed locally with an isolated npm cache and the recovered workspace passed its current code validation gates.

- Controlled-runbook focused suite: 1 file / 3 tests passed.
- Backend full suite: 50 files / 461 tests passed.
- Frontend full suite: 9 files / 239 tests passed.
- Frontend lint passed with zero warnings.
- Frontend production build passed; existing large-chunk warnings remain non-blocking.
- RBAC matrix passed.
- Evidence review, approval package, write gate, change request and release dossier all blocked as designed without observed Supabase evidence and human metadata.
- Continuation pack generation passed from `66769b9`.

Legacy predeploy/go-no-go remains blocked by missing environment credentials and historical SQL/page artifacts outside this NUXERA change. No placeholder credentials or files were created to bypass those checks.

## Admin console crash fix - 2026-07-18

The manual browser verification deferred by every prior handoff (blocked by `spawn EPERM` in the office/Codex sandbox) was finally run with real Chrome on the home machine. Applicant and grantor NUXERA views loaded cleanly, but the admin NUXERA console crashed to a blank screen on every load.

Root cause:
- `LOCAL_BACKEND_READINESS_STATE` (the local fallback used before the backend readiness endpoint resolves, and whenever it fails) ships signal objects without a `requiredFor` field.
- `buildBackendReadinessHandoff` in `src/nuxera/admin/backendReadinessAdapter.js` copied `signal.requiredFor` into `unavailableTables` unnormalized.
- `AdminOperationsHome` in `src/nuxera/pages/NuxeraHome.jsx` calls `item.requiredFor.join(", ")` on each `unavailableTables` row, which threw `TypeError: Cannot read properties of undefined (reading 'join')` with no error boundary above it, so the whole admin route went blank.
- This reproduced on every admin NUXERA load in this environment because the backend server was not running, so the readiness fetch always fell back to the broken local shape; it would also hit the same crash on first paint before any fetch resolves, backend up or not.

Fix:
- `buildBackendReadinessHandoff` now wraps `signal.requiredFor` in the existing `asArray()` helper before returning it, matching the safety already used in `normalizeSignal`.
- Added a regression test in `src/tests/nuxeraExperience.test.js` ("keeps backend readiness handoff safe when signals arrive without requiredFor (local fallback shape)") that exercises the exact local-fallback signal shape and asserts `.join()` does not throw.
- Also closed a real gap noted in the 07-18 handoff's brand-toggle claim: `document.title` was still hardcoded to the NEXUS legal name in `index.html` and never updated at runtime. Added a `useEffect` in `src/App.jsx` that sets `document.title` from `BRAND.legalName`, verified in Chrome with the flag both on (NUXERA) and off (NEXUS).

Validation:
- Manual Chrome verification: applicant, grantor and admin NUXERA views all load without console errors or exceptions, flag on and off, `VITE_NUXERA_EXPERIENCE_ENABLED` toggled via dev server env (not committed to `.env`).
- Frontend full suite: 9 files / 240 tests passed (239 previous + 1 new regression test).
- Frontend lint: passed with zero warnings.
- Frontend production build: passed; existing large-chunk warning remains non-blocking.

Guardrails:
- No SQL, backend routes, permissions, or Supabase state touched.
- No production `.env` values changed; the flag was only enabled via a local dev-server environment override to verify visually.

Next recommended task: still blocked on a real non-production Supabase project — `backend/.env` currently points at a `placeholder-local-smoke-test.supabase.co` host that does not resolve, so `npm run check:supabase` fails with `fetch failed` for every table. The controlled RLS/endpoint verification pass cannot start until real non-production Supabase credentials are provided.

## Route sweep and scope finding - 2026-07-18

With the admin crash fixed, every NUXERA route was walked in Chrome for all three roles (applicant: home/finance/intelligence/markets/strategy/followup; grantor: home/queue/finance/intelligence/markets/strategy; admin: home/operations/security/ai/system/finance/intelligence/markets/strategy). No further crashes or console exceptions found; only expected `Network Error` noise from legacy components calling a backend that is not running in this dev session.

Scope finding (not a regression, not fixed): the entire NUXERA guided workspace (`src/nuxera/pages/NuxeraHome.jsx` and the Finance/Markets/Strategy/Intelligence adapters) is hardcoded Spanish text with no `useTranslation`/`t()` calls. Switching the site language to English has zero effect inside `/dashboard/nuxera/*` — it only affects the legacy dashboard and the public site (which do use i18next and were verified working correctly in English, including the four new public pages). This has been true since the shell was first built on 2026-07-16 and was never claimed otherwise in any handoff; flagging it now because an English-speaking demo of the new NUXERA workspace would look untranslated today.

## First controlled Supabase application - 2026-07-18

The user provided direct links to the actual Supabase org/project, GitHub repo and Vercel deployment. Inspecting the Supabase dashboard showed only one project exists in the org (`ulitron34-code's ProjectNSD IF`, ref `iafwnrootbtlsdqfioiu`), explicitly labeled `main` / **PRODUCTION** in the dashboard chrome — there is no separate non-production project. This was flagged to the user before touching anything; the user explicitly chose to apply the three additive NUXERA tables directly to this production project rather than provision a separate non-prod project first.

What was done:
- Retrieved the real `SUPABASE_URL`, legacy `anon` key and `service_role` key from the Supabase dashboard (Project Settings → API Keys → Legacy anon/service_role) and wrote them into `backend/.env` (gitignored, confirmed with `git check-ignore` before writing).
- Ran `npm run check:supabase` first to confirm connectivity and that all 12 existing production tables were reachable and unaffected — baseline was green before any change.
- Ran `npm run check:nuxera-sql` to reconfirm the three draft migrations are additive, RLS-gated and free of destructive operations.
- Applied the three SQL drafts directly in the Supabase SQL Editor, in dependency order: `2026-07-16_nuxera_workspace_states.sql`, then `2026-07-17_nuxera_evidence_links.sql` (has an FK to workspace_states), then `2026-07-17_nuxera_admin_controls.sql`. Each ran with "Success. No rows returned".
- Verified the result with a direct `pg_class`/`pg_policies` query: all three tables exist with `relrowsecurity = true`, and policy counts match the source files exactly (`nuxera_workspace_states`: 3 policies, `nuxera_evidence_links`: 1, `nuxera_admin_controls`: 1).
- Started the local backend (`npm run dev` in `backend/`) against the real credentials; it boots cleanly.

Known gap, not chased further: the frontend backend-readiness panel in the admin NUXERA console still shows all three tables as `unverified`/local-fallback when checked in the browser. This is expected, not a bug — the frontend dev server's `VITE_API_URL` points at the deployed Render backend (`codex-backendnsd.onrender.com`), not the local backend just started, and the NUXERA readiness endpoint requires a real authenticated admin session (`nuxera:admin:read`), which the localStorage demo-role flags used for UI verification do not provide. The tables' existence and RLS were confirmed directly at the database level instead; live end-to-end readiness through the deployed backend has not been checked.

What was explicitly NOT done:
- No existing production table, column, row or policy was modified — only new, additive `CREATE TABLE IF NOT EXISTS` objects.
- No commit, no push to `https://github.com/ulitron34-code/NSD`, no Vercel deployment.
- No production `.env` on Render/Vercel was touched — only this machine's local `backend/.env`.
- `VITE_NUXERA_EXPERIENCE_ENABLED` remains `false`; none of this is visible to real users yet.

Next recommended task: decide whether to point a local/staging frontend at the local backend with a real authenticated admin login to verify the readiness panel end-to-end, or move straight to filling real controlled-run metadata (operator, reviewer, rollback owner, isolated identities) into the evidence scaffold now that the backend tables it depends on actually exist.

## Real applicant-to-grantor integration block - 2026-07-18

Implemented the first large product-completion block from the Spanish NUXERA master restructuring plan, focused on phases 5 and 6 without changing backend contracts.

- Applicant real sessions now expose the latest real order identity and derive displayed readiness from the real project adapter.
- Applicant and grantor real evidence ledgers no longer merge persisted/failed remote state with demo evidence.
- Grantor real sessions now map `GET /otorgante/pipeline` into the NUXERA case queue.
- Real pipeline scoring, document count, share status, interest and contact state flow into queue prioritization.
- Workbench, authorized document summary and non-binding memo accept the real queue and stay bound to the same selected order.
- Demo queues and evidence remain available only for demo sessions.
- Legacy/current experiences and API contracts remain unchanged.

Validation for this block:
- Targeted NUXERA suite passed: 1 file / 82 tests before final full-suite closure.
- Frontend lint passed.
- Frontend production build passed.

Remaining acceptance gap:
- Exercise the grantor pipeline and `grantor-evidence` endpoint through HTTP with a real authenticated grantor and accepted `data_room_shares` row.

## Authenticated admin operational snapshot - 2026-07-18

Continued the large phases 5-7 completion block by connecting the NUXERA admin home to existing protected backend contracts.

- Added `operationalSnapshotAdapter` with parallel read-only requests for users, global audit logs, human-review queue and readiness metrics.
- Every source remains protected by the existing backend `requireAdmin` middleware.
- Partial endpoint failures are reported by source; the adapter never substitutes demo users, audit events or reviews.
- Added an authenticated-operation panel to the NUXERA admin home with aggregate counts and recent audit events.
- No role update, source mutation, rubric mutation or production write was added.
- Added tests for mixed real/failed sources and complete remote unavailability.

Validation:
- Targeted NUXERA suite: 1 file / 84 tests passed.
- Frontend lint passed.
- Frontend production build passed.

Remaining admin gaps:
- Verify all four protected sources through HTTP with a real administrator session.
- Add focused pages for user/permission management, human-review operations and audit filtering instead of only the home snapshot.
- Replace remaining static health/incident narrative where a real telemetry contract exists.

## Explicit real-order selection - 2026-07-18

- Added stable selected-order state to applicant and grantor data hooks.
- Applicant users with multiple real orders can select the expediente that drives project, readiness, checklist and evidence panels.
- Grantor users can select any authorized pipeline case; workbench, document summary, memo and evidence stay bound to that same order.
- Invalid or removed selections fall back safely to the first currently authorized record.
- Demo users remain on isolated local fixtures.

## Phase 7 operational modules and selector regression fix - 2026-07-18

- Corrected the applicant order selector placement so it renders only inside the applicant workspace, not the admin console.
- Expanded the protected admin snapshot into grouped real-data modules for users/roles, human review, readiness metrics and global audit activity.
- Human-review items now expose deterministic priority from the backend score without mutating review state.
- Readiness metrics use the exact backend contract (`avgGlobalScore`, costs, document gaps, illegibility and downloads).
- Empty and partial remote states remain explicit and never receive demo replacements.

Validation:
- Frontend: 9 files / 247 tests passed.
- Backend: 50 files / 469 tests passed.
- Go/no-go local: 22/22 checks in GO.
- ESLint, production build and `git diff --check` passed.

## Phases 16-17 administration, E2E and controlled rollout - 2026-07-18

- Split the NUXERA administrator workspace into operations, security, AI and system routes backed by existing protected modules.
- Fixed authenticated-role preservation so the demo profile selector cannot override a real administrator or grantor session.
- Added current public, applicant, grantor and administrator Chromium journeys; the complete Chromium suite passes 34/34.
- Added Chromium E2E to local go/no-go and predeploy checks.
- Added a credential-safe GET-only HTTP readiness harness for applicant, grantor and administrator preview verification.
- Published the deployment/HTTP runbook and a conservative weighted restructuring assessment of 90%.

Validation:
- Frontend: 9 files / 259 tests passed.
- Backend: 50 files / 469 tests passed.
- Chromium E2E: 34/34 passed.
- Go/no-go local: 25/25 checks in GO.
- ESLint, production build, HTTP plan and `git diff --check` passed.

## Final local hardening audit - 2026-07-18

- Completed the responsive NUXERA workspace header with breadcrumbs, language control, help, profile identity and guarded-agent status.
- Replaced the static mobile sidebar with an accessible menu using `aria-expanded`, keyboard activation, backdrop close and route-close behavior.
- Lazy-loaded the complete NUXERA workspace away from the legacy dashboard bundle.
- Reduced the NUXERA chunk to approximately 169 kB and the legacy dashboard chunk to approximately 410 kB, eliminating the build warning above 500 kB.
- Expanded Chromium E2E to 35/35, including mobile keyboard navigation and language switching.
- Final assessment: 96% local restructuring/release preparation and 93% complete master-plan fulfillment; remaining work requires controlled external acceptance.

## Phase 8 real-expedient Finance journey - 2026-07-18

- Replaced fixed applicant/grantor Finance percentages with a journey derived from the selected real order or authorized pipeline entry.
- Finance now exposes project identity, score/readiness, visible document count and current risk without inventing missing scoring data.
- Added a shared selected-expedient event store so Home, Finance and reused legacy modules stay synchronized in the same browser session.
- Applicant and grantor Finance selectors only expose orders already returned by their role-protected APIs.
- Demo sessions retain the isolated local Finance journey.

Validation:
- Frontend: 9 files / 250 tests passed.
- Backend: 50 files / 469 tests passed.
- Go/no-go local: 22/22 checks in GO.
- ESLint, production build and `git diff --check` passed.

## Godzilla block: phases 9-11 shared real-expedient context - 2026-07-18

- Added one role-aware `NuxeraExpedientProvider` for Finance, Intelligence, Markets and Strategy.
- Applicant engines receive only owner orders; grantor engines receive only entries returned by the authorized pipeline API.
- Intelligence binds subject, findings and draft report identity to the selected real expediente.
- Markets adds expediente-specific risk context while preserving the unlicensed/delayed provider gate and never claiming realtime data.
- Strategy derives its recommendation from selected case risk and score, preserves human review and emits a non-binding contextual audit state.
- All four engine selectors now update one shared browser-session selection without duplicate engine-level API loads.
- Demo sessions remain isolated on local models.

Validation:
- Frontend: 9 files / 254 tests passed.
- Backend: 50 files / 469 tests passed.
- Go/no-go local: 22/22 checks in GO.
- ESLint, production build and `git diff --check` passed.

## Phases 12-14 secure orchestration foundation - 2026-07-18

- Added an auditable 11-agent orchestration plan matching the rector plan agent catalog.
- Every agent records objective, input, output, sources, model state, version, estimated cost/time, confidence, error, human-review requirement and trace id.
- Added a role/source/selection access envelope that blocks demo, mismatched orders and grantor contexts not produced by the authorized pipeline.
- Document, score, risk and delayed-market evidence are summarized without opening files or extending data-room access.
- Missing documents or scoring gate dependent agents instead of fabricating outputs.
- Mounted the read-only orchestration and security guardrails inside Strategy; no agent execution or persistence was enabled.

Validation:
- Frontend: 9 files / 258 tests passed.
- Backend: 50 files / 469 tests passed.
- Go/no-go local: 22/22 checks in GO.
- ESLint, production build and `git diff --check` passed.

## Phase 15 public identity and deploy gate - 2026-07-18

- Updated static HTML metadata and the Open Graph image from NEXUS/NSD visible identity to NUXERA Financial Intelligence.
- Removed the environment-specific Vercel hostname from static social metadata; OG assets now use deployment-relative paths.
- Added `check:nuxera-public-identity` to block reintroduction of legacy visible names in primary public metadata and social assets.
- Added the identity and public-page checks to predeploy and the local go/no-go matrix.
- Renamed go/no-go and predeploy console headings to NUXERA Financial Intelligence.

Validation:
- NUXERA public identity gate passed.
- Public routes/narrative gate passed.
- Frontend: 9 files / 258 tests passed.
- Backend rerun: 50 files / 469 tests passed after one transient Vitest worker exit.
- Go/no-go local: 23/23 checks in GO.
- ESLint, production build and `git diff --check` passed.

## Grantor-evidence HTTP endpoint gap closed - 2026-07-19

The one remaining technical gap from the 2026-07-18 controlled RLS/endpoint evidence run — `GET /api/nuxera/orders/:orderId/grantor-evidence` never called over real HTTP with a real session — was closed today, with explicit user authorization for the production writes involved.

**Why it was open:** the endpoint requires an accepted `data_room_shares` row linking a real otorgante (grantor) user to a real order. Checking production first: `SELECT profile_type, count(*) FROM users GROUP BY profile_type` returned only `solicitante` (35) and `administrador` (1) — **zero real otorgante accounts exist in production.** All existing `data_room_shares` rows point to demo/placeholder recipients (`analista@example.com`, synthetic `nsd.lender.*@gmail.com` addresses with no `recipient_user_id`), so none of them could be used to exercise the endpoint end-to-end either.

**What was done, with explicit authorization at each escalation:**
1. Created a real Supabase auth user for a real, operator-controlled address (`ulitron34+nuxera-otorgante-test@gmail.com`, a Gmail alias — no email actually sent; session obtained via `admin.generateLink` + `verifyOtp`, same no-password technique as 2026-07-18) and upserted a matching `users` row with `profile_type:'otorgante'`.
2. Inserted a real `data_room_shares` row (`status:'accepted'`, `recipient_user_id` set) linking that identity to real order `3e6a321f-6705-4ead-9f77-b6555e80f28f` (a pre-existing test order, "Prueba institucional Codex", owned by the real admin account `f999b317-...ef8f2`/`ulitron34@gmail.com`).
3. Inserted a real `nuxera_evidence_links` row (`visibility:'authorized_grantor'`, `engine:'finance'`) on the same order.
4. Ran the backend locally against real production Supabase credentials and called the real endpoint three ways: authorized session -> `200` with the exact evidence link; unauthorized real solicitante session -> `403 PERMISSION_DENIED` (no row-existence leak); no token -> `401`.
5. Queried `audit_logs` for the full test window: **zero rows.** Finding: `GET grantor-evidence` calls `logAuditEvent` nowhere in its path, unlike the legacy `GET /shared-data-room/:token` (logs `shared_data_room_viewed` on every read) and the NUXERA write route (`PATCH .../state/checklist`, audited). Not fixed — flagged as an open design decision, not a blocker, since this is a read endpoint and the project's audit requirement is explicitly about writes.
6. Deleted all test artifacts via service role: the `nuxera_evidence_links` row, the `data_room_shares` row, the `users` row, and the auth user itself (`auth.admin.deleteUser`). Confirmed all four back to pre-test state. Nothing was kept behind because nothing auditable was generated by this read-only endpoint (see finding above) — this differs from the 2026-07-18 write-route test, where the `audit_logs` entry was deliberately preserved.
7. Stopped the local backend dev server; deleted all temporary scripts (`setup_grantor_test_tmp.mjs`, `test_grantor_evidence_tmp.mjs`, `cleanup_grantor_test_tmp.mjs`, state/result JSON files). `git status` confirmed a clean working tree afterward — none of this touched tracked files directly (the doc updates below are the only tracked changes).

Full evidence rows added to `NUXERA_CONTROLLED_RLS_ENDPOINT_EVIDENCE_TEMPLATE.md` and `NUXERA_SQL_RLS_READINESS_CHECKLIST.md`.

**Net effect:** all 4 RLS identities and all HTTP endpoints in the controlled evidence matrix are now PASS. The only thing left before enabling any NUXERA production write path is the user's formal go/no-go decision — already true before today, unchanged by this work — plus the newly-surfaced, non-blocking question of whether `grantor-evidence` reads should be audited like the legacy data-room view.

## Pre-cutover live metadata audit - 2026-07-22

Codex synchronized the local workspace to `4418d3a7` from the latest `F:\NUXERA` bundle and re-ran local validation in the office environment.

Verification performed:
- GitHub PR #3 is open, non-draft, mergeable, and points at head `4418d3a7726f4f418fbc90be93b4bc37049e3af1` on `nuxera-controlled-migration` over `main`.
- GitHub reports Vercel status checks for commit `4418d3a7` as success (`Vercel - nsd` and `Vercel - nsd-j28v`).
- Pull request has no unresolved review threads according to the GitHub connector.
- Direct public GET from this office shell to the Vercel Preview and Render PR backend was blocked by local proxy/refusal (`127.0.0.1:9`), so HTTP availability was not re-claimed from this machine.
- Local validation on the synchronized checkout passed: NUXERA public identity, public pages package, HTTP readiness plan, SQL draft guard, controlled verification plan, RBAC matrix, backend targeted tests (2 files / 51 tests), frontend NUXERA targeted tests (1 file / 104 tests), backend full suite (51 files / 484 tests), frontend full suite (9 files / 265 tests), and frontend production build.

Documentation cleanup:
- Updated current migration matrix/readiness notes that still described `grantor-evidence` or HTTP-level verification as pending even though later evidence closed those gaps.
- Production cutover remains explicitly not executed; merge to `main`, Vercel production flag flip, Render production health confirmation and live production verification still require explicit go-ahead.

## Grantor evidence read audit instrumentation - 2026-07-22

Closed the local design question around `GET /api/nuxera/orders/:orderId/grantor-evidence`: authorized reads now emit `logAuditEvent` with action `nuxera_grantor_evidence_read` after the service authorization/data-room checks return evidence successfully.

Implementation notes:
- Audit metadata records `workspaceRole:'grantor'`, requester email, returned link count and whether the response came from persisted evidence rows.
- Permission-denied/no-token attempts still stop before the route's evidence service and produce no grantor read audit event.
- The controlled verification plan now marks the authorized-grantor evidence endpoint as requiring audit evidence.

Validation scope: local route test coverage was updated to verify both sides of the behavior. This change is local until pushed to PR #3 and deployed; the historical 2026-07-19/20 deployed evidence remains accurate because that run observed zero audit rows before this instrumentation existed.

## Real notification outbox persistence, real otorgante information-requests join and controlled conversation runtime - 2026-07-22

Claude Code, on `C:\Users\ulitr\NSD`, closed several "código pendiente" items left open by the prior `dbb4389e` block (safe agent + rollout controls), after fast-forwarding this checkout from `4418d3a` to `dbb4389e`.

**1. Real notification outbox persistence (priority-1 gap from the 2026-07-22 continuity note).**
- `nuxeraNotificationOutboxService.js`: `enqueueNuxeraNotificationIntent` now checks for an existing active row (`preview`/`queued`/`sent`) by `dedupe_key` before inserting; a duplicate is rejected (`status:'suppressed'`) and audited as `nuxera_notification_duplicate_rejected` instead of creating a second row. Added `listNuxeraNotificationOutbox` (read-only, filterable by status/audience/orderId) and exported `isNuxeraNotificationDeliveryEnabled` for reuse.
- `nuxera.js`: added `POST /nuxera/admin/notification-outbox` (queues using the server-side `NUXERA_NOTIFICATION_DELIVERY_ENABLED` flag, never a client-supplied one) and `GET /nuxera/admin/notification-outbox` (list), both behind `nuxera:admin:read`.
- The send worker (`processNuxeraNotificationDeliveryBatch`) is unchanged and still always returns `delivery-worker-not-implemented`; persistence and delivery remain two separate gates as designed.
- Frontend: fixed a real pre-existing bug where `nuxeraNotificationOutboxAPI.dryRun` was called by `useNotificationDryRun` but never defined in `src/services/api.js` (would have thrown at runtime once the NUXERA flag and non-empty dry-run intents were both active). Added `dryRun`, `queue`, `list` client methods; added `useNotificationOutboxList` hook and wired a small "Outbox persistido" admin panel into `NuxeraHome.jsx`.

**2. Real `information_requests` join for the otorgante pipeline (priority-1 "sustituir datos demo" gap).**
- `backend/src/routes/otorgante.js`: `buildPipelineItem` now fetches real rows from `information_requests` by `order_id` (tolerates a missing table by returning `[]` rather than failing the whole pipeline) and returns them as `informationRequests`. Previously `infoRequests` for every real order was always empty because nothing ever populated `service_orders.metadata.infoRequests`.
- `src/data/otorgantePipeline.js`: `mapPipelineEntryToOpportunity` now prefers `entry.informationRequests` over the metadata fallback, so `caseQueue.js`'s existing "needs-information" priority and "Faltantes y requests" folder become real for authorized-pipeline sessions instead of always-empty.
- Added `backend/src/routes/otorgante.test.js` (did not previously exist) covering the permission gate and the new join.
- Scope note: `triage.sla`/`triage.owner` in `caseQueue.js` remain deliberately-static per-priority policy labels, not per-case timestamps/assignees — doing that for real would need new `service_orders`/assignment columns, which is a schema decision left for a dedicated task, not bundled into this one. Admin `operationsConsole.js` also still reads the demo case queue only; wiring an admin-wide (cross-grantor) real case view needs its own authorization-scoping decision and was left as a documented gap rather than rushed.

**3. Controlled conversation runtime (priority-2 "convertir chat preview en runtime real controlado").**
- `nuxeraConversationAgentReadinessService.js`: added `runNuxeraConversationTurn`, which reuses the existing envelope/authorization gate, then calls the real `generateJsonWithFallback` (from `aiJsonProvider.js`) with `dataRisk:'sensitive', anonymized:false` — meaning it can only ever reach Anthropic/OpenAI, never Kimi/DeepSeek/NVIDIA, by the same policy code already used for document review. Every attempt (success, provider failure, or output-guardrail block) is audited via `logAuditEvent` with metadata only (role, provider, model, message/answer **length**) — the actual message and answer text are never logged or persisted. A second output guardrail (`violatesConversationOutputGuardrails`) withholds and separately audits any provider response that reads like an approval, term sheet, permission grant, or promise to send a notification.
- `nuxera.js`: added `POST /nuxera/conversation/turn`. Unlike the existing `/preview` route, this one does **not** trust a client-supplied `authorized` boolean — it re-derives authorization server-side by actually calling `getOwnerEvidenceLinks`/`getAuthorizedGrantorEvidenceLinks` for the requester's real role and order, and only passes real evidence-link data through as the LLM's authorized context.
- Frontend: added `nuxeraConversationAgentAPI.turn`, plus `normalizeNuxeraConversationTurnResponse`/`sendNuxeraConversationTurn` in `conversationAgentBackendAdapter.js`. Deliberately did not wire an interactive chat-box UI component into `NuxeraHome.jsx` this session — the backend/client plumbing is real and tested, but a proper per-role chat UI is a UX task worth its own dedicated pass rather than a rushed widget bolted onto a dashboard page.

**4. Documentation.**
- Added `NUXERA_ENVIRONMENT_VARIABLES.md` (every real `NUXERA_*`/`VITE_NUXERA_*` var plus the AI provider keys they depend on, verified against the code, with what is *not* an app env var called out explicitly) and `NUXERA_AI_RISK_MATRIX.md` (per-provider allowed/blocked matrix and the "no agent may ever" list, grounded in the enforced policy code, not aspirational).
- Documented backend `.env.example` gaps that already existed (`OPENAI_API_KEY`, `KIMI_*`, `NVIDIA_API_KEY` were used by real code but never listed) and the two controlled rollout flags.

**Also fixed in passing (found while touching adjacent code, not part of any pending list):** two stale hardcoded `endpointRows` counts (`11`→`13`, `9`→`13`) in `nuxeraControlledEvidenceScaffoldService.test.js`/`nuxeraControlledRunbookService.test.js` that had drifted out of sync with `nuxeraControlledVerificationService.js` after the prior session added new endpoint rows; and a stale `"Grantor queue"` string assertion in `nuxeraExperience.test.js` left over from the `dbb4389e` grantor-inbox/desk rename.

Validation: backend full suite 55 files / 523 tests passed (Windows vitest worker pool is flaky under full parallelism in this environment — a bare `npx vitest run` occasionally reports a crashed worker fork unrelated to any test failure; `--no-file-parallelism` reproduces a clean 523/523 every time). Frontend: `nuxeraExperience.test.js` 113 tests passed, `eslint` clean on every touched file, `vite build` passed. `check:nuxera-sql`, `check:nuxera-verification-plan` and `check:rbac` all passed unchanged.

Explicitly not attempted, and why: production cutover/live verification with real identities (needs the user's go-ahead and real Supabase/Render access, not just code); an admin-wide real grantor case aggregation endpoint (needs an authorization-scoping decision); real SLA/assigned-reviewer columns (needs a schema decision); an interactive chat UI component (needs a dedicated UX pass); actually enabling either controlled-rollout flag or configuring provider keys in Render (operator action, not code).

## Chat UI per role, real admin-wide grantor pipeline, and SLA/assignment schema proposal - 2026-07-22 (continued)

The user reviewed the four items listed as "explicitly out of scope" above and authorized continuing ("tienes mi autorizacion, sigue"). Commit `c09a7cc` was pushed to `origin/nuxera-controlled-migration` first (the one action this session that needed a heads-up per `CLAUDE.md`; git push itself and PR #3 merge/production config remain the only things still requiring a notice before acting). Three of the four items were then closed with the same reasoning discipline as the rest of this file — real code where it was safe, a documented draft where it required a decision this session should not make unilaterally:

**Chat UI per role** (`src/nuxera/communications/ConversationChat.jsx`, new): a real, minimal chat widget wired to `POST /nuxera/conversation/turn` via `sendNuxeraConversationTurn`, mounted once each in `ApplicantMissionHome`, `GrantorQueueHome` and `AdminOperationsHome`. Sending is disabled for demo sessions and for applicant/grantor without a real selected order. While building this, found that `buildNuxeraConversationAgentEnvelope` required a `selectedId` for every role including admin, even though the admin channel's own readiness status already said `operations-monitor-ready-read-only` (no file access) rather than `requires-selected-authorized-file` — fixed the envelope so admin no longer needs a selected file, and tightened the `/conversation/turn` route to derive role strictly from `req.userRole` (never `req.body.role`) specifically for that route, since unlike `/conversation/preview` it makes a real billable LLM call and trusting a client-supplied role there would let any authenticated user claim the admin scope.

**Real admin-wide grantor pipeline**: added `GET /api/nuxera/admin/grantor-cases` (`backend/src/routes/otorgante.js`), which reuses the existing `buildPipelineItem` helper across every accepted/shared `data_room_shares` row instead of only the requester's own shares — deliberately not a new visibility tier, since `administrador` already has `['*']` permission over users/audit-logs/orders elsewhere. Frontend: `src/nuxera/admin/grantorCasesAdapter.js` (new) with `mergeGrantorCasesWithConsole`, which replaces `operationsConsole.js`'s demo-derived `grantorDocumentReadiness` with the real one when the pipeline is available, following the exact same non-cascading merge convention already used by `mergeAdminControlsWithConsole`/`mergeBackendReadinessWithConsole` (only the one slice is replaced; `auditPackage`/`adminHealthSignals` stay as originally computed, matching how those other merges already behave).

**SLA / assigned-reviewer**: `caseQueue.js`'s `triage.sla`/`triage.owner` remain static per-priority policy labels; making them real needs an actual schema decision (who can assign reviewers, what the real SLA policy is per tier), so instead of guessing, added a **draft-only** proposal: `backend/sql_migrations_pendientes/2026-07-22_nuxera_case_assignments.sql` (additive `nuxera_case_assignments` table, one open assignment per order via a partial unique index, owner/authorized-grantor read policies mirroring the existing evidence-links pattern, writes reserved for `service_role`), registered in `check-nuxera-sql-drafts.js`, and documented as proposal 5 in `NUXERA_PERSISTENCE_CONTRACTS.md`. No backend service, route or SQL application was added — this stays a proposal until the schema/product decision is made, consistent with how every other NUXERA table in this repo went through a draft stage before any service code touched it.

Validation: backend full suite 55 files / 528 tests passed (`--no-file-parallelism`); frontend `nuxeraExperience.test.js` 114 tests passed; `vite build`, `eslint` on every touched frontend file, `check:nuxera-sql`, `check:nuxera-verification-plan` and `check:rbac` all passed.

Still not attempted, unchanged from above: production cutover, enabling either rollout flag, or configuring provider keys in Render — these remain operator actions needing an explicit heads-up per `CLAUDE.md`, not something to do silently under a general "sigue."

Next recommended task: either build the per-role chat UI on top of `POST /nuxera/conversation/turn` now that the backend is real, or design the SQL/authorization contract for a real admin-wide case view to close the `operationsConsole.js` demo-data gap.

## Read-only case assignment integration - 2026-07-23

Commit scope: convert the `nuxera_case_assignments` draft from documentation-only into a read-only integration point without applying SQL or enabling writes. `backend/src/routes/otorgante.js` now attempts to read the latest `status='open'` assignment for each pipeline order from `nuxera_case_assignments`; if the table is missing, the pipeline continues with `assignment: null` instead of failing. The same shape is reused by `/otorgante/pipeline` and `/nuxera/admin/grantor-cases`, so grantor and admin surfaces stay aligned.

Frontend: `src/data/otorgantePipeline.js` preserves `entry.assignment`, and `src/nuxera/grantor/caseQueue.js` uses real `slaTier`, `slaDueAt`, reviewer role/id, reason and status when present. Without a real assignment row, the UI keeps the existing static policy labels (`24h`/`48h`/`7d`, `Analista senior`/`Relacion solicitante`/`Monitoreo`).

Guardrails: no SQL was applied; no assignment create/update/reassign route was added; no service-role write path was exposed. Tests added in `backend/src/routes/otorgante.test.js` and `src/tests/nuxeraExperience.test.js` cover the real-assignment read path and fallback behavior.
## Controlled case assignment queue endpoint - 2026-07-23

Added `POST /api/nuxera/admin/case-assignments` behind `nuxera:admin:update` and `NUXERA_CASE_ASSIGNMENT_WRITE_ENABLED`. Default mode is preview/no-write: it validates `orderId`, reviewer role, SLA tier and SLA due date, then returns the assignment intent without inserting a row. When the backend flag is explicitly enabled in a controlled environment, the route will mark the existing open assignment as `reassigned`, insert the new open assignment row, and record a metadata-only audit event. No SQL was applied and no production flag was enabled in this commit.
## Admin case assignment history and SLA observability - 2026-07-23

Added a read-only `GET /api/nuxera/admin/case-assignments` endpoint requiring `nuxera:admin:read`. It reads `nuxera_case_assignments` when the table exists, maps assignment rows to the frontend camelCase contract, calculates `slaStatus` (`on-track`, `due-soon`, `overdue`, closed/unset/invalid variants), and returns a summary (`total`, `open`, `reassigned`, `overdue`, `dueSoon`, `onTrack`). If the table is unavailable, the endpoint returns an empty unavailable history rather than breaking the admin console.

Frontend now calls the history endpoint from the NUXERA admin console and shows assignment history, open/total counts, overdue/due-soon/on-track SLA signals, table availability and latest assignment rows below the controlled preview form. The same block also aligned the frontend assignment form values with backend validation by allowing `grantor_analyst`, `grantor_senior`, `compliance_reviewer`, `risk_committee` plus the newer SLA tiers. No SQL was applied, no delivery automation was enabled, and no write flag was changed.
