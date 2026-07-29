import { sendEmail } from '../src/services/emailService.js';

const sendEnabled = process.env.NUXERA_NOTIFICATION_SANDBOX_SEND_ENABLED === 'true';
const to = process.env.NUXERA_SANDBOX_EMAIL_TO || 'sandbox-recipient@nuxera.local';
const subject = 'NUXERA sandbox notification - operational preview';
const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,sans-serif;background:#F6F7F9;margin:0;padding:24px;">
  <div style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #D9DEE7;border-radius:10px;overflow:hidden;">
    <div style="background:#172B45;padding:22px 28px;"><h1 style="color:#fff;margin:0;font-size:20px;">NUXERA</h1><p style="color:#D8B25A;margin:6px 0 0;font-size:13px;">Operational sandbox notification</p></div>
    <div style="padding:26px 28px;">
      <h2 style="margin:0 0 12px;color:#172B45;font-size:18px;">A file requires human follow-up</h2>
      <p style="margin:0;color:#344054;font-size:14px;line-height:1.55;">This sandbox message validates the email provider path with operational copy only. Open NUXERA to review the authorized file with your active permissions.</p>
      <div style="margin-top:20px;padding:14px;background:#F8FAFC;border-left:4px solid #D8B25A;border-radius:6px;">
        <p style="margin:0;color:#667085;font-size:12px;line-height:1.45;">No evidence, attachments, scores, personal identifiers or binding decisions are included in this email.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

const evidence = {
  id: 'nuxera-notification-sandbox-preview',
  generatedAt: new Date().toISOString(),
  sendEnabled,
  to: sendEnabled ? to : 'not-sent-preview-only',
  subject,
  policy: {
    includesEvidence: false,
    includesAttachments: false,
    includesScores: false,
    includesBindingDecision: false
  }
};

if (!sendEnabled) {
  console.log(JSON.stringify({ ...evidence, status: 'preview-only' }, null, 2));
  process.exit(0);
}

const result = await sendEmail({ to, subject, html });
console.log(JSON.stringify({ ...evidence, status: result?.simulated ? 'simulated' : 'sent', providerResult: result }, null, 2));
