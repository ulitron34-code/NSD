import express from 'express';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { logAuditEvent } from '../utils/audit.js';
import {
  listReferenceSources,
  createReferenceSource,
  updateReferenceSource,
  deactivateReferenceSource
} from '../services/referenceSourcesService.js';

const router = express.Router();

// Catálogo de fuentes oficiales (sección 24 del plan: GET /api/reference-sources).
router.get('/reference-sources', authMiddleware, async (req, res) => {
  try {
    const { country, sourceType, integrationStatus } = req.query;
    const sources = await listReferenceSources({ country, sourceType, integrationStatus });
    res.json({ sources });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Gestión del catálogo (sección 8.1 del plan: rol Administrador "gestionar
// catálogos... fuentes") -- antes de esto la tabla solo tenía GET, sin forma
// de agregar/corregir/desactivar una fuente sin escribir SQL a mano.
router.get('/admin/reference-sources', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { country, sourceType, integrationStatus } = req.query;
    const sources = await listReferenceSources({ country, sourceType, integrationStatus, includeInactive: true });
    res.json({ sources });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/admin/reference-sources', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const source = await createReferenceSource(req.body || {});
    await logAuditEvent({
      userId: req.userId,
      action: 'reference_source_created',
      entityType: 'reference_source',
      entityId: source.id,
      req,
      metadata: { name: source.name }
    });
    res.json({ source });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/admin/reference-sources/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const source = await updateReferenceSource(req.params.id, req.body || {});
    await logAuditEvent({
      userId: req.userId,
      action: 'reference_source_updated',
      entityType: 'reference_source',
      entityId: source.id,
      req,
      metadata: { name: source.name }
    });
    res.json({ source });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/admin/reference-sources/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const source = await deactivateReferenceSource(req.params.id);
    await logAuditEvent({
      userId: req.userId,
      action: 'reference_source_deactivated',
      entityType: 'reference_source',
      entityId: source.id,
      req,
      metadata: { name: source.name }
    });
    res.json({ source });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
