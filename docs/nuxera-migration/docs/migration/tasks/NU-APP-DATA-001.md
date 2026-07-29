# NU-APP-DATA-001 - Applicant company and project workspace foundation

## Objective
Add a frontend-only NUXERA workspace that unifies company, project, financing and risk/impact preparation data for the applicant.

## Scope
- Add a local company/project workspace model for applicant metadata and checklist evidence.
- Normalize existing order metadata when available and fallback safely when no real order exists.
- Mount the workspace in applicant NUXERA home.
- Add unit coverage for metadata normalization, evidence sections and guardrails.

## Explicit non-goals
- No backend/API contract changes.
- No persistence of company/project answers or metadata.
- No document upload, document permission, data-room share or visibility changes.
- No credit approval, term sheet, investment recommendation or automatic decision.

## Acceptance
- Applicant sees company, project, financing and risk/impact sections.
- Each section shows readiness, next evidence and an existing module route.
- Real order metadata can be displayed when available without mutating it.
- Guardrails remain explicit and tests cover the local-only boundary.