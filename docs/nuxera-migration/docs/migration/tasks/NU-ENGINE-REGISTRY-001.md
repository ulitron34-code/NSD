# NU-ENGINE-REGISTRY-001 - Shared engine registry

## Objective
Consolidate Finance, Intelligence, Markets and Strategy metadata into one NUXERA registry used by navigation and section resolution.

## Context
After the four initial engines were mounted, route labels, paths, titles and adapters were duplicated between navigation and section registry. This task removes that duplication before deeper module work begins.

## Authorized scope
- Shared engine metadata registry.
- Navigation source update.
- Section resolver source update.
- Focused tests for engine order, navigation items and adapter metadata.
- Migration documentation updates.

## Prohibited changes
- Do not change engine routes.
- Do not change role semantics.
- Do not alter backend contracts or providers.
- Do not retire legacy/current views.

## Implemented work - 2026-07-16
- Added `src/nuxera/engines/engineRegistry.js`.
- Updated `src/nuxera/navigation/navigationByRole.js` to use `getNuxeraEngineNavigationItems()`.
- Updated `src/nuxera/sections/sectionRegistry.js` to resolve engine sections from the registry.
- Extended `src/tests/nuxeraExperience.test.js` with engine registry coverage.

## Validation
- Targeted NUXERA tests: passed, 23 checks.
- `pnpm run lint`: passed.
- `pnpm run build`: passed with bundled Node and elevated execution because Vite/Rolldown hits `spawn EPERM` inside the restricted sandbox.
- `pnpm run test:run`: passed, 9 files and 184 tests.

## Acceptance notes
- Engine order is centralized: Finance, Intelligence, Markets, Strategy.
- Navigation and section resolution now read from the same metadata source.
- Adapter metadata is available for later deepening tasks.

## Rollback
Revert the commit for this task. The previous explicit navigation and section mapping can be restored without touching the mounted engine adapters.