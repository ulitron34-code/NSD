# NU-BE-EVID-001 - NUXERA Evidence Link Backend Skeleton

## Goal
Create the first backend skeleton for NUXERA evidence links without enabling writes or changing document/data-room access.

## Scope
- Draft SQL for `nuxera_evidence_links`.
- Owner-scoped read-only service.
- Read-only GET route for applicant-owned orders.
- Tests with mocked Supabase and route service mocks.

## Implemented
- Added `backend/sql_migrations_pendientes/2026-07-17_nuxera_evidence_links.sql`.
- Added `backend/src/services/nuxeraEvidenceLinkService.js`.
- Added `GET /api/nuxera/orders/:orderId/evidence` in `backend/src/routes/nuxera.js`.
- Added service tests for default empty state, owner rejection, owner link mapping and invalid engine rejection.
- Extended route tests for evidence read permission and response guardrails.

## Validation
- Backend targeted tests passed: 2 files / 12 tests.
- Backend full suite passed: 39 files / 402 tests.
- `node --check` passed for new/changed backend files.
- `git diff --check` passed.

## Out of Scope
- Applying SQL to Supabase/production.
- POST/PATCH evidence writes.
- Grantor/internal evidence authorization.
- Data-room permission changes.
- Frontend connection to the evidence endpoint.

## Next
Connect a read-only frontend adapter to `GET /api/nuxera/orders/:orderId/evidence`, or verify/apply SQL drafts in a controlled Supabase environment before any writes.