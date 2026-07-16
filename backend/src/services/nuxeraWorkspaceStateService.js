import { supabaseAdmin } from '../config/supabase.js';
import { logAuditEvent } from '../utils/audit.js';

const APPLICANT_ROLE = 'applicant';
const CHECKLIST_SURFACE = 'checklist';
const ALLOWED_CHECKLIST_STATUSES = new Set([
  'draft',
  'in_progress',
  'evidence_in_review',
  'human_review_required',
  'ready_for_review',
  'archived'
]);

function normalizePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {};
  return payload;
}

function normalizeStatus(status) {
  const normalized = String(status || 'in_progress').trim().toLowerCase();
  if (!ALLOWED_CHECKLIST_STATUSES.has(normalized)) {
    throw new Error('Estado NUXERA checklist invalido');
  }
  return normalized;
}

export function buildDefaultApplicantChecklistState(orderId) {
  return {
    id: null,
    orderId,
    workspaceRole: APPLICANT_ROLE,
    surface: CHECKLIST_SURFACE,
    status: 'draft',
    payload: {},
    version: 0,
    persisted: false,
    guardrails: [
      'Estado local por defecto; no hay persistencia NUXERA creada todavia.',
      'No cambia documentos, permisos ni data-room shares.',
      'No aprueba credito ni garantiza financiamiento.'
    ]
  };
}

function mapWorkspaceState(row) {
  if (!row) return null;
  return {
    id: row.id,
    orderId: row.order_id,
    workspaceRole: row.workspace_role,
    surface: row.surface,
    status: row.status,
    payload: row.payload || {},
    version: Number(row.version || 1),
    persisted: true,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
    archivedAt: row.archived_at || null,
    guardrails: [
      'Persistencia limitada a applicant checklist.',
      'No cambia documentos, permisos ni data-room shares.',
      'Cada actualizacion debe quedar auditada.'
    ]
  };
}

export async function assertApplicantOrderOwner(orderId, userId) {
  const { data, error } = await supabaseAdmin
    .from('service_orders')
    .select('id, user_id')
    .eq('id', orderId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    throw new Error('Expediente no encontrado o sin permisos para NUXERA');
  }

  return data;
}

async function findApplicantChecklistState(orderId) {
  const { data, error } = await supabaseAdmin
    .from('nuxera_workspace_states')
    .select('*')
    .eq('order_id', orderId)
    .eq('workspace_role', APPLICANT_ROLE)
    .eq('surface', CHECKLIST_SURFACE)
    .is('archived_at', null)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function getApplicantChecklistState({ orderId, userId }) {
  await assertApplicantOrderOwner(orderId, userId);
  const row = await findApplicantChecklistState(orderId);
  return mapWorkspaceState(row) || buildDefaultApplicantChecklistState(orderId);
}

export async function upsertApplicantChecklistState({ orderId, userId, status, payload, req = null }) {
  await assertApplicantOrderOwner(orderId, userId);

  const nextStatus = normalizeStatus(status);
  const nextPayload = normalizePayload(payload);
  const current = await findApplicantChecklistState(orderId);
  const nextVersion = Number(current?.version || 0) + 1;

  const baseRow = {
    order_id: orderId,
    workspace_role: APPLICANT_ROLE,
    surface: CHECKLIST_SURFACE,
    status: nextStatus,
    payload: nextPayload,
    version: nextVersion,
    updated_by: userId,
    updated_at: new Date().toISOString()
  };

  let row;
  let action;

  if (current?.id) {
    const { data, error } = await supabaseAdmin
      .from('nuxera_workspace_states')
      .update(baseRow)
      .eq('id', current.id)
      .select('*')
      .single();
    if (error) throw error;
    row = data;
    action = 'nuxera_state_updated';
  } else {
    const { data, error } = await supabaseAdmin
      .from('nuxera_workspace_states')
      .insert([{ ...baseRow, created_by: userId }])
      .select('*')
      .single();
    if (error) throw error;
    row = data;
    action = 'nuxera_state_created';
  }

  await logAuditEvent({
    userId,
    action,
    entityType: 'nuxera_workspace_state',
    entityId: row.id,
    orderId,
    req,
    metadata: {
      surface: CHECKLIST_SURFACE,
      workspaceRole: APPLICANT_ROLE,
      previousStatus: current?.status || null,
      nextStatus,
      version: row.version,
      featureFlag: 'VITE_NUXERA_EXPERIENCE_ENABLED',
      humanReviewRequired: true,
      guardrailsApplied: true,
      rollbackReference: 'feature-flag-disable-and-soft-archive'
    }
  });

  return mapWorkspaceState(row);
}
