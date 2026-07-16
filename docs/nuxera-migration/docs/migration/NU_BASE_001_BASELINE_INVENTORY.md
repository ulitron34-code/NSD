# NU-BASE-001 Baseline Inventory

Date: 2026-07-16
Branch: nuxera-controlled-migration
Repository: ulitron34-code/NSD

## Scope

Read-only repository baseline for the controlled NUXERA migration. Runtime application code was not modified in this task.

## Identity Control

- User-facing target identity: NUXERA Financial Intelligence.
- Earlier N&U / NU / NEXUS references in the migration package are superseded by `docs/nuxera-migration/NUXERA_IDENTITY_ADENDA.md`.
- Technical identifiers such as `nsd_ui_view`, `nsd_demo_profile`, routes, database tables, API contracts and environment variables must not be mass-renamed in shell work.

## Current Application Entry

- `src/App.jsx` owns the React Router tree.
- Providers: `AuthProvider` wraps `NotificationProvider`, which wraps `AppContent`.
- Public routes include `/`, `/login`, `/signup`, `/privacy`, `/terms`, `/contact`, `/contacto`, `/blog`, `/certifications`, `/services`, `/shared-data-room/:token`, `/modalidades`, `/plataforma`, `/cobertura-global`, `/inteligencia`, `/integraciones`, `/industrias`, `/industrias/:sector`, `/recursos`.
- `/pricing` redirects to `/modalidades`.
- Protected routes include `/dashboard/*`, `/profile`, `/service-orders`, `/checkout`.
- `Header` is mounted in route elements outside `DashboardPage`, so the future NUXERA shell must avoid duplicating the global header.

## Dashboard Architecture

- `src/pages/DashboardPage.jsx` is the compatibility host candidate.
- It currently owns role state, view state, sidebar state, tab arrays, tab rendering and some data loading.
- Role-like demo modes stored in `nsd_demo_profile`: `solicitante`, `otorgante`, `nsd_admin`.
- View state stored in `nsd_ui_view`: `classic`, `new`.
- Sidebar state stored in `nsd_sidebar_collapsed`.
- The NUXERA experience should be introduced as a third reversible experience value behind a feature flag, while preserving `classic` and `new`.

## Frontend State and Flags

Known local storage keys:

- `auth_token`
- `user`
- `language`
- `nsd_theme`
- `nsd_ui_view`
- `nsd_demo_profile`
- `nsd_sidebar_collapsed`
- `nsd_selected_expediente_id`
- `intel_consent`
- `intel_consent_signature`
- `intel_subscription`
- `nsd_token` in `TransactionOversightTab`, separate from `auth_token`

Known frontend environment variables:

- `VITE_API_URL`
- `VITE_STRIPE_PUBLIC_KEY`
- `VITE_DEMO_MODE`
- `VITE_SENTRY_DSN`
- `VITE_APP_VERSION`
- `VITE_FORMSPREE_URL`

Recommended new flag for shell migration:

- `VITE_NUXERA_EXPERIENCE_ENABLED=true`

## Authentication and Roles

Frontend:

- `src/context/AuthContext.jsx` persists `auth_token` and serialized `user` in localStorage.
- `src/components/Layout/ProtectedRoute.jsx` supports `VITE_DEMO_MODE` and creates a demo user.
- `src/services/auth.service.js` can create a demo session only when `VITE_DEMO_MODE === "true"`.

Backend:

- `backend/src/middleware/auth.js` validates Supabase JWT or API key.
- Role aliases map `admin` -> `administrador`, `applicant` -> `solicitante`, `funder`/`investor` -> `otorgante`/`inversionista`.
- Core roles: `administrador`, `solicitante`, `agente_interno`, `analista`, `compliance_officer`, `auditor_interno`, `otorgante`, `inversionista`.
- Permission checks are server-side through `requireRole`, `requirePermission`, `requireAnyPermission`, `requireAllPermissions`, and `requireAdmin`.
- NUXERA shell must not change role semantics or authorization behavior.

## API Client Surface

Primary frontend client: `src/services/api.js`.

Exported clients include:

- `authAPI`
- `ordersAPI`
- `scoringAPI`
- `regulatoryAPI`
- `institutionalAPI`
- `paymentsAPI`
- `documentsAPI`
- `sharesAPI`
- `otorganteAPI`
- `informationRequestsAPI`
- `auditAPI`
- `adminAPI`
- `readinessTemplatesAPI`
- `aiAgentsAPI`
- `checklistAPI`
- `apiKeysAPI`
- `complianceAPI`
- `screeningAPI`
- `intelAPI`
- `requisitosMinimosAPI`
- `readinessChecklistAPI`
- `reviewNotesAPI`
- `messagingAPI`
- `activitySummaryAPI`
- `nagmarAPI`

Potential duplication/debt:

- `src/services/authService.js` and `src/services/auth.service.js` both exist.
- `src/services/scoringService.js` and `src/services/scoring.service.js` both exist.
- `src/services/project.service.js` appears to point at `/api/projects`, while the main backend product surface uses service orders and related routes.

## Backend Route Surface

Backend entry: `backend/src/server.js`.

Mounted route modules:

- `/api/auth`
- `/api` orders
- `/api` payments
- `/api` documents
- `/api` shares
- `/api` audit
- `/api` scoring
- `/api` regulatory
- `/api` otorgante
- `/api` institutional
- `/api` informationRequests
- `/api` documentIntelligence
- `/api` compliance
- `/api` checklist
- `/api` apiKeys
- `/api` screening
- `/api` caseManager
- `/api` transactionOversight
- `/api` f6Regulatory
- `/api` whatsapp
- `/api` nsdApplicant
- `/api` requisitosMinimos
- `/api` readinessChecklist
- `/api` readinessTemplates
- `/api` referenceSources
- `/api` messaging
- `/api` activitySummary
- `/api` admin

Backend health: `/health`.

## Database and Migration State

Current Supabase files:

- `supabase/migrations/nagmar_case_manager.sql`
- `supabase/migrations/audit_logs.sql`

Pending backend SQL package:

- `backend/sql_migrations_pendientes/2026-06-22_document_type_catalog_multipais.sql`
- `backend/sql_migrations_pendientes/2026-06-24_api_keys.sql`
- `backend/sql_migrations_pendientes/2026-07-04_readiness_document_types.sql`
- `backend/sql_migrations_pendientes/2026-07-05_messages.sql`
- `backend/sql_migrations_pendientes/2026-07-06_document_review_notes.sql`
- `backend/sql_migrations_pendientes/2026-07-06_reference_sources.sql`
- `backend/sql_migrations_pendientes/2026-07-08_readiness_sector_specific.sql`
- `backend/sql_migrations_pendientes/2026-07-10_core_tables_rls.sql`
- `backend/sql_migrations_pendientes/2026-07-13_credit_providers.sql`
- `backend/sql_migrations_pendientes/2026-07-13_document_reviews_completed_at.sql`
- `backend/sql_migrations_pendientes/2026-07-13_document_reviews_sources_used.sql`
- `backend/sql_migrations_pendientes/2026-07-13_satellite_tables_rls.sql`
- `backend/sql_migrations_pendientes/2026-07-14_rag_vector_embeddings.sql`

Risk: SQL appears split between applied migrations and pending operational scripts. Any schema work needs a dedicated task and backward-compatible migration rules.

## Build, Test and Deployment

Frontend scripts from `package.json`:

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run test:run`
- `npm run test:e2e`

Backend scripts from `backend/package.json`:

- `npm start`
- `npm run dev`
- `npm run check:supabase`
- `npm run check:supabase-pending`
- `npm run check:rbac`
- `npm run go-nogo:local`
- `npm run predeploy`
- `npm run smoke`
- `npm test`

Deployment/config files:

- `vercel.json`
- `netlify.toml`
- `backend/render.yaml`
- `backend/railway.toml`
- `.github` directory present

## Validation Status

Baseline command execution is currently blocked locally because global `node` and `npm` are not on PATH, and this checkout has no `node_modules` or `backend/node_modules` installed.

Verified available runtime:

- Bundled Node: `C:\Users\usalgado\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`

Missing for this checkout:

- global `node`
- global `npm`
- root `node_modules`
- backend `node_modules`

Required before marking NU-BASE-001 fully green:

- install root dependencies
- install backend dependencies
- run frontend build/lint/tests
- run backend tests and structural checks
- run a critical Playwright path if browser deps are present

## Unknowns / Follow-up

- Which SQL files in `backend/sql_migrations_pendientes` are already applied in production Supabase.
- Whether Vercel deploy uses only frontend or also relies on separate Render/Railway backend.
- Whether `.env` values in the public repo are placeholders or production-adjacent values. No private service-role key was observed in the redacted check, but `.env` should still be reviewed for repository hygiene.
- Whether `nsd_token` in `TransactionOversightTab` is intentional or legacy drift from `auth_token`.
- Whether the root `.github` workflows are active and aligned with the current Vercel project.

## Next Task Recommendation

Finish NU-BASE-001 by installing dependencies and running validation. After that, start `NU-SHELL-001` with a NUXERA-specific version of the experience provider and shell.
## Validation Attempts - 2026-07-16

Attempted commands:

- `npm run build` from repo root: failed because `npm` is not recognized on PATH.
- `npm run lint` from repo root: failed because `npm` is not recognized on PATH.
- `npm run test:run` from repo root: failed because `npm` is not recognized on PATH.
- `npm test` from `backend/`: failed because `npm` is not recognized on PATH.

Tooling check:

- `Get-Command npm`: no npm command found.
- Bundled Node works: `v24.14.0`.
- Bundled pnpm works: `11.7.0`, but this repo uses `package-lock.json`; pnpm was not used to avoid introducing a different lockfile or dependency graph in the baseline task.
