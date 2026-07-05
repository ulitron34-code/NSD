import express from 'express';
import { reviewReadinessChecklist } from '../services/aiEngine.js';

const router = express.Router();

// POST /requisitos-minimos/review
// Revisión IA (Claude real, con fallback heurístico) del checklist de 12 Requisitos Mínimos.
// Sin auth: es stateless, el checklist se maneja hoy por localStorage en el frontend, no hay
// datos de orden/PII que proteger aquí.
router.post('/requisitos-minimos/review', async (req, res) => {
  try {
    const { items, language } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items es requerido y debe ser un arreglo no vacío' });
    }
    const result = await reviewReadinessChecklist(items, language);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
