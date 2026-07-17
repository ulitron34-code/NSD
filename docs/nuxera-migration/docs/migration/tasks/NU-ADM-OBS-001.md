# NU-ADM-OBS-001 - Admin local health signals

## Objective

Expose local admin health signals that summarize rollout governance, runtime tooling, evidence observability, document visibility, decision safety, AI automation and audit readiness.

## Scope

- Build `adminHealthSignals` from existing local console state.
- Mount a compact Admin observability panel.
- Keep signals local/read-only and derived from existing guardrailed surfaces.
- Preserve backend contracts, permissions, data-room visibility and manual decision gates.

## Guardrails

- Does not write backend state or SQL/RLS.
- Does not open documents, export files, generate downloads or create signed URLs.
- Does not change permissions, shares, data-room access or document visibility.
- Does not activate AI agents or make binding credit decisions.

## Validation

- Targeted NUXERA frontend test: passed, 1 file / 65 tests.
- Frontend lint: passed.
- Frontend build: passed; Vite emitted the existing large chunk warning.
- Frontend full unit suite: passed, 9 files / 226 tests.
- `node --check` on `operationsConsole.js`: passed.
- `git diff --check`: passed.