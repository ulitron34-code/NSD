# NU-STR-ADAPTER-001 - Strategy decision-support foundation

## Objective
Open the first NUXERA Strategy workspace as auditable decision support connected to Finance, Intelligence and Markets evidence.

## Context
This task follows the ChatGPT migration package task `NU-STR-001`. It creates a controlled Strategy foundation without changing backend contracts or pretending that AI can make final decisions.

## Authorized scope
- Local Strategy workspace model.
- Strategy UI inside the NUXERA shell.
- Section registry and router mounting.
- Focused tests for assumptions, uncertainty, evidence links and action plan.
- Migration documentation updates.

## Prohibited changes
- Do not present recommendations as final automated decisions.
- Do not persist strategic outputs until a dedicated audit/storage task is approved.
- Do not change backend contracts, auth or role semantics.
- Do not retire legacy/current dashboard views.

## Implemented work - 2026-07-16
- Added `src/nuxera/strategy/strategyWorkspace.js`.
- Added `src/nuxera/adapters/StrategyWorkspace.jsx`.
- Updated `src/nuxera/sections/sectionRegistry.js` so `strategy` resolves to `strategy-workspace`.
- Updated `src/nuxera/NuxeraWorkspaceRouter.jsx` so `/dashboard/nuxera/strategy` mounts Strategy.
- Added Strategy styles in `src/nuxera/styles/shell.css`.
- Extended `src/tests/nuxeraExperience.test.js` with Strategy registry, assumptions, uncertainty, evidence links and action-plan coverage.

## Validation
- Targeted NUXERA tests: passed, 20 checks.
- `pnpm run lint`: passed.
- `pnpm run build`: passed with bundled Node and elevated execution because Vite/Rolldown hits `spawn EPERM` inside the restricted sandbox.
- `pnpm run test:run`: passed, 9 files and 181 tests.

## Acceptance notes
- Strategy exposes assumptions, uncertainty and human-review requirement.
- Evidence links point back to Finance, Intelligence and Markets.
- Action plan is local and auditable as a draft only.
- Future persistence and report export remain separate tasks.

## Rollback
Revert the commit for this task. Finance, Intelligence, Markets and legacy/current dashboard views remain available because this task only adds the Strategy route and local foundation.