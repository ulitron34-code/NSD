# NU-MKT-ADAPTER-001 - Markets foundation adapter

## Objective
Open the first NUXERA Markets workspace with visible provenance, delay labeling and no-advice safeguards.

## Context
This task follows the ChatGPT migration package task `NU-MKT-001`. It creates a controlled foundation without pretending to provide licensed real-time market data.

## Authorized scope
- Local delayed market provider abstraction.
- Markets workspace UI inside the NUXERA shell.
- Section registry and router mounting.
- Focused tests for provenance, delay and monitoring policies.
- Migration documentation updates.

## Prohibited changes
- Do not add unlicensed realtime feeds.
- Do not present trading, investment or credit decisions as guaranteed recommendations.
- Do not change backend contracts or authentication.
- Do not retire legacy/current dashboard views.

## Implemented work - 2026-07-16
- Added `src/nuxera/markets/marketDataProvider.js`.
- Added `src/nuxera/adapters/MarketsWorkspace.jsx`.
- Updated `src/nuxera/sections/sectionRegistry.js` so `markets` resolves to `markets-workspace`.
- Updated `src/nuxera/NuxeraWorkspaceRouter.jsx` so `/dashboard/nuxera/markets` mounts Markets.
- Added Markets styles in `src/nuxera/styles/shell.css`.
- Extended `src/tests/nuxeraExperience.test.js` with Markets registry, provider status, watchlist and policy coverage.

## Validation
- Targeted NUXERA tests: passed, 16 checks.
- `pnpm run lint`: passed.
- `pnpm run build`: passed with bundled Node and elevated execution because Vite/Rolldown hits `spawn EPERM` inside the restricted sandbox.
- `pnpm run test:run`: passed, 9 files and 177 tests.

## Acceptance notes
- Markets exposes provider, mode, delay, provenance and disclaimer.
- Watchlist and events are local controlled data for experience design.
- Monitoring policies explicitly require graceful degradation and human review.
- `strategy` and future sections remain placeholders until separately approved.

## Rollback
Revert the commit for this task. Finance, Intelligence and legacy/current dashboard views remain available because this task only adds the Markets route and local provider foundation.