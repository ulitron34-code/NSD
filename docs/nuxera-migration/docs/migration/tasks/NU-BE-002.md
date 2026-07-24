# NU-BE-002 - NUXERA workspace state skeleton

## Objective
Create the first backend skeleton for persisted NUXERA state using the approved `NU-BE-001` contract, limited to applicant checklist state only.

## Context
`NU-BE-001` defined the persistence contract. This task starts implementation carefully with SQL draft, backend service, route skeleton and mocked tests. It does not connect frontend writes and does not persist grantor memo/admin controls.

## Authorized scope
- SQL draft for `nuxera_workspace_states`.
- Backend service for applicant checklist state read/upsert.
- Backend route skeleton under `/api/nuxera`.
- Mocked backend unit tests.
- Documentation updates.

## Prohibited changes
- Do not apply SQL to production.
- Do not connect UI writes.
- Do not persist grantor memo, admin controls, market provider state or strategy packages.
- Do not alter existing roles, permissions, RLS policies, data-room shares or legacy routes.
- Do not create approval/term-sheet/credit-decision status.

## Implemented work
- Added draft SQL file `backend/sql_migrations_pendientes/2026-07-16_nuxera_workspace_states.sql`.
- Added `backend/src/services/nuxeraWorkspaceStateService.js`.
- Added `backend/src/routes/nuxera.js`.
- Mounted route with `app.use('/api', nuxeraRoutes)`.
- Added `backend/src/services/nuxeraWorkspaceStateService.test.js`.

## Runtime contract
- `GET /api/nuxera/orders/:orderId/state`
  - Requires existing `case:own:read` permission.
  - Returns applicant checklist state only.
  - If no row exists, returns guarded default state with `persisted: false`.
- `PATCH /api/nuxera/orders/:orderId/state/checklist`
  - Requires existing `case:own:update` permission.
  - Upserts applicant checklist state only.
  - Verifies `service_orders.id + user_id` ownership before write.
  - Emits `nuxera_state_created` or `nuxera_state_updated` audit event.

## Acceptance evidence
- Skeleton references existing `service_orders` ownership.
- State is limited to `workspace_role=applicant` and `surface=checklist`.
- Unsupported status such as credit approval is rejected.
- Every upsert path writes audit metadata through `logAuditEvent`.
- No frontend writes or production SQL application were introduced.

## Validation checklist
- Backend targeted test: passed, 1 file / 5 tests.
- Backend full test suite: passed, 37 files / 390 tests.
- `git diff --check`: passed.
- `node scripts/check-supabase-pending-sql.js`: blocked by pre-existing missing fixture `backend/supabase_pendiente_010626.sql`; not caused by NU-BE-002 SQL draft.

## Handoff
Update `PROJECT_STATE.md`, `MIGRATION_MATRIX.md`, `NUXERA_PERSISTENCE_CONTRACTS.md` and the external Downloads handoff after validation.
