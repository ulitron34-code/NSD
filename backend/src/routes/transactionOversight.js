import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { evaluateTransaction, getTransactionRules } from '../services/transactionOversightService.js';

const router = Router();

// POST /api/transactions/screen
// Evalua una transaccion contra reglas de compliance y screening de sanciones.
// Body: { name, amount, currency, countryCode, txType, notes }
router.post('/transactions/screen', authMiddleware, async (req, res, next) => {
  try {
    const { name, amount, currency, countryCode, txType, notes } = req.body;
    if (amount === undefined || amount === null) {
      return res.status(400).json({ error: 'Campo "amount" requerido (numero)' });
    }
    const result = await evaluateTransaction({ name, amount, currency, countryCode, txType, notes });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/transactions/rules
// Devuelve la configuracion de reglas activa para mostrar en el panel de monitoreo.
router.get('/transactions/rules', authMiddleware, (req, res) => {
  res.json(getTransactionRules());
});

export default router;
