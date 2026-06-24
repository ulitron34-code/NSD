import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_ADDRESS = process.env.EMAIL_FROM || 'NAGMAR <alertas@nagmar.com>';

export async function sendEmail({ to, subject, html }) {
  if (!resend) {
    console.log(`[EmailService] RESEND_API_KEY no configurada — email simulado para: ${to} | Asunto: ${subject}`);
    return { simulated: true };
  }

  const { data, error } = await resend.emails.send({ from: FROM_ADDRESS, to, subject, html });
  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`);
  return data;
}

export function buildExpiryAlertHtml({ userName, alerts, orderId, orderName }) {
  const alertRows = alerts.map((a) => {
    const color = a.severity === 'critical' ? '#C62828' : a.severity === 'high' ? '#E65100' : '#F57F17';
    const badge = a.severity === 'critical' ? 'VENCIDO' : a.severity === 'high' ? 'URGENTE' : 'PRÓXIMO';
    return `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${a.documentName}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">
          <span style="background:${color};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;">${badge}</span>
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${a.expiryDate}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;color:${color};font-weight:600;">
          ${a.daysUntilExpiry < 0 ? `${Math.abs(a.daysUntilExpiry)} días vencido` : `${a.daysUntilExpiry} días`}
        </td>
      </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,sans-serif;background:#F9F6F1;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#1C3553;padding:24px 32px;">
      <h1 style="color:#fff;margin:0;font-size:20px;">NAGMAR — Alerta de Cumplimiento</h1>
      <p style="color:#90CAF9;margin:4px 0 0;font-size:14px;">Documentos por vencer en su expediente</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="color:#333;margin:0 0 8px;">Hola <strong>${userName || 'Usuario'}</strong>,</p>
      <p style="color:#555;margin:0 0 20px;line-height:1.5;">
        El siguiente expediente tiene documentos que requieren atención inmediata:
        <strong>${orderName || orderId}</strong>
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#F2EFE9;">
            <th style="padding:10px 12px;text-align:left;color:#555;font-weight:600;">Documento</th>
            <th style="padding:10px 12px;text-align:center;color:#555;font-weight:600;">Estado</th>
            <th style="padding:10px 12px;text-align:center;color:#555;font-weight:600;">Fecha vencimiento</th>
            <th style="padding:10px 12px;text-align:center;color:#555;font-weight:600;">Tiempo</th>
          </tr>
        </thead>
        <tbody>${alertRows}</tbody>
      </table>
      <div style="margin:24px 0 0;padding:16px;background:#FFF3E0;border-left:4px solid #E65100;border-radius:4px;">
        <p style="margin:0;color:#555;font-size:13px;line-height:1.5;">
          Accede a tu expediente en NAGMAR para actualizar los documentos vencidos y mantener tu expediente activo.
        </p>
      </div>
    </div>
    <div style="padding:16px 32px;background:#F2EFE9;text-align:center;">
      <p style="margin:0;color:#888;font-size:11px;">NAGMAR International Finance — Sistema de Alertas Automáticas</p>
    </div>
  </div>
</body>
</html>`;
}
