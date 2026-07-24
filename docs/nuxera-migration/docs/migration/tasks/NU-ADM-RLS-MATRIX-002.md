# NU-ADM-RLS-MATRIX-002 - RLS matrix admin surface finalization

## Objective

Finalize the local RLS verification matrix as an admin-visible readiness artifact before controlled Supabase/RLS verification.

## Scope

- Derive RLS verification scenarios from backend readiness signals.
- Display applicant owner, different applicant, authorized grantor and admin/internal scenarios in the admin console.
- Surface read/write expectations, denial requirements and readiness blockers.
- Keep the matrix as a local planning artifact for controlled Supabase verification.

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