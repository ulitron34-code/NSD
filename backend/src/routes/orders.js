import express from 'express';
import crypto from 'node:crypto';
import { supabaseAdmin } from '../config/supabase.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';
import { buildExecutiveReport, scoreExpedient } from '../services/scoringEngine.js';
import { REQUIREMENTS_MATRIX } from '../config/requirementsMatrix.js';
import { logAuditEvent } from '../utils/audit.js';

const router = express.Router();

const CASE_STAGE_DEFAULTS = {
  pending: 'captura',
  paid: 'revision_documental',
  in_progress: 'revision_documental',
  completed: 'cerrado'
};

const ALLOWED_CASE_STAGES = new Set([
  'captura',
  'revision_documental',
  'scoring',
  'data_room',
  'presentado_otorgantes',
  'cerrado'
]);

const ALLOWED_COMPLIANCE_STATUSES = new Set([
  'pendiente',
  'en_revision',
  'observado',
  'aprobado_para_presentacion',
  'rechazado_por_cumplimiento'
]);

function normalizeInstitutionalPatch(body = {}) {
  const patch = {};

  if (body.projectName !== undefined) patch.project_name = body.projectName;
  if (body.applicantType !== undefined) patch.applicant_type = body.applicantType;
  if (body.requestedAmount !== undefined) patch.requested_amount = Number(body.requestedAmount) || null;
  if (body.fundingPurpose !== undefined) patch.funding_purpose = body.fundingPurpose;
  if (body.stage !== undefined) {
    if (!ALLOWED_CASE_STAGES.has(body.stage)) throw new Error('Etapa de expediente invalida');
    patch.stage = body.stage;
  }
  if (body.riskLevel !== undefined) patch.risk_level = body.riskLevel;
  if (body.readinessGrade !== undefined) patch.readiness_grade = String(body.readinessGrade).toUpperCase();
  if (body.complianceStatus !== undefined) {
    if (!ALLOWED_COMPLIANCE_STATUSES.has(body.complianceStatus)) throw new Error('Estado de cumplimiento invalido');
    patch.compliance_status = body.complianceStatus;
  }
  if (body.canShareWithFunders !== undefined) patch.can_share_with_funders = Boolean(body.canShareWithFunders);

  return patch;
}

function patchToMetadata(patch = {}) {
  const mapped = {};
  if (patch.project_name !== undefined) mapped.projectName = patch.project_name;
  if (patch.applicant_type !== undefined) mapped.applicantType = patch.applicant_type;
  if (patch.requested_amount !== undefined) mapped.requestedAmount = patch.requested_amount;
  if (patch.funding_purpose !== undefined) mapped.fundingPurpose = patch.funding_purpose;
  if (patch.stage !== undefined) mapped.caseStage = patch.stage;
  if (patch.risk_level !== undefined) mapped.riskLevel = patch.risk_level;
  if (patch.readiness_grade !== undefined) mapped.readinessGrade = patch.readiness_grade;
  if (patch.compliance_status !== undefined) mapped.complianceStatus = patch.compliance_status;
  if (patch.can_share_with_funders !== undefined) mapped.canShareWithFunders = patch.can_share_with_funders;
  return mapped;
}

function buildCaseMetadata(metadata = {}, serviceType) {
  const submittedAt = metadata.submittedAt || new Date().toISOString();
  const projectName = metadata.projectName || metadata.companyName || `Expediente ${String(serviceType || 'NSD').toUpperCase()}`;

  return {
    projectName,
    description: metadata.description || null,
    sector: metadata.sector || null,
    investmentRequired: metadata.investmentRequired || metadata.requestedAmount || null,
    requestedAmount: metadata.requestedAmount || metadata.investmentRequired || null,
    fundingPurpose: metadata.fundingPurpose || metadata.useOfFunds || null,
    applicantType: metadata.applicantType || metadata.entityType || 'empresa',
    targetEntity: metadata.targetEntity || metadata.entityType || null,
    country: metadata.country || 'MX',
    hasDocuments: metadata.hasDocuments || null,
    contactEmail: metadata.email || metadata.contactEmail || null,
    contactPhone: metadata.phone || metadata.contactPhone || null,
    companyName: metadata.companyName || null,
    serviceName: metadata.serviceName || null,
    caseStage: metadata.caseStage || 'captura',
    riskLevel: metadata.riskLevel || 'pendiente',
    readinessGrade: metadata.readinessGrade || 'pendiente',
    complianceStatus: metadata.complianceStatus || 'pendiente',
    canShareWithFunders: Boolean(metadata.canShareWithFunders || false),
    submittedAt
  };
}

// CREAR ORDEN
router.post('/orders', authMiddleware, requirePermission('case:own:create'), async (req, res) => {
  const { serviceType, amount, metadata = {} } = req.body;

  try {
    const cleanAmount = Number(amount);

    if (!serviceType || !Number.isFinite(cleanAmount) || cleanAmount <= 0) {
      return res.status(400).json({ error: 'serviceType and valid amount are required' });
    }

    const caseMetadata = buildCaseMetadata(metadata, serviceType);
    const caseNumber = `NSD-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const institutionalPayload = {
      user_id: req.userId,
      service_type: serviceType,
      amount: cleanAmount,
      status: 'pending',
      case_number: caseNumber,
      project_name: caseMetadata.projectName,
      applicant_type: caseMetadata.applicantType,
      requested_amount: Number(caseMetadata.requestedAmount || cleanAmount) || cleanAmount,
      funding_purpose: caseMetadata.fundingPurpose,
      stage: caseMetadata.caseStage,
      risk_level: caseMetadata.riskLevel,
      readiness_grade: caseMetadata.readinessGrade,
      compliance_status: caseMetadata.complianceStatus,
      can_share_with_funders: caseMetadata.canShareWithFunders,
      metadata: caseMetadata
    };

    const legacyPayload = {
      user_id: req.userId,
      service_type: serviceType,
      amount: cleanAmount,
      status: 'pending',
      metadata: caseMetadata
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

    await logAuditEvent({
      userId: req.userId,
      action: 'case_created',
      entityType: 'service_order',
      entityId: data[0].id,
      orderId: data[0].id,
      req,
      metadata: {
        serviceType,
        caseNumber,
        projectName: caseMetadata.projectName,
        compatibilityMode: !data[0].case_number
      }
    });

    res.json(data[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// OBTENER ORDENES DEL USUARIO
router.get('/orders', authMiddleware, requirePermission('case:own:read'), async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('service_orders')
      .select()
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// OBTENER ORDEN POR ID
router.get('/orders/:orderId', authMiddleware, requirePermission('case:own:read'), async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('service_orders')
      .select()
      .eq('id', req.params.orderId)
      .eq('user_id', req.userId)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ACTUALIZAR CAPA INSTITUCIONAL DEL EXPEDIENTE
router.patch('/orders/:orderId/institutional', authMiddleware, requirePermission('case:own:update'), async (req, res) => {
  try {
    const { data: currentOrder, error: currentError } = await supabaseAdmin
      .from('service_orders')
      .select()
      .eq('id', req.params.orderId)
      .eq('user_id', req.userId)
      .single();

    if (currentError || !currentOrder) {
      throw new Error('Expediente no encontrado o sin permisos');
    }

    const patch = normalizeInstitutionalPatch(req.body || {});
    const metadataPatch = patchToMetadata(patch);
    const nextMetadata = {
      ...(currentOrder.metadata || {}),
      ...metadataPatch,
      institutionalUpdatedAt: new Date().toISOString()
    };

    let { data, error } = await supabaseAdmin
      .from('service_orders')
      .update({
        ...patch,
        metadata: nextMetadata
      })
      .eq('id', req.params.orderId)
      .eq('user_id', req.userId)
      .select()
      .single();

    if (error && /column|schema cache/i.test(error.message || '')) {
      const fallback = await supabaseAdmin
        .from('service_orders')
        .update({ metadata: nextMetadata })
        .eq('id', req.params.orderId)
        .eq('user_id', req.userId)
        .select()
        .single();
      data = fallback.data;
      error = fallback.error;
    }

    if (error) throw error;

    await logAuditEvent({
      userId: req.userId,
      action: 'case_institutional_updated',
      entityType: 'service_order',
      entityId: req.params.orderId,
      orderId: req.params.orderId,
      req,
      metadata: { patch, compatibilityMode: !data.stage }
    });

    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GENERAR REPORTE EJECUTIVO
router.post('/orders/:orderId/executive-report', authMiddleware, requirePermission('report:own:create'), async (req, res) => {
  try {
    const { orderId } = req.params;

    const { data: order, error } = await supabaseAdmin
      .from('service_orders')
      .select()
      .eq('id', orderId)
      .eq('user_id', req.userId)
      .single();

    if (error) throw error;

    const [{ data: documents, error: documentsError }, { data: reviews, error: reviewsError }] = await Promise.all([
      supabaseAdmin
        .from('documents')
        .select()
        .eq('order_id', orderId)
        .order('uploaded_at', { ascending: false }),
      supabaseAdmin
        .from('document_reviews')
        .select()
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })
    ]);

    if (documentsError) throw documentsError;
    if (reviewsError) throw reviewsError;

    const scoringResult = scoreExpedient({
      order,
      documents: documents || [],
      reviews: reviews || [],
      matrixKey: req.body?.matrixKey
    });

    await logAuditEvent({
      userId: req.userId,
      action: 'executive_report_generated',
      entityType: 'service_order',
      entityId: orderId,
      orderId,
      req,
      metadata: {
        finalScore: scoringResult.finalScore,
        readinessGrade: scoringResult.readinessGrade?.grade,
        matrixKey: scoringResult.matrixKey
      }
    });

    res.json(buildExecutiveReport(scoringResult));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// OBTENER REQUISITOS POR PERFIL/SECTOR
router.get('/requirements', authMiddleware, requirePermission('case:own:read'), async (req, res) => {
  try {
    res.json(REQUIREMENTS_MATRIX);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
