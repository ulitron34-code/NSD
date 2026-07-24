# NU-MKT-001 - Markets foundation

## Objective
Create a compliant market-intelligence foundation without pretending to be a full Bloomberg replacement.

## Context
This task belongs to the controlled dual-view migration. Preserve legacy behavior and reuse existing business logic.

## Authorized scope
Markets UI, provider interfaces, watchlists and alerts.

## Prohibited changes
- Do not delete legacy components.
- Do not alter backend contracts unless explicitly listed.
- Do not change role semantics.
- Do not perform unrelated refactors.

## Required work
Implement data-provider abstraction, market-session awareness, delayed/realtime labeling, watchlists, events, explanations and persistent agent monitoring policies.

## Acceptance criteria
Data provenance and delay are visible; no trading advice is presented as guaranteed; provider failures degrade gracefully.

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
