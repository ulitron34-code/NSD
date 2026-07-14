// Ruta del agente de evaluacion de solicitante NSD.
//   POST /api/agent/applicant/screen
//   GET  /api/agent/applicant/status
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { runApplicantScreen } from '../agents/nsdApplicantAgent.js';
import { isConfigured as satConfigured } from '../services/satValidationService.js';
import { isProviderConfigured as buroConfigured } from '../services/creditProviders/creditProviderGateway.js';

const router = Router();

// POST /api/agent/applicant/screen
// Body: { rfc, name?, pepCargo? }
router.post('/agent/applicant/screen', authMiddleware, async (req, res, next) => {
  try {
    const { rfc, name, pepCargo } = req.body;
    if (!rfc) return res.status(400).json({ error: 'Campo "rfc" requerido' });

    const result = await runApplicantScreen({ rfc, name, pepCargo });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/agent/applicant/status
router.get('/agent/applicant/status', authMiddleware, (req, res) => {
  res.json({
    agent: 'NSD Applicant Screening Agent',
    model: 'claude-sonnet-4-6',
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
    sources: {
      sat: satConfigured() ? 'API real configurada' : 'MOCK (falta SAT_API_URL + SAT_API_KEY)',
      buro: buroConfigured() ? 'API real configurada' : 'MOCK (falta BURO_API_URL + BURO_API_KEY)',
      sanctions: 'Gateway real (OFAC + ONU + UK + UE + CA + FBI)',
      pep: 'Catalogo estatico LFPIORPI (no requiere API)',
      equifax: 'MOCK (falta integracion Equifax)',
      clarity: 'MOCK (falta integracion Clarity)'
    }
  });
});

export default router;
