import { pickLang } from "../../data/requisitosMinimos";

// Preguntas guiadas del "Asistente de creacion de proyecto" (capacidad
// nueva): mismo orden y mismos ids que backend/src/agents/projectBuilderAgent.js
// (ANSWER_FIELDS) para que las respuestas viajen sin transformar.
const QUESTION_FIELDS = [
  { id: "sector", label: { es: "Sector", en: "Sector" }, required: false, placeholder: { es: "Ej. Tecnologia / SaaS", en: "E.g. Technology / SaaS" } },
  { id: "goal", label: { es: "Objetivo del financiamiento", en: "Funding objective" }, required: true, placeholder: { es: "Ej. Capital de trabajo, expansion, equipo", en: "E.g. Working capital, expansion, equipment" } },
  { id: "amount", label: { es: "Monto aproximado", en: "Approximate amount" }, required: true, placeholder: { es: "Ej. $500,000 MXN", en: "E.g. $500,000 MXN" } },
  { id: "useOfFunds", label: { es: "Uso de fondos", en: "Use of funds" }, required: true, placeholder: { es: "En que se usaria el dinero exactamente", en: "What exactly the money would be used for" } },
  { id: "stage", label: { es: "Etapa del proyecto", en: "Project stage" }, required: false, placeholder: { es: "Ej. En operacion, en preparacion, piloto", en: "E.g. Operating, in preparation, pilot" } },
  { id: "market", label: { es: "Mercado / clientes", en: "Market / clients" }, required: true, placeholder: { es: "A quien le vendes o le venderias", en: "Who you sell or would sell to" } },
  { id: "advantage", label: { es: "Ventaja competitiva", en: "Competitive advantage" }, required: false, placeholder: { es: "Que te hace diferente", en: "What makes you different" } },
  { id: "knownRisks", label: { es: "Riesgos que ya identificas", en: "Risks you already see" }, required: false, placeholder: { es: "Opcional", en: "Optional" } },
  { id: "entityHint", label: { es: "Tipo de ente financiero preferido", en: "Preferred funding entity type" }, required: false, placeholder: { es: "Si ya lo sabes: banco, SOFOM, fondo, fintech...", en: "If you already know: bank, SOFOM, fund, fintech..." } },
];

export function getProjectBuilderQuestions(language = "es") {
  return QUESTION_FIELDS.map((field) => ({
    id: field.id,
    required: field.required,
    label: pickLang(field.label, language),
    placeholder: pickLang(field.placeholder, language),
  }));
}

export function getProjectBuilderRequiredFieldIds() {
  return QUESTION_FIELDS.filter((field) => field.required).map((field) => field.id);
}

export function buildEmptyProjectBuilderAnswers() {
  return QUESTION_FIELDS.reduce((acc, field) => ({ ...acc, [field.id]: "" }), {});
}

export function getMissingRequiredProjectBuilderFields(answers = {}, language = "es") {
  const questions = getProjectBuilderQuestions(language);
  return questions
    .filter((question) => question.required && !String(answers[question.id] || "").trim())
    .map((question) => question.label);
}

// Etiquetas locales de los 5 rubros redactables — deben coincidir con los ids
// de DRAFTABLE_RUBRIC_IDS en backend/src/agents/projectBuilderAgent.js, pero
// el backend ya manda el label real (getRubric().label); esto es solo
// fallback si algun rubricId llegara sin label.
const RUBRIC_FALLBACK_LABELS = {
  plan_negocios: { es: "Plan de negocios", en: "Business plan" },
  estudio_viabilidad: { es: "Estudio de viabilidad", en: "Feasibility study" },
  estudio_mercado: { es: "Estudio de mercado", en: "Market study" },
  marco_riesgos: { es: "Marco de gestion de riesgos", en: "Risk management framework" },
  modelo_financiero: { es: "Modelo financiero", en: "Financial model" },
};

export function getRubricFallbackLabel(rubricId, language = "es") {
  return pickLang(RUBRIC_FALLBACK_LABELS[rubricId] || { es: rubricId, en: rubricId }, language);
}

export function getProjectBuilderCopy(language = "es") {
  return {
    title: pickLang({ es: "Asistente de creacion de proyecto", en: "Project builder assistant" }, language),
    intro: pickLang(
      {
        es: "Si aun no tienes tu proyecto armado, responde estas preguntas. NUXERA identifica a que tipo de ente financiero conviene presentarlo y arma un primer borrador por seccion, usando los mismos criterios que despues se usaran para validar tu expediente. Podras revisarlo y editarlo antes de usarlo.",
        en: "If you don't have your project put together yet, answer these questions. NUXERA identifies which type of funding entity fits best and drafts a first version per section, using the same criteria that will later validate your file. You can review and edit it before using it.",
      },
      language
    ),
    startButton: pickLang({ es: "Construir mi proyecto con ayuda de NUXERA", en: "Build my project with NUXERA's help" }, language),
    submitButton: pickLang({ es: "Generar borrador", en: "Generate draft" }, language),
    loading: pickLang({ es: "Redactando tu borrador por secciones...", en: "Drafting your project section by section..." }, language),
    aiLabel: pickLang({ es: "Redactado por IA", en: "AI-drafted" }, language),
    templateLabel: pickLang({ es: "Borrador local (sin IA)", en: "Local draft (no AI)" }, language),
    disclaimer: pickLang(
      {
        es: "Este borrador no aprueba credito, no garantiza fondeo y no sustituye asesoria legal, fiscal o financiera. Revisalo y ajustalo antes de presentarlo.",
        en: "This draft does not approve credit, guarantee funding, or replace legal, tax or financial advice. Review and adjust it before presenting it.",
      },
      language
    ),
    continueButton: pickLang({ es: "Continuar a Mi expediente", en: "Continue to My file" }, language),
    entityMatchTitle: pickLang({ es: "Ente financiero sugerido", en: "Suggested funding entity" }, language),
    entityMatchNote: pickLang(
      { es: "Sugerencia basada en sector y monto; confirma que aplica a tu caso.", en: "Suggestion based on sector and amount; confirm it fits your case." },
      language
    ),
    requiredDocumentsTitle: pickLang({ es: "Documentos que debes subir (no los redacta el asistente)", en: "Documents you must upload (not drafted by the assistant)" }, language),
    mandatoryLabel: pickLang({ es: "Obligatorio", en: "Mandatory" }, language),
    optionalLabel: pickLang({ es: "Opcional", en: "Optional" }, language),
    sectionsTitle: pickLang({ es: "Borrador por seccion", en: "Draft by section" }, language),
    coveredLabel: pickLang({ es: "Cubierto", en: "Covered" }, language),
    missingLabel: pickLang({ es: "Falta informacion", en: "Missing information" }, language),
    redFlagsLabel: pickLang({ es: "Banderas rojas a vigilar", en: "Red flags to watch" }, language),
    scopeTitle: pickLang({ es: "Que hacen los agentes y que te toca a ti", en: "What the agents do and what's on you" }, language),
    scopeAgentsDo: pickLang({ es: "Los agentes hacen esto:", en: "The agents do this:" }, language),
    scopeAgentsDoNot: pickLang({ es: "Los agentes NO hacen esto:", en: "The agents do NOT do this:" }, language),
    scopeHumanReview: pickLang({ es: "A ti te toca esto:", en: "This is on you:" }, language),
  };
}
