import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { screenEntity, getGatewayStatus } from '../services/sanctionsGateway.js';

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

export default router;
