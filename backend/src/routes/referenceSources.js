import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { listReferenceSources } from '../services/referenceSourcesService.js';

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

export default router;
