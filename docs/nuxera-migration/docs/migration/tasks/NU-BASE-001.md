# NU-BASE-001 - Repository baseline and dependency map

## Objective
Create a verified inventory of the current application before any restructuring.

## Context
This task belongs to the controlled dual-view migration. Preserve legacy behavior and reuse existing business logic.

## Authorized scope
Read-only audit plus documentation files.

## Prohibited changes
- Do not delete legacy components.
- Do not alter backend contracts unless explicitly listed.
- Do not change role semantics.
- Do not perform unrelated refactors.

## Required work
Inventory routes, layouts, menus, roles, feature/view switches, API clients, services, hooks, state management, environment variables, tests and deployments. Produce exact file paths and dependency diagrams.

## Acceptance criteria
All relevant application areas are mapped; unknowns are documented; no runtime code is modified.

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
