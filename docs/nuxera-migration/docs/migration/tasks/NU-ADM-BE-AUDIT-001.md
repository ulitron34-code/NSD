# NU-ADM-BE-AUDIT-001 - Backend readiness audit package integration

## Objective

Include backend readiness evidence in the local NUXERA admin audit package.

## Scope

- Add backend readiness scope to the merged admin audit package.
- Add a backend readiness signal with readiness percentage and status.
- Add backend readiness next actions to the audit package.
- Keep audit package local/read-only and aligned with the backend readiness handoff.

## Guardrails

- Does not apply SQL to Supabase/production.
- Does not change RLS policies, permission grants or database schemas.
- Does not expose new write endpoints.
- Does not export files or execute audit actions.
- Backend readiness evidence does not replace controlled identity/RLS verification.

## Validation

- `node --check` on `src/nuxera/admin/backendReadinessAdapter.js`: passed.
- Targeted frontend NUXERA test: passed, 1 file / 69 tests.
- Frontend full suite: passed, 9 files / 230 tests.