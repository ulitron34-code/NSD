# NU-ADM-EVID-001 - Admin Read-Only Evidence Coverage

## Goal
Expose evidence coverage in the admin NUXERA console as read-only compliance/readiness metadata.

## Scope
- Reuse the frontend-only evidence ledger.
- Summarize coverage by engine.
- Mark visibility as `internal-review`.
- Keep admin controls and evidence links unpersisted.

## Implemented
- Added evidence coverage derivation in `src/nuxera/admin/operationsConsole.js`.
- Added admin evidence coverage panel in `src/nuxera/pages/NuxeraHome.jsx`.
- Added CSS for the admin coverage panel.
- Added tests confirming evidence signals, engine coverage, internal visibility and no-grants policy.

## Validation
- Targeted NUXERA frontend test passed: 1 file / 52 tests.
- Frontend lint passed.
- Frontend build passed.
- Frontend full unit suite passed: 9 files / 213 tests.
- `git diff --check` passed.

## Out of Scope
- Creating backend `nuxera_admin_controls` routes or SQL.
- Creating backend `nuxera_evidence_links` routes or SQL.
- Persisting evidence coverage.
- Granting access, exporting evidence packages or changing permissions.

## Next
Pause for handoff, or open a dedicated backend task for `nuxera_evidence_links` contracts/skeleton with UI writes still disabled.