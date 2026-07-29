# NU-SHELL-002 - First NUXERA Intelligence adapter

## Objective
Connect the first real working module inside the NUXERA shell without retiring or rewriting the legacy dashboard surface.

## Context
This task follows `NU-SHELL-001`. The shell exists behind `VITE_NUXERA_EXPERIENCE_ENABLED=true`; this task proves the migration model by mounting one existing operational capability through a controlled NUXERA adapter.

## Authorized scope
- NUXERA section registry.
- NUXERA route-to-section adapter selection.
- A wrapper for the existing document intelligence module.
- Focused tests for section resolution.
- Migration documentation updates.

## Prohibited changes
- Do not delete or move `DocumentIntelligenceTab`.
- Do not change backend contracts, API services or route semantics.
- Do not rename legacy storage keys or dashboard tabs.
- Do not connect additional engines in the same task.

## Implemented work - 2026-07-16
- Added `src/nuxera/sections/sectionRegistry.js`.
- Added `src/nuxera/adapters/DocumentIntelligenceAdapter.jsx`.
- Updated `src/nuxera/NuxeraWorkspaceRouter.jsx` so `/dashboard/nuxera/intelligence` mounts the document intelligence adapter.
- Added adapter shell styles in `src/nuxera/styles/shell.css`.
- Extended `src/tests/nuxeraExperience.test.js` to cover section registry behavior.

## Validation
- Targeted NUXERA tests: passed, 9 checks.
- `pnpm run lint`: passed.
- `pnpm run build`: passed with bundled Node and elevated execution because Vite/Rolldown hits `spawn EPERM` inside the restricted sandbox.
- `pnpm run test:run`: passed, 9 files and 170 tests.

## Acceptance notes
- `intelligence` is now the first real NUXERA section backed by an existing module.
- `finance`, `markets`, `strategy` and future sections remain placeholders until separately approved.
- Legacy dashboard tabs remain untouched.
- Manual browser screenshots remain blocked in this environment by browser launch `spawn EPERM`.

## Rollback
Revert the commit for this task. The legacy `DocumentIntelligenceTab` remains available through the existing dashboard tab because it was not moved or modified.