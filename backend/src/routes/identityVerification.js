import express from 'express';
import { verifyIdentity, getVerificationStats } from '../services/identityVerificationService.js';

const router = express.Router();

// GET /api/identity/readiness - Chequea si corpus está listo
router.get('/readiness', async (req, res) => {
  try {
    const stats = await getVerificationStats();
    res.json({
      success: true,
      ...stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/identity/verify - Verifica identidad contra corpus de sanciones
router.post('/verify', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Campo "query" requerido'
      });
    }

    const result = await verifyIdentity(query);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Identity verification error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/identity/search - Búsqueda GET (alternativo)
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Parámetro "q" requerido'
      });
    }

    const result = await verifyIdentity(q);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Identity search error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
