# NU-DB-VERIFY-002 - Consolidated local SQL draft guard

## Objective
Extend local verification for NUXERA SQL drafts so `workspace_states`, `evidence_links` and `admin_controls` are checked before any controlled Supabase application.

## Scope
- Add a consolidated local guard script for all current NUXERA SQL drafts.
- Keep the previous workspace-state-specific guard available.
- Update backend `check:nuxera-sql` to run the consolidated guard.
- Validate additive table creation, FK anchors, JSON payload/provenance, RLS, active indexes and read/write policy boundaries.

## Explicit non-goals
- No SQL application to Supabase/production.
- No live schema/RLS verification.
- No frontend writes.
- No permission expansion.

## Acceptance
- Guard rejects destructive operations against legacy anchor tables.
- Guard verifies owner-scoped evidence read policy remains select-only.
- Guard verifies admin controls remain select-only in this slice.
- Direct Node execution passes in the local environment.