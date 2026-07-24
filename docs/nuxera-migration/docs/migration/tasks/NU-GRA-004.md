# NU-GRA-004 - Grantor non-binding decision memo

## Objective
Add a local, non-binding decision memo for grantor review that summarizes thesis, evidence, risks, proposed conditions and next actions without issuing approvals, term sheets or permission changes.

## Context
`NU-GRA-003` added the grantor case workbench. This task turns that workbench into a review-ready memo artifact while keeping it local, reversible and human-review gated.

## Authorized scope
- Local memo builder over the existing grantor queue/workbench.
- Grantor NUXERA home memo rendering.
- Unit coverage for memo guardrails and evidence snapshot.
- Migration docs and matrix status.

## Prohibited changes
- Do not emit term sheets, approvals or binding credit decisions.
- Do not change data-room permissions or document sharing.
- Do not persist memo state or alter backend/API contracts.
- Do not remove or replace legacy grantor modules.

## Implemented work
- Added `getGrantorDecisionMemo` derived from `getGrantorCaseWorkbench`.
- Added thesis, recommendation, evidence snapshot, risk notes, proposed conditions, next actions and guardrails.
- Updated grantor NUXERA home to show the memo below the workbench.
- Kept memo explicitly local, non-binding and human-review gated.

## Acceptance evidence
- Grantor sees a review memo that is useful for committee preparation.
- Memo guardrails explicitly state it is not a term sheet or approval.
- Memo does not change permissions, persist state or create backend/API contracts.
- Existing grantor queue/workbench and legacy grantor modules remain available.

## Validation checklist
- Targeted NUXERA Vitest file: passed, 46 checks.
- Frontend lint: passed with `pnpm run lint`.
- Frontend build: passed with `pnpm run build`.
- Full frontend unit test run: passed, 9 files and 207 tests.
- `git diff --check`: passed.
- E2E/manual browser automation remains blocked in this environment by `spawn EPERM` and unavailable npm on PATH.

## Handoff
Update `PROJECT_STATE.md`, `MIGRATION_MATRIX.md` and the external Downloads handoff after validation.
