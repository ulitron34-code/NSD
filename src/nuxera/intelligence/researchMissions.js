import { pickLang } from "../../data/requisitosMinimos";

const missionTypesSource = [
  {
    id: "company-diligence",
    label: { es: "Investigacion de empresa", en: "Company research" },
    subjectHint: { es: "Empresa solicitante, grupo, RFC o razon social", en: "Applicant company, group, tax ID or legal name" },
    objective: { es: "Entender actividad, estructura, reputacion, documentos y riesgos de contraparte.", en: "Understand counterparty activity, structure, reputation, documents and risks." },
  },
  {
    id: "person-screening",
    label: { es: "Revision de persona clave", en: "Key person screening" },
    subjectHint: { es: "Accionista, representante, beneficiario controlador o directivo", en: "Shareholder, representative, controlling beneficiary or executive" },
    objective: { es: "Identificar exposicion reputacional, control, conflicto o documentacion faltante.", en: "Identify reputational exposure, control, conflict or missing documentation." },
  },
  {
    id: "sector-context",
    label: { es: "Contexto sectorial", en: "Sector context" },
    subjectHint: { es: "Industria, region o cadena de suministro", en: "Industry, region or supply chain" },
    objective: { es: "Conectar riesgos externos con evidencia del expediente y mercado.", en: "Connect external risks with file and market evidence." },
  },
];

const sourcePlanSource = [
  {
    id: "internal-documents",
    source: { es: "Expediente documental", en: "Document file" },
    provenance: "DocumentIntelligenceTab / documentos cargados",
    delay: { es: "Actual al ultimo procesamiento interno", en: "Current as of the last internal processing run" },
    reliabilityLevel: "high",
    reliability: { es: "Alta si el expediente esta completo", en: "High if the file is complete" },
  },
  {
    id: "market-context",
    source: "NUXERA Markets delayed provider",
    provenance: { es: "Dataset local controlado", en: "Controlled local dataset" },
    delay: { es: "No tiempo real", en: "Not real-time" },
    reliabilityLevel: "medium",
    reliability: { es: "Media para contexto, no para decision automatica", en: "Medium for context, not for automated decisions" },
  },
  {
    id: "finance-readiness",
    source: "NUXERA Finance journey",
    provenance: { es: "Checklist y pipeline reutilizados", en: "Reused checklist and pipeline" },
    delay: { es: "Actual al ultimo estado local/API", en: "Current as of the last local/API state" },
    reliabilityLevel: "high",
    reliability: { es: "Alta para faltantes visibles", en: "High for visible gaps" },
  },
];

const findingsSource = [
  {
    id: "document-gap",
    claim: { es: "El expediente puede avanzar si los faltantes criticos quedan documentados y trazables.", en: "The file can move forward if critical gaps are documented and traceable." },
    confidence: { es: "Media-alta", en: "Medium-high" },
    evidenceIds: ["internal-documents", "finance-readiness"],
    risk: { es: "Subsanacion tardia puede retrasar comite o interes institucional.", en: "Late remediation can delay committee or institutional interest." },
    recommendation: { es: "Cerrar faltantes antes de emitir conclusion ejecutiva.", en: "Close gaps before issuing an executive conclusion." },
  },
  {
    id: "external-sensitivity",
    claim: { es: "Variables externas pueden afectar costo financiero, margen o covenants.", en: "External variables can affect financial cost, margin or covenants." },
    confidence: { es: "Media", en: "Medium" },
    evidenceIds: ["market-context"],
    risk: { es: "Cambios de tasas, FX o insumos pueden alterar el escenario base.", en: "Rate, FX or input changes can alter the base scenario." },
    recommendation: { es: "Vincular umbrales Markets al plan Strategy.", en: "Link Markets thresholds to the Strategy plan." },
  },
];

function localizeSource(source, language) {
  return {
    ...source,
    source: pickLang(source.source, language),
    provenance: pickLang(source.provenance, language),
    delay: pickLang(source.delay, language),
    reliability: pickLang(source.reliability, language),
  };
}

function localizeFinding(finding, language) {
  return {
    ...finding,
    claim: pickLang(finding.claim, language),
    confidence: pickLang(finding.confidence, language),
    risk: pickLang(finding.risk, language),
    recommendation: pickLang(finding.recommendation, language),
  };
}

export function getResearchMissionTypes(language = "es") {
  return missionTypesSource.map((mission) => ({
    ...mission,
    label: pickLang(mission.label, language),
    subjectHint: pickLang(mission.subjectHint, language),
    objective: pickLang(mission.objective, language),
  }));
}

export function getResearchMission(role = "applicant", missionId = "company-diligence", language = "es") {
  const missionTypes = getResearchMissionTypes(language);
  const mission = missionTypes.find((item) => item.id === missionId) || missionTypes[0];
  const roleFocus = {
    applicant: { es: "Preparar evidencia clara antes de compartir o solicitar revision.", en: "Prepare clear evidence before sharing or requesting review." },
    grantor: { es: "Revisar riesgos y evidencia antes de pedir informacion o preparar comite.", en: "Review risks and evidence before requesting information or preparing committee." },
    admin: { es: "Auditar consistencia de fuentes, trazabilidad y estado de revision humana.", en: "Audit source consistency, traceability and human review status." },
  };
  const sources = sourcePlanSource.map((source) => localizeSource(source, language));
  const findings = findingsSource.map((finding) => localizeFinding(finding, language));

  return {
    mission,
    roleFocus: pickLang(roleFocus[role] || roleFocus.applicant, language),
    subject: {
      label: pickLang({ es: "Sujeto de investigacion", en: "Research subject" }, language),
      value: mission.subjectHint,
      status: pickLang({ es: "pendiente de seleccion real", en: "pending real selection" }, language),
    },
    plan: [
      { es: "Definir sujeto, alcance y decision que se quiere soportar.", en: "Define the subject, scope and decision to support." },
      { es: "Recolectar fuentes internas y contexto externo permitido.", en: "Collect internal sources and allowed external context." },
      { es: "Extraer hallazgos con evidencia, confianza y riesgos.", en: "Extract findings with evidence, confidence and risks." },
      { es: "Preparar reporte con supuestos, limites y revision humana.", en: "Prepare a report with assumptions, limits and human review." },
    ].map((step) => pickLang(step, language)),
    sources,
    findings,
    report: {
      title: pickLang({ es: `Reporte borrador - ${mission.label}`, en: `Draft report - ${mission.label}` }, language),
      format: "markdown-ready",
      status: pickLang({ es: "borrador local no persistido", en: "local draft, not persisted" }, language),
      auditNote: pickLang({ es: "Cada afirmacion material debe conservar evidencia, fuente y confianza antes de exportarse.", en: "Every material claim must keep evidence, source and confidence before export." }, language),
    },
  };
}

export function getEvidenceByFinding(findingId, language = "es") {
  const finding = findingsSource.find((item) => item.id === findingId);
  if (!finding) return [];
  return sourcePlanSource
    .filter((source) => finding.evidenceIds.includes(source.id))
    .map((source) => localizeSource(source, language));
}

export function buildResearchMissionForExpedient(context, missionId = "company-diligence", language = "es") {
  const base = getResearchMission(context?.role, missionId, language);
  const order = context?.order;
  if (!order || context?.isDemo) return base;

  const metadata = order.metadata || {};
  const subjectValue = metadata.companyName || metadata.legalName || order.project_name || order.projectName || order.case_number || order.id;
  const risk = order.risk_level || order.riskLevel || pickLang({ es: "por validar", en: "to validate" }, language);
  const sector = metadata.sector || pickLang({ es: "sector no especificado", en: "sector not specified" }, language);

  return {
    ...base,
    subject: {
      label: pickLang({ es: "Expediente seleccionado", en: "Selected file" }, language),
      value: subjectValue,
      status: pickLang({ es: "contexto real autorizado", en: "authorized real context" }, language),
    },
    findings: base.findings.map((finding) => ({
      ...finding,
      claim: finding.id === "document-gap"
        ? pickLang(
            { es: `${subjectValue} requiere trazabilidad documental antes de avanzar; riesgo actual ${risk}.`, en: `${subjectValue} requires documentary traceability before moving forward; current risk ${risk}.` },
            language
          )
        : pickLang(
            { es: `El contexto de ${sector} puede modificar costo financiero, margen o covenants de ${subjectValue}.`, en: `The ${sector} context can change the financial cost, margin or covenants of ${subjectValue}.` },
            language
          ),
    })),
    report: {
      ...base.report,
      title: pickLang({ es: `Reporte borrador - ${subjectValue}`, en: `Draft report - ${subjectValue}` }, language),
      status: pickLang({ es: "borrador contextual no persistido", en: "contextual draft, not persisted" }, language),
      expedientId: order.id,
    },
  };
}
