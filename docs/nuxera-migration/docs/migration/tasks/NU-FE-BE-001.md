# NU-FE-BE-001 - Applicant Read-Only State Adapter

## Goal
Connect the applicant NUXERA checklist view to the first backend state endpoint in read-only mode, while preserving local fallback behavior and keeping writes disabled.

## Scope
- Expose `GET /api/nuxera/orders/:orderId/state` from the frontend API client.
- Normalize applicant checklist state into UI-safe metadata.
- Merge persisted checklist completion into the local data-room checklist view when available.
- Keep the adapter behind the NUXERA experience and real-order availability.
- Preserve local fallback in demo mode, missing-order mode and endpoint failure mode.

## Implemented
- Added `nuxeraWorkspaceStateAPI.getOrderState(orderId)` in `src/services/api.js`.
- Added `src/nuxera/applicant/workspaceStateAdapter.js`.
- Updated `src/nuxera/pages/NuxeraHome.jsx` to display backend state metadata and continue local fallback.
- Added compact CSS for the state caption.
- Added tests for state normalization and read-only checklist merge behavior.

## Validation
- Targeted NUXERA frontend test passed: 1 file / 48 tests.
- Frontend lint passed.
- Frontend build passed.
- Frontend full unit suite passed: 9 files / 209 tests.
- `git diff --check` passed.

## Out of Scope
- Frontend PATCH/write behavior.
- Applying SQL to Supabase or production.
- Changing data-room permissions or document access.
- Persisting grantor memo, evidence links, review artifacts or admin controls.
- Manual screenshot verification, blocked by local browser launch restrictions.

## Next
Apply and verify the SQL draft in a controlled Supabase environment before enabling the first UI write path, or continue with read-only adapters for evidence links.