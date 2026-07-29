# NU-BE-003 - NUXERA Route Coverage

## Goal
Add route-level backend tests for the first NUXERA state endpoints before connecting any frontend read or write path.

## Scope
- Cover `GET /api/nuxera/orders/:orderId/state`.
- Cover `PATCH /api/nuxera/orders/:orderId/state/:surface`.
- Mock auth/permission middleware and the workspace state service.
- Keep the executable surface limited to applicant checklist state.

## Implemented
- Added `backend/src/routes/nuxera.test.js`.
- Verified authentication is required before state reads.
- Verified `case:own:read` is required before reading applicant checklist state.
- Verified route response shape includes applicant/checklist guardrails.
- Verified `case:own:update` is required before patching state.
- Verified non-checklist surfaces are blocked before service execution.
- Verified checklist patch delegates order id, user id, status, payload and request context to the service.

## Validation
- Targeted route test passed: 1 file / 6 tests.
- Full backend suite passed: 38 files / 396 tests.
- `git diff --check` passed.

## Out of Scope
- Applying SQL to Supabase or production.
- Connecting frontend reads or writes.
- Implementing grantor memo, evidence links, review artifacts or admin controls.
- Changing backend permissions beyond the existing route requirements.

## Next
Connect a read-only frontend adapter behind `VITE_NUXERA_EXPERIENCE_ENABLED=true`, or apply/verify the SQL draft in a controlled Supabase environment before any UI write path.