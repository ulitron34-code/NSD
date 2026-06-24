import cron from 'node-cron';
import { supabaseAdmin } from '../config/supabase.js';
import { generateDocumentAlerts } from './complianceMonitorService.js';
import { sendEmail, buildExpiryAlertHtml } from './emailService.js';

// Corre todos los días a las 8:00am hora Ciudad de México.
// En producción (Render) la zona horaria del servidor es UTC —
// "0 14 * * *" = 14:00 UTC = 08:00 CST (UTC-6).
const CRON_SCHEDULE = process.env.COMPLIANCE_CRON_SCHEDULE || '0 14 * * *';

let cronTask = null;

async function runComplianceAlertJob() {
  console.log('[ComplianceCron] Iniciando revisión de vencimientos...');
  try {
    // Traer todos los expedientes activos con su usuario
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('service_orders')
      .select('id, user_id, service_type, metadata')
      .not('status', 'eq', 'cancelled');

    if (ordersError) throw ordersError;
    if (!orders?.length) {
      console.log('[ComplianceCron] Sin expedientes activos.');
      return;
    }

    // Traer emails de usuarios en lote
    const userIds = [...new Set(orders.map((o) => o.user_id))];
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds);

    const profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));

    let emailsSent = 0;
    let alertsFound = 0;

    for (const order of orders) {
      const { data: documents } = await supabaseAdmin
        .from('documents')
        .select('id, filename, expires_at, document_type')
        .eq('order_id', order.id)
        .not('expires_at', 'is', null);

      if (!documents?.length) continue;

      const alerts = generateDocumentAlerts(documents);
      // Solo enviar email para alertas críticas o altas (vencido o <30 días)
      const urgentAlerts = alerts.filter((a) => ['critical', 'high'].includes(a.severity));
      if (!urgentAlerts.length) continue;

      alertsFound += urgentAlerts.length;

      const profile = profileMap[order.user_id];
      if (!profile?.email) continue;

      const orderName = order.metadata?.projectName || order.service_type || order.id;

      try {
        await sendEmail({
          to: profile.email,
          subject: `⚠️ NAGMAR — ${urgentAlerts.length} documento(s) por vencer en "${orderName}"`,
          html: buildExpiryAlertHtml({
            userName: profile.full_name,
            alerts: urgentAlerts,
            orderId: order.id,
            orderName
          })
        });
        emailsSent++;
      } catch (emailErr) {
        console.error(`[ComplianceCron] Error enviando email a ${profile.email}:`, emailErr.message);
      }
    }

    console.log(`[ComplianceCron] Completado — ${alertsFound} alertas urgentes, ${emailsSent} emails enviados.`);
  } catch (err) {
    console.error('[ComplianceCron] Error en job:', err.message);
  }
}

export function startComplianceCron() {
  if (cronTask) return;

  cronTask = cron.schedule(CRON_SCHEDULE, runComplianceAlertJob, {
    timezone: 'UTC'
  });

  console.log(`[ComplianceCron] Programado con schedule "${CRON_SCHEDULE}" (UTC).`);
}

export function stopComplianceCron() {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
  }
}

// Permite disparar manualmente (útil para testing o admin)
export { runComplianceAlertJob };
