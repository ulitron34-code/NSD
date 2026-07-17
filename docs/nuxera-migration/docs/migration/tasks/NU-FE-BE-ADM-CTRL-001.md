# NU-FE-BE-ADM-CTRL-001 - Read-only frontend adapter for admin controls

## Objective
Connect the NUXERA admin console to `GET /api/nuxera/admin/controls` in read-only mode while preserving the local operations console as fallback.

## Scope
- Add frontend API client coverage for admin controls.
- Normalize backend controls into UI-safe read-only rows.
- Merge backend controls into the local admin console without replacing local gates, incidents or policies.
- Show backend/default control state in the admin NUXERA home behind the NUXERA experience flag.

## Explicit non-goals
- No frontend writes.
- No POST/PATCH/DELETE admin control calls.
- No feature flag mutation.
- No automation, permission or licensed market data activation.
- No SQL application to Supabase/production.

## Acceptance
- Backend controls have local fallback on missing auth, backend error or missing rows.
- Persisted controls are visibly read-only.
- Tests cover response normalization and console merge behavior.
- Existing admin console local state remains intact.