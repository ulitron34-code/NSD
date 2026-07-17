# QA and Acceptance Matrix

Every migrated module must verify:

- Build passes.
- ESLint passes with zero warnings.
- Unit tests pass.
- Relevant integration tests pass.
- Playwright critical path passes.
- No console errors.
- No unhandled promise rejections.
- Role restrictions match legacy behavior.
- Data written in new view is readable in legacy view and vice versa where applicable.
- Responsive behavior is acceptable.
- Accessibility basics: keyboard navigation, labels, focus order and contrast.
- Sentry does not show a regression after pilot release.
- Rollback switch restores legacy behavior without data loss.

## Backend/API persistence tasks must additionally verify

- New persistence contracts reference existing ownership records before creating new state.
- New tables are additive, nullable/defaulted where possible and backward compatible.
- Every write path has an `audit_logs` event with actor, order id, entity type, prior status, next status and rollback reference.
- Role permissions are additive and do not broaden data-room visibility implicitly.
- Grantor-visible evidence is filtered by existing authorized data-room access.
- Human-review-required artifacts cannot be exported or treated as approval without explicit internal permission.
- Feature flag off prevents new UI writes and leaves legacy reads/writes intact.
- Rollback archives or hides NUXERA state without deleting audit history.

## NUXERA SQL/RLS live-application readiness

Before any pending NUXERA SQL draft is applied outside local static verification:

- Attach local `check-nuxera-sql-drafts` output to the handoff.
- Apply drafts only in a controlled non-production Supabase environment first.
- Verify RLS with applicant owner, different applicant, grantor/otorgante and admin/internal identities.
- Verify denied reads/writes return controlled responses without row-existence leaks.
- Verify every enabled write path emits `audit_logs` metadata before UI write controls are considered production-capable.
- Verify `VITE_NUXERA_EXPERIENCE_ENABLED=false` hides NUXERA UI reads/writes and leaves legacy flows intact.
- Record SQL filenames, commit hash, actor, rollback owner and prior known-good deployment before go-live.