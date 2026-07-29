import { REQUISITOS_CATEGORIAS, REQUISITOS_MINIMOS, pickLang } from "../../data/requisitosMinimos";

const missionByRole = {
  applicant: {
    id: "applicant-capital-readiness",
    title: { es: "Preparar solicitud de financiamiento", en: "Prepare your funding request" },
    summary: { es: "Convertir proyecto, documentos y evidencia en una ruta clara para estar listo antes de pedir capital.", en: "Turn your project, documents and evidence into a clear path to be ready before requesting capital." },
    outcome: { es: "Solicitud lista para revision humana con faltantes, riesgos y siguientes acciones visibles.", en: "Request ready for human review, with gaps, risks and next actions visible." },
    progress: 42,
    nextAction: { es: "Cerrar evidencia critica de empresa, proyecto y uso de fondos antes de avanzar a comite.", en: "Close critical evidence for company, project and use of funds before moving to committee." },
  },
  grantor: {
    id: "grantor-case-intake",
    title: { es: "Preparar caso para revision", en: "Prepare the case for review" },
    summary: { es: "Ordenar evidencia inicial antes de pasar a la bandeja de revision.", en: "Organize initial evidence before moving the case into the review inbox." },
    outcome: { es: "Caso con senales suficientes para priorizacion.", en: "Case with enough signals for prioritization." },
    progress: 38,
    nextAction: { es: "Revisar Finance e Intelligence antes de solicitar informacion adicional.", en: "Review Finance and Intelligence before requesting additional information." },
  },
  admin: {
    id: "admin-operational-readiness",
    title: { es: "Preparar operacion NUXERA", en: "Prepare NUXERA operations" },
    summary: { es: "Alinear modulos, permisos y supervision antes de activar flujos transversales.", en: "Align modules, permissions and oversight before activating cross-cutting flows." },
    outcome: { es: "Operacion lista para monitoreo y control humano.", en: "Operations ready for monitoring and human control." },
    progress: 35,
    nextAction: { es: "Validar responsables, permisos y politicas por modulo.", en: "Validate owners, permissions and policies per module." },
  },
};

const applicantMissionSteps = [
  {
    id: "define-goal",
    label: { es: "Definir objetivo", en: "Define your goal" },
    status: "ready",
    owner: { es: "Solicitante", en: "Applicant" },
    prompt: { es: "Que monto, uso de fondos, plazo y resultado espera conseguir?", en: "What amount, use of funds, term and outcome are you expecting?" },
    output: { es: "Objetivo financiero claro y comparable.", en: "Clear, comparable financial goal." },
    evidencePath: "/dashboard/nuxera/finance",
    engine: "Finance",
  },
  {
    id: "complete-evidence",
    label: { es: "Completar evidencia", en: "Complete your evidence" },
    status: "in-progress",
    owner: { es: "Solicitante + analista", en: "Applicant + analyst" },
    prompt: { es: "Que documentos prueban ingresos, identidad, proyecto y capacidad operativa?", en: "What documents prove income, identity, project and operating capacity?" },
    output: { es: "Faltantes priorizados y evidencia lista para revision.", en: "Prioritized gaps and evidence ready for review." },
    evidencePath: "/dashboard/nuxera/intelligence",
    engine: "Intelligence",
  },
  {
    id: "stress-context",
    label: { es: "Tensionar contexto", en: "Stress-test the context" },
    status: "watch",
    owner: { es: "NUXERA Strategy", en: "NUXERA Strategy" },
    prompt: { es: "Que supuestos de mercado o ejecucion pueden cambiar la decision?", en: "What market or execution assumptions could change the decision?" },
    output: { es: "Riesgos, mitigantes y condiciones de pausa visibles.", en: "Visible risks, mitigants and pause conditions." },
    evidencePath: "/dashboard/nuxera/strategy",
    engine: "Strategy",
  },
];

const applicantGuardrails = [
  { es: "La mision no aprueba credito ni garantiza financiamiento.", en: "This mission does not approve credit or guarantee funding." },
  { es: "Cada avance requiere evidencia trazable antes de pasar a decision humana.", en: "Every step requires traceable evidence before moving to a human decision." },
  { es: "Los datos de mercado se usan como contexto, no como recomendacion de inversion o trading.", en: "Market data is used as context, not as investment or trading advice." },
  { es: "La persistencia formal de la mision queda pendiente de una tarea aprobada de datos/API.", en: "Formal persistence of the mission is pending an approved data/API task." },
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
  ready: { es: "Listo", en: "Ready" },
  "in-review": { es: "En revision", en: "In review" },
  missing: { es: "Faltante", en: "Missing" },
};

const dataRoomFolders = [
  {
    id: "identity-kyb",
    label: { es: "Identidad y KYB", en: "Identity & KYB" },
    visibility: { es: "Solicitante + NUXERA", en: "Applicant + NUXERA" },
    requirementIds: ["doc_corporativa", "identificacion_oficial", "doc_kyc"],
  },
  {
    id: "project-viability",
    label: { es: "Proyecto y viabilidad", en: "Project & viability" },
    visibility: { es: "Solicitante + revision autorizada", en: "Applicant + authorized review" },
    requirementIds: ["estudio_viabilidad", "estudio_mercado", "plan_negocios"],
  },
  {
    id: "finance-transparency",
    label: { es: "Finanzas y transparencia", en: "Finance & transparency" },
    visibility: { es: "NUXERA + otorgante autorizado", en: "NUXERA + authorized grantor" },
    requirementIds: ["modelo_financiero", "viabilidad_financiera", "transparencia_documental"],
  },
  {
    id: "impact-risk",
    label: { es: "Impacto, ESG y riesgos", en: "Impact, ESG & risks" },
    visibility: { es: "Revision humana requerida", en: "Human review required" },
    requirementIds: ["marco_riesgos", "ods", "esg", "esia"],
  },
];
const applicantOnboardingStages = [
  {
    id: "company-profile",
    label: { es: "Empresa y responsables", en: "Company & owners" },
    status: "ready",
    owner: { es: "Solicitante", en: "Applicant" },
    objective: { es: "Confirmar identidad, estructura corporativa y responsables del expediente.", en: "Confirm identity, corporate structure and the people responsible for the file." },
    action: { es: "Revisar datos base antes de pedir analisis financiero.", en: "Review base data before requesting financial analysis." },
    sectionPath: "/dashboard/nuxera/intelligence",
    requirementIds: ["doc_corporativa", "identificacion_oficial", "doc_kyc"],
  },
  {
    id: "project-case",
    label: { es: "Proyecto y uso de fondos", en: "Project & use of funds" },
    status: "in-progress",
    owner: { es: "Solicitante + analista", en: "Applicant + analyst" },
    objective: { es: "Explicar para que se solicita capital, avance del proyecto y supuestos principales.", en: "Explain what the capital is for, project progress and key assumptions." },
    action: { es: "Completar plan, modelo financiero y viabilidad antes de revision humana.", en: "Complete the plan, financial model and viability before human review." },
    sectionPath: "/dashboard/nuxera/finance",
    requirementIds: ["plan_negocios", "modelo_financiero", "viabilidad_financiera"],
  },
  {
    id: "risk-impact",
    label: { es: "Riesgo, mercado e impacto", en: "Risk, market & impact" },
    status: "blocked-by-evidence",
    owner: { es: "NUXERA Strategy", en: "NUXERA Strategy" },
    objective: { es: "Separar riesgos, impacto y contexto de mercado de cualquier decision automatica.", en: "Separate risks, impact and market context from any automated decision." },
    action: { es: "Agregar mercado, ESG, ESIA y marco de riesgos para tener una lectura completa.", en: "Add market, ESG, ESIA and risk framework data for a complete picture." },
    sectionPath: "/dashboard/nuxera/strategy",
    requirementIds: ["estudio_mercado", "marco_riesgos", "esg", "esia"],
  },
];

function getRequirementStatus(requirementId) {
  return localStatusByRequirement[requirementId] || "missing";
}

export function getApplicantGuidedMission(role = "applicant", language = "es") {
  const mission = missionByRole[role] || missionByRole.applicant;
  const steps = applicantMissionSteps.map((step) => ({
    ...step,
    label: pickLang(step.label, language),
    owner: pickLang(step.owner, language),
    prompt: pickLang(step.prompt, language),
    output: pickLang(step.output, language),
  }));

  return {
    ...mission,
    title: pickLang(mission.title, language),
    summary: pickLang(mission.summary, language),
    outcome: pickLang(mission.outcome, language),
    nextAction: pickLang(mission.nextAction, language),
    steps,
    guardrails: applicantGuardrails.map((guardrail) => pickLang(guardrail, language)),
    evidenceLinks: steps.map((step) => ({
      id: step.id,
      engine: step.engine,
      label: step.label,
      path: step.evidencePath,
      signal: step.output,
    })),
  };
}

export function getApplicantMissionReadiness(role = "applicant", language = "es") {
  const mission = getApplicantGuidedMission(role, language);
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
    statusLabel: pickLang(statusLabels[getRequirementStatus(requirement.id)], language),
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
        label: pickLang(folder.label, language),
        visibility: pickLang(folder.visibility, language),
        items,
        status: items.some((item) => item.status === "missing") ? "needs-evidence" : "ready-for-review",
      };
    }),
    nextEvidence: missing.slice(0, 3),
    guardrail: pickLang({ es: "Checklist local de preparacion; no sustituye validacion documental ni decision humana.", en: "Local preparation checklist; it does not replace document validation or human decision." }, language),
  };
}
export function getApplicantOnboardingWizard(language = "es") {
  const checklist = getApplicantDataRoomChecklist(language);
  const requirementsById = new Map(
    checklist.categories.flatMap((category) => category.items).map((item) => [item.id, item])
  );
  const humanReviewLabel = pickLang({ es: "Revision humana", en: "Human review" }, language);
  const stages = applicantOnboardingStages.map((stage, index) => {
    const evidence = stage.requirementIds
      .map((requirementId) => requirementsById.get(requirementId))
      .filter(Boolean);
    const missingEvidence = evidence.filter((item) => item.status === "missing");
    const readyEvidence = evidence.filter((item) => item.status === "ready");

    return {
      ...stage,
      label: pickLang(stage.label, language),
      owner: pickLang(stage.owner, language),
      objective: pickLang(stage.objective, language),
      action: pickLang(stage.action, language),
      order: index + 1,
      evidence,
      readyEvidence: readyEvidence.length,
      missingEvidence: missingEvidence.length,
      nextEvidence: missingEvidence[0]?.label || evidence.find((item) => item.status === "in-review")?.label || humanReviewLabel,
      complete: missingEvidence.length === 0,
    };
  });
  const nextStage = stages.find((stage) => !stage.complete) || stages[stages.length - 1];

  return {
    id: "applicant-onboarding-wizard-local",
    status: "local-preparation-only",
    summary: {
      totalStages: stages.length,
      completedStages: stages.filter((stage) => stage.complete).length,
      blockedStages: stages.filter((stage) => stage.missingEvidence > 0).length,
      progress: Math.round((checklist.summary.ready / checklist.summary.total) * 100),
    },
    stages,
    nextStage,
    guardrails: [
      { es: "Wizard local de preparacion; no persiste respuestas ni documentos.", en: "Local preparation wizard; it does not persist answers or documents." },
      { es: "No aprueba credito, no emite term sheet y no reemplaza revision humana.", en: "It does not approve credit, issue a term sheet, or replace human review." },
      { es: "Las rutas conectan a modulos existentes sin cambiar permisos ni contratos backend.", en: "Routes connect to existing modules without changing permissions or backend contracts." },
    ].map((guardrail) => pickLang(guardrail, language)),
  };
}
