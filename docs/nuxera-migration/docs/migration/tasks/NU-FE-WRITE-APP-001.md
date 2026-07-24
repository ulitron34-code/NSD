# NU-FE-WRITE-APP-001 - Guarded applicant checklist write UX

## Objective
Enable the first low-risk NUXERA frontend write path for applicant checklist progress, using the existing `PATCH /api/nuxera/orders/:orderId/state/checklist` endpoint.

## Scope
- Add frontend API client support for checklist state PATCH.
- Add a guarded save helper/hook path in `workspaceStateAdapter`.
- Add disabled-by-default UI controls in applicant NUXERA home unless a real order and remote state are available.
- Preserve local fallback and no-write behavior for demo, missing-order and backend-error modes.

## Explicit non-goals
- No document uploads, signed URLs, document permission changes or data-room share changes.
- No grantor/admin writes.
- No SQL application to Supabase/production.
- No automatic credit, funding, investment or approval decisions.

## Acceptance
- UI write is behind NUXERA flag and real-order availability.
- Payload is limited to checklist `completedItemIds` metadata.
- Save failure keeps fallback local state and surfaces a safe message.
- Tests cover payload construction and existing merge behavior.
