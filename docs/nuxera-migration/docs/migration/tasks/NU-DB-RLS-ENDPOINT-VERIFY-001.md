# NU-DB-RLS-ENDPOINT-VERIFY-001 - Controlled RLS and endpoint verification plan guard

## Objective
Add a local guard that confirms the controlled Supabase verification packet is complete before applying NUXERA SQL drafts to a non-production database.

## Scope
- Add `backend/scripts/check-nuxera-controlled-verification-plan.js`.
- Add backend script alias `check:nuxera-verification-plan`.
- Add `docs/migration/NUXERA_CONTROLLED_RLS_ENDPOINT_EVIDENCE_TEMPLATE.md` for controlled run evidence capture.
- Verify the readiness checklist, SQL drafts, backend readiness service and admin adapter still contain the required evidence for the next controlled RLS/endpoint pass.

## Explicit non-goals
- No SQL application to Supabase.
- No live RLS execution.
- No production writes.
- No data-room, document-grant or permission mutation.

## Acceptance
- Guard requires the four RLS identities: applicant owner, different applicant, authorized grantor and admin/internal.
- Guard requires the five endpoint checks for state, checklist patch, evidence, admin controls and admin readiness.
- Guard confirms SQL drafts and admin readiness artifacts are still present before handoff.
- Evidence template captures run metadata, RLS scenarios, endpoint results, no-go criteria, rollback rehearsal and approval decision.
- Direct Node execution passes locally.
