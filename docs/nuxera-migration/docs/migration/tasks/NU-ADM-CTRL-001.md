# NU-ADM-CTRL-001 - Read-only backend skeleton for admin controls

## Objective
Create the first backend skeleton for `nuxera_admin_controls` in read-only mode so the admin console can eventually inspect rollout, incident, readiness and policy controls without enabling writes.

## Scope
- Add draft SQL for `nuxera_admin_controls`.
- Add a read-only service that normalizes persisted controls or returns guarded defaults.
- Add `GET /api/nuxera/admin/controls` behind `nuxera:admin:read`.
- Add service and route tests.

## Explicit non-goals
- No SQL application to Supabase/production.
- No POST/PATCH/DELETE admin control routes.
- No permission expansion beyond the route guard.
- No automation activation, market data activation, feature flag mutation or data-room permission change.

## Acceptance
- Route requires auth and `nuxera:admin:read`.
- Defaults are returned when no rows exist.
- Persisted rows are validated by control type, scope and severity.
- Tests prove controls remain read-only and non-activating.