# NU-STR-002 - Strategy decision flow hardening

## Objective
Deepen NUXERA Strategy from scenario display into an auditable decision flow with evidence gates, rollback conditions and a local decision package.

## Context
This task extends `NU-STR-001` while preserving the controlled dual-view migration. It does not persist decisions, approve actions or change backend/API contracts.

## Authorized scope
- Local Strategy decision model.
- Strategy UI decision-flow layer.
- Unit coverage for gates, evidence ids, rollback and audit package.
- Migration docs and matrix status.

## Prohibited changes
- Do not auto-approve decisions.
- Do not execute financial, credit, investment or compliance actions.
- Do not alter backend APIs, database contracts or legacy dashboard behavior.
- Do not claim persistence until a dedicated storage/API task is approved.

## Implemented work
- Added decision flow stages with owner, status, gate, evidence ids and rollback condition.
- Added decision readiness criteria for evidence coverage, human review and reversibility.
- Added a local `getStrategyDecisionPackage` helper with required evidence ids, rollback conditions and audit trail.
- Updated the Strategy workspace UI to show gates before assumptions/scenarios.
- Added visible decision package/audit trail without approval or persistence side effects.

## Acceptance evidence
- Recommendations still expose uncertainty and human review.
- Each decision stage links to evidence ids from Finance, Intelligence and Markets.
- Rollback conditions are visible before execution.
- Decision package explicitly says it does not execute automatic approvals or contract changes.

## Validation checklist
- Targeted NUXERA Vitest file: passed, 35 checks.
- Frontend lint: passed with `pnpm run lint`.
- Frontend build: passed with `pnpm run build`.
- Full frontend unit test run: passed, 9 files and 196 tests.
- E2E/manual browser verification remains blocked in this environment by `spawn EPERM` and unavailable npm on PATH.

## Handoff
Update `PROJECT_STATE.md`, `MIGRATION_MATRIX.md` and the external Downloads handoff after validation.
