import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authMiddleware, requireAnyPermission, isInternalReviewerRole } from '../middleware/auth.js';

// El dueno del expediente ve su propia bitacora (audit:own:read). Los roles
// internos (analista/agente_interno/compliance_officer/auditor_interno/
// administrador) pueden ver la de cualquier expediente -- el rol Auditor
// (seccion 8.1 del plan: "revisar bitacora... trazabilidad") no tenia ningun
// permiso que calzara con estas rutas ni pasaba assertOrderOwner porque nunca
// es dueno del expediente.
const AUDIT_ACCESS_PERMISSIONS = ['audit:own:read', 'audit:read', 'audit:case:read', 'case:read'];

const router = express.Router();

const CRITICAL_ACTIONS = new Set([
  'document_uploaded',
  'document_ai_review_completed',
  'document_institutional_updated',
  'case_institutional_updated',
  'data_room_shared',
  'shared_data_room_viewed',
  'funder_interest_recorded',
  'executive_report_generated',
  'institutional_memo_downloaded',
  'payment_intent_created',
  'payment_confirmed',
  'information_request_created',
  'information_request_updated',
  'information_request_evidence_viewed',
  'funder_contact_requested',
  'funder_contact_request_decided'
]);

function sanitizeFilename(value = 'expediente') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120);
}

function csvCell(value) {
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  return `"${stringValue.replace(/"/g, '""')}"`;
}

async function assertOrderOwner(orderId, userId, userRole) {
  let query = supabaseAdmin
    .from('service_orders')
    .select('id, case_number, project_name, metadata')
    .eq('id', orderId);

  if (!isInternalReviewerRole(userRole)) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    throw new Error('Expediente no encontrado o sin permisos');
  }

  return data;
}

async function loadAuditLogs(orderId, limit = 500) {
  const { data, error } = await supabaseAdmin
    .from('audit_logs')
    .select()
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data || [];
}

function summarizeLogs(logs = []) {
  const byAction = logs.reduce((acc, log) => {
    acc[log.action] = (acc[log.action] || 0) + 1;
    return acc;
  }, {});
  const byEntity = logs.reduce((acc, log) => {
    acc[log.entity_type || 'unknown'] = (acc[log.entity_type || 'unknown'] || 0) + 1;
    return acc;
  }, {});
  const criticalEvents = logs.filter((log) => CRITICAL_ACTIONS.has(log.action));

  return {
    totalEvents: logs.length,
    complianceRelevantEvents: logs.filter((log) => log.compliance_relevant !== false).length,
    criticalEvents: criticalEvents.length,
    lastEventAt: logs[0]?.created_at || null,
    firstEventAt: logs[logs.length - 1]?.created_at || null,
    byAction,
    byEntity,
    recentCriticalEvents: criticalEvents.slice(0, 8)
  };
}

function buildAuditMarkdown({ order, logs, summary }) {
  const metadata = order.metadata || {};
  const caseNumber = order.case_number || `NSD-${String(order.id || '').slice(0, 8).toUpperCase()}`;
  const projectName = order.project_name || metadata.projectName || metadata.companyName || 'Proyecto NSD';
  const lines = [
    '# Paquete de auditoria NSD',
    '',
    `- Expediente: ${caseNumber}`,
    `- Proyecto: ${projectName}`,
    `- Generado: ${new Date().toLocaleString('es-MX')}`,
    '',
    '## Resumen',
    `- Eventos totales: ${summary.totalEvents}`,
    `- Eventos relevantes de cumplimiento: ${summary.complianceRelevantEvents}`,
    `- Eventos criticos: ${summary.criticalEvents}`,
    `- Primer evento: ${summary.firstEventAt || 'N/D'}`,
    `- Ultimo evento: ${summary.lastEventAt || 'N/D'}`,
    '',
    '## Eventos por accion',
    ...Object.entries(summary.byAction).map(([action, count]) => `- ${action}: ${count}`),
    '',
    '## Eventos por entidad',
    ...Object.entries(summary.byEntity).map(([entity, count]) => `- ${entity}: ${count}`),
    '',
    '## Bitacora',
    '| Fecha | Accion | Entidad | Relevante | Metadata |',
    '|---|---|---|---|---|',
    ...logs.map((log) => {
      const metadataText = JSON.stringify(log.metadata || {}).replace(/\|/g, '/');
      return `| ${log.created_at || ''} | ${log.action || ''} | ${log.entity_type || ''} | ${log.compliance_relevant !== false ? 'Si' : 'No'} | ${metadataText} |`;
    }),
    '',
    '## Nota',
    'Este paquete reconstruye eventos operativos registrados por NSD. Debe revisarse junto con documentos, permisos, data room y evidencias originales.'
  ];

  return {
    caseNumber,
    content: lines.join('\n')
  };
}

function buildAuditCsv(logs = []) {
  const header = ['created_at', 'action', 'entity_type', 'entity_id', 'user_id', 'compliance_relevant', 'metadata'];
  const rows = logs.map((log) => [
    log.created_at,
    log.action,
    log.entity_type,
    log.entity_id,
    log.user_id,
    log.compliance_relevant !== false ? 'true' : 'false',
    log.metadata || {}
  ]);

  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
}

router.get('/audit-logs/:orderId', authMiddleware, requireAnyPermission(AUDIT_ACCESS_PERMISSIONS), async (req, res) => {
  try {
    await assertOrderOwner(req.params.orderId, req.userId, req.userRole);
    const data = await loadAuditLogs(req.params.orderId, 50);

    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/audit-logs/:orderId/summary', authMiddleware, requireAnyPermission(AUDIT_ACCESS_PERMISSIONS), async (req, res) => {
  try {
    await assertOrderOwner(req.params.orderId, req.userId, req.userRole);
    const logs = await loadAuditLogs(req.params.orderId, 250);
    const summary = summarizeLogs(logs);

    res.json({
      orderId: req.params.orderId,
      ...summary
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/audit-logs/:orderId/export.md', authMiddleware, requireAnyPermission(AUDIT_ACCESS_PERMISSIONS), async (req, res) => {
  try {
    const order = await assertOrderOwner(req.params.orderId, req.userId, req.userRole);
    const logs = await loadAuditLogs(req.params.orderId, 1000);
    const summary = summarizeLogs(logs);
    const auditPackage = buildAuditMarkdown({ order, logs, summary });
    const filename = `${sanitizeFilename(auditPackage.caseNumber)}-auditoria.md`;

    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(auditPackage.content);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/audit-logs/:orderId/export.csv', authMiddleware, requireAnyPermission(AUDIT_ACCESS_PERMISSIONS), async (req, res) => {
  try {
    const order = await assertOrderOwner(req.params.orderId, req.userId, req.userRole);
    const logs = await loadAuditLogs(req.params.orderId, 1000);
    const filename = `${sanitizeFilename(order.case_number || order.id)}-auditoria.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buildAuditCsv(logs));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
