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
## Backend contract follow-up

The controlled verification plan now has a read-only backend/frontend contract for admin review.

Additional scope completed:
- Added `backend/src/services/nuxeraControlledVerificationService.js` as the single source for required identities, endpoint checks, denied checks, no-go criteria, rollback checks and evidence-template metadata.
- Added `GET /api/nuxera/admin/verification-plan`, protected by `nuxera:admin:read`.
- Added `nuxeraControlledVerificationAPI.getPlan()` and `useControlledVerificationPlan()` so the admin console can prefer the backend plan and fall back to the local package if the backend is unavailable.
- Extended route, service and frontend adapter tests for the read-only contract.

Guardrails:
- The endpoint returns a plan only; it does not execute endpoint checks.
- No SQL, RLS, feature-flag, permission, document-grant or data-room mutation is performed.
- Completed evidence must still come from a controlled non-production Supabase run using the evidence template.
## Evidence scaffold follow-up

The controlled verification package now includes a generated evidence scaffold for the next non-production Supabase run.

Additional scope completed:
- Added `nuxeraControlledEvidenceScaffoldService` to generate Markdown evidence scaffolds from the approved verification plan.
- Added `GET /api/nuxera/admin/verification-evidence-scaffold`, protected by `nuxera:admin:read`.
- Added backend script alias `scaffold:nuxera-evidence` for local Markdown/JSON scaffold generation without starting the server.
- Added frontend API, normalizer and hook so the admin console can surface scaffold readiness.
- Added route, service and frontend adapter tests for scaffold shape and read-only guardrails.

Guardrails:
- The scaffold is generated only; it does not execute endpoint checks.
- No SQL, RLS, feature-flag, permission, document-grant or data-room mutation is performed.
- Operators must fill observed results from a controlled non-production Supabase run.
## Controlled runbook follow-up

The evidence scaffold now has a read-only runbook that tells operators whether the controlled Supabase run is ready to start.

Additional scope completed:
- Added `nuxeraControlledRunbookService` to evaluate required run metadata, commands, operator steps, acceptance gates and next decision.
- Added `GET /api/nuxera/admin/verification-runbook`, protected by `nuxera:admin:read`.
- Added frontend API, normalizer and hook so the admin console can surface runbook readiness.
- Added an admin `Runbook controlado` panel with metadata blockers, commands and gates.
- Added backend and frontend tests for blocked/ready runbook states.

Guardrails:
- The runbook is advisory/read-only; it does not execute checks or apply SQL.
- Production writes remain blocked until observed evidence is attached and reviewed.
- Missing metadata blocks the controlled run before any Supabase operation.
## Evidence review follow-up

The controlled evidence flow now includes a read-only review layer for completed Markdown evidence.

Additional scope completed:
- Added `nuxeraControlledEvidenceReviewService` to detect missing sections, TODO markers, missing decisions and no-go indicators.
- Added `POST /api/nuxera/admin/verification-evidence-review`, protected by `nuxera:admin:read`.
- Added backend CLI alias `review:nuxera-evidence` for local review of a completed Markdown evidence file.
- Added frontend API, normalizer and optional hook for evidence review.
- Added an admin `Review de evidencia` panel showing blockers and next decision.
- Added backend and frontend tests for missing, incomplete, no-go and ready-for-human-review states.

Guardrails:
- Review is in-memory/read-only and does not persist submitted Markdown.
- Ready-for-human-review is not production approval.
- Any TODO, missing decision or no-go keeps NUXERA writes blocked.