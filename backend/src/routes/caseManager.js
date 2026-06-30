import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  createScreeningCase,
  listCases,
  getCase,
  addCaseAction,
  resolveCase
} from '../services/caseManagerService.js';

const router = Router();

const VALID_ACTIONS = ['false_positive', 'confirm_hit', 'escalate', 'note', 'resolve'];
const VALID_DICTAMENES = ['APROBADO', 'RECHAZADO', 'EN_REVISION', 'ESCALADO'];
const VALID_STATUSES = ['pending', 'resolved', 'escalated'];

// POST /api/nagmar/screen — Screening completo + crea caso persistido
router.post('/nagmar/screen', authMiddleware, async (req, res, next) => {
  try {
    const { name, country } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: 'El campo "name" es requerido.' });
    }
    const result = await createScreeningCase({
      userId: req.user.id,
      name: name.trim(),
      country: country?.trim() || null
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/nagmar/cases — Listar casos del usuario autenticado
router.get('/nagmar/cases', authMiddleware, async (req, res, next) => {
  try {
    const { page = '1', limit = '20', verdict, status } = req.query;
    const result = await listCases({
      userId: req.user.id,
      page: Math.max(1, parseInt(page, 10) || 1),
      limit: Math.min(100, Math.max(1, parseInt(limit, 10) || 20)),
      verdict: verdict || undefined,
      status: status || undefined
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/nagmar/cases/:id — Detalle de caso + historial de acciones
router.get('/nagmar/cases/:id', authMiddleware, async (req, res, next) => {
  try {
    const result = await getCase({ userId: req.user.id, caseId: req.params.id });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/nagmar/cases/:id/actions — Registrar accion del analista
router.post('/nagmar/cases/:id/actions', authMiddleware, async (req, res, next) => {
  try {
    const { action, source, entityName, reason } = req.body;
    if (!action || !VALID_ACTIONS.includes(action)) {
      return res.status(400).json({
        error: `Accion invalida. Valores permitidos: ${VALID_ACTIONS.join(', ')}`
      });
    }
    const result = await addCaseAction({
      userId: req.user.id,
      caseId: req.params.id,
      action,
      source: source || null,
      entityName: entityName || null,
      reason: reason || null
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/nagmar/cases/:id — Actualizar dictamen / notas / status
router.patch('/nagmar/cases/:id', authMiddleware, async (req, res, next) => {
  try {
    const { dictamen, notes, status } = req.body;
    if (dictamen && !VALID_DICTAMENES.includes(dictamen)) {
      return res.status(400).json({
        error: `Dictamen invalido. Valores permitidos: ${VALID_DICTAMENES.join(', ')}`
      });
    }
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Status invalido. Valores permitidos: ${VALID_STATUSES.join(', ')}`
      });
    }
    const result = await resolveCase({
      userId: req.user.id,
      caseId: req.params.id,
      dictamen,
      notes,
      status
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
