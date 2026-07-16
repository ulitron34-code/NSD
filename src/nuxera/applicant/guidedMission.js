import { REQUISITOS_CATEGORIAS, REQUISITOS_MINIMOS, pickLang } from "../../data/requisitosMinimos";

const missionByRole = {
  applicant: {
    id: "applicant-capital-readiness",
    title: "Preparar solicitud de financiamiento",
    summary: "Convertir proyecto, documentos y evidencia en una ruta clara para estar listo antes de pedir capital.",
    outcome: "Solicitud lista para revision humana con faltantes, riesgos y siguientes acciones visibles.",
    progress: 42,
    nextAction: "Cerrar evidencia critica de empresa, proyecto y uso de fondos antes de avanzar a comite.",
  },
  grantor: {
    id: "grantor-case-intake",
    title: "Preparar caso para revision",
    summary: "Ordenar evidencia inicial antes de pasar a cola de decision.",
    outcome: "Caso con senales suficientes para priorizacion.",
    progress: 38,
    nextAction: "Revisar Finance e Intelligence antes de solicitar informacion adicional.",
  },
  admin: {
    id: "admin-operational-readiness",
    title: "Preparar operacion NUXERA",
    summary: "Alinear modulos, permisos y supervision antes de activar flujos transversales.",
    outcome: "Operacion lista para monitoreo y control humano.",
    progress: 35,
    nextAction: "Validar responsables, permisos y politicas por modulo.",
  },
};

const applicantMissionSteps = [
  {
    id: "define-goal",
    label: "Definir objetivo",
    status: "ready",
    owner: "Solicitante",
    prompt: "Que monto, uso de fondos, plazo y resultado espera conseguir?",
    output: "Objetivo financiero claro y comparable.",
    evidencePath: "/dashboard/nuxera/finance",
    engine: "Finance",
  },
  {
    id: "complete-evidence",
    label: "Completar evidencia",
    status: "in-progress",
    owner: "Solicitante + analista",
    prompt: "Que documentos prueban ingresos, identidad, proyecto y capacidad operativa?",
    output: "Faltantes priorizados y evidencia lista para revision.",
    evidencePath: "/dashboard/nuxera/intelligence",
    engine: "Intelligence",
  },
  {
    id: "stress-context",
    label: "Tensionar contexto",
    status: "watch",
    owner: "NUXERA Strategy",
    prompt: "Que supuestos de mercado o ejecucion pueden cambiar la decision?",
    output: "Riesgos, mitigantes y condiciones de pausa visibles.",
    evidencePath: "/dashboard/nuxera/strategy",
    engine: "Strategy",
  },
];

const applicantGuardrails = [
  "La mision no aprueba credito ni garantiza financiamiento.",
  "Cada avance requiere evidencia trazable antes de pasar a decision humana.",
  "Los datos de mercado se usan como contexto, no como recomendacion de inversion o trading.",
  "La persistencia formal de la mision queda pendiente de una tarea aprobada de datos/API.",
];

const localStatusByRequirement = {
  doc_corporativa: "ready",
  identificacion_oficial: "ready",
  doc_kyc: "in-review",
  marco_riesgos: "missing",
  estudio_viabilidad: "in-review",
  estudio_mercado: "missing",
  plan_negocios: "ready",
  modelo_financiero: "missing",
  viabilidad_financiera: "missing",
  transparencia_documental: "in-review",
  ods: "ready",
  esg: "missing",
  esia: "in-review",
};

const statusLabels = {
  ready: "Listo",
  "in-review": "En revision",
  missing: "Faltante",
};

const dataRoomFolders = [
  {
    id: "identity-kyb",
    label: "Identidad y KYB",
    visibility: "Solicitante + NUXERA",
    requirementIds: ["doc_corporativa", "identificacion_oficial", "doc_kyc"],
  },
  {
    id: "project-viability",
    label: "Proyecto y viabilidad",
    visibility: "Solicitante + revision autorizada",
    requirementIds: ["estudio_viabilidad", "estudio_mercado", "plan_negocios"],
  },
  {
    id: "finance-transparency",
    label: "Finanzas y transparencia",
    visibility: "NUXERA + otorgante autorizado",
    requirementIds: ["modelo_financiero", "viabilidad_financiera", "transparencia_documental"],
  },
  {
    id: "impact-risk",
    label: "Impacto, ESG y riesgos",
    visibility: "Revision humana requerida",
    requirementIds: ["marco_riesgos", "ods", "esg", "esia"],
  },
];

function getRequirementStatus(requirementId) {
  return localStatusByRequirement[requirementId] || "missing";
}

export function getApplicantGuidedMission(role = "applicant") {
  const mission = missionByRole[role] || missionByRole.applicant;

  return {
    ...mission,
    steps: applicantMissionSteps,
    guardrails: applicantGuardrails,
    evidenceLinks: applicantMissionSteps.map((step) => ({
      id: step.id,
      engine: step.engine,
      label: step.label,
      path: step.evidencePath,
      signal: step.output,
    })),
  };
}

export function getApplicantMissionReadiness(role = "applicant") {
  const mission = getApplicantGuidedMission(role);
  const openSteps = mission.steps.filter((step) => step.status !== "ready");

  return {
    missionId: mission.id,
    status: openSteps.length > 0 ? "evidence-in-progress" : "ready-for-human-review",
    progress: mission.progress,
    nextAction: mission.nextAction,
    openStepIds: openSteps.map((step) => step.id),
    requiresHumanReview: true,
  };
}

export function getApplicantDataRoomChecklist(language = "es") {
  const requirements = REQUISITOS_MINIMOS.map((requirement) => ({
    id: requirement.id,
    category: requirement.categoria,
    label: pickLang(requirement.label, language),
    detail: pickLang(requirement.detalle, language),
    critical: Boolean(requirement.critico),
    status: getRequirementStatus(requirement.id),
    statusLabel: statusLabels[getRequirementStatus(requirement.id)],
  }));
  const missing = requirements.filter((requirement) => requirement.status === "missing");
  const criticalMissing = missing.filter((requirement) => requirement.critical);

  return {
    summary: {
      total: requirements.length,
      ready: requirements.filter((requirement) => requirement.status === "ready").length,
      inReview: requirements.filter((requirement) => requirement.status === "in-review").length,
      missing: missing.length,
      criticalMissing: criticalMissing.length,
      status: criticalMissing.length > 0 ? "critical-gaps" : "fillable-gaps",
    },
    categories: REQUISITOS_CATEGORIAS.map((category) => ({
      id: category.id,
      label: pickLang(category.label, language),
      items: requirements.filter((requirement) => requirement.category === category.id),
    })),
    folders: dataRoomFolders.map((folder) => {
      const items = requirements.filter((requirement) => folder.requirementIds.includes(requirement.id));
      return {
        ...folder,
        items,
        status: items.some((item) => item.status === "missing") ? "needs-evidence" : "ready-for-review",
      };
    }),
    nextEvidence: missing.slice(0, 3),
    guardrail: "Checklist local de preparacion; no sustituye validacion documental ni decision humana.",
  };
}
