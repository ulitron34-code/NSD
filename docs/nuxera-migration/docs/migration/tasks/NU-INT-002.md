# NU-INT-002 - Research missions foundation

## Objective
Start evolving NUXERA Intelligence beyond a document adapter by adding research missions with subject, plan, sources, evidence, confidence, findings, risks, recommendations and report metadata.

## Context
This task builds on `NU-SHELL-002` and aligns with `NU-INT-001` from the ChatGPT migration package. It remains local/foundational and does not change backend contracts.

## Authorized scope
- Local research mission model.
- Intelligence adapter composition.
- Intelligence mission styling.
- Focused tests for mission types, evidence metadata and report/audit requirements.
- Migration documentation updates.

## Prohibited changes
- Do not remove or alter `DocumentIntelligenceTab`.
- Do not create external source integrations or scraping in this task.
- Do not persist/export reports until a dedicated task is approved.
- Do not change backend APIs, auth, roles or storage keys.

## Implemented work - 2026-07-16
- Added `src/nuxera/intelligence/researchMissions.js`.
- Updated `src/nuxera/adapters/DocumentIntelligenceAdapter.jsx` with mission, plan, sources, findings and report note.
- Added Intelligence mission styles in `src/nuxera/styles/shell.css`.
- Extended `src/tests/nuxeraExperience.test.js` with research mission coverage.

## Validation
- Targeted NUXERA tests: passed, 30 checks.
- `pnpm run lint`: passed.
- `pnpm run build`: passed with bundled Node and elevated execution because Vite/Rolldown hits `spawn EPERM` inside the restricted sandbox.
- `pnpm run test:run`: passed, 9 files and 191 tests.

## Acceptance notes
- Mission types include company diligence, person screening and sector context.
- Material findings include confidence and evidence ids.
- Evidence metadata includes source, provenance, delay/reliability context.
- Reports remain local draft metadata until persistence/export is approved.

## Rollback
Revert the commit for this task. The original document intelligence adapter remains recoverable and the legacy module was not modified.