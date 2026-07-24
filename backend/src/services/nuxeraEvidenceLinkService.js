import { supabaseAdmin } from '../config/supabase.js';

const ALLOWED_ENGINES = new Set(['finance', 'intelligence', 'markets', 'strategy', 'admin']);
const ALLOWED_VISIBILITY = new Set(['owner', 'authorized_grantor', 'internal']);

function normalizeObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value;
}

function mapEvidenceLink(row) {
  return {
    id: row.id,
    workspaceStateId: row.workspace_state_id || null,
    orderId: row.order_id,
    documentId: row.document_id || null,
    documentReviewId: row.document_review_id || null,
    engine: row.engine,
    label: row.label,
    visibility: row.visibility,
    provenance: normalizeObject(row.provenance),
    createdBy: row.created_by || null,
    createdAt: row.created_at || null,
    archivedAt: row.archived_at || null,
    guardrails: [
      'Evidence link read-only; no otorga acceso documental.',
      'No cambia documentos, reviews ni data-room shares.',
      'Grantor/internal visibility requiere autorizacion dedicada antes de exponerse.'
    ]
  };
}

export function buildDefaultEvidenceLinks(orderId) {
  return {
    orderId,
    persisted: false,
    links: [],
    guardrails: [
      'No hay nuxera_evidence_links persistidos para este expediente.',
      'El frontend puede seguir usando ledger local read-only.',
      'No se concede acceso documental por ausencia o presencia de links.'
    ]
  };
}

export async function assertEvidenceOwnerOrder(orderId, userId) {
  const { data, error } = await supabaseAdmin
    .from('service_orders')
    .select('id, user_id')
    .eq('id', orderId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    throw new Error('Expediente no encontrado o sin permisos para evidencia NUXERA');
  }

  return data;
}

function validateLink(row) {
  if (!ALLOWED_ENGINES.has(row.engine)) throw new Error('Engine NUXERA evidence invalido');
  if (!ALLOWED_VISIBILITY.has(row.visibility)) throw new Error('Visibilidad NUXERA evidence invalida');
}

export async function assertEvidenceGrantorAuthorized(orderId, userId, email) {
  if (!email) {
    throw new Error('Usuario autenticado sin email');
  }

  let { data, error } = await supabaseAdmin
    .from('data_room_shares')
    .select('id, order_id, status')
    .eq('order_id', orderId)
    .or(`recipient_user_id.eq.${userId},recipient_email.ilike.${email}`)
    .in('status', ['accepted', 'shared'])
    .maybeSingle();

  if (error?.message?.includes('recipient_user_id')) {
    const fallback = await supabaseAdmin
      .from('data_room_shares')
      .select('id, order_id, status')
      .eq('order_id', orderId)
      .ilike('recipient_email', email)
      .in('status', ['accepted', 'shared'])
      .maybeSingle();
    data = fallback.data;
    error = fallback.error;
  }

  if (error || !data) {
    throw new Error('Expediente no encontrado o sin permisos para revision de otorgante');
  }

  return data;
}

export async function getAuthorizedGrantorEvidenceLinks({ orderId, userId, email }) {
  await assertEvidenceGrantorAuthorized(orderId, userId, email);

  const { data, error } = await supabaseAdmin
    .from('nuxera_evidence_links')
    .select('*')
    .eq('order_id', orderId)
    .eq('visibility', 'authorized_grantor')
    .is('archived_at', null);

  if (error) throw error;

  const rows = Array.isArray(data) ? data : [];
  rows.forEach(validateLink);
  const links = rows.map(mapEvidenceLink);

  if (!links.length) return buildDefaultEvidenceLinks(orderId);

  return {
    orderId,
    persisted: true,
    links,
    summary: {
      total: links.length,
      engines: [...new Set(links.map((link) => link.engine))],
      visibility: [...new Set(links.map((link) => link.visibility))]
    },
    guardrails: [
      'Evidence links authorized-grantor-scoped only; requires an accepted data_room_shares record.',
      'Links reference evidence; they do not grant document access.',
      'No write endpoint is exposed in this slice.'
    ]
  };
}

export async function getOwnerEvidenceLinks({ orderId, userId }) {
  await assertEvidenceOwnerOrder(orderId, userId);

  const { data, error } = await supabaseAdmin
    .from('nuxera_evidence_links')
    .select('*')
    .eq('order_id', orderId)
    .eq('visibility', 'owner')
    .is('archived_at', null);

  if (error) throw error;

  const rows = Array.isArray(data) ? data : [];
  rows.forEach(validateLink);
  const links = rows.map(mapEvidenceLink);

  if (!links.length) return buildDefaultEvidenceLinks(orderId);

  return {
    orderId,
    persisted: true,
    links,
    summary: {
      total: links.length,
      engines: [...new Set(links.map((link) => link.engine))],
      visibility: [...new Set(links.map((link) => link.visibility))]
    },
    guardrails: [
      'Evidence links owner-scoped only in NU-BE-EVID-001.',
      'Links reference evidence; they do not grant document access.',
      'No write endpoint is exposed in this slice.'
    ]
  };
}