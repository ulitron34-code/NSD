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
