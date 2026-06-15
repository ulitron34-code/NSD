import express from 'express';
import { authMiddleware, requirePermission } from '../middleware/auth.js';
import { validateRegulatoryProfile } from '../services/regulatoryValidation.js';

const router = express.Router();

router.post('/regulatory/validate', authMiddleware, requirePermission('regulatory:own:validate'), async (req, res) => {
  try {
    const result = validateRegulatoryProfile({
      country: req.body?.country,
      applicant: req.body?.applicant || {}
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
