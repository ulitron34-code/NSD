import express from 'express';
import { authMiddleware, requirePermission } from '../middleware/auth.js';
import { getAdminControls } from '../services/nuxeraAdminControlService.js';
import { getOwnerEvidenceLinks } from '../services/nuxeraEvidenceLinkService.js';
import { getApplicantChecklistState, upsertApplicantChecklistState } from '../services/nuxeraWorkspaceStateService.js';

const router = express.Router();
router.get(
  '/nuxera/admin/controls',
  authMiddleware,
  requirePermission('nuxera:admin:read'),
  async (req, res) => {
    try {
      const controls = await getAdminControls();

      res.json({
        workspaceRole: 'admin',
        controls,
        guardrails: [
          'NU-ADM-CTRL-001 exposes admin controls in read-only mode.',
          'Admin controls do not activate automation, permissions or licensed market data.',
          'No write endpoint is exposed for admin controls.'
        ]
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.get(
  '/nuxera/orders/:orderId/state',
  authMiddleware,
  requirePermission('case:own:read'),
  async (req, res) => {
    try {
      const checklist = await getApplicantChecklistState({
        orderId: req.params.orderId,
        userId: req.userId
      });

      res.json({
        orderId: req.params.orderId,
        workspaceRole: 'applicant',
        states: { checklist },
        guardrails: [
          'NU-BE-002 exposes applicant checklist state only.',
          'No grantor memo, admin controls or document permissions are persisted by this route.'
        ]
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.get(
  '/nuxera/orders/:orderId/evidence',
  authMiddleware,
  requirePermission('case:own:read'),
  async (req, res) => {
    try {
      const evidence = await getOwnerEvidenceLinks({
        orderId: req.params.orderId,
        userId: req.userId
      });

      res.json({
        orderId: req.params.orderId,
        workspaceRole: 'applicant',
        evidence,
        guardrails: [
          'NU-BE-EVID-001 exposes owner-scoped evidence links only.',
          'Evidence links do not grant document access or data-room visibility.',
          'No write endpoint is exposed for evidence links.'
        ]
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);
router.patch(
  '/nuxera/orders/:orderId/state/:surface',
  authMiddleware,
  requirePermission('case:own:update'),
  async (req, res) => {
    try {
      if (req.params.surface !== 'checklist') {
        return res.status(400).json({ error: 'NUXERA surface no habilitada para persistencia' });
      }

      const checklist = await upsertApplicantChecklistState({
        orderId: req.params.orderId,
        userId: req.userId,
        status: req.body?.status,
        payload: req.body?.payload,
        req
      });

      res.json({
        orderId: req.params.orderId,
        workspaceRole: 'applicant',
        state: checklist
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

export default router;
