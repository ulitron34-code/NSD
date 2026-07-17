# NU-DB-APPLY-READINESS-001 - SQL/RLS readiness checklist

## Objective

Create a documentation-only readiness checklist for controlled NUXERA SQL/RLS application before any pending draft is applied to Supabase or production.

## Scope

- Document pending NUXERA SQL drafts and dependency order.
- Define local guard, controlled Supabase, RLS, endpoint, feature-flag and rollback gates.
- Update migration matrix, QA acceptance matrix, rollback plan and project state.

## Guardrails

- Does not apply SQL to Supabase/production.
- Does not change backend routes, RLS policies, permissions or UI writes.
- Does not mutate data-room access, shares, signed URLs or document visibility.
- Keeps grantor memo export, admin control writes and evidence-link writes blocked.

## Validation

- Documentation-only task; no runtime behavior changed.
- Direct NUXERA SQL draft guard from `backend/`: passed.
- Literal newline check: passed.
- `git diff --check`: passed.