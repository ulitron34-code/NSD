# NU-ADM-AUD-001 - Admin local audit package

## Objective

Expose a local admin audit package that consolidates rollout gates, readiness, evidence, grantor document readiness and incident controls for human review.

## Scope

- Build `auditPackage` from existing local admin console signals.
- Mount a compact Admin panel with consolidated signals and guardrails.
- Keep the package local, read-only and non-exporting.
- Preserve existing backend contracts, permissions and document visibility.

## Guardrails

- Does not write to backend services or SQL/RLS.
- Does not export files, generate downloads or create signed URLs.
- Does not change permissions, shares, data-room access or document visibility.
- Does not approve credit, term sheets or binding decisions.

## Validation

- Targeted NUXERA frontend test: passed, 1 file / 64 tests.
- Frontend lint: passed.
- Frontend build: passed; Vite emitted the existing large chunk warning.
- Frontend full unit suite: passed, 9 files / 225 tests.
- `node --check` on `operationsConsole.js`: passed.
- `git diff --check`: passed.