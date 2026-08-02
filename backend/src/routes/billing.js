import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getOrCreateIndividualAccount } from '../services/billingAccountService.js';
import { resolveEntitlements } from '../services/entitlementService.js';

const router = express.Router();

const BILLING_ACCOUNTS_ENABLED = String(process.env.BILLING_ACCOUNTS_ENABLED || 'false').toLowerCase() === 'true';

function requireFlag(req, res, next) {
  if (!BILLING_ACCOUNTS_ENABLED) {
    return res.status(404).json({ error: 'Not found' });
  }
  next();
}

// Fase 2 del plan comercial ("Cuentas y entitlements", modo lectura, sin
// cobrar). Cada usuario autenticado tiene como máximo una cuenta individual,
// creada perezosamente en su primera lectura -- no hay cobro ni asignación
// de suscripción/paquete real todavía (eso llega en Fase 4/5).
router.get('/billing/me', requireFlag, authMiddleware, async (req, res) => {
  try {
    const billingAccount = await getOrCreateIndividualAccount(req.userId);
    res.json({ billingAccount });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Devuelve los derechos resueltos de la cuenta del usuario autenticado.
// Sin usage_ledger todavía (Fase 6), `remaining` siempre iguala `limit` --
// no hay descuento de consumo que reportar hasta que exista esa pieza.
router.get('/billing/entitlements', requireFlag, authMiddleware, async (req, res) => {
  try {
    const billingAccount = await getOrCreateIndividualAccount(req.userId);
    const { entitlements } = await resolveEntitlements(billingAccount.id);
    res.json({ billingAccount, entitlements });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
