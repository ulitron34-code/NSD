# NUXERA Notification Sandbox Runbook

Date: 2026-07-29
Purpose: test operational email delivery without sending evidence, attachments or binding decisions.

## Safety Model

Notification delivery has two gates:

- `NUXERA_NOTIFICATION_DELIVERY_ENABLED`
- `NUXERA_NOTIFICATION_EMAIL_DELIVERY_ENABLED`

If either gate is off, production outbox delivery remains dry-run or disabled.

## Sandbox Preview Command

```bash
cd backend
npm run notification:sandbox
```

Default behavior:

- Builds a NUXERA operational notification preview.
- Does not require Supabase.
- Does not send email unless `NUXERA_NOTIFICATION_SANDBOX_SEND_ENABLED=true`.
- If `RESEND_API_KEY` is missing, `emailService` returns a simulated result.

## Optional Send Variables

```powershell
$env:NUXERA_NOTIFICATION_SANDBOX_SEND_ENABLED = "true"
$env:NUXERA_SANDBOX_EMAIL_TO = "approved-recipient@example.com"
$env:RESEND_API_KEY = "<sandbox resend key>"
$env:EMAIL_FROM = "NUXERA <sandbox@your-domain.example>"
```

## Acceptance Criteria

- Subject/body contain operational copy only.
- No document body, score details, attachments, personal identifiers or binding decision appears in email content.
- Provider response is logged as sandbox evidence.
- Production flags remain off after test unless separately approved.
