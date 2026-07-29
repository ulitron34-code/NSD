# NU-ADM-RLS-MATRIX-001 - Admin RLS verification matrix

## Objective

Expose a local controlled-identity RLS verification matrix in the NUXERA admin console.

## Scope

- Build RLS verification scenarios from backend readiness signals.
- Cover applicant owner, different applicant, authorized grantor and admin/internal identities.
- Surface required reads, writes, denials and readiness blockers.
- Display the matrix in the admin console next to backend readiness handoff.

## Guardrails

- Does not run Supabase queries.
- Does not apply SQL to Supabase/production.
- Does not change RLS policies, permission grants or database schemas.
- Does not expose new write endpoints.
- Does not mutate documents, data-room shares, signed URLs or document visibility.

## Validation

- `node --check` on `src/nuxera/admin/backendReadinessAdapter.js`: passed.
- Targeted frontend NUXERA test: passed, 1 file / 69 tests.
- Frontend full suite: passed, 9 files / 230 tests.