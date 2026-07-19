const missionTypes = [
  {
    id: "company-diligence",
    label: "Investigacion de empresa",
    subjectHint: "Empresa solicitante, grupo, RFC o razon social",
    objective: "Entender actividad, estructura, reputacion, documentos y riesgos de contraparte.",
  },
  {
    id: "person-screening",
    label: "Revision de persona clave",
    subjectHint: "Accionista, representante, beneficiario controlador o directivo",
    objective: "Identificar exposicion reputacional, control, conflicto o documentacion faltante.",
  },
  {
    id: "sector-context",
    label: "Contexto sectorial",
    subjectHint: "Industria, region o cadena de suministro",
    objective: "Conectar riesgos externos con evidencia del expediente y mercado.",
  },
];

const sourcePlan = [
  {
    id: "internal-documents",
    source: "Expediente documental",
    provenance: "DocumentIntelligenceTab / documentos cargados",
    delay: "Actual al ultimo procesamiento interno",
    reliability: "Alta si el expediente esta completo",
  },
  {
    id: "market-context",
    source: "NUXERA Markets delayed provider",
    provenance: "Dataset local controlado",
    delay: "No tiempo real",
    reliability: "Media para contexto, no para decision automatica",
  },
  {
    id: "finance-readiness",
    source: "NUXERA Finance journey",
    provenance: "Checklist y pipeline reutilizados",
    delay: "Actual al ultimo estado local/API",
    reliability: "Alta para faltantes visibles",
  },
];

const findings = [
  {
    id: "document-gap",
    claim: "El expediente puede avanzar si los faltantes criticos quedan documentados y trazables.",
    confidence: "Media-alta",
    evidenceIds: ["internal-documents", "finance-readiness"],
    risk: "Subsanacion tardia puede retrasar comite o interes institucional.",
    recommendation: "Cerrar faltantes antes de emitir conclusion ejecutiva.",
  },
  {
    id: "external-sensitivity",
    claim: "Variables externas pueden afectar costo financiero, margen o covenants.",
    confidence: "Media",
    evidenceIds: ["market-context"],
    risk: "Cambios de tasas, FX o insumos pueden alterar el escenario base.",
    recommendation: "Vincular umbrales Markets al plan Strategy.",
  },
];

export function getResearchMissionTypes() {
  return missionTypes;
}

export function getResearchMission(role = "applicant", missionId = "company-diligence") {
  const mission = missionTypes.find((item) => item.id === missionId) || missionTypes[0];
  const roleFocus = {
    applicant: "Preparar evidencia clara antes de compartir o solicitar revision.",
    grantor: "Revisar riesgos y evidencia antes de pedir informacion o preparar comite.",
    admin: "Auditar consistencia de fuentes, trazabilidad y estado de revision humana.",
  };

  return {
    mission,
    roleFocus: roleFocus[role] || roleFocus.applicant,
    subject: {
      label: "Sujeto de investigacion",
      value: mission.subjectHint,
      status: "pendiente de seleccion real",
    },
    plan: [
      "Definir sujeto, alcance y decision que se quiere soportar.",
      "Recolectar fuentes internas y contexto externo permitido.",
      "Extraer hallazgos con evidencia, confianza y riesgos.",
      "Preparar reporte con supuestos, limites y revision humana.",
    ],
    sources: sourcePlan,
    findings,
    report: {
      title: `Reporte borrador - ${mission.label}`,
      format: "markdown-ready",
      status: "borrador local no persistido",
      auditNote: "Cada afirmacion material debe conservar evidencia, fuente y confianza antes de exportarse.",
    },
  };
}

export function getEvidenceByFinding(findingId) {
  const finding = findings.find((item) => item.id === findingId);
  if (!finding) return [];
  return sourcePlan.filter((source) => finding.evidenceIds.includes(source.id));
}

export function buildResearchMissionForExpedient(context, missionId = "company-diligence") {
  const base = getResearchMission(context?.role, missionId);
  const order = context?.order;
  if (!order || context?.isDemo) return base;

  const metadata = order.metadata || {};
  const subjectValue = metadata.companyName || metadata.legalName || order.project_name || order.projectName || order.case_number || order.id;
  const risk = order.risk_level || order.riskLevel || "por validar";
  const sector = metadata.sector || "sector no especificado";

  return {
    ...base,
    subject: {
      label: "Expediente seleccionado",
      value: subjectValue,
      status: "contexto real autorizado",
    },
    findings: base.findings.map((finding) => ({
      ...finding,
      claim: finding.id === "document-gap"
        ? `${subjectValue} requiere trazabilidad documental antes de avanzar; riesgo actual ${risk}.`
        : `El contexto de ${sector} puede modificar costo financiero, margen o covenants de ${subjectValue}.`,
    })),
    report: {
      ...base.report,
      title: `Reporte borrador - ${subjectValue}`,
      status: "borrador contextual no persistido",
      expedientId: order.id,
    },
  };
}
