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
