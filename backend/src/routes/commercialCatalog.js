import express from 'express';
import { listCommercialOffers } from '../services/commercialCatalogService.js';

const router = express.Router();

const COMMERCIAL_CATALOG_ENABLED = String(process.env.COMMERCIAL_CATALOG_ENABLED || 'false').toLowerCase() === 'true';

// Fuente única de precios/límites para landing, /modalidades, checkout y
// administración (Fase 1 del plan comercial). Público a propósito -- un
// visitante no autenticado debe poder evaluar precios antes de registrarse.
// No expone costos internos ni configuración de proveedores.
router.get('/commercial/offers', async (req, res) => {
  if (!COMMERCIAL_CATALOG_ENABLED) {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    const { audience, currency } = req.query;
    const offers = await listCommercialOffers({ audience, currency: currency || 'USD' });
    res.json({ offers });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
