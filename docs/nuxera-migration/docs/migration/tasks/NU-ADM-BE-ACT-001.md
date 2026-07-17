# NU-ADM-BE-ACT-001 - Backend readiness admin actions

## Objective

Turn backend readiness gaps into actionable admin health signals and human follow-up queue items.

## Scope

- Add a backend readiness health signal to the admin console merge layer.
- Add one admin action queue item per unavailable backend readiness signal.
- Keep actions informational and human-owned.
- Preserve the read-only backend readiness panel and existing local operations console.

## Guardrails

- Does not apply SQL to Supabase/production.
- Does not change RLS policies, permission grants or database schemas.
- Does not expose new write endpoints.
- Does not execute admin actions automatically.
- Does not mutate documents, data-room shares, signed URLs or document visibility.

## Validation

- `node --check` on `src/nuxera/admin/backendReadinessAdapter.js`: passed.
- Targeted frontend NUXERA test: passed, 1 file / 69 tests.
- Frontend full suite: passed, 9 files / 230 tests.