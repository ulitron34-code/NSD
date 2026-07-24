# NU-SHELL-001 - NUXERA parallel application shell

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
Implement a reversible NUXERA shell behind a feature flag. Preserve existing routes through adapters. Add role-aware navigation for Applicant, Grantor and Admin.

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

## Implementation update - 2026-07-16

Status: implemented as a first controlled shell slice.

Changed files:
- `src/App.jsx`
- `src/pages/DashboardPage.jsx`
- `src/experience/experienceStorage.js`
- `src/experience/experienceFlags.js`
- `src/experience/ExperienceContext.jsx`
- `src/nuxera/navigation/roleResolver.js`
- `src/nuxera/navigation/navigationByRole.js`
- `src/nuxera/pages/NuxeraHome.jsx`
- `src/nuxera/shell/NuxeraShell.jsx`
- `src/nuxera/NuxeraWorkspaceRouter.jsx`
- `src/nuxera/styles/tokens.css`
- `src/nuxera/styles/shell.css`
- `src/tests/nuxeraExperience.test.js`

Evidence:
- `pnpm run lint`: passed.
- `pnpm run build`: passed with bundled Node and escalated execution for Vite/Rolldown native process access.
- `pnpm run test:run`: passed, 9 files and 168 tests.
- Targeted NUXERA test coverage added for feature flag gating, legacy-compatible storage key, role resolution and role navigation.

Acceptance notes:
- NUXERA entry is feature-flagged by `VITE_NUXERA_EXPERIENCE_ENABLED=true`.
- Legacy `classic` and `new` dashboard views remain available.
- The shell can return to the current dashboard view.
- Role-aware navigation is present for applicant, grantor and admin.

Remaining evidence needed before product acceptance:
- Manual browser check with feature flag enabled. Attempted with installed Chrome, but browser launch is blocked by local `spawn EPERM` restrictions in this environment and no admin/install path is available.
- Screenshots for each role.
- Deep-link verification for `/dashboard/nuxera/:section`.
