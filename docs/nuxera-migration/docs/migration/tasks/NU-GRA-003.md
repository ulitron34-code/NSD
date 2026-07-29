# NU-GRA-003 - Grantor case workbench foundation

## Objective
Deepen the grantor case queue with a frontend-only workbench for the highest-priority case, showing review questions, required evidence, non-binding conditions and audit trail.

## Context
This task extends `NU-GRA-002`. It remains a local NUXERA foundation layer and does not approve credit, emit term sheets, persist data or change backend/API/data-room permissions.

## Authorized scope
- Grantor local case workbench model.
- Grantor NUXERA home workbench surface.
- Unit coverage for case selection, questions, evidence, conditions and audit trail.
- Migration docs and matrix status.

## Prohibited changes
- Do not approve credit, emit term sheets or create binding decisions.
- Do not alter backend APIs, database contracts, permissions or legacy dashboard behavior.
- Do not expose unauthorized documents or bypass data-room permissions.
- Do not replace the existing PipelineTab.

## Implemented work
- Added `getGrantorCaseWorkbench` over the existing local queue.
- Added review questions for risk gaps, structure fit and data-room permission checks.
- Added required evidence and non-binding conditions for the selected case.
- Added local audit trail stating no term sheet, no approval and no permission changes.
- Updated grantor NUXERA home to show the workbench under the prioritized queue.

## Acceptance evidence
- Workbench opens a selected case from the queue.
- Review questions identify owner and prompt.
- Conditions remain explicitly non-binding.
- Audit trail preserves human review and data-room permission boundaries.

## Validation checklist
- Targeted NUXERA Vitest file: passed, 42 checks.
- Frontend lint: passed with `pnpm run lint`.
- Frontend build: passed with `pnpm run build`.
- Full frontend unit test run: passed, 9 files and 203 tests.
- E2E/manual browser verification remains blocked in this environment by `spawn EPERM` and unavailable npm on PATH.

## Handoff
Update `PROJECT_STATE.md`, `MIGRATION_MATRIX.md` and the external Downloads handoff after validation.
