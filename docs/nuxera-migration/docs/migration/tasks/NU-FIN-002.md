# NU-FIN-002 - Finance guided journey layer

## Objective
Start unifying the Finance experience beyond a raw adapter by adding role-aware progress, next action, alerts, goals and evidence links above the existing operational modules.

## Context
This task builds on `NU-FIN-ADAPTER-001`. The legacy/current modules still provide the operational surface, while NUXERA Finance begins to guide applicant, grantor and admin users with clearer next actions.

## Authorized scope
- Local Finance journey model.
- Finance adapter composition.
- Finance journey styling.
- Focused tests for role journeys and evidence links.
- Migration documentation updates.

## Prohibited changes
- Do not move or delete legacy Finance-related modules.
- Do not alter backend APIs, Supabase contracts or storage keys.
- Do not change role semantics.
- Do not persist journey state until a dedicated task is approved.

## Implemented work - 2026-07-16
- Added `src/nuxera/finance/financeJourney.js`.
- Updated `src/nuxera/adapters/FinanceWorkspaceAdapter.jsx` with guided next action, progress, goals, alerts and evidence links.
- Added Finance journey styles in `src/nuxera/styles/shell.css`.
- Extended `src/tests/nuxeraExperience.test.js` with Finance journey coverage.

## Validation
- Targeted NUXERA tests: passed, 27 checks.
- `pnpm run lint`: passed.
- `pnpm run build`: passed with bundled Node and elevated execution because Vite/Rolldown hits `spawn EPERM` inside the restricted sandbox.
- `pnpm run test:run`: passed, 9 files and 188 tests.

## Acceptance notes
- Applicant Finance now exposes a plain next action, progress and goals without heavy jargon.
- Grantor Finance now exposes queue-oriented action language.
- Admin Finance now exposes operational supervision language.
- Existing modules remain mounted below the guidance layer.

## Rollback
Revert the commit for this task. The previous Finance adapter remains recoverable because the underlying legacy modules were not modified.