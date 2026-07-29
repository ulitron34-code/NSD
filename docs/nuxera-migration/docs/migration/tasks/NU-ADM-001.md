# NU-ADM-001 - Admin console separation

## Objective
Split administration into operations, configuration, security, AI and system monitoring.

## Context
This task belongs to the controlled dual-view migration. Preserve legacy behavior and reuse existing business logic.

## Authorized scope
Admin new-view navigation and wrappers.

## Prohibited changes
- Do not delete legacy components.
- Do not alter backend contracts unless explicitly listed.
- Do not change role semantics.
- Do not perform unrelated refactors.

## Required work
Reorganize existing admin capabilities without changing underlying services.

## Acceptance criteria
No capability is lost; technical functions are grouped consistently; audit and security remain restricted.

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
