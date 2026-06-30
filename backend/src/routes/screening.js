import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { screenEntity, getGatewayStatus } from '../services/sanctionsGateway.js';
import { screenEntityFull, getRegulatoryGatewayStatus } from '../services/regulatoryGateway.js';

const router = Router();

// POST /api/screening/check
// Body: { name: string }
// Corre el nombre contra las 6 listas de sanciones en paralelo.
router.post('/screening/check', authMiddleware, async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Campo "name" requerido (string)' });
    }
    const result = await screenEntity(name.trim());
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/screening/status
// Estado de todas las listas (cuantos registros, cuando se cargaron, errores).
router.get('/screening/status', authMiddleware, (req, res) => {
  res.json(getGatewayStatus());
});

// POST /api/screening/check-full
// Body: { name: string, country?: string }
// Corre el nombre contra sanciones (6 fuentes) + INTERPOL + FATF en paralelo.
// Devuelve veredicto consolidado con modelo de entidades normalizado.
router.post('/screening/check-full', authMiddleware, async (req, res, next) => {
  try {
    const { name, country } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Campo "name" requerido (string)' });
    }
    const result = await screenEntityFull(name.trim(), country?.trim() || null);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/screening/status-full
// Estado de todas las listas: sanciones + regulatorio + FATF.
router.get('/screening/status-full', authMiddleware, (req, res) => {
  res.json(getRegulatoryGatewayStatus());
});

export default router;
