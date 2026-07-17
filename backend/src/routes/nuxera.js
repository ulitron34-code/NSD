import express from 'express';
import { authMiddleware, requirePermission } from '../middleware/auth.js';
import { getAdminControls } from '../services/nuxeraAdminControlService.js';
import { getNuxeraBackendReadiness } from '../services/nuxeraBackendReadinessService.js';
import { getNuxeraControlledEvidenceScaffold } from '../services/nuxeraControlledEvidenceScaffoldService.js';
import { getNuxeraControlledVerificationPlan } from '../services/nuxeraControlledVerificationService.js';
import { getOwnerEvidenceLinks } from '../services/nuxeraEvidenceLinkService.js';
import { getApplicantChecklistState, upsertApplicantChecklistState } from '../services/nuxeraWorkspaceStateService.js';

const router = express.Router();

function sendNuxeraError(res, error) {
  const message = String(error?.message || '');

  if (/no encontrado|sin permisos/i.test(message)) {
    return res.status(404).json({
      error: 'Recurso NUXERA no disponible',
      code: 'NUXERA_RESOURCE_UNAVAILABLE'
    });
  }

  if (/invalido|invalida/i.test(message)) {
    return res.status(422).json({
      error: 'Datos NUXERA invalidos',
      code: 'NUXERA_INVALID_DATA'
    });
  }

  return res.status(503).json({
    error: 'Servicio NUXERA no disponible',
    code: 'NUXERA_BACKEND_UNAVAILABLE'
  });
}
router.get(
  '/nuxera/admin/verification-plan',
  authMiddleware,
  requirePermission('nuxera:admin:read'),
  async (req, res) => {
    try {
      const verificationPlan = getNuxeraControlledVerificationPlan();

      res.json({
        workspaceRole: 'admin',
        verificationPlan,
        guardrails: [
          'NU-DB-RLS-ENDPOINT-VERIFY-001 exposes the controlled verification plan in read-only mode.',
          'Verification plan does not execute endpoints, apply SQL, change RLS or enable writes.',
          'Completed evidence must come from a controlled non-production Supabase run.'
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);
router.get(
  '/nuxera/admin/verification-evidence-scaffold',
  authMiddleware,
  requirePermission('nuxera:admin:read'),
  async (req, res) => {
    try {
      const evidenceScaffold = getNuxeraControlledEvidenceScaffold({
        repoCommit: req.query?.commit,
        environment: req.query?.environment,
        operator: req.query?.operator,
        reviewer: req.query?.reviewer,
        priorKnownGoodCommit: req.query?.priorKnownGoodCommit,
        rollbackOwner: req.query?.rollbackOwner
      });

      res.json({
        workspaceRole: 'admin',
        evidenceScaffold,
        guardrails: [
          'Evidence scaffold is generated read-only and does not execute endpoint checks.',
          'No SQL, RLS, feature flag, permission, document grant or data-room mutation is performed.',
          'Operators must fill observed evidence from a controlled non-production Supabase run.'
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);
router.get(
  '/nuxera/admin/readiness',
  authMiddleware,
  requirePermission('nuxera:admin:read'),
  async (req, res) => {
    try {
      const readiness = await getNuxeraBackendReadiness();

      res.json({
        workspaceRole: 'admin',
        readiness,
        guardrails: [
          'NU-BE-READINESS-001 exposes backend readiness in read-only mode.',
          'Readiness does not apply SQL, change RLS or enable writes.',
          'RLS must still be verified with controlled identities before production use.'
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);
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
      sendNuxeraError(res, error);
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
      sendNuxeraError(res, error);
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
      sendNuxeraError(res, error);
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
      sendNuxeraError(res, error);
    }
  }
);

export default router;
