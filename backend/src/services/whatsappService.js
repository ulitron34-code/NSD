// Twilio WhatsApp via REST API — sin SDK, usa fetch nativo de Node 18+
// Simula cuando no hay credenciales configuradas.

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

function isConfigured() {
  return Boolean(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN);
}

async function sendViaTwilio(to, body) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const params = new URLSearchParams({
    From: TWILIO_WHATSAPP_FROM,
    To: `whatsapp:${to}`,
    Body: body
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Twilio HTTP ${response.status}`);
  }

  return await response.json();
}

export async function sendWhatsApp({ to, message }) {
  if (!to) return;

  if (!isConfigured()) {
    console.log(`[WhatsApp simulado] → ${to}\n${message}\n`);
    return { simulated: true };
  }

  return await sendViaTwilio(to, message);
}

export function buildExpiryAlertWhatsApp({ userName, alerts, orderName }) {
  const critical = alerts.filter((a) => a.severity === 'critical');
  const high = alerts.filter((a) => a.severity === 'high');

  const name = userName || 'Usuario';
  let msg = `*NAGMAR — Alerta de Vencimiento*\n\nHola ${name},\n\n`;

  if (critical.length) {
    msg += `🔴 *VENCIDOS (${critical.length}):*\n`;
    critical.slice(0, 3).forEach((a) => {
      const days = Math.abs(a.daysUntilExpiry ?? 0);
      msg += `• ${a.documentName} — vencido hace ${days}d\n`;
    });
  }

  if (high.length) {
    msg += `\n🟠 *Próximos a vencer (${high.length}):*\n`;
    high.slice(0, 3).forEach((a) => {
      msg += `• ${a.documentName} — ${a.daysUntilExpiry}d restantes\n`;
    });
  }

  msg += `\n📁 Expediente: *${orderName}*\nActualiza tus documentos en nsd.global`;
  return msg;
}
