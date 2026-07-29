# NUXERA Non-Production Persistence Runbook

Date: 2026-07-29
Scope: prepare controlled persistence without enabling production writes.

## Ledgers covered

- `nuxera_case_events`
- `nuxera_notification_approvals`
- `nuxera_evidence_links` provenance columns

## Existing SQL drafts

- `backend/sql_migrations_pendientes/2026-07-23_nuxera_case_events.sql`
- `backend/sql_migrations_pendientes/2026-07-23_nuxera_notification_approvals.sql`
- `backend/sql_migrations_pendientes/2026-07-23_nuxera_evidence_provenance_columns.sql`

## Step 1 - Static SQL Review

Run the repo SQL checker and record output:

```bash
cd backend
npm run check:nuxera-sql
```

Acceptance:

- No destructive operations.
- RLS policies explicitly cover owner, authorized funding provider and admin read paths.
- Writes remain service-role/admin-controlled, not frontend-controlled.

## Step 2 - Apply in Non-Production Only

Apply the SQL drafts to a non-production database. Do not use production first.

Required evidence:

- Migration timestamp.
- Database/environment name.
- Operator initials.
- Rollback command or rollback migration.
- Before/after table existence checks.

## Step 3 - Run Operational Persistence Plan

Use Admin endpoint:

```text
GET /api/nuxera/admin/orders/:orderId/operational-persistence-plan?language=en
```

Acceptance:

- The endpoint returns three ledgers.
- `writeEnabled` remains `false` unless an explicit backend gate is introduced later.
- Candidate payloads contain metadata only.
- Dedupe keys are stable.

## Step 4 - Controlled Write Design Before Production

Before production writes are enabled, create a separate change request with:

- Service-role function name.
- Exact rows/tables writable.
- Idempotency/dedupe strategy.
- Audit event emitted for every write.
- Rollback plan.
- RLS evidence JSON.

## Current Position

The application now exposes a read-only operational persistence plan. It is ready for non-production SQL/RLS rehearsal, not for production writes.
