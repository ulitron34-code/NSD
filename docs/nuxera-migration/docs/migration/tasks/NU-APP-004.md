# NU-APP-004 - Applicant onboarding wizard foundation

## Objective
Add a frontend-only applicant onboarding wizard that sequences company profile, project case and risk/impact preparation before any persisted workflow is introduced.

## Scope
- Add local onboarding wizard model derived from the existing applicant checklist.
- Mount the wizard in the applicant NUXERA home.
- Keep links scoped to existing NUXERA modules.
- Add unit coverage for stages, evidence and guardrails.

## Explicit non-goals
- No backend/API contract changes.
- No persistence of onboarding answers or documents.
- No credit approval, term sheet, investment recommendation or automatic decision.
- No document permission or data-room write changes.

## Acceptance
- Applicant sees a three-stage onboarding sequence.
- Each stage shows owner, objective, evidence readiness and next missing evidence.
- Wizard remains local preparation-only and human-review guarded.
- Migration matrix and project state are updated after validation.