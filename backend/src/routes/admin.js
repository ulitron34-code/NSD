import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { authMiddleware, requireAdmin, NSD_ROLES } from '../middleware/auth.js';
import { logAuditEvent } from '../utils/audit.js';
import { READINESS_RUBRICS, READINESS_MODULE_WEIGHTS } from '../config/readinessRubrics.js';
import { getHumanReviewQueue } from '../services/humanReviewQueueService.js';
import { getReadinessMetrics } from '../services/readinessMetricsService.js';

const router = express.Router();
const ASSIGNABLE_ROLES = new Set(Object.values(NSD_ROLES));

// Gestión de usuarios/roles (sección 8.1 del plan: rol Administrador
// "gestionar... usuarios, permisos"). No existía ningún listado global de la
// tabla users ni forma de cambiar profile_type sin editar Supabase a mano.
router.get('/admin/users', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const { data, error, count } = await supabaseAdmin
      .from('users')
      .select('id, email, profile_type, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    res.json({ users: data || [], total: count ?? null, limit, offset });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/admin/users/:id/role', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const nextRole = String(req.body?.profileType || '').trim().toLowerCase();
    if (!ASSIGNABLE_ROLES.has(nextRole)) {
      return res.status(400).json({ error: `Rol inválido: "${nextRole}". Debe ser uno de: ${[...ASSIGNABLE_ROLES].join(', ')}.` });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ profile_type: nextRole })
      .eq('id', req.params.id)
      .select('id, email, profile_type')
      .single();

    if (error) throw error;

    await logAuditEvent({
      userId: req.userId,
      action: 'user_role_updated',
      entityType: 'user',
      entityId: req.params.id,
      req,
      metadata: { newRole: nextRole }
    });

    res.json({ user: data });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Bitácora global (sección 8.1: "revisar bitácora... trazabilidad"). Las
// rutas de audit.js son por expediente; esta es la única vista agregada de
// todos los expedientes, reemplaza los datos hardcodeados que hoy muestra
// TraceabilityLogTab.jsx en el frontend.
router.get('/admin/audit-logs', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    let query = supabaseAdmin
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (req.query.action) query = query.eq('action', req.query.action);
    if (req.query.entityType) query = query.eq('entity_type', req.query.entityType);
    if (req.query.orderId) query = query.eq('order_id', req.query.orderId);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ logs: data || [], total: count ?? null, limit, offset });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rúbricas y pesos del checklist Readiness (sección 8.1: "gestionar...
// rúbricas"). Son constantes en código (backend/src/config/readinessRubrics.js),
// no filas editables en base de datos -- este endpoint es de solo lectura
// para transparencia real, no se finge un CRUD que no existe. Cambiarlas
// requiere editar ese archivo y desplegar.
router.get('/admin/rubrics', authMiddleware, requireAdmin, async (req, res) => {
  res.json({
    rubrics: READINESS_RUBRICS,
    weights: READINESS_MODULE_WEIGHTS,
    readOnly: true,
    note: 'Las rúbricas y los pesos están definidos en código (backend/src/config/readinessRubrics.js), no en una tabla editable. Este endpoint es de solo lectura; para modificarlas hay que editar ese archivo y desplegar.'
  });
});

// Cola de "revisión humana pendiente" (sección 21.3 del plan). Antes solo se
// veía documento por documento dentro del checklist de cada expediente; esta
// es la primera vista agregada a través de todos los expedientes.
router.get('/admin/human-review-queue', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const result = await getHumanReviewQueue({ limit, offset });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard de métricas del módulo (sección 30 del plan: "Dashboard admin ->
// Costos por evaluación, Tasa de error OCR..."). Primera vista agregada a
// través de TODOS los expedientes -- antes solo existían métricas por
// expediente individual (totalCostUsd) o listas sin agregar (cola de
// revisión humana).
router.get('/admin/readiness-metrics', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const metrics = await getReadinessMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
