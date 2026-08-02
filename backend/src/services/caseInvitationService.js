import crypto from 'node:crypto';
import { supabaseAdmin } from '../config/supabase.js';
import { assertBillingAccountMember } from './billingAccountService.js';
import { assertSponsorshipCapacity, createSponsoredCase } from './caseSponsorshipService.js';

const TOKEN_BYTES = 32;
const DEFAULT_EXPIRY_DAYS = 14;

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function mapInvitation(row) {
  if (!row) return null;
  return {
    id: row.id,
    sponsorBillingAccountId: row.sponsor_billing_account_id,
    sponsorUserId: row.sponsor_user_id,
    orderId: row.order_id,
    recipientEmail: row.recipient_email,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
    revokedAt: row.revoked_at,
    acceptedByUserId: row.accepted_by_user_id,
    status: row.status,
    createdAt: row.created_at
  };
}

async function findInvitationByToken(rawToken) {
  const { data, error } = await supabaseAdmin
    .from('case_invitations')
    .select('*')
    .eq('token_hash', hashToken(rawToken))
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Genera un token criptográfico y guarda solo su hash (sección 7.2 del
// plan) -- el token en claro se devuelve una única vez, para que el
// otorgante lo entregue por el canal que elija (email, link). No hay forma
// de recuperarlo después.
export async function createInvitation({
  sponsorBillingAccountId,
  sponsorUserId,
  recipientEmail,
  orderId = null,
  expiresInDays = DEFAULT_EXPIRY_DAYS
}) {
  if (!recipientEmail || !recipientEmail.includes('@')) {
    throw new Error('recipientEmail inválido');
  }

  await assertBillingAccountMember(sponsorUserId, sponsorBillingAccountId);

  const rawToken = crypto.randomBytes(TOKEN_BYTES).toString('hex');
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabaseAdmin
    .from('case_invitations')
    .insert({
      sponsor_billing_account_id: sponsorBillingAccountId,
      sponsor_user_id: sponsorUserId,
      order_id: orderId,
      recipient_email: recipientEmail.trim().toLowerCase(),
      token_hash: hashToken(rawToken),
      expires_at: expiresAt,
      status: 'pending'
    })
    .select()
    .single();
  if (error) throw error;

  return { invitation: mapInvitation(data), token: rawToken };
}

// Datos mínimos: nunca revela el expediente antes de autenticar/aceptar
// (sección 8.3). No expone sponsorBillingAccountId, orderId ni quién invitó.
export async function previewInvitation(rawToken) {
  const row = await findInvitationByToken(rawToken);
  if (!row) return null;

  const expired = row.status === 'pending' && new Date(row.expires_at).getTime() < Date.now();

  return {
    status: expired ? 'expired' : row.status,
    recipientEmail: row.recipient_email,
    expiresAt: row.expires_at
  };
}

// assertInvitationAcceptable (sección 6.2): existe, no expiró, no fue
// revocada ni ya aceptada, y el correo coincide con quien se está
// autenticando -- una invitación nunca la acepta alguien distinto del
// destinatario original.
async function assertInvitationAcceptable(rawToken, userEmail) {
  const row = await findInvitationByToken(rawToken);
  if (!row) {
    const err = new Error('Invitación no encontrada');
    err.code = 'INVITATION_NOT_FOUND';
    throw err;
  }
  if (row.status === 'revoked') {
    const err = new Error('La invitación fue revocada');
    err.code = 'INVITATION_REVOKED';
    throw err;
  }
  if (row.status === 'accepted') {
    const err = new Error('La invitación ya fue aceptada');
    err.code = 'INVITATION_ALREADY_ACCEPTED';
    throw err;
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await supabaseAdmin.from('case_invitations').update({ status: 'expired' }).eq('id', row.id);
    const err = new Error('La invitación expiró');
    err.code = 'INVITATION_EXPIRED';
    throw err;
  }
  if (row.recipient_email.toLowerCase() !== String(userEmail || '').toLowerCase()) {
    const err = new Error('La invitación fue enviada a otro correo');
    err.code = 'INVITATION_EMAIL_MISMATCH';
    throw err;
  }

  return row;
}

// Acepta una sola vez (sección 7.2): crea o vincula el expediente y su
// patrocinio, y nunca agrega al solicitante como miembro interno del
// otorgante -- conserva el rol solicitante (sección 2.3).
export async function acceptInvitation({ token, userId, userEmail }) {
  const invitation = await assertInvitationAcceptable(token, userEmail);

  await assertSponsorshipCapacity(invitation.sponsor_billing_account_id);

  const { order, sponsorship } = await createSponsoredCase({
    applicantUserId: userId,
    sponsorBillingAccountId: invitation.sponsor_billing_account_id,
    sourceInvitationId: invitation.id,
    orderId: invitation.order_id
  });

  const { data, error } = await supabaseAdmin
    .from('case_invitations')
    .update({ status: 'accepted', accepted_at: new Date().toISOString(), accepted_by_user_id: userId })
    .eq('id', invitation.id)
    .select()
    .single();
  if (error) throw error;

  return { invitation: mapInvitation(data), order, sponsorship };
}

export async function revokeInvitation({ invitationId, actingUserId }) {
  const { data: row, error } = await supabaseAdmin
    .from('case_invitations')
    .select('*')
    .eq('id', invitationId)
    .maybeSingle();
  if (error) throw error;
  if (!row) {
    const err = new Error('Invitación no encontrada');
    err.code = 'INVITATION_NOT_FOUND';
    throw err;
  }

  await assertBillingAccountMember(actingUserId, row.sponsor_billing_account_id);

  if (row.status !== 'pending') {
    const err = new Error('Solo se puede revocar una invitación pendiente');
    err.code = 'INVITATION_NOT_REVOCABLE';
    throw err;
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('case_invitations')
    .update({ status: 'revoked', revoked_at: new Date().toISOString() })
    .eq('id', invitationId)
    .select()
    .single();
  if (updateError) throw updateError;

  return mapInvitation(updated);
}
