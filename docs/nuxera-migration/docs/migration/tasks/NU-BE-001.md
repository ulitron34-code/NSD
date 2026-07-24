# NU-BE-001 - NUXERA persistence contract design

## Objective
Design the first backend/API persistence contracts for NUXERA state before any database migration, route implementation or UI write path is enabled.

## Context
The NUXERA frontend now has local applicant, grantor and admin foundations. The next risk is not another local screen; it is deciding what can be persisted, who can read it, who can write it, how it is audited and how rollback works.

## Authorized scope
- Documentation-only persistence contract.
- Proposed tables, API routes, permissions, audit events and rollback requirements.
- Mapping to existing `service_orders`, `documents`, `document_reviews`, `audit_logs`, data-room permissions and backend role permissions.
- Migration matrix, QA and rollback documentation updates.

## Prohibited changes
- Do not create SQL migrations yet.
- Do not add backend routes or services yet.
- Do not connect UI writes to backend.
- Do not change existing roles, permissions, RLS policies or data-room behavior.
- Do not persist grantor memo, admin controls or applicant checklist state in this task.

## Implemented work
- Added `NUXERA_PERSISTENCE_CONTRACTS.md`.
- Defined proposed modules: `nuxera_workspace_states`, `nuxera_evidence_links`, `nuxera_review_artifacts`, `nuxera_admin_controls`.
- Drafted API routes under `/nuxera` without changing existing routes.
- Drafted additive permissions and role access matrix.
- Defined required audit event names and minimum audit metadata.
- Defined rollback requirements and implementation gates for `NU-BE-002`.

## Acceptance evidence
- Contract references existing backend anchors instead of duplicating ownership.
- Contract keeps all writes auditable and rollback-friendly.
- Contract preserves feature flag, legacy dashboard, data-room authorization and human-review guardrails.
- No runtime/backend/schema behavior changed.

## Validation checklist
- Documentation syntax and whitespace check passed with `git diff --check`.
- Runtime tests not required because this is documentation-only and does not change executable code.

## Handoff
Update `PROJECT_STATE.md`, `MIGRATION_MATRIX.md`, `QA_ACCEPTANCE_MATRIX.md`, `ROLLBACK_PLAN.md` and the external Downloads handoff after validation.
