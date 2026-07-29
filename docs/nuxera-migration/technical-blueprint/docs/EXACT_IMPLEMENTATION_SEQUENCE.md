# Implementation Sequence — Exact First Commits

## Commit 1: Documentation only
Add the technical blueprint and starter-code package under `/docs/nu-migration/`.
No runtime changes.

## Commit 2: Experience provider
Create:
- `src/experience/experienceStorage.js`
- `src/experience/experienceFlags.js`
- `src/experience/ExperienceContext.jsx`

Modify:
- `src/App.jsx`

Acceptance:
- Current app behaves exactly the same when `VITE_NU_EXPERIENCE_ENABLED` is absent.
- Existing `classic` and `new` values continue working.

## Commit 3: N&U shell skeleton
Create all files under `src/nu/`.
Do not connect existing business modules yet.

Acceptance:
- `VITE_NU_EXPERIENCE_ENABLED=true` allows N&U view.
- Applicant, grantor and admin render different homes.
- Exit returns to current view.
- Refresh preserves selected experience.

## Commit 4: Brand compatibility
Modify:
- `src/config/brand.js`
- `src/components/Layout/Header.jsx`
Add:
- `/public/logo-nu.png`

Acceptance:
- New logo renders.
- Fallback remains valid.
- Public and protected pages do not break.

## Commit 5 onward: domain composition
Map existing dashboard modules into N&U journeys one role at a time.
Do not copy business logic. Wrap and compose.
