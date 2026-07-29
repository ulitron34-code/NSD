# NU-ADM-ACT-001 - Admin local action queue

## Objective

Expose a local admin action queue derived from health signals and audit-package next actions so administrators can prioritize human follow-up before real persistence work.

## Scope

- Build `adminActionQueue` from existing local Admin health signals and audit package actions.
- Mount a compact Admin panel for local-open actions, owners and guardrails.
- Keep the queue informational and read-only.
- Preserve backend contracts, permissions, data-room visibility, exports and AI/manual decision gates.

## Guardrails

- Does not execute actions or write backend state.
- Does not mutate SQL/RLS, feature flags, permissions or data-room access.
- Does not export files, generate downloads or create signed URLs.
- Does not activate AI agents or make binding credit decisions.

## Validation

- Targeted NUXERA frontend test: passed, 1 file / 66 tests.
- Frontend lint: passed.
- Frontend build: passed; Vite emitted the existing large chunk warning.
- Frontend full unit suite: passed, 9 files / 227 tests.
- `node --check` on `operationsConsole.js`: passed.
- `git diff --check`: passed.