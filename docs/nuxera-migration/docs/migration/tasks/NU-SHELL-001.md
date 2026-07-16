# NU-SHELL-001 - N&U parallel application shell

## Objective
Create the new role-aware shell while preserving the old and current views.

## Context
This task belongs to the controlled dual-view migration. Preserve legacy behavior and reuse existing business logic.

## Authorized scope
New shell, feature flags, compatibility routing and design tokens.

## Prohibited changes
- Do not delete legacy components.
- Do not alter backend contracts unless explicitly listed.
- Do not change role semantics.
- Do not perform unrelated refactors.

## Required work
Implement a reversible N&U shell behind a feature flag. Preserve existing routes through adapters. Add role-aware navigation for Applicant, Grantor and Admin.

## Acceptance criteria
Users can switch safely; refresh and deep links work; permissions remain identical; legacy remains available.

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
