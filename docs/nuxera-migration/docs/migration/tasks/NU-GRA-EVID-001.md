# NU-GRA-EVID-001 - Grantor Read-Only Evidence Ledger

## Goal
Show the existing NUXERA evidence ledger in the grantor workspace as authorized-summary metadata without granting document access or creating persistence.

## Scope
- Reuse the frontend-only evidence ledger from `NU-EVID-001`.
- Display a compact grantor panel near the workbench/memo flow.
- Keep visibility as `authorized-summary-only`.
- Preserve data-room permissions and document access unchanged.

## Implemented
- Added grantor evidence ledger panel in `src/nuxera/pages/NuxeraHome.jsx`.
- Added CSS for the grantor ledger panel.
- Added tests confirming grantor-safe rows, guardrails and no-new-access policy.

## Validation
- Targeted NUXERA frontend test passed: 1 file / 51 tests.
- Frontend lint passed.
- Frontend build passed.
- Frontend full unit suite passed: 9 files / 212 tests.
- `git diff --check` passed.

## Out of Scope
- Creating backend `nuxera_evidence_links` routes or SQL.
- Persisting evidence links.
- Granting document/data-room access.
- Exporting evidence packages.
- Connecting UI writes.

## Next
Add admin read-only evidence/compliance mapping, or start a dedicated backend contract/skeleton for `nuxera_evidence_links` with UI writes still disabled.