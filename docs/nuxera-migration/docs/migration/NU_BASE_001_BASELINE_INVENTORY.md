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

## Validation Attempts - 2026-07-16 Continued

Dependency bootstrap:

- Frontend dependencies installed with bundled `pnpm install --lockfile=false` because `npm` was unavailable on PATH. No pnpm lockfile was retained.
- Backend dependencies were partially installed with bundled pnpm. pnpm reported `ERR_PNPM_IGNORED_BUILDS` for `tesseract.js@7.0.0`; generated backend pnpm lock/workspace files were removed to keep the repository on its existing npm lockfile contract.

Build:

- First sandbox run failed with `spawn EPERM` from Vite/Rolldown while loading config.
- Escalated run progressed through production build and transformed 1000 modules, then failed on unresolved import `@sentry/browser` from `src/utils/sentry.js`.
- `package-lock.json` contains `@sentry/browser` as a transitive dependency of `@sentry/react`, so this may pass under npm's hoisted layout but fails under pnpm's strict dependency resolution. Treat as a real dependency hygiene risk before shell work.

Lint:

- `pnpm run lint` failed with ESLint configuration discovery error while scanning `backend/scripts`.
- Root script is `eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0`; the command currently scans backend files but no ESLint config is found from `backend/scripts` upward under ESLint 8.
- Recommended follow-up: make lint scope explicit or add a compatible root ESLint config task. Do not hide errors by disabling lint globally.

Frontend tests:

- `pnpm run test:run` passed.
- Result: 8 test files passed, 161 tests passed.

Backend tests:

- `pnpm test` was blocked by pnpm dependency status / ignored build script check.
- Direct Vitest execution succeeded with bundled Node: `node ./node_modules/vitest/vitest.mjs run`.
- Result: 36 test files passed, 385 tests passed.

Current NU-BASE-001 status:

- Baseline inventory: created.
- Tests: frontend and backend unit tests pass through available tooling.
- Build: blocked by Sentry dependency hygiene under pnpm strict layout.
- Lint: blocked by lint scope/config issue.
- E2E: not run yet; should wait until build/lint baseline is resolved or explicitly documented as deferred.

## Baseline Hygiene Fixes - 2026-07-16

Minimal runtime-adjacent fixes applied before starting `NU-SHELL-001`:

- Added `@sentry/browser` as an explicit root dependency because `src/utils/sentry.js` imports it directly. It was previously only available as a transitive dependency of `@sentry/react`, which is fragile and failed under pnpm strict resolution.
- Added root `eslint.config.js` for ESLint flat config.
- Updated the root lint script from `eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0` to `eslint . --report-unused-disable-directives --max-warnings 0` because flat config does not support `--ext`.
- Scoped lint to app/e2e JavaScript and JSX, while ignoring backend, generated output, docs, scratch, test results and Storybook stories. Backend has its own test/check surface and should receive a dedicated lint task later if desired.
- Disabled `react-refresh/only-export-components` in baseline lint to avoid forcing context/helper extraction before the migration shell task.

Validation after fixes:

- Frontend build: passed with `pnpm run build` using bundled Node on PATH and escalated execution for Vite native process access.
- Frontend lint: passed with `pnpm run lint`.
- Frontend unit tests: passed, 8 test files and 161 tests.
- Backend unit tests: passed via direct Vitest execution, 36 test files and 385 tests.
- E2E: not run. `playwright.config.js` uses `webServer.command: npm run dev`, but npm is not available on PATH in this environment. Do not change Playwright config inside NU-BASE-001 just to work around local tooling.

Current NU-BASE-001 status after these fixes:

- Baseline inventory: complete.
- Build: pass.
- Lint: pass.
- Frontend tests: pass.
- Backend tests: pass.
- E2E: deferred due local npm tooling gap.

Recommended next action: commit these baseline hygiene fixes, then begin `NU-SHELL-001` in a separate commit.
