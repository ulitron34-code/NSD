// Rutas de Twilio WhatsApp:
//   POST /api/whatsapp/webhook  — recibe mensajes entrantes via Twilio (form-encoded)
//   POST /api/whatsapp/send     — envio manual autenticado (admin / pruebas)
//   GET  /api/whatsapp/status   — estado de la configuracion
import { Router } from 'express';
import crypto from 'crypto';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { sendWhatsApp } from '../services/whatsappService.js';

const router = Router();

const getToken = () => process.env.TWILIO_AUTH_TOKEN  || '';
const getSid   = () => process.env.TWILIO_ACCOUNT_SID || '';
const isConfigured = () => Boolean(getToken() && getSid());

// ── Validacion de firma Twilio (HMAC-SHA1) ────────────────────────────────────
// Twilio firma cada request entrante. Verificar antes de procesar para evitar
// que terceros llamen al webhook con mensajes falsos.
// Si no hay AUTH_TOKEN configurado se omite (modo desarrollo).
function isValidTwilioSignature(req) {
  const token = getToken();
  if (!token) return true;

  const twilioSig = req.headers['x-twilio-signature'] || '';
  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

  // Twilio ordena los parametros del body alfabeticamente y los concatena con sus valores
  const body = req.body || {};
  const paramStr = Object.keys(body).sort().reduce((s, k) => s + k + body[k], '');

  const expected = crypto
    .createHmac('sha1', token)
    .update(url + paramStr)
    .digest('base64');

  try {
    return crypto.timingSafeEqual(Buffer.from(twilioSig), Buffer.from(expected));
  } catch {
    return false;
  }
}

// ── POST /api/whatsapp/webhook ────────────────────────────────────────────────
// Twilio llama aqui cuando un usuario responde al WhatsApp del numero NSD.
// Requiere que en Twilio Console -> Messaging -> Sender -> Webhook se apunte a:
//   https://<render-url>/api/whatsapp/webhook
// El Content-Type es application/x-www-form-urlencoded — se parsea en server.js
// via express.urlencoded() aplicado solo a esta ruta antes de JSON global.
router.post('/whatsapp/webhook', (req, res) => {
  if (!isValidTwilioSignature(req)) {
    console.warn('[WhatsApp webhook] Firma Twilio invalida — request rechazado');
    return res.status(403).send('Forbidden');
  }

  const from       = String(req.body?.From        || '').replace('whatsapp:', '');
  const msgBody    = String(req.body?.Body        || '');
  const msgSid     = String(req.body?.MessageSid  || '');
  const profileName = String(req.body?.ProfileName || '');

  console.info(`[WhatsApp] entrante | from=${from} | profile="${profileName}" | sid=${msgSid} | msg="${msgBody.slice(0, 120)}"`);

  // Responder con TwiML vacio — Twilio requiere 200 para no reintentar.
  // Para enviar una respuesta automatica al usuario agregar dentro de <Response>:
  //   <Message>texto de respuesta</Message>
  res.set('Content-Type', 'text/xml');
  res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
});

// ── POST /api/whatsapp/send ───────────────────────────────────────────────────
// Envio manual autenticado — util para pruebas y notificaciones ad-hoc desde admin.
// Body JSON: { to: '+521234567890', message: 'texto' }
router.post('/whatsapp/send', authMiddleware, async (req, res, next) => {
  try {
    const { to, message } = req.body;
    if (!to || !message) {
      return res.status(400).json({ error: 'Campos "to" y "message" requeridos' });
    }
    const result = await sendWhatsApp({ to, message });
    res.json({ ok: true, result });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/whatsapp/status ──────────────────────────────────────────────────
router.get('/whatsapp/status', authMiddleware, (req, res) => {
  res.json({
    configured: isConfigured(),
    accountSid: isConfigured() ? `${getSid().slice(0, 8)}...` : null,
    from: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886 (sandbox Twilio)',
    webhookUrl: '/api/whatsapp/webhook',
    note: isConfigured()
      ? 'Configurado. Apuntar webhook de Twilio Console a https://<render-url>/api/whatsapp/webhook'
      : 'Faltan TWILIO_ACCOUNT_SID y/o TWILIO_AUTH_TOKEN en variables de entorno de Render',
  });
});

export default router;
