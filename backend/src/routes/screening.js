import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { screenEntity, getGatewayStatus } from '../services/sanctionsGateway.js';
import { screenEntityFull, getRegulatoryGatewayStatus } from '../services/regulatoryGateway.js';
import { screenRfcAgainstSat69b, getSat69bListStatus } from '../services/satBlacklistScreening.js';

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

// POST /api/screening/sat69b
// Body: { rfc?: string, razonSocial?: string }
// Corre el RFC/razon social contra el listado publico 69-B del SAT (EFOS).
router.post('/screening/sat69b', authMiddleware, async (req, res, next) => {
  try {
    const { rfc, razonSocial } = req.body;
    if (!rfc && !razonSocial) {
      return res.status(400).json({ error: 'Se requiere "rfc" o "razonSocial"' });
    }
    const result = screenRfcAgainstSat69b(rfc, razonSocial);
    res.json({ ...result, rfc: rfc || null, razonSocial: razonSocial || null, screened_at: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

// GET /api/screening/sat69b/status
// Estado del listado 69-B (cuantos registros, cuando se cargo, errores).
router.get('/screening/sat69b/status', authMiddleware, (req, res) => {
  res.json(getSat69bListStatus());
});

export default router;
