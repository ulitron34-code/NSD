# NU-BE-READINESS-001 - Backend readiness preflight

## Objective

Expose a read-only NUXERA backend readiness preflight for admin review before live SQL/RLS rollout.

## Scope

- Add backend readiness service for expected NUXERA tables.
- Add `GET /api/nuxera/admin/readiness` behind `nuxera:admin:read`.
- Mark missing/unavailable tables as readiness signals instead of throwing raw backend failures.
- Add frontend API client and admin readiness adapter.
- Display backend readiness in the NUXERA admin console.
- Add backend service, route and frontend adapter tests.

## Guardrails

- Does not apply SQL to Supabase/production.
- Does not change RLS policies, permission grants or database schemas.
- Does not expose new write endpoints.
- Does not mutate documents, data-room shares, signed URLs or document visibility.
- Table visibility is not treated as RLS approval; controlled identity verification is still required.

## Validation

- `node --check` on backend readiness service/test, NUXERA routes/test and frontend readiness adapter: passed.
- Targeted backend tests: passed, 2 files / 19 tests.
- Targeted frontend NUXERA test: passed, 1 file / 68 tests.
- Backend full suite: passed, 41 files / 419 tests.
- Frontend full suite: passed, 9 files / 229 tests.