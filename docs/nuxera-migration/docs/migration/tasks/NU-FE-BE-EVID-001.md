# NU-FE-BE-EVID-001 - Read-only frontend adapter for owner evidence links

## Objective
Connect the applicant NUXERA evidence ledger to `GET /api/nuxera/orders/:orderId/evidence` in read-only mode, while preserving the local ledger as fallback.

## Scope
- Add frontend API client coverage for the owner evidence endpoint.
- Normalize backend `evidence.links` into the existing ledger row shape.
- Merge persisted owner-visible evidence links ahead of local evidence signals.
- Show backend evidence state in the applicant NUXERA home only when the NUXERA experience is enabled and a real order id exists.

## Explicit non-goals
- No frontend writes.
- No POST/PATCH evidence routes.
- No document download, signed URL, data-room permission or grantor authorization changes.
- No SQL application to Supabase/production.

## Acceptance
- Local fallback remains available in demo, missing-order and backend-error modes.
- Persisted backend links are visibly read-only and owner-scoped.
- Tests cover response normalization and merge behavior.
- Existing NUXERA feature flag and legacy dashboard behavior remain intact.