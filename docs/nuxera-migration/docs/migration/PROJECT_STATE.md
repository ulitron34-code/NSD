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
