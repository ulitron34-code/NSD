# Rollback Plan

## Default rollback mechanism
Disable the feature flag for the new module and route the user to the legacy equivalent.

## Requirements
- No destructive data migration in a UI migration task.
- Database migrations must be backward compatible.
- New fields must be nullable or have safe defaults during coexistence.
- Old APIs remain available until all consumers migrate.
- Every release records the prior known-good commit and deployment.

## Trigger conditions
Rollback immediately for authentication failure, authorization leak, data corruption, inaccessible critical workflow, payment error, high-severity Sentry regression or failed production health checks.

## NUXERA persistence rollback

- Disabling `VITE_NUXERA_EXPERIENCE_ENABLED` must stop NUXERA UI reads and writes while preserving all stored state.
- New `nuxera_*` records must support soft archive or status-based hiding; do not delete audit-relevant records during rollback.
- Legacy `service_orders`, `documents`, `document_reviews`, data-room shares and `audit_logs` remain the source of continuity.
- If a NUXERA write path fails, the UI must degrade to local/read-only state and show that persistence is unavailable.
- Grantor memos and review artifacts can be hidden or archived but cannot be treated as approved, exported or deleted by rollback.
- Admin controls must record the prior known-good commit, feature flag status and incident reason before rollback is marked complete.

## NUXERA SQL/RLS rollback rehearsal

Before applying pending NUXERA SQL drafts to production:

- Rehearse feature-flag rollback in a controlled environment.
- Confirm legacy service order, document, review and data-room flows do not require `nuxera_*` tables.
- Confirm `nuxera_*` records can be hidden or soft-archived without deleting audit history.
- Capture row counts for each new table before and after rollback rehearsal.
- Record the prior known-good commit, SQL filenames, deployment id, rollback owner and incident criteria.
- Do not rollback by deleting `audit_logs`, documents, document reviews or service orders.