# File-by-File Implementation Map

## Existing files to modify carefully

### `src/App.jsx`
Purpose: mount the experience provider around protected application routes.

Change:
- Import `ExperienceProvider`.
- Wrap `AppContent` or protected routes with the provider.
- Keep all existing public routes unchanged.
- Do not change auth provider order without tests.

### `src/pages/DashboardPage.jsx`
Purpose: compatibility host during migration.

Change:
- Extract existing content to `LegacyDashboardHost.jsx` in a later controlled commit.
- Add branch:
  - `uiView === "nu"` -> render `NUWorkspaceRouter`.
  - otherwise -> render existing classic/new logic.
- Preserve `classic` and `new`.
- Preserve `nsd_demo_profile`.
- Do not delete lazy imports until each module is mapped.

### `src/components/Layout/Header.jsx`
Purpose: global public/auth header.

Change:
- Replace hard-coded `/logo-nexus.png` with `BRAND.logoPath`.
- Allow `hideOnWorkspace` or render a compact workspace header through a deliberate App route decision.
- Do not duplicate the header inside `NUShell`.

### `src/config/brand.js`
Purpose: single brand source.

Change:
- Replace NEXUS fields with N&U fields only after final descriptor approval.
- Add `logoPath`.
- Keep contact fields unchanged unless separately approved.

## New files to create

- `src/experience/ExperienceContext.jsx`
- `src/experience/experienceStorage.js`
- `src/experience/experienceFlags.js`
- `src/nu/NUWorkspaceRouter.jsx`
- `src/nu/shell/NUShell.jsx`
- `src/nu/shell/NUWorkspaceHeader.jsx`
- `src/nu/navigation/navigationByRole.js`
- `src/nu/navigation/roleResolver.js`
- `src/nu/pages/applicant/ApplicantHome.jsx`
- `src/nu/pages/grantor/GrantorHome.jsx`
- `src/nu/pages/admin/AdminHome.jsx`
- `src/nu/styles/tokens.css`
- `src/nu/styles/shell.css`
- `src/nu/__tests__/roleResolver.test.js`
- `src/nu/__tests__/NUWorkspaceRouter.test.jsx`

## Existing modules to reuse, not duplicate

Applicant:
- `MiPerfilTab`
- `FundingReadinessTab`
- `MatchesTab`
- `SubirProyectoTab`
- `CumplimientoTab`
- `ExpedientesTab`
- `DataRoomIndexTab`
- `DocumentIntelligenceTab`
- `ScoringAETab`

Grantor:
- `PipelineTab`
- `AnalyticsTab`
- `DecisionRoomTab`
- `ForensicAnalysisTab`
- `CommitteeMemoTab`
- `RequirementsTab`
- `TransactionOversightTab`
- `NagmarCaseManagerTab`

Admin:
- `AdminUsersTab`
- `AdminReferenceSourcesTab`
- `AdminRubricsTab`
- `AdminHumanReviewTab`
- `AdminMetricsTab`
- `AIAgentOpsTab`
- `TraceabilityLogTab`

The N&U pages should compose these modules behind simpler journeys. They must not copy their business logic.
