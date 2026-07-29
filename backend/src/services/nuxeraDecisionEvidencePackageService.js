import { supabaseAdmin } from '../config/supabase.js';
import { getAdminCaseTimeline, getGrantorCaseTimeline } from './nuxeraCaseTimelineService.js';
import { getAuthorizedGrantorEvidenceLinks } from './nuxeraEvidenceLinkService.js';

const REQUIRED_ENGINES = ['finance', 'intelligence', 'markets', 'strategy', 'compliance'];

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function normalizeSourceTrace(link) {
  const provenance = asObject(link.provenance);
  return {
    sourceType: provenance.sourceType || (link.documentId ? 'document-link' : 'evidence-link'),
    documentId: link.documentId || provenance.documentId || null,
    documentReviewId: link.documentReviewId || provenance.documentReviewId || null,
    page: provenance.page || null,
    section: provenance.section || null,
    extractionId: provenance.extractionId || null,
    confidence: provenance.confidence ?? null,
    reviewStatus: provenance.reviewStatus || 'unreviewed',
    strong: Boolean(link.documentId || provenance.documentId || provenance.extractionId || provenance.section)
  };
}

function mapEvidenceFinding(link) {
  const sourceTrace = normalizeSourceTrace(link);
  return {
    id: `finding:${link.id}`,
    evidenceLinkId: link.id,
    engine: link.engine || 'intelligence',
    label: link.label || 'Evidencia NUXERA',
    findingType: sourceTrace.strong ? 'source-traced-finding' : 'weak-reference',
    sourceTrace,
    summary: sourceTrace.strong
      ? 'Hallazgo elegible para revision de Mesa con referencia trazable.'
      : 'Referencia debil: requiere fuente, seccion o extractionId antes de usarse como evidencia fuerte.',
    requiresHumanReview: true
  };
}

function buildCoverage(findings, timeline) {
  return REQUIRED_ENGINES.map((engine) => {
    const engineFindings = findings.filter((finding) => finding.engine === engine);
    const timelineSignals = asArray(timeline?.events).filter((event) => event.metadata?.engine === engine || event.type === engine);
    return {
      engine,
      label: engine[0].toUpperCase() + engine.slice(1),
      findings: engineFindings.length,
      sourceTraced: engineFindings.filter((finding) => finding.sourceTrace.strong).length,
      weakReferences: engineFindings.filter((finding) => !finding.sourceTrace.strong).length,
      timelineSignals: timelineSignals.length,
      status: engineFindings.some((finding) => finding.sourceTrace.strong) ? 'covered' : engineFindings.length ? 'weak' : 'missing'
    };
  });
}

function buildQuestions({ timeline, findings, coverage }) {
  const questions = [];
  if ((timeline?.summary?.openInformationRequests || 0) > 0) {
    questions.push({ id: 'open-information-requests', owner: 'grantor', prompt: 'Que informacion faltante debe cerrarse antes de Mesa?', source: 'information_requests' });
  }
  if (findings.some((finding) => !finding.sourceTrace.strong)) {
    questions.push({ id: 'weak-source-tracing', owner: 'admin', prompt: 'Que hallazgos requieren pagina, seccion, extractionId o reviewStatus?', source: 'nuxera_evidence_links.provenance' });
  }
  if (coverage.some((item) => item.status === 'missing')) {
    questions.push({ id: 'coverage-gaps', owner: 'grantor', prompt: 'Que motores sin cobertura son indispensables para decision humana?', source: 'coverage' });
  }
  if ((timeline?.summary?.failedNotifications || 0) > 0 || (timeline?.summary?.slaOverdue || 0) > 0) {
    questions.push({ id: 'operational-risk', owner: 'admin', prompt: 'Que riesgo operativo debe resolverse antes de enviar a comite?', source: 'timeline.health' });
  }
  return questions;
}

function buildDecisionPackage({ orderId, workspaceRole, timeline, evidence }) {
  const links = asArray(evidence?.links);
  const findings = links.map(mapEvidenceFinding);
  const coverage = buildCoverage(findings, timeline);
  const gaps = coverage.filter((item) => item.status === 'missing');
  const weakReferences = findings.filter((finding) => !finding.sourceTrace.strong);
  const blockers = (timeline?.summary?.blockers || 0) + gaps.length + weakReferences.length;
  const status = blockers ? 'decision-package-needs-evidence' : 'decision-package-ready-for-human-review';

  return {
    id: `nuxera-decision-evidence-package:${orderId}:${workspaceRole}`,
    status,
    orderId,
    workspaceRole,
    nonBinding: true,
    thesis: {
      summary: status === 'decision-package-ready-for-human-review'
        ? 'El expediente tiene cobertura inicial suficiente para preparar revision humana no vinculante.'
        : 'El expediente requiere cerrar gaps de evidencia, trazabilidad o riesgo operativo antes de Mesa.',
      basis: ['timeline.operational-health', 'nuxera_evidence_links', 'information_requests', 'case_assignments', 'notification_outbox']
    },
    summary: {
      findings: findings.length,
      sourceTraced: findings.filter((finding) => finding.sourceTrace.strong).length,
      weakReferences: weakReferences.length,
      coverageMissing: gaps.length,
      openInformationRequests: timeline?.summary?.openInformationRequests || 0,
      operationalBlockers: timeline?.summary?.blockers || 0,
      failedNotifications: timeline?.summary?.failedNotifications || 0,
      slaOverdue: timeline?.summary?.slaOverdue || 0
    },
    findings,
    coverage,
    gaps: [
      ...gaps.map((item) => ({ id: `coverage:${item.engine}`, type: 'coverage', label: `${item.label} sin cobertura fuerte`, source: 'coverage' })),
      ...weakReferences.map((finding) => ({ id: `trace:${finding.evidenceLinkId}`, type: 'source-tracing', label: finding.label, source: 'nuxera_evidence_links.provenance' }))
    ],
    questions: buildQuestions({ timeline, findings, coverage }),
    conditions: [
      'Decision humana obligatoria antes de aprobar, rechazar o emitir term sheet.',
      'Todo hallazgo fuerte debe conservar fuente trazable o declararse como inferencia.',
      'No se cambia permiso de data room ni se envia notificacion desde este paquete.'
    ],
    guardrails: [
      'Decision package is read-only and non-binding.',
      'No document content is returned; only evidence-link metadata and source-trace status.',
      'AI outputs without source tracing cannot become strong evidence.'
    ]
  };
}

async function readAdminEvidenceLinks(orderId) {
  const { data, error } = await supabaseAdmin
    .from('nuxera_evidence_links')
    .select('*')
    .eq('order_id', orderId)
    .in('visibility', ['owner', 'authorized_grantor', 'internal'])
    .is('archived_at', null);

  if (error) {
    if (String(error.message || '').includes('does not exist') || String(error.message || '').includes('schema cache')) {
      return { orderId, persisted: false, links: [], guardrails: ['nuxera_evidence_links unavailable; coverage degraded.'] };
    }
    throw error;
  }

  const links = asArray(data).map((row) => ({
    id: row.id,
    orderId: row.order_id,
    documentId: row.document_id || null,
    documentReviewId: row.document_review_id || null,
    engine: row.engine,
    label: row.label,
    visibility: row.visibility,
    provenance: asObject(row.provenance),
    createdAt: row.created_at || null
  }));

  return { orderId, persisted: links.length > 0, links, guardrails: ['Admin coverage reads metadata only; no document content returned.'] };
}

export async function getGrantorDecisionEvidencePackage({ orderId, userId, email }) {
  const [timeline, evidence] = await Promise.all([
    getGrantorCaseTimeline({ orderId, userId, email }),
    getAuthorizedGrantorEvidenceLinks({ orderId, userId, email })
  ]);
  return buildDecisionPackage({ orderId, workspaceRole: 'grantor', timeline, evidence });
}

export async function getAdminEvidenceCoverage({ orderId }) {
  const [timeline, evidence] = await Promise.all([
    getAdminCaseTimeline({ orderId }),
    readAdminEvidenceLinks(orderId)
  ]);
  return buildDecisionPackage({ orderId, workspaceRole: 'admin', timeline, evidence });
}
