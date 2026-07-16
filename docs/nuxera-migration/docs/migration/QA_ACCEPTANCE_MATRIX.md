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
