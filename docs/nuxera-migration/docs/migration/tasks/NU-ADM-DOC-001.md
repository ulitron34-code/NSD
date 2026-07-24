# NU-ADM-DOC-001 - Admin grantor document readiness

## Objective

Expose a read-only admin view of grantor document review readiness using the existing authorized-summary metadata.

## Scope

- Reuse `getGrantorDocumentSummary` from the grantor workbench foundation.
- Add aggregate document-readiness rows to the admin operations console.
- Mount a compact admin panel for visible, pending and total document signals by case.
- Keep the surface summary-only and local until backend/RLS contracts are approved.

## Guardrails

- Does not grant document access.
- Does not create uploads, downloads, shares, signed URLs or data-room permission changes.
- Does not write to backend services or change SQL/RLS.
- Keeps all decisions human-review gated and non-binding.

## Validation

- Targeted NUXERA frontend test: passed, 1 file / 63 tests.
- Frontend lint: passed.
- Frontend build: passed; Vite emitted the existing large chunk warning.
- Frontend full unit suite: passed, 9 files / 224 tests.
- `node --check` on `operationsConsole.js`: passed.
- `git diff --check`: passed.