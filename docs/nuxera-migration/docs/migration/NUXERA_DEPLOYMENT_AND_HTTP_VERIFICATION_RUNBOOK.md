# NUXERA deployment and HTTP verification runbook

## Purpose

This runbook moves the restructured platform from locally validated code to a controlled preview deployment. It does not authorize production activation or database writes.

## 1. Local release gates

Run from the repository root:

```powershell
npm.cmd run test:run
npm.cmd run lint
npm.cmd run build
npm.cmd run test:e2e:chromium
Set-Location backend
npm.cmd test
npm.cmd run go-nogo:local
```

All checks must report GO before publishing a branch or preview.

## 2. Supabase preparation

1. Review pending SQL and RLS policies in `backend/sql_migrations_pendientes`.
2. Apply them manually in the intended Supabase project only after peer approval and backup confirmation.
3. Confirm authenticated users exist for applicant, grantor, and administrator roles.
4. Confirm the selected applicant and grantor orders are linked through accepted `data_room_shares` where required.
5. Never commit service-role keys, access tokens, or `.env` files.

## 3. Vercel preview

1. Push an intentional branch and open a reviewable pull request.
2. Configure the preview environment with the approved Supabase URL/key and backend URL.
3. Keep `VITE_NUXERA_EXPERIENCE_ENABLED=false` until verification succeeds.
4. Deploy a preview, not production, and record its immutable URL.

## 4. GET-only authenticated verification

Use short-lived tokens in the local shell. The verification script never prints them and sends only GET requests.

```powershell
$env:NUXERA_HTTP_BASE_URL='https://preview-api.example.com'
$env:NUXERA_APPLICANT_TOKEN='<short-lived-token>'
$env:NUXERA_APPLICANT_ORDER_ID='<owned-order-id>'
$env:NUXERA_GRANTOR_TOKEN='<short-lived-token>'
$env:NUXERA_GRANTOR_ORDER_ID='<shared-order-id>'
$env:NUXERA_ADMIN_TOKEN='<short-lived-token>'
npm.cmd run verify:nuxera-http
```

Expected result: every applicant, grantor, and administrator endpoint reports GO. A 401, 403, 404, empty response, timeout, or transport error is a NO-GO.

## 5. Controlled activation

1. Save the verification output as release evidence without credentials.
2. Enable `VITE_NUXERA_EXPERIENCE_ENABLED=true` only in the approved preview.
3. Repeat Chromium E2E and role-based manual smoke tests.
4. Promote only after product, security, and operations acceptance.

## 6. Rollback

Disable the feature flag and redeploy the last known-good Vercel build. Do not reverse database migrations until their dependency and data impact has been reviewed. Record the incident, deployment identifier, affected roles, and recovery evidence.

## Security boundaries

- The automated HTTP harness is read-only.
- AI provider execution remains disabled unless separately approved and configured.
- Production SQL, commits, pushes, and deployments are intentional human-controlled actions.
