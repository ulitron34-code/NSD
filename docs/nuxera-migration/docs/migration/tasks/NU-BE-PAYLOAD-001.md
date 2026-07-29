# NU-BE-PAYLOAD-001 - Applicant checklist payload contract

## Objective

Constrain applicant checklist persistence to approved NUXERA metadata before live SQL/RLS rollout.

## Scope

- Normalize backend checklist payloads to approved metadata only.
- Persist only `completedItemIds`, `lastCompletedItemId` and `source` for applicant checklist writes.
- Deduplicate and trim checklist item ids.
- Reject malformed checklist payload metadata.
- Update the frontend patch builder so it does not carry arbitrary prior payload keys forward.

## Guardrails

- Does not apply SQL to Supabase/production.
- Does not change RLS policies, permission grants or database schemas.
- Does not expose new write endpoints.
- Does not mutate documents, data-room shares, signed URLs or document visibility.
- Does not create approval, credit, funding or investment decisions.

## Validation

- `node --check` on `backend/src/services/nuxeraWorkspaceStateService.js`: passed.
- `node --check` on `backend/src/services/nuxeraWorkspaceStateService.test.js`: passed.
- `node --check` on `src/nuxera/applicant/workspaceStateAdapter.js`: passed.
- Targeted backend service test: passed, 1 file / 7 tests.
- Targeted frontend NUXERA test: passed, 1 file / 66 tests.