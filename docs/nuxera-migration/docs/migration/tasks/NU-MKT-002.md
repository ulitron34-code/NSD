# NU-MKT-002 - Markets provider degradation hardening

## Objective
Harden the NUXERA Markets provider layer so the product can show market context without implying licensed realtime coverage.

## Context
This task deepens the `NU-MKT-001` foundation. It keeps the dual-view migration intact and does not replace backend/API contracts.

## Authorized scope
- Local market provider status model.
- Provider health and degradation states.
- Markets UI provider status panel.
- Unit coverage for delayed, degraded and unlicensed provider modes.

## Prohibited changes
- Do not claim realtime market data without a licensed provider state.
- Do not provide trading, investment or credit recommendations.
- Do not alter backend APIs, database contracts or legacy dashboard behavior.
- Do not remove the local delayed provider fallback.

## Implemented work
- Added explicit provider states: `local-delayed`, `degraded` and `unlicensed`.
- Added `canUseRealtimeMarketData` guard that only permits realtime when a licensed realtime status is explicitly active.
- Added a provider degradation plan with visible actions, fallback strategy and human-review framing.
- Updated the Markets workspace to show provider health, realtime availability, snapshot time and fallback actions.
- Kept local watchlist rows and monitored events available in degraded mode.

## Acceptance evidence
- Data provenance remains visible before the watchlist.
- Delay/realtime availability is explicit.
- Unlicensed mode blocks realtime claims.
- Degraded mode keeps local context while requiring human review.

## Validation checklist
- Targeted NUXERA Vitest file: passed, 33 checks.
- Frontend lint: passed with `pnpm run lint`.
- Frontend build: passed with `pnpm run build`.
- Full frontend unit test run: passed, 9 files and 194 tests.
- E2E/manual browser verification remains blocked in this environment by `spawn EPERM` and unavailable npm on PATH.

## Handoff
Update `PROJECT_STATE.md`, `MIGRATION_MATRIX.md` and the external Downloads handoff after validation.
