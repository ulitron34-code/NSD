# NUXERA SQL/RLS Readiness Checklist v1

## Purpose

Define the minimum go/no-go checklist before applying any pending NUXERA SQL draft to a controlled Supabase environment.

This is documentation-only. It does not apply SQL, change RLS, create tables, run live Supabase checks or enable UI writes.

## Scope

Pending NUXERA SQL drafts currently covered by the local guard:

| Draft | Purpose | Current application status |
|---|---|---|
| `backend/sql_migrations_pendientes/2026-07-16_nuxera_workspace_states.sql` | Applicant checklist state container. | **Applied to production Supabase (`iafwnrootbtlsdqfioiu`) on 2026-07-18** by explicit user authorization. RLS enabled, 3 policies confirmed. |
| `backend/sql_migrations_pendientes/2026-07-17_nuxera_evidence_links.sql` | Owner-visible evidence-link references. | **Applied to production Supabase on 2026-07-18.** RLS enabled, 1 policy confirmed. |
| `backend/sql_migrations_pendientes/2026-07-17_nuxera_admin_controls.sql` | Admin read-only control state. | **Applied to production Supabase on 2026-07-18.** RLS enabled, 1 policy confirmed. |

Note: the original plan below assumed a non-production Supabase project for this pass. No separate non-production project existed in the org (single-project org, free tier); the user was told this explicitly before proceeding and chose to apply directly to production rather than provision a separate project first. See `PROJECT_STATE.md`, "First controlled Supabase application - 2026-07-18" for the full record.

## Required local checks before live application

- Run direct local guard from `backend/`: `node scripts/check-nuxera-sql-drafts.js`.
- Confirm every draft is additive and contains no `DROP TABLE`, `TRUNCATE`, legacy-table drops or destructive `service_orders` operations.
- Confirm each draft enables RLS before any production-like use.
- Confirm each draft keeps write policies narrower than read policies.
- Confirm read-only drafts expose no insert/update/delete policies.
- Confirm local frontend still passes NUXERA tests, full unit suite, lint and build after any adapter changes.

## Required controlled Supabase checks

Before applying to production, use a non-production Supabase project or isolated branch with representative test users and orders.

### Schema verification

- Confirm existing anchors exist and match expected column names:
  - `service_orders.id`
  - `service_orders.user_id`
  - `documents.id`
  - `documents.order_id`
  - `document_reviews.id`
  - `audit_logs.order_id`
- Confirm no existing migration owns a conflicting `nuxera_*` table.
- Apply drafts in dependency order:
  1. `nuxera_workspace_states`
  2. `nuxera_evidence_links`
  3. `nuxera_admin_controls`
- Confirm indexes are present and active predicates match the local guard.
- Confirm `archived_at`/soft-hiding semantics exist before enabling UI writes.

**Done 2026-07-18:** all three tables applied in dependency order against production; `service_orders`/`documents`/`document_reviews` FK anchors accepted without error (confirming column names matched); `pg_class`/`pg_policies` query confirmed `relrowsecurity = true` and correct policy counts (3/1/1) for the three tables; `node backend/scripts/check-nuxera-sql-drafts.js` and `npm run check:supabase` (12 pre-existing tables) both passed immediately before applying. `getNuxeraBackendReadiness()` was called directly (bypassing HTTP/auth) and returned `ready: true`, `readiness: 100%`, all three signals `available` with `count: 0`.

### RLS verification

**Done at the RLS/database layer, 2026-07-18.** All four identities tested against production with real, pre-existing ids (no fabricated data), entirely inside `BEGIN...ROLLBACK` transactions so nothing was ever committed:
- `nuxera_workspace_states`: real order owner sees own row (`count = 1`); a different real user sees nothing for that order (`count = 0`).
- `nuxera_evidence_links` (`authorized_grantor` visibility): after implementing the previously contract-only grantor policy (new SQL draft `2026-07-18_nuxera_evidence_links_grantor_policy.sql`, reusing the existing `data_room_shares` authorization), a real user with an accepted share sees the row (`count = 1`); a real user with no share for that order sees nothing (`count = 0`).
- `nuxera_admin_controls`: the one real `administrador` user in production sees the row (`count = 1`); a real non-admin user sees nothing (`count = 0`).
- Every table confirmed back at `count(*) = 0` immediately after each rollback — zero permanent rows left by any of these tests.

This confirms all four rows of the identity matrix below at the RLS/database layer. **Still not tested:** the HTTP-level permission middleware (`requirePermission(...)`) with a real authenticated session for any of these routes, and no write-path RLS test has been run.

Use at minimum these controlled identities:

| Identity | Must read | Must write | Must not read/write |
|---|---|---|---|
| Applicant owner | Own `applicant/checklist` state. | Own applicant checklist only, when feature flag is on. | Other orders, grantor/admin state, evidence not owned. |
| Different applicant | Nothing for another order. | Nothing for another order. | All rows for foreign orders. |
| Grantor/otorgante | Only authorized summaries after existing data-room check, when implemented. | No write in current drafts. | Owner-only evidence rows and hidden documents. |
| Admin/internal | Admin controls read when permitted. | No write in current read-only admin-controls draft. | Feature flag mutation, automation activation, document grants. |

## Endpoint verification before UI enablement

- `GET /api/nuxera/orders/:orderId/state` returns role-scoped state only.
- `PATCH /api/nuxera/orders/:orderId/state/checklist` updates applicant checklist only.
- `GET /api/nuxera/orders/:orderId/evidence` returns owner-visible evidence only in the current slice.
- `GET /api/nuxera/admin/controls` requires admin-read permission.
- `GET /api/nuxera/admin/readiness` returns read-only backend readiness without applying SQL or changing RLS.
- Every denied path must return controlled 401/403/404 behavior without leaking existence of restricted rows.
- Every write must emit an `audit_logs` event before the UI write path is considered production-capable.

## Feature-flag gates

- `VITE_NUXERA_EXPERIENCE_ENABLED=false` must hide NUXERA UI reads/writes.
- UI must degrade to local/read-only fallback when endpoints fail.
- Applicant checklist write controls must remain disabled unless a real order id, persisted state and approved backend contract are present.
- Grantor memo export, admin control writes, evidence-link writes and document access changes remain blocked until separate tasks approve them.

## Go/no-go checklist

| Gate | Required evidence | Status |
|---|---|---|
| Local SQL guard | Guard output attached to handoff. | **Done** — `check-nuxera-sql-drafts.js` passed 2026-07-18. |
| Controlled DB apply | Apply log with schema/RLS confirmation. | **Done, but applied directly to production** (no separate non-prod project existed; user explicitly authorized). See `pg_class`/`pg_policies` verification above. |
| RLS matrix | Applicant, different applicant, grantor and admin checks. | **Done at the RLS/database layer (2026-07-18).** All 4 identities confirmed by real behavioral tests against production (`nuxera_workspace_states`, `nuxera_evidence_links`, `nuxera_admin_controls`), all PASS. HTTP-level permission-middleware checks still pending — see `NUXERA_CONTROLLED_RLS_ENDPOINT_EVIDENCE_TEMPLATE.md`. |
| Endpoint tests | Backend service/route tests and controlled API calls. | **Done for all routes, including `authorized-grantor` (closed 2026-07-19).** Mocked route/service tests pass (469 total backend tests, all green). Real HTTP calls made against the local backend (running with real production Supabase credentials) using real Supabase sessions: admin/applicant/write routes verified 2026-07-18; the `grantor-evidence` route verified 2026-07-19 by creating a real (temporary, since none existed in production) otorgante identity — 200 authorized, 403 unauthorized, 401 no-token, then fully torn down. See `NUXERA_CONTROLLED_RLS_ENDPOINT_EVIDENCE_TEMPLATE.md`. Non-blocking finding from that run: the `grantor-evidence` read path has no `audit_logs` call, unlike comparable routes. |
| Audit writes | `audit_logs` rows verified for writes. | Not applicable yet — no write path has been exercised against these tables. |
| Rollback rehearsal | Feature flag off and soft-archive/hide behavior verified. | **Done (2026-07-18), 5/5 checks pass.** Flag off confirmed live (zero `/api/nuxera/*` network calls navigating the real legacy dashboard); legacy code has zero coupling to the 3 tables (verified by repo grep); soft-archive verified in production inside a rolled-back transaction (archived row hidden from active queries, still exists, then rolled back — zero permanent footprint). See `NUXERA_CONTROLLED_RLS_ENDPOINT_EVIDENCE_TEMPLATE.md`. |
| Production approval | Human approval with commit, SQL hash and rollback owner. | Informal — explicit user authorization in chat to apply directly to production, given after being told no non-prod project existed. Not routed through the formal change-request/dossier chain (`request:nuxera-change`, `dossier:nuxera-release`). |

## Rollback expectations

- Rollback starts by disabling the NUXERA feature flag.
- Do not delete `nuxera_*` rows after live use; use soft archive/status hiding.
- Legacy dashboards and service order flows must continue without reading `nuxera_*` tables.
- If a write path fails, UI returns to local/read-only state and records the failure for admin review.
- Any rollback report must include prior known-good commit, SQL filenames, table row counts and affected order ids.

## Current recommendation

Updated 2026-07-18: the SQL drafts are applied. The next safe backend step is the RLS behavioral matrix (four controlled identities) against the now-live tables, and/or filling real controlled-run metadata into the evidence scaffold — both still require human-provided identities/metadata and should not be fabricated. UI writes against these tables remain gated behind that verification regardless of the feature flag state.