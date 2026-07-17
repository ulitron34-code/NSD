# NU-GRA-DOC-001 - Grantor authorized document summary foundation

## Objective
Add a grantor-safe, read-only document summary panel that helps reviewers understand visible evidence without opening files or changing data-room permissions.

## Scope
- Add local grantor document summary model based on the current workbench required evidence.
- Group summary signals into identity/KYB, project/structure and risk request folders.
- Mount the summary in the grantor NUXERA home.
- Add unit coverage for summary-only guardrails and data-room permission boundaries.

## Explicit non-goals
- No document access expansion, download, upload, delete, signed URL or share mutation.
- No backend/API/database contract changes.
- No term sheet, credit approval, investment recommendation or automatic decision.
- No replacement of existing grantor workbench, memo or evidence ledger.

## Acceptance
- Grantor sees document readiness as authorized summary metadata only.
- Folder counts and next action are visible before memo/ledger review.
- Guardrails explicitly state no file opening, no new access and no data-room permission changes.