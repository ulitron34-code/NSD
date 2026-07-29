# NUXERA RLS Phase 2 Execution Pack

Date: 2026-07-29
Purpose: execute real HTTP/RLS evidence without placing credentials in the repo.

## Required local environment variables

Create a local shell/session only. Do not commit secrets.

```powershell
$env:NUXERA_HTTP_BASE_URL = "https://<backend-host>"
$env:NUXERA_APPLICANT_TOKEN = "<real applicant bearer token>"
$env:NUXERA_APPLICANT_ORDER_ID = "<order owned by applicant>"
$env:NUXERA_GRANTOR_TOKEN = "<authorized funding provider bearer token>"
$env:NUXERA_GRANTOR_ORDER_ID = "<order shared with funding provider>"
$env:NUXERA_ADMIN_TOKEN = "<admin bearer token with nuxera:admin:read>"
$env:NUXERA_FOREIGN_ORDER_ID = "<order not owned by applicant and not shared with grantor>"
$env:NUXERA_HTTP_EVIDENCE_OUT = "..\\artifacts\\nuxera-http-rls-evidence.json"
```

## Commands

```bash
cd backend
npm run verify:nuxera-http:plan
npm run verify:nuxera-http:json
```

The JSON evidence includes allow and deny scenarios.

## MustAllow scenarios

- Applicant reads own `/api/orders`.
- Applicant reads own `/api/nuxera/orders/:orderId/evidence`.
- Authorized funding provider reads `/api/otorgante/pipeline`.
- Authorized funding provider reads `/api/nuxera/orders/:orderId/grantor-evidence`.
- Admin reads users, audit logs, human review queue, readiness metrics and NUXERA readiness.

## MustDeny scenarios

- Applicant cannot read a foreign order state.
- Applicant cannot read foreign evidence.
- Applicant cannot write a foreign checklist state.
- Unauthorized funding provider cannot read grantor evidence.
- Non-admin applicant/funding provider cannot read admin readiness or admin controls.

## Acceptance Criteria

- Summary status is `GO`.
- Every denied case returns the expected `404` or `403`.
- The evidence JSON is attached to the release dossier.
- No token value is pasted into docs, tickets, screenshots or commits.
