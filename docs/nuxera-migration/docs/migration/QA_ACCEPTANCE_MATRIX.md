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
