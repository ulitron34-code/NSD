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

## Follow-up implementation

The admin console now surfaces the controlled RLS/endpoint evidence package directly in the NUXERA experience.

Additional scope completed:
- `mergeBackendReadinessWithConsole` now returns `controlledVerificationPackage` with required identities, endpoint checks, denied checks, no-go criteria, rollback checks and evidence-template path.
- The controlled package feeds the admin audit package through `controlled-rls-endpoint-evidence` scope and `controlled-verification-package` signal.
- `NuxeraHome` admin view renders a dedicated `Paquete RLS/endpoints` section.
- Styles were extended for the new admin evidence package panel.
- Frontend NUXERA tests cover the package, endpoint list, template path, audit signal and next actions.
## Operational signal follow-up

The controlled evidence package now contributes operational admin observability.

Additional scope completed:
- Added `controlled-verification-evidence` health signal.
- Added controlled verification action queue items for template completion, denied-path evidence and rollback rehearsal.
- The action queue remains human-only and does not execute endpoints, apply SQL or mutate permissions.
- Frontend NUXERA tests cover the health signal and action queue integration.