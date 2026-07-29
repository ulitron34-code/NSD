# NU-APP-002 - Applicant guided mission foundation

## Objective
Replace the applicant home placeholder with a frontend-only guided mission that helps the applicant prepare a financing request with clear evidence, next action and guardrails.

## Context
This task deepens the NUXERA applicant experience while preserving the controlled dual-view migration. It does not persist mission state, approve credit or change backend/API contracts.

## Authorized scope
- Applicant home surface in NUXERA.
- Local guided mission model.
- Evidence links to Finance, Intelligence and Strategy.
- Unit coverage for mission steps, guardrails and readiness status.
- Migration docs and matrix status.

## Prohibited changes
- Do not approve credit or guarantee financing.
- Do not alter backend APIs, database contracts or legacy dashboard behavior.
- Do not store mission state until a dedicated data/API task is approved.
- Do not remove grantor/admin home placeholders unless a task explicitly scopes them.

## Implemented work
- Added `getApplicantGuidedMission` with mission summary, outcome, progress, steps and guardrails.
- Added `getApplicantMissionReadiness` with status, open steps, next action and human-review requirement.
- Updated applicant NUXERA home to show a real mission surface instead of generic placeholder cards.
- Linked applicant steps to Finance, Intelligence and Strategy workspaces.
- Kept grantor/admin home behavior unchanged.

## Acceptance evidence
- Applicant sees a concrete financing readiness mission.
- Mission steps identify owner, status, prompt, output and connected engine.
- Guardrails state that the mission does not approve credit or guarantee financing.
- Readiness remains evidence-in-progress and requires human review.

## Validation checklist
- Targeted NUXERA Vitest file: passed, 37 checks.
- Frontend lint: passed with `pnpm run lint`.
- Frontend build: passed with `pnpm run build`.
- Full frontend unit test run: passed, 9 files and 198 tests.
- E2E/manual browser verification remains blocked in this environment by `spawn EPERM` and unavailable npm on PATH.

## Handoff
Update `PROJECT_STATE.md`, `MIGRATION_MATRIX.md` and the external Downloads handoff after validation.
