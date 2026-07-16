# NU-STR-001 - Strategy workspace

## Objective
Create a decision-support workspace that converts evidence into scenarios and actions.

## Context
This task belongs to the controlled dual-view migration. Preserve legacy behavior and reuse existing business logic.

## Authorized scope
Strategy module only.

## Prohibited changes
- Do not delete legacy components.
- Do not alter backend contracts unless explicitly listed.
- Do not change role semantics.
- Do not perform unrelated refactors.

## Required work
Implement guided questions, assumptions, scenarios, risk/benefit comparison, recommendation, action plan and links to Finance, Intelligence and Markets evidence.

## Acceptance criteria
Recommendations expose assumptions and uncertainty; outputs are saved and auditable.

## Required validation
- `npm run build`
- `npm run lint`
- `npm run test:run`
- Relevant `npm run test:e2e`
- Manual role and rollback verification

## Evidence
List changed files, screenshots where applicable, commands executed, test results and remaining risks.

## Handoff
Update PROJECT_STATE and MIGRATION_MATRIX.
