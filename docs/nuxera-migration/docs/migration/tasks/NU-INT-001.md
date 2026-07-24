# NU-INT-001 - Intelligence research missions

## Objective
Implement deep research as a premium applicant and grantor capability.

## Context
This task belongs to the controlled dual-view migration. Preserve legacy behavior and reuse existing business logic.

## Authorized scope
New Intelligence module and adapters only.

## Prohibited changes
- Do not delete legacy components.
- Do not alter backend contracts unless explicitly listed.
- Do not change role semantics.
- Do not perform unrelated refactors.

## Required work
Create mission types, subject identification, generated research plan, source collection, evidence, confidence, findings, risks, recommendations and exportable report.

## Acceptance criteria
Every material claim has evidence metadata; agents remain hidden behind a single N&U experience.

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
