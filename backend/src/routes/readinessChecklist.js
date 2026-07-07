import express from 'express';
import { authMiddleware, requireAnyPermission, requirePermission } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';
import { getReadinessChecklist } from '../services/readinessChecklistService.js';
import { buildReadinessMemo, buildReadinessMemoPdf, buildReadinessTechnicalMemo, buildReadinessTechnicalMemoPdf } from '../services/readinessMemoService.js';
import { runReadinessCrossReferences } from '../agents/readinessCrossRefAgent.js';
import { getCrossReferences } from '../services/documentIntelligenceService.js';
import { addReviewNote, getReviewNotes } from '../services/documentReviewNotesService.js';
import { logAuditEvent } from '../utils/audit.js';

const router = express.Router();

// El expediente es visible para su dueño (solicitante) o para un otorgante
// con acceso autorizado vía data_room_shares — mismo criterio que ya usa
// GET /otorgante/pipeline en otorgante.js.
async function assertReadinessAccess(orderId, req) {
  const { data: order } = await supabaseAdmin
    .from('service_orders')
    .select('id, user_id')
    .eq('id', orderId)
    .single();

  if (order?.user_id === req.userId) return true;

  const email = req.user?.email;
  const { data: shares } = await supabaseAdmin
    .from('data_room_shares')
    .select('id')
    .eq('order_id', orderId)
    .or(`recipient_user_id.eq.${req.userId}${email ? `,recipient_email.ilike.${email}` : ''}`)
    .in('status', ['accepted', 'shared'])
    .limit(1);

  return Boolean(shares && shares.length > 0);
}

// El workflow humano de revision (seccion 7 del plan) es para roles internos
// (analista/agente_interno/compliance_officer/auditor/admin) -- no hay un
// sistema de "casos asignados" construido todavia, asi que por ahora
// cualquier rol interno puede revisar cualquier expediente (mismo alcance
// real que ya tienen esos roles sobre score:read/case:assigned:read en
// middleware/auth.js). El dueño del expediente tambien puede LEER las notas
// (transparencia de por que se aprobo/rechazo), nunca escribirlas.
const INTERNAL_REVIEWER_ROLES = new Set(['analista', 'administrador', 'agente_interno', 'compliance_officer', 'auditor_interno']);

function isInternalReviewerRole(role) {
  return INTERNAL_REVIEWER_ROLES.has(String(role || '').toLowerCase());
}

async function assertReviewNotesReadAccess(orderId, req) {
  if (isInternalReviewerRole(req.userRole)) return true;
  return assertReadinessAccess(orderId, req);
}

router.get(
  '/orders/:orderId/readiness-checklist',
  authMiddleware,
  requireAnyPermission(['case:own:read', 'data_room:authorized:read']),
  async (req, res) => {
    try {
      const hasAccess = await assertReadinessAccess(req.params.orderId, req);
      if (!hasAccess) {
        return res.status(404).json({ error: 'Expediente no encontrado o sin permisos' });
      }

      const result = await getReadinessChecklist(req.params.orderId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get(
  '/orders/:orderId/readiness-checklist/memo.md',
  authMiddleware,
  requireAnyPermission(['case:own:read', 'data_room:authorized:read']),
  async (req, res) => {
    try {
      const hasAccess = await assertReadinessAccess(req.params.orderId, req);
      if (!hasAccess) {
        return res.status(404).json({ error: 'Expediente no encontrado o sin permisos' });
      }

      const { data: order } = await supabaseAdmin
        .from('service_orders')
        .select('id, case_number, project_name, metadata')
        .eq('id', req.params.orderId)
        .single();

      const checklistResult = await getReadinessChecklist(req.params.orderId);
      const report = buildReadinessMemo(checklistResult, order || {});
      const caseNumber = order?.case_number || `NSD-${String(req.params.orderId).slice(0, 8).toUpperCase()}`;
      const filename = `${caseNumber}-reporte-readiness.md`.replace(/[^a-zA-Z0-9._-]/g, '-');

      await logAuditEvent({
        userId: req.userId,
        action: 'readiness_memo_downloaded',
        entityType: 'service_order',
        entityId: req.params.orderId,
        orderId: req.params.orderId,
        req,
        metadata: { globalProgress: report.globalProgress, readyToSubmit: report.readyToSubmit }
      });

      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(report.memo.content);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.get(
  '/orders/:orderId/readiness-checklist/memo.pdf',
  authMiddleware,
  requireAnyPermission(['case:own:read', 'data_room:authorized:read']),
  async (req, res) => {
    try {
      const hasAccess = await assertReadinessAccess(req.params.orderId, req);
      if (!hasAccess) {
        return res.status(404).json({ error: 'Expediente no encontrado o sin permisos' });
      }

      const { data: order } = await supabaseAdmin
        .from('service_orders')
        .select('id, case_number, project_name, metadata')
        .eq('id', req.params.orderId)
        .single();

      const checklistResult = await getReadinessChecklist(req.params.orderId);
      const report = await buildReadinessMemoPdf(checklistResult, order || {});
      const filename = `${report.caseNumber}-reporte-readiness.pdf`.replace(/[^a-zA-Z0-9._-]/g, '-');

      await logAuditEvent({
        userId: req.userId,
        action: 'readiness_memo_pdf_downloaded',
        entityType: 'service_order',
        entityId: req.params.orderId,
        orderId: req.params.orderId,
        req,
        metadata: { globalProgress: report.globalProgress, readyToSubmit: report.readyToSubmit }
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(report.buffer);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

async function getStoredInconsistencies(orderId) {
  const crossReferences = await getCrossReferences(orderId);
  return (crossReferences || []).filter((ref) => ref.status === 'fail');
}

router.get(
  '/orders/:orderId/readiness-checklist/technical-memo.md',
  authMiddleware,
  requireAnyPermission(['case:own:read', 'data_room:authorized:read']),
  async (req, res) => {
    try {
      const hasAccess = await assertReadinessAccess(req.params.orderId, req);
      if (!hasAccess) {
        return res.status(404).json({ error: 'Expediente no encontrado o sin permisos' });
      }

      const { data: order } = await supabaseAdmin
        .from('service_orders')
        .select('id, case_number, project_name, metadata')
        .eq('id', req.params.orderId)
        .single();

      const [checklistResult, inconsistencies] = await Promise.all([
        getReadinessChecklist(req.params.orderId),
        getStoredInconsistencies(req.params.orderId)
      ]);
      const report = buildReadinessTechnicalMemo(checklistResult, order || {}, inconsistencies);
      const caseNumber = order?.case_number || `NSD-${String(req.params.orderId).slice(0, 8).toUpperCase()}`;
      const filename = `${caseNumber}-reporte-tecnico.md`.replace(/[^a-zA-Z0-9._-]/g, '-');

      await logAuditEvent({
        userId: req.userId,
        action: 'readiness_technical_memo_downloaded',
        entityType: 'service_order',
        entityId: req.params.orderId,
        orderId: req.params.orderId,
        req,
        metadata: { globalScore: report.globalScore.score }
      });

      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(report.memo.content);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.get(
  '/orders/:orderId/readiness-checklist/technical-memo.pdf',
  authMiddleware,
  requireAnyPermission(['case:own:read', 'data_room:authorized:read']),
  async (req, res) => {
    try {
      const hasAccess = await assertReadinessAccess(req.params.orderId, req);
      if (!hasAccess) {
        return res.status(404).json({ error: 'Expediente no encontrado o sin permisos' });
      }

      const { data: order } = await supabaseAdmin
        .from('service_orders')
        .select('id, case_number, project_name, metadata')
        .eq('id', req.params.orderId)
        .single();

      const [checklistResult, inconsistencies] = await Promise.all([
        getReadinessChecklist(req.params.orderId),
        getStoredInconsistencies(req.params.orderId)
      ]);
      const report = await buildReadinessTechnicalMemoPdf(checklistResult, order || {}, inconsistencies);
      const filename = `${report.caseNumber}-reporte-tecnico.pdf`.replace(/[^a-zA-Z0-9._-]/g, '-');

      await logAuditEvent({
        userId: req.userId,
        action: 'readiness_technical_memo_pdf_downloaded',
        entityType: 'service_order',
        entityId: req.params.orderId,
        orderId: req.params.orderId,
        req,
        metadata: { globalScore: report.globalScore.score }
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(report.buffer);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.post(
  '/orders/:orderId/readiness-checklist/cross-check',
  authMiddleware,
  requireAnyPermission(['case:own:read', 'data_room:authorized:read']),
  async (req, res) => {
    try {
      const hasAccess = await assertReadinessAccess(req.params.orderId, req);
      if (!hasAccess) {
        return res.status(404).json({ error: 'Expediente no encontrado o sin permisos' });
      }

      const result = await runReadinessCrossReferences(req.params.orderId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Workflow humano de revision (seccion 7 del plan): historial de
// aprobaciones/rechazos/comentarios de un analista sobre la evaluacion de IA
// de un documento especifico del checklist.
router.get(
  '/orders/:orderId/documents/:documentId/review-notes',
  authMiddleware,
  requireAnyPermission(['case:own:read', 'data_room:authorized:read', 'score:read', 'case:assigned:read', 'audit:case:read']),
  async (req, res) => {
    try {
      const hasAccess = await assertReviewNotesReadAccess(req.params.orderId, req);
      if (!hasAccess) {
        return res.status(404).json({ error: 'Expediente no encontrado o sin permisos' });
      }

      const notes = await getReviewNotes(req.params.documentId);
      res.json({ notes });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.post(
  '/orders/:orderId/documents/:documentId/review-notes',
  authMiddleware,
  requirePermission('score:update'),
  async (req, res) => {
    try {
      const { decision, comment } = req.body;
      const note = await addReviewNote({
        orderId: req.params.orderId,
        documentId: req.params.documentId,
        reviewerUserId: req.userId,
        decision,
        comment
      });

      await logAuditEvent({
        userId: req.userId,
        action: 'document_review_note_added',
        entityType: 'document_review_note',
        entityId: note.id,
        orderId: req.params.orderId,
        req,
        metadata: { documentId: req.params.documentId, decision }
      });

      res.json({ note });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

export default router;
