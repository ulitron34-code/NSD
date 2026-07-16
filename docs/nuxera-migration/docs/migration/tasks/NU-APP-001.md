# NU-APP-001 - Applicant home and guided mission

## Objective
Replace the metric-heavy applicant entry with progress, next action and simple goals.

## Context
This task belongs to the controlled dual-view migration. Preserve legacy behavior and reuse existing business logic.

## Authorized scope
Applicant new-view components only.

## Prohibited changes
- Do not delete legacy components.
- Do not alter backend contracts unless explicitly listed.
- Do not change role semantics.
- Do not perform unrelated refactors.

## Required work
Create applicant home with Continue application, progress, missing items, estimated effort, alerts and four primary goals: financing, improve project, investigate company, follow up.

## Acceptance criteria
A novice user understands the next action without financial jargon; legacy data is reused.

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
