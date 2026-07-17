# NUXERA SQL/RLS Readiness Checklist v1

## Purpose

Define the minimum go/no-go checklist before applying any pending NUXERA SQL draft to a controlled Supabase environment.

This is documentation-only. It does not apply SQL, change RLS, create tables, run live Supabase checks or enable UI writes.

## Scope

Pending NUXERA SQL drafts currently covered by the local guard:

| Draft | Purpose | Current application status |
|---|---|---|
| `backend/sql_migrations_pendientes/2026-07-16_nuxera_workspace_states.sql` | Applicant checklist state container. | Draft only; not applied to Supabase/production. |
| `backend/sql_migrations_pendientes/2026-07-17_nuxera_evidence_links.sql` | Owner-visible evidence-link references. | Draft only; not applied to Supabase/production. |
| `backend/sql_migrations_pendientes/2026-07-17_nuxera_admin_controls.sql` | Admin read-only control state. | Draft only; not applied to Supabase/production. |

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

### RLS verification

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
- Every denied path must return controlled 401/403/404 behavior without leaking existence of restricted rows.
- Every write must emit an `audit_logs` event before the UI write path is considered production-capable.

## Feature-flag gates

- `VITE_NUXERA_EXPERIENCE_ENABLED=false` must hide NUXERA UI reads/writes.
- UI must degrade to local/read-only fallback when endpoints fail.
- Applicant checklist write controls must remain disabled unless a real order id, persisted state and approved backend contract are present.
- Grantor memo export, admin control writes, evidence-link writes and document access changes remain blocked until separate tasks approve them.

## Go/no-go checklist

| Gate | Required evidence | Status before live SQL |
|---|---|---|
| Local SQL guard | Guard output attached to handoff. | Required. |
| Controlled DB apply | Non-production Supabase apply log. | Required. |
| RLS matrix | Applicant, different applicant, grantor and admin checks. | Required. |
| Endpoint tests | Backend service/route tests and controlled API calls. | Required. |
| Audit writes | `audit_logs` rows verified for writes. | Required before any write UI. |
| Rollback rehearsal | Feature flag off and soft-archive/hide behavior verified. | Required. |
| Production approval | Human approval with commit, SQL hash and rollback owner. | Required. |

## Rollback expectations

- Rollback starts by disabling the NUXERA feature flag.
- Do not delete `nuxera_*` rows after live use; use soft archive/status hiding.
- Legacy dashboards and service order flows must continue without reading `nuxera_*` tables.
- If a write path fails, UI returns to local/read-only state and records the failure for admin review.
- Any rollback report must include prior known-good commit, SQL filenames, table row counts and affected order ids.

## Current recommendation

Do not apply these SQL drafts directly to production yet. The next safe backend step is a controlled Supabase verification task that records schema/RLS evidence without enabling additional UI writes.