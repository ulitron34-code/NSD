# NUXERA Notification Delivery Runbook

Status: controlled/manual only. No cron, scheduler or production flag is enabled by this document.

## Purpose

This runbook explains how to execute a small, auditable email delivery batch from `nuxera_notification_outbox` after an operator explicitly enables the required backend flags in a controlled environment.

## Required Gates

All gates must be true before any queued email can be delivered:

| Gate | Required value | Why it matters |
| --- | --- | --- |
| `NUXERA_NOTIFICATION_DELIVERY_ENABLED` | `true` | Allows queue persistence and allows the worker to read queued outbox rows. |
| `NUXERA_NOTIFICATION_EMAIL_DELIVERY_ENABLED` | `true` | Allows the email adapter to process eligible queued rows. |
| `RESEND_API_KEY` | configured | Enables `emailService.sendEmail` to call Resend instead of returning a local simulation. |
| Admin permission | `nuxera:admin:update` | Required by the manual delivery endpoint. |

If either NUXERA delivery flag is false, the worker returns a dry-run status and performs no Supabase reads, updates, audit inserts or provider calls.

## Preflight

1. Confirm the table `nuxera_notification_outbox` exists and RLS/readiness were verified in the target environment.
2. Confirm there are queued rows with `channels` containing `email` and a non-empty `recipient_email`.
3. Confirm the queued rows use safe `subject` and `body_preview` text. The worker does not include evidence, attachments or hidden file context.
4. Confirm `RESEND_API_KEY` and `EMAIL_FROM` are configured for the target environment.
5. Confirm both delivery flags are enabled only in the intended environment, not broadly across production by accident.

## Manual Execution Endpoint

Endpoint:

```http
POST /api/nuxera/admin/notification-delivery-batch
```

Minimum request body:

```json
{
  "maxBatchSize": 1,
  "channels": ["email"]
}
```

Important: the endpoint never trusts client-supplied `deliveryEnabled` or `emailDeliveryEnabled`. It derives delivery state server-side from environment variables.

Expected disabled response examples:

- `delivery-disabled-dry-run`: outbox delivery flag is off.
- `email-delivery-disabled-dry-run`: outbox delivery is on, but email adapter flag is off.

Expected enabled response:

- `delivery-worker-completed` with `processed`, `sent`, `failed`, `suppressed` and per-row `results`.

## Post-Run Verification

After a manual batch:

1. Read `GET /api/nuxera/admin/notification-outbox?status=sent` and confirm expected rows moved to `sent`.
2. Read failed/suppressed rows and inspect their delivery metadata.
3. Verify audit events:
   - `nuxera_notification_email_sent`
   - `nuxera_notification_email_failed`
   - `nuxera_notification_delivery_suppressed`
4. Confirm no row included attachments or evidence content in the email body.
5. If anything is unexpected, disable `NUXERA_NOTIFICATION_EMAIL_DELIVERY_ENABLED` first, then inspect rows before any retry.

## Rollback

1. Set `NUXERA_NOTIFICATION_EMAIL_DELIVERY_ENABLED=false`.
2. If needed, set `NUXERA_NOTIFICATION_DELIVERY_ENABLED=false`.
3. Do not manually change `sent` rows back to `queued` unless a human operator verifies duplicate risk and dedupe keys.
4. Keep audit evidence for the failed run; do not delete outbox or audit rows.

## Not Implemented Yet

- Cron or automatic scheduler.
- WhatsApp delivery adapter.
- In-app delivery adapter.
- Bulk production delivery runbook beyond small manual batches.
