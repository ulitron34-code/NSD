# Rollback Plan

## Default rollback mechanism
Disable the feature flag for the new module and route the user to the legacy equivalent.

## Requirements
- No destructive data migration in a UI migration task.
- Database migrations must be backward compatible.
- New fields must be nullable or have safe defaults during coexistence.
- Old APIs remain available until all consumers migrate.
- Every release records the prior known-good commit and deployment.

## Trigger conditions
Rollback immediately for authentication failure, authorization leak, data corruption, inaccessible critical workflow, payment error, high-severity Sentry regression or failed production health checks.
