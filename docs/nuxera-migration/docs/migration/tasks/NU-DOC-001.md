# NU-DOC-001 - Applicant contextual document center foundation

## Objective
Add a frontend-only contextual document center for the applicant that groups document readiness by business context instead of exposing a flat file list.

## Scope
- Add a local/read-only document center model using demo document metadata and existing minimum requirements.
- Group documents into identity/KYB, project/use-of-funds, financial/transparency and risk/impact folders.
- Mount the document center in applicant NUXERA home.
- Add unit coverage for folders, document summary and guardrails.

## Explicit non-goals
- No document uploads, deletes, signed URLs or file mutations.
- No data-room share, role permission or visibility changes.
- No backend/API/database contract changes.
- No credit approval, term sheet, investment recommendation or automatic decision.

## Acceptance
- Applicant sees contextual document folders with readiness and next document work.
- The active folder exposes read-only document rows and requirement-derived rows.
- Existing NUXERA modules are linked only as context.
- Guardrails state no uploads, no permission changes and human review required.