# NU-GRA-001 - Grantor decision workspace

## Objective
Create a work-oriented grantor dashboard and unified case entry.

## Context
This task belongs to the controlled dual-view migration. Preserve legacy behavior and reuse existing business logic.

## Authorized scope
Grantor new-view components only.

## Prohibited changes
- Do not delete legacy components.
- Do not alter backend contracts unless explicitly listed.
- Do not change role semantics.
- Do not perform unrelated refactors.

## Required work
Create intake queue, priority alerts, pending documents, ready-for-decision cases and direct entry into a case workbench.

## Acceptance criteria
Critical cases are reachable in one click; filters and permissions work; no legacy workflow is removed.

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
