# NU-DB-VERIFY-001 - NUXERA SQL Guard Verification

## Goal
Verify the NUXERA workspace state SQL draft before any production or Supabase application.

## Scope
- Validate the draft SQL file locally.
- Confirm it is additive and owner-scoped.
- Confirm no destructive SQL is present.
- Record environment blockers for live Supabase verification.

## Implemented
- Added `backend/scripts/check-nuxera-workspace-state-sql.js`.
- Added backend package script `check:nuxera-sql`.
- Verified the SQL draft includes:
  - `nuxera_workspace_states` additive table.
  - `service_orders(id)` foreign key anchor.
  - role and surface checks.
  - JSONB payload default.
  - soft archive via `archived_at`.
  - active unique index for `order_id + workspace_role + surface`.
  - RLS enabled.
  - owner-scoped select, update and insert policies.
- Verified the SQL draft does not include destructive operations such as `DROP TABLE`, `TRUNCATE`, legacy table drops or `DELETE FROM service_orders`.

## Validation
- Direct script syntax check passed.
- Direct SQL guard execution passed.
- Live Supabase schema check was not run successfully because Supabase environment variables are absent.
- Package-script execution through pnpm was blocked by the local pnpm wrapper trying to perform a non-interactive modules purge/install; direct Node execution is the accepted validation for this task.
- Backend full test suite passed: 38 files / 396 tests.

## Out of Scope
- Applying SQL to Supabase or production.
- Running live RLS tests with real Supabase auth users.
- Enabling frontend writes.
- Expanding persistence beyond applicant checklist.

## Next
In an environment with Supabase credentials, apply the SQL draft to a controlled database, run the schema check, exercise GET/PATCH with controlled applicant rows and only then consider the first UI write path.