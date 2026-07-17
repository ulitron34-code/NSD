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
Not green yet. The local checkout has no `node_modules` or `backend/node_modules`, and global `node`/`npm` are not on PATH. Bundled Node exists at `C:\Users\usalgado\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`, but npm is not available from that bundle path.

Required before NU-BASE-001 completion:
- Install frontend dependencies.
- Install backend dependencies.
- Run `npm run build`.
- Run `npm run lint`.
- Run `npm run test:run`.
- Run relevant E2E or document why unavailable.
- Run backend tests/checks where feasible.

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