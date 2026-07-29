# NUXERA QA English, RLS Phase 2 and Operational Persistence - 2026-07-29

## Scope implemented

This package adds three production-readiness workstreams without enabling destructive writes:

1. English QA evidence capture for public, applicant, grantor and admin views.
2. HTTP/RLS phase 2 evidence output in JSON, with mustAllow and mustDeny scenarios.
3. Operational persistence dry-run plan that consolidates case events, notification approvals and evidence provenance.

## English QA

Command:

```bash
npm run qa:nuxera:english
```

Default target:

```text
https://nsd-pi.vercel.app
```

Optional variables:

```bash
NUXERA_PUBLIC_BASE_URL=http://localhost:5173
NUXERA_ENGLISH_QA_OUT=artifacts/nuxera-english-qa
```

Output:

- `english-qa-evidence.json`
- `public-home.png`
- `applicant-dashboard-en.png`
- `grantor-workspace-en.png`
- `admin-operations-en.png`

Acceptance criteria:

- Public metadata keeps NUXERA identity.
- Applicant, grantor and admin demo sessions open in English mode.
- No NEXUS-facing copy appears in the captured first-pass evidence.
- Screenshots are review artifacts only; they do not prove backend authorization or RLS.

## RLS Phase 2 Evidence

Commands:

```bash
cd backend
npm run verify:nuxera-http:plan
npm run verify:nuxera-http:json -- --out ../artifacts/nuxera-http-rls-evidence.json
```

Required environment variables:

```text
NUXERA_HTTP_BASE_URL
NUXERA_APPLICANT_TOKEN
NUXERA_APPLICANT_ORDER_ID
NUXERA_GRANTOR_TOKEN
NUXERA_GRANTOR_ORDER_ID
NUXERA_ADMIN_TOKEN
NUXERA_FOREIGN_ORDER_ID
```

The verifier now emits structured JSON with:

- allow checks for applicant, grantor and admin endpoints.
- deny checks for foreign applicant access, unauthorized grantor access and non-admin access to admin controls.
- summary status `GO` or `NO-GO`.

Acceptance criteria:

- Applicant can read only own applicant resources.
- Grantor can read only authorized data-room resources.
- Admin can read admin endpoints with `nuxera:admin:read`.
- Foreign owner and unauthorized grantor scenarios return the expected deny status.

## Operational Persistence

New backend service:

```text
backend/src/services/nuxeraOperationalPersistenceService.js
```

New admin endpoint:

```text
GET /api/nuxera/admin/orders/:orderId/operational-persistence-plan?language=en
```

New frontend Admin panel:

```text
Operational persistence / Persistencia operativa
```

The plan consolidates three ledgers:

- `nuxera_case_events`
- `nuxera_notification_approvals`
- `nuxera_evidence_links`

All three remain `dry-run-only`. The endpoint returns insert candidates, blockers, dedupe keys, required gates and guardrails, but it cannot insert, update or delete rows.

Production writes remain blocked until:

- SQL drafts are run in non-production.
- Real RLS evidence is captured with applicant, grantor and admin tokens.
- Service-role write gates are approved per ledger.
- Rollback rehearsal is documented.

## Remaining Real Work

- Execute the English QA script against the final Vercel deployment and archive screenshots.
- Run RLS phase 2 with real Supabase/Auth tokens and archive JSON evidence.
- Apply pending SQL migrations in a non-production database first.
- Wire actual service-role persistence only after approval.
- Execute notification delivery against a sandbox email provider before production delivery.
