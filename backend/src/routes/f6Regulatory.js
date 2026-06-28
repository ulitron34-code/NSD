// Rutas F6: integraciones regulatorias Canada (Companies House) y EAU (Dubai).
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { lookupCompany, searchCompanies } from '../services/companiesHouseService.js';
import { verifyEmiratesId, verifyTradeLicense } from '../services/aeRegulatoryService.js';

const router = Router();

// ── Canada / UK — Companies House ────────────────────────────────────────────

// GET /api/regulatory/ca/company/:number
// Verifica una empresa por su numero de registro Companies House (8 chars).
// Para entidades canadienses incorporadas en UK; o verificacion de contrapartes UK.
router.get('/regulatory/ca/company/:number', authMiddleware, async (req, res, next) => {
  try {
    const result = await lookupCompany(req.params.number);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/regulatory/ca/company/search
// Body: { query: string, items?: number }
// Busca empresas por nombre en Companies House (max 10 por defecto).
router.post('/regulatory/ca/company/search', authMiddleware, async (req, res, next) => {
  try {
    const { query, items } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Campo "query" requerido (string)' });
    }
    const result = await searchCompanies(query.trim(), items || 10);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ── EAU — Emirates ID ────────────────────────────────────────────────────────

// POST /api/regulatory/ae/emirates-id
// Body: { emiratesId: string }
// Verifica un Emirates ID contra la API de la ICA/Dubai.
router.post('/regulatory/ae/emirates-id', authMiddleware, async (req, res, next) => {
  try {
    const { emiratesId } = req.body;
    if (!emiratesId) {
      return res.status(400).json({ error: 'Campo "emiratesId" requerido' });
    }
    const result = await verifyEmiratesId(emiratesId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ── EAU — Trade Licence ──────────────────────────────────────────────────────

// POST /api/regulatory/ae/trade-license
// Body: { licenseNumber: string }
// Verifica una licencia de comercio del DED de Dubai.
router.post('/regulatory/ae/trade-license', authMiddleware, async (req, res, next) => {
  try {
    const { licenseNumber } = req.body;
    if (!licenseNumber) {
      return res.status(400).json({ error: 'Campo "licenseNumber" requerido' });
    }
    const result = await verifyTradeLicense(licenseNumber);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
