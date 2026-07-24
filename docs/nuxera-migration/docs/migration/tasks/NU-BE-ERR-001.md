# NU-BE-ERR-001 - Controlled NUXERA route errors

## Objective

Return controlled, non-leaky errors from NUXERA backend routes before live SQL/RLS rollout.

## Scope

- Map NUXERA ownership/permission service failures to a generic 404 response.
- Map invalid persisted/request data to a generic 422 response.
- Map backend or unapplied-table failures to a generic 503 response.
- Extend route tests for controlled error behavior.

## Guardrails

- Does not apply SQL to Supabase/production.
- Does not change RLS policies, permission grants or database schemas.
- Does not expose new write endpoints.
- Does not mutate data-room access, shares, signed URLs or document visibility.

## Validation

- `node --check` on `backend/src/routes/nuxera.js`: passed.
- `node --check` on `backend/src/routes/nuxera.test.js`: passed.
- Targeted backend route test: passed, 1 file / 13 tests.