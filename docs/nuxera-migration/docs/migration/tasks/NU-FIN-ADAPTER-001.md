# NU-FIN-ADAPTER-001 - First NUXERA Finance adapter

## Objective
Mount the first Finance workspace inside the NUXERA shell by reusing existing role-specific modules.

## Context
This task follows `NU-SHELL-002`. Finance must become usable incrementally without retiring current dashboard tabs or changing backend contracts.

## Authorized scope
- Finance adapter inside `src/nuxera/adapters`.
- Section registry entry for `finance`.
- NUXERA router adapter selection.
- Focused tests for Finance registry and role mapping.
- Migration documentation updates.

## Prohibited changes
- Do not delete or move legacy dashboard modules.
- Do not alter backend APIs, Supabase contracts or storage keys.
- Do not change role semantics.
- Do not add new Finance business logic in this task.

## Implemented work - 2026-07-16
- Added `src/nuxera/adapters/FinanceWorkspaceAdapter.jsx`.
- Updated `src/nuxera/sections/sectionRegistry.js` so `finance` resolves to `finance-workspace`.
- Updated `src/nuxera/NuxeraWorkspaceRouter.jsx` so `/dashboard/nuxera/finance` mounts the Finance adapter.
- Extended `src/tests/nuxeraExperience.test.js` with Finance registry and role-selection coverage.

## Role mapping
- Applicant: existing `FundingReadinessTab`.
- Grantor: existing `PipelineTab`.
- Admin: existing `ServiceOrdersPage`.

## Validation
- Targeted NUXERA tests: passed, 12 checks.
- `pnpm run lint`: passed.
- `pnpm run build`: passed with bundled Node and elevated execution because Vite/Rolldown hits `spawn EPERM` inside the restricted sandbox.
- `pnpm run test:run`: passed, 9 files and 173 tests.

## Acceptance notes
- `finance` is now a role-aware NUXERA adapter backed by existing modules.
- `markets`, `strategy` and future sections remain placeholders until separately approved.
- Legacy dashboard tabs remain untouched.
- Manual browser screenshots remain blocked in this environment by browser launch `spawn EPERM`.

## Rollback
Revert the commit for this task. Existing Finance-related dashboard modules remain available through the legacy/current dashboard because they were not moved or modified.