import crypto from 'node:crypto';
import { supabaseAdmin } from '../config/supabase.js';
import { resolveEntitlements } from './entitlementService.js';

const ACTIVE_SPONSORSHIP_STATUSES = ['active'];

function mapSponsorship(row) {
  if (!row) return null;
  return {
    id: row.id,
    orderId: row.order_id,
    sponsorBillingAccountId: row.sponsor_billing_account_id,
    applicantUserId: row.applicant_user_id,
    sourceInvitationId: row.source_invitation_id,
    status: row.status,
    startedAt: row.started_at,
    endedAt: row.ended_at
  };
}

export async function countActiveSponsorships(sponsorBillingAccountId) {
  const { data, error } = await supabaseAdmin
    .from('case_sponsorships')
    .select('id')
    .eq('sponsor_billing_account_id', sponsorBillingAccountId)
    .in('status', ACTIVE_SPONSORSHIP_STATUSES);
  if (error) throw error;
  return (data || []).length;
}

// Sección 2.3 del plan: "el expediente patrocinado está dentro del límite
// del otorgante". Sin una suscripción activa con entitlement `active_cases`
// no hay capacidad que otorgar -- un otorgante sin plan no puede patrocinar.
export async function assertSponsorshipCapacity(sponsorBillingAccountId) {
  const { entitlements } = await resolveEntitlements(sponsorBillingAccountId);
  const activeCases = entitlements.find((e) => e.key === 'active_cases' && e.allowed);

  if (!activeCases || activeCases.limit === null) {
    const err = new Error('La cuenta patrocinadora no tiene un plan activo con expedientes disponibles');
    err.code = 'SPONSORSHIP_NO_ACTIVE_PLAN';
    throw err;
  }

  const current = await countActiveSponsorships(sponsorBillingAccountId);
  if (current >= activeCases.limit) {
    const err = new Error('La cuenta patrocinadora alcanzó su límite de expedientes activos');
    err.code = 'SPONSORSHIP_CAPACITY_EXCEEDED';
    throw err;
  }

  return { current, limit: activeCases.limit };
}

// Mismo par institucional/legacy que backend/src/routes/orders.js -- el
// esquema real de service_orders vive fuera de este repo (no hay migración
// para la tabla base), así que replicamos su fallback por columna faltante
// en lugar de asumir cuál de los dos esquemas está activo hoy.
async function createServiceOrderForSponsorship(applicantUserId, serviceType) {
  const caseNumber = `NSD-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const metadata = {
    projectName: `Expediente patrocinado ${caseNumber}`,
    caseStage: 'captura',
    riskLevel: 'pendiente',
    readinessGrade: 'pendiente',
    complianceStatus: 'pendiente',
    canShareWithFunders: false,
    sponsored: true
  };

  const institutionalPayload = {
    user_id: applicantUserId,
    service_type: serviceType,
    amount: 0,
    status: 'in_progress',
    case_number: caseNumber,
    project_name: metadata.projectName,
    stage: metadata.caseStage,
    risk_level: metadata.riskLevel,
    readiness_grade: metadata.readinessGrade,
    compliance_status: metadata.complianceStatus,
    can_share_with_funders: metadata.canShareWithFunders,
    metadata
  };

  const legacyPayload = {
    user_id: applicantUserId,
    service_type: serviceType,
    amount: 0,
    status: 'in_progress',
    metadata
  };

  let { data, error } = await supabaseAdmin
    .from('service_orders')
    .insert([institutionalPayload])
    .select();

  if (error && /column|schema cache/i.test(error.message || '')) {
    const fallback = await supabaseAdmin
      .from('service_orders')
      .insert([legacyPayload])
      .select();
    data = fallback.data;
    error = fallback.error;
  }
  if (error) throw error;

  return data[0];
}

// Crea el expediente patrocinado (o lo vincula, si la invitación ya traía un
// order_id) y su registro de patrocinio. El solicitante nunca ve un cobro:
// amount = 0 y no se agrega como miembro interno del otorgante (sección
// 2.3 -- "el solicitante conserva el rol solicitante").
export async function createSponsoredCase({
  applicantUserId,
  sponsorBillingAccountId,
  sourceInvitationId = null,
  orderId = null,
  serviceType = 'sponsored_case'
}) {
  const order = orderId
    ? { id: orderId }
    : await createServiceOrderForSponsorship(applicantUserId, serviceType);

  const { data, error } = await supabaseAdmin
    .from('case_sponsorships')
    .insert({
      order_id: order.id,
      sponsor_billing_account_id: sponsorBillingAccountId,
      applicant_user_id: applicantUserId,
      source_invitation_id: sourceInvitationId,
      status: 'active'
    })
    .select()
    .single();
  if (error) throw error;

  return { order, sponsorship: mapSponsorship(data) };
}

export async function resolveCaseFundingSource(orderId) {
  const { data, error } = await supabaseAdmin
    .from('case_sponsorships')
    .select('*')
    .eq('order_id', orderId)
    .eq('status', 'active')
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return { type: 'sponsored', sponsorship: mapSponsorship(data) };
}

// Doble control (sección 6.2): confirma que el usuario es el solicitante
// patrocinado o pertenece a la cuenta patrocinadora antes de exponer datos
// comerciales del expediente. Una invitación de un otorgante NUNCA da
// acceso a expedientes patrocinados por otro (sección 2.3, última regla).
export async function assertCaseCommercialAccess(userId, orderId) {
  const fundingSource = await resolveCaseFundingSource(orderId);
  if (!fundingSource) {
    const err = new Error('El expediente no tiene patrocinio activo');
    err.code = 'CASE_NOT_SPONSORED';
    throw err;
  }

  const { sponsorship } = fundingSource;
  if (sponsorship.applicantUserId === userId) return fundingSource;

  const { data: account, error: accountError } = await supabaseAdmin
    .from('billing_accounts')
    .select('owner_user_id')
    .eq('id', sponsorship.sponsorBillingAccountId)
    .maybeSingle();
  if (accountError) throw accountError;

  if (account?.owner_user_id === userId) return fundingSource;

  const { data: membership, error: membershipError } = await supabaseAdmin
    .from('billing_account_members')
    .select('id')
    .eq('billing_account_id', sponsorship.sponsorBillingAccountId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  if (membershipError) throw membershipError;

  if (membership) return fundingSource;

  const err = new Error('Acceso denegado al patrocinio de este expediente');
  err.code = 'SPONSORSHIP_ACCESS_DENIED';
  throw err;
}
