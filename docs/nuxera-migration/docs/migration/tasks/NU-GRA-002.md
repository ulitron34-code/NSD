# NU-GRA-002 - Grantor case queue foundation

## Objective
Replace the grantor home placeholder with a frontend-only case queue that prioritizes opportunities by readiness, risk, evidence and next action.

## Context
This task deepens the grantor NUXERA experience while preserving the controlled dual-view migration. It reuses existing opportunity mapping semantics and does not change backend/API contracts or data-room permissions.

## Authorized scope
- Grantor local case queue model.
- Grantor NUXERA home queue surface.
- Unit coverage for queue summary, priorities, evidence links and human-review policy.
- Migration docs and matrix status.

## Prohibited changes
- Do not approve credit, emit term sheets or make binding decisions.
- Do not alter backend APIs, database contracts, permissions or legacy dashboard behavior.
- Do not replace the existing PipelineTab; this is a NUXERA foundation layer.
- Do not expose unauthorized documents or bypass data-room permissions.

## Implemented work
- Added a local grantor case queue model using existing `otorgantePipeline` mapping helpers.
- Added queue priorities: `committee-ready`, `needs-information` and `watch`.
- Added decision signals and evidence links to Finance, Intelligence and Strategy.
- Updated grantor NUXERA home to show summary metrics, prioritized cases and review policies.
- Kept all output local and explicitly human-review gated.

## Acceptance evidence
- Grantor sees a real queue instead of placeholder cards.
- Cases show readiness, risk, documents, ticket and next action.
- Queue policies state no automatic credit approval or term sheet.
- Existing legacy pipeline remains untouched.

## Validation checklist
- Targeted NUXERA Vitest file: passed, 41 checks.
- Frontend lint: passed with `pnpm run lint`.
- Frontend build: passed with `pnpm run build`.
- Full frontend unit test run: passed, 9 files and 202 tests.
- E2E/manual browser verification remains blocked in this environment by `spawn EPERM` and unavailable npm on PATH.

## Handoff
Update `PROJECT_STATE.md`, `MIGRATION_MATRIX.md` and the external Downloads handoff after validation.
