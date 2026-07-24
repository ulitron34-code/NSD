# NU-APP-003 - Applicant data-room checklist foundation

## Objective
Connect the applicant guided mission to a frontend-only data-room/checklist layer based on the existing minimum requirements model.

## Context
This task deepens `NU-APP-002`. It keeps the applicant experience useful while preserving controlled migration boundaries: no persistence, no backend/API changes and no credit approval.

## Authorized scope
- Applicant local checklist/data-room model.
- Applicant NUXERA home checklist panels.
- Unit coverage for minimum requirements mapping, critical gaps and data-room folders.
- Migration docs and matrix status.

## Prohibited changes
- Do not persist checklist state.
- Do not alter backend APIs, database contracts or legacy dashboard behavior.
- Do not approve credit or guarantee financing.
- Do not replace the existing legacy requirements/data-room modules.

## Implemented work
- Reused `REQUISITOS_MINIMOS` and categories from `src/data/requisitosMinimos.js`.
- Added `getApplicantDataRoomChecklist` with local statuses, summary, categories, folders and next evidence.
- Added data-room readiness panels to applicant NUXERA home.
- Kept checklist output local and explicitly guarded as preparation-only.
- Added tests for critical gaps, minimum requirement count, categories and data-room folder grouping.

## Acceptance evidence
- Applicant sees document readiness from existing minimum requirements semantics.
- Critical gaps remain visible before human review.
- Data-room folders explain visibility and readiness without changing permissions or storage.
- Legacy data-room/checklist modules remain untouched.

## Validation checklist
- Targeted NUXERA Vitest file: passed, 39 checks.
- Frontend lint: passed with `pnpm run lint`.
- Frontend build: passed with `pnpm run build`.
- Full frontend unit test run: passed, 9 files and 200 tests.
- E2E/manual browser verification remains blocked in this environment by `spawn EPERM` and unavailable npm on PATH.

## Handoff
Update `PROJECT_STATE.md`, `MIGRATION_MATRIX.md` and the external Downloads handoff after validation.
