import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { logAuditEvent } from '../utils/audit.js';
import {
  createInvitation,
  previewInvitation,
  acceptInvitation,
  revokeInvitation
} from '../services/caseInvitationService.js';

const router = express.Router();

const CASE_INVITATIONS_ENABLED = String(process.env.CASE_INVITATIONS_ENABLED || 'false').toLowerCase() === 'true';

function requireFlag(req, res, next) {
  if (!CASE_INVITATIONS_ENABLED) {
    return res.status(404).json({ error: 'Not found' });
  }
  next();
}

const ERROR_STATUS_BY_CODE = {
  INVITATION_NOT_FOUND: 404,
  INVITATION_REVOKED: 409,
  INVITATION_ALREADY_ACCEPTED: 409,
  INVITATION_EXPIRED: 409,
  INVITATION_EMAIL_MISMATCH: 403,
  INVITATION_NOT_REVOCABLE: 409,
  BILLING_ACCOUNT_NOT_FOUND: 404,
  BILLING_ACCOUNT_ACCESS_DENIED: 403,
  SPONSORSHIP_NO_ACTIVE_PLAN: 409,
  SPONSORSHIP_CAPACITY_EXCEEDED: 409
};

function respondError(res, error) {
  const status = ERROR_STATUS_BY_CODE[error.code] || 400;
  res.status(status).json({ error: error.message, code: error.code });
}

// Fase 3 del plan comercial ("Invitaciones patrocinadas"). Un otorgante
// (miembro de su cuenta de facturación) invita a un solicitante; el
// solicitante entra sin checkout y no ocupa asiento interno del otorgante
// (sección 2.3).
router.post('/invitations/cases', requireFlag, authMiddleware, async (req, res) => {
  try {
    const { sponsorBillingAccountId, recipientEmail, orderId, expiresInDays } = req.body || {};
    if (!sponsorBillingAccountId) {
      return res.status(400).json({ error: 'sponsorBillingAccountId es requerido' });
    }

    const { invitation, token } = await createInvitation({
      sponsorBillingAccountId,
      sponsorUserId: req.userId,
      recipientEmail,
      orderId: orderId || null,
      expiresInDays
    });

    await logAuditEvent({
      userId: req.userId,
      action: 'case_invitation_created',
      entityType: 'case_invitation',
      entityId: invitation.id,
      orderId: invitation.orderId,
      req,
      metadata: { sponsorBillingAccountId, recipientEmail: invitation.recipientEmail }
    });

    // El token en claro solo se devuelve aquí, una vez -- el backend guarda
    // únicamente su hash y no puede volver a mostrarlo.
    res.status(201).json({ invitation, token });
  } catch (error) {
    respondError(res, error);
  }
});

// Público a propósito: el destinatario todavía no se autenticó cuando
// decide si acepta. Nunca revela el expediente ni al otorgante (sección 8.3).
router.get('/invitations/cases/:token/preview', async (req, res) => {
  if (!CASE_INVITATIONS_ENABLED) {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    const preview = await previewInvitation(req.params.token);
    if (!preview) return res.status(404).json({ error: 'Invitación no encontrada' });
    res.json({ invitation: preview });
  } catch (error) {
    respondError(res, error);
  }
});

router.post('/invitations/cases/:token/accept', requireFlag, authMiddleware, async (req, res) => {
  try {
    const userEmail = req.userProfile?.email || req.user?.email;
    const { invitation, order, sponsorship } = await acceptInvitation({
      token: req.params.token,
      userId: req.userId,
      userEmail
    });

    await logAuditEvent({
      userId: req.userId,
      action: 'case_invitation_accepted',
      entityType: 'case_sponsorship',
      entityId: sponsorship.id,
      orderId: order.id,
      req,
      metadata: { invitationId: invitation.id, sponsorBillingAccountId: sponsorship.sponsorBillingAccountId }
    });

    res.json({ invitation, order, sponsorship });
  } catch (error) {
    respondError(res, error);
  }
});

router.post('/invitations/cases/:invitationId/revoke', requireFlag, authMiddleware, async (req, res) => {
  try {
    const invitation = await revokeInvitation({
      invitationId: req.params.invitationId,
      actingUserId: req.userId
    });

    await logAuditEvent({
      userId: req.userId,
      action: 'case_invitation_revoked',
      entityType: 'case_invitation',
      entityId: invitation.id,
      orderId: invitation.orderId,
      req,
      metadata: { sponsorBillingAccountId: invitation.sponsorBillingAccountId }
    });

    res.json({ invitation });
  } catch (error) {
    respondError(res, error);
  }
});

export default router;
