# NU-EVID-001 - Read-Only Evidence Ledger

## Goal
Create a frontend-only evidence ledger that normalizes existing NUXERA evidence signals before persisted `nuxera_evidence_links` are implemented.

## Scope
- Reuse existing local NUXERA sources.
- Normalize evidence id, engine, status, visibility, provenance, path and guardrail.
- Show a compact read-only ledger on the applicant NUXERA home.
- Keep data-room permissions and document access unchanged.

## Implemented
- Added `src/nuxera/evidence/evidenceLedger.js`.
- Combined applicant checklist requirements, demo document summaries, Intelligence research sources, Strategy evidence links and Finance journey links.
- Added read-only applicant home panel showing normalized evidence count and first evidence rows.
- Added tests for engine coverage, role-scoped visibility and no-new-access policies.

## Validation
- Targeted NUXERA frontend test passed: 1 file / 50 tests.
- Frontend lint passed.
- Frontend build passed.
- Frontend full unit suite passed: 9 files / 211 tests.
- `git diff --check` passed.

## Out of Scope
- Creating backend `nuxera_evidence_links` routes or SQL.
- Persisting evidence links.
- Granting document/data-room access.
- Exporting evidence packages.
- Connecting UI writes.

## Next
Continue with grantor/admin read-only evidence surfaces, or start a dedicated backend contract/skeleton for `nuxera_evidence_links` while keeping UI writes disabled.