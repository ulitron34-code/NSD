// Asistente de creacion de proyecto — version robusta (22 jul 2026): en vez
// de un unico agente redactando texto libre, reusa las mismas fuentes de
// verdad que ya usa el resto de NUXERA para no inventar criterios propios:
//   - Los 5 rubros redactables del checklist real de 12 Requisitos Minimos
//     (backend/src/config/readinessRubrics.js) definen estructura esperada,
//     criterios ponderados y banderas rojas por seccion — los mismos que
//     despues usara readinessRubricAgent.js para evaluar el documento real.
//   - La clasificacion de a que tipo de ente financiero conviene presentar
//     el proyecto reusa resolveMatrixKey() de scoringEngine.js (la misma
//     logica que ya clasifica expedientes reales), no una heuristica nueva.
//   - La lista de documentos obligatorios/opcionales sale de la matriz real
//     (backend/src/config/requirementsMatrix.js) para ese tipo de ente.
//   - El rubro de estudio de mercado se enriquece con datos reales de INEGI
//     DENUE y Banxico SIE, mismo patron que readinessRubricAgent.js.
//   - Todos los rubros se apoyan opcionalmente en el catalogo RAG de fuentes
//     regulatorias (ragService.js) cuando hay coincidencias.
// Sigue sin persistir nada: cada seccion se redacta o se arma localmente sin
// proveedor de IA, y el humano decide que copiar hacia su expediente real.
import { generateJsonWithFallback, hasAnyJsonProvider } from '../services/aiJsonProvider.js';
import { getRubric } from '../config/readinessRubrics.js';
import { REQUIREMENTS_MATRIX } from '../config/requirementsMatrix.js';
import { resolveMatrixKey } from '../services/scoringEngine.js';
import { getBusinessDensity } from '../services/inegiService.js';
import { getKeyIndicators } from '../services/banxicoService.js';
import { searchReferenceSources } from '../services/ragService.js';

// Los 5 rubros con contenido narrativo que un asistente puede ayudar a
// redactar. Los otros 9-10 rubros del checklist (identificacion, KYC, doc
// corporativa, transparencia documental, ESG/ODS/ESIA, permisos) son
// documentos que se cargan, no se redactan — quedan fuera a proposito.
export const DRAFTABLE_RUBRIC_IDS = ['plan_negocios', 'estudio_viabilidad', 'estudio_mercado', 'marco_riesgos', 'modelo_financiero'];

const ANSWER_FIELDS = [
  ['sector', 'Sector'],
  ['goal', 'Objetivo del financiamiento'],
  ['amount', 'Monto aproximado'],
  ['useOfFunds', 'Uso de fondos'],
  ['stage', 'Etapa del proyecto'],
  ['market', 'Mercado / clientes'],
  ['advantage', 'Ventaja competitiva'],
  ['knownRisks', 'Riesgos conocidos por el solicitante'],
  ['entityHint', 'Tipo de ente financiero preferido (si lo sabe)'],
];

// Que respuestas del solicitante son relevantes para cada rubro — evita
// mandarle a cada agente todo el formulario completo sin criterio.
const RUBRIC_RELEVANT_FIELDS = {
  plan_negocios: ['sector', 'goal', 'stage', 'advantage', 'useOfFunds'],
  estudio_viabilidad: ['sector', 'stage', 'goal', 'knownRisks'],
  estudio_mercado: ['sector', 'market', 'advantage'],
  marco_riesgos: ['sector', 'knownRisks', 'stage'],
  modelo_financiero: ['amount', 'useOfFunds', 'goal'],
};

function hasValue(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function fieldLabel(id) {
  return (ANSWER_FIELDS.find(([fieldId]) => fieldId === id) || [])[1] || id;
}

function answersSummary(answers, fieldIds, language) {
  const lines = fieldIds
    .filter((id) => hasValue(answers[id]))
    .map((id) => `${fieldLabel(id)}: ${answers[id].trim()}`);
  if (lines.length) return lines.join('\n');
  return language === 'en' ? '(no answers provided for this section)' : '(sin respuestas para esta seccion)';
}

function missingFieldLabels(answers, language) {
  const required = ['goal', 'amount', 'useOfFunds', 'market'];
  const labelsEs = { goal: 'Objetivo del financiamiento', amount: 'Monto aproximado', useOfFunds: 'Uso de fondos', market: 'Mercado o clientes' };
  const labelsEn = { goal: 'Funding objective', amount: 'Requested amount', useOfFunds: 'Use of funds', market: 'Target market or clients' };
  const labels = language === 'en' ? labelsEn : labelsEs;
  return required.filter((key) => !hasValue(answers[key])).map((key) => labels[key]);
}

const SYSTEM_PROMPT_BASE = `Eres un asistente que ayuda a un solicitante de financiamiento a redactar UNA seccion de su proyecto para presentarlo ante un ente financiero (banco, SOFOM, fondo o fintech).

Reglas obligatorias:
1. No inventes datos que el solicitante no proporciono (montos, clientes, cifras, nombres, cifras de mercado).
2. Evalua tu propio borrador contra la estructura esperada y los criterios que se te dan abajo; enumera que partes de la estructura esperada NO pudiste cubrir por falta de informacion.
3. Distingue claramente entre lo que el solicitante dijo (hecho) y lo que tu sugieres (sugerencia a validar).
4. No prometas aprobacion de credito, tasas, montos garantizados ni resultados.
5. Si se te da contexto de fuentes externas (INEGI, Banxico, catalogo regulatorio), cita la fuente en el texto en vez de presentarlo como conocimiento propio.
6. Usa lenguaje claro y profesional, sin jerga tecnica innecesaria.
7. Devuelve unicamente JSON valido conforme al schema solicitado, sin texto adicional.`;

const SECTION_OUTPUT_SCHEMA_HINT = `Schema esperado (responde solo este JSON):
{
  "content": "string, 3 a 6 oraciones con el borrador de esta seccion",
  "coveredStructure": ["string, elementos de la estructura esperada que si cubriste"],
  "missingStructure": ["string, elementos de la estructura esperada que NO pudiste cubrir por falta de informacion"],
  "redFlagsToWatch": ["string, banderas rojas de la lista dada que aplicarian si no se corrigen"]
}`;

function buildSectionSystemPrompt(rubric) {
  const criterios = (rubric.criterios || []).map((c) => `- ${c.nombre} (peso ${c.peso})`).join('\n');
  const estructura = (rubric.estructuraEsperada || []).join(', ');
  const banderas = (rubric.banderasRojas || []).join('; ') || 'ninguna definida';

  return `${SYSTEM_PROMPT_BASE}

Seccion a redactar: "${rubric.label}".
Estructura esperada (mismos criterios que usara despues el validador real de documentos): ${estructura}.
Criterios de evaluacion posteriores:
${criterios || '(sin criterios ponderados definidos para esta seccion)'}
Banderas rojas conocidas para esta seccion: ${banderas}.`;
}

async function fetchMarketContext(answers, country) {
  try {
    const [densidad, macro] = await Promise.all([
      getBusinessDensity(answers.sector || '', '00'),
      getKeyIndicators(),
    ]);
    return {
      text: `Densidad de negocios (INEGI DENUE): ${densidad.establishmentCount ?? 'no disponible'} establecimientos para "${densidad.term}" (fuente: ${densidad.source}).\nIndicadores macro (Banxico SIE): tipo de cambio FIX ${macro.exchangeRateFix?.valor ?? 'no disponible'}, tasa de referencia ${macro.referenceRate?.valor ?? 'no disponible'}, INPC ${macro.inpc?.valor ?? 'no disponible'} (fuente: ${macro.source}).`,
      sourcesUsed: [
        { source: densidad.source, label: 'Densidad de negocios (INEGI DENUE)' },
        { source: macro.source, label: 'Indicadores macro (Banxico SIE)' },
      ],
    };
  } catch (err) {
    return { text: '', sourcesUsed: [], error: err.message };
  }
}

async function fetchReferenceContext(rubric, answers, country) {
  try {
    const query = `${rubric.label}. ${answersSummary(answers, RUBRIC_RELEVANT_FIELDS[rubric.id] || [], 'es')}`.slice(0, 500);
    const matches = await searchReferenceSources(query, { countryCode: country, matchCount: 3 });
    if (!matches.length) return { text: '', sourcesUsed: [] };
    return {
      text: `Fragmentos relevantes de fuentes regulatorias internas (RAG):\n${matches.map((m) => `- [${m.sourceName}] ${m.content.slice(0, 400)}`).join('\n')}`,
      sourcesUsed: matches.map((m) => ({ source: m.sourceName, label: `Fuente regulatoria (RAG): ${m.sourceName}` })),
    };
  } catch (err) {
    return { text: '', sourcesUsed: [], error: err.message };
  }
}

function templateSectionDraft(rubric, answers, language) {
  const en = language === 'en';
  const relevantIds = RUBRIC_RELEVANT_FIELDS[rubric.id] || [];
  const provided = relevantIds.filter((id) => hasValue(answers[id]));
  const content = provided.length
    ? provided.map((id) => `${fieldLabel(id)}: ${answers[id].trim()}.`).join(' ')
    : (en ? 'Not enough information was provided yet for this section.' : 'Aun no hay informacion suficiente para esta seccion.');

  const coveredStructure = [];
  const missingStructure = [...(rubric.estructuraEsperada || [])];

  return { content, coveredStructure, missingStructure, redFlagsToWatch: [] };
}

function parseSectionDraft(rawText, rubric) {
  const parsed = JSON.parse(rawText);
  if (!parsed || typeof parsed !== 'object') throw new Error('Respuesta de IA con formato invalido');

  return {
    content: typeof parsed.content === 'string' ? parsed.content : '',
    coveredStructure: Array.isArray(parsed.coveredStructure) ? parsed.coveredStructure.filter((v) => typeof v === 'string') : [],
    missingStructure: Array.isArray(parsed.missingStructure) ? parsed.missingStructure.filter((v) => typeof v === 'string') : [],
    redFlagsToWatch: Array.isArray(parsed.redFlagsToWatch) ? parsed.redFlagsToWatch.filter((v) => typeof v === 'string') : [],
  };
}

async function draftSection(rubricId, answers, { language = 'es', country = 'MX' } = {}) {
  const rubric = { id: rubricId, ...getRubric(rubricId, country) };
  const relevantFieldIds = RUBRIC_RELEVANT_FIELDS[rubricId] || [];

  if (!hasAnyJsonProvider()) {
    return {
      rubricId,
      label: rubric.label,
      source: 'local-template',
      provider: null,
      model: null,
      costUsd: null,
      sourcesUsed: [],
      ...templateSectionDraft(rubric, answers, language),
    };
  }

  const extraContext = [];
  const sourcesUsed = [];

  if (rubricId === 'estudio_mercado') {
    const market = await fetchMarketContext(answers, country);
    if (market.text) extraContext.push(market.text);
    sourcesUsed.push(...market.sourcesUsed);
  }

  const reference = await fetchReferenceContext(rubric, answers, country);
  if (reference.text) extraContext.push(reference.text);
  sourcesUsed.push(...reference.sourcesUsed);

  const userPrompt = `Idioma de salida: ${language === 'en' ? 'ingles' : 'espanol'}.

Respuestas del solicitante relevantes a esta seccion:
${answersSummary(answers, relevantFieldIds, language)}
${extraContext.length ? `\nContexto adicional de fuentes externas:\n${extraContext.join('\n\n')}` : ''}

${SECTION_OUTPUT_SCHEMA_HINT}`;

  try {
    const result = await generateJsonWithFallback(buildSectionSystemPrompt(rubric), userPrompt, { maxTokens: 700 });
    return {
      rubricId,
      label: rubric.label,
      source: 'ai-generated',
      provider: result.provider,
      model: result.model,
      costUsd: result.costUsd,
      sourcesUsed,
      ...parseSectionDraft(result.text, rubric),
    };
  } catch (err) {
    return {
      rubricId,
      label: rubric.label,
      source: 'local-template',
      provider: null,
      model: null,
      costUsd: null,
      sourcesUsed,
      aiError: err.message,
      ...templateSectionDraft(rubric, answers, language),
    };
  }
}

function buildRequiredDocuments(matrix) {
  return (matrix.requirements || []).map((req) => ({
    code: req.code,
    name: req.name,
    category: req.category,
    mandatory: Boolean(req.is_mandatory),
    weight: req.weight,
  }));
}

export function matchFinancingEntity(answers = {}) {
  const matrixKey = resolveMatrixKey({
    entityType: answers.entityHint,
    sector: answers.sector,
  });
  const matrix = REQUIREMENTS_MATRIX[matrixKey];

  return {
    matrixKey,
    entityLabel: matrix.entity,
    sectorLabel: matrix.sector,
    approvalThreshold: matrix.approval_threshold ?? null,
    minDscr: matrix.min_dscr ?? null,
    requiredDocuments: buildRequiredDocuments(matrix),
  };
}

const SCOPE_NOTE = Object.freeze({
  agentsDraftOnly: [
    'Redactan un borrador por seccion narrativa del checklist (plan de negocios, viabilidad, mercado, riesgos, modelo financiero).',
    'Senalan que partes de la estructura esperada de cada seccion no pudieron cubrir por falta de informacion.',
    'Sugieren a que tipo de ente financiero conviene presentar el proyecto, con base en sector y monto.',
  ],
  agentsDoNotDo: [
    'No suben, generan ni validan documentos oficiales (identificacion, KYC, acta constitutiva, estados financieros).',
    'No verifican que las cifras o afirmaciones del solicitante sean ciertas.',
    'No aprueban credito, no fijan tasas ni garantizan fondeo.',
    'No crean ni modifican el expediente real; nada de esto se guarda automaticamente.',
  ],
  humanMustReview: [
    'Revisar y editar cada seccion redactada antes de usarla.',
    'Completar los documentos obligatorios listados (no los redacta el asistente).',
    'Confirmar que el tipo de ente financiero sugerido es el correcto para su caso.',
    'Cargar la version final en "Mi expediente" para que entre al flujo real de revision.',
  ],
});

export async function draftProjectFromAnswers(answers = {}, { language = 'es', country = 'MX' } = {}) {
  const normalizedLanguage = language === 'en' ? 'en' : 'es';
  const safeAnswers = answers && typeof answers === 'object' ? answers : {};

  const [entityMatch, sections] = await Promise.all([
    Promise.resolve(matchFinancingEntity(safeAnswers)),
    Promise.all(DRAFTABLE_RUBRIC_IDS.map((id) => draftSection(id, safeAnswers, { language: normalizedLanguage, country }))),
  ]);

  return {
    entityMatch,
    missingInfo: missingFieldLabels(safeAnswers, normalizedLanguage),
    sections,
    scope: SCOPE_NOTE,
  };
}

export function getProjectBuilderQuestions(language = 'es') {
  const en = language === 'en';
  const labelsEn = {
    sector: 'Sector', goal: 'Funding objective', amount: 'Approximate amount', useOfFunds: 'Use of funds',
    stage: 'Project stage', market: 'Market / clients', advantage: 'Competitive advantage',
    knownRisks: 'Known risks', entityHint: 'Preferred funding entity type (if known)',
  };
  return ANSWER_FIELDS.map(([id, labelEs]) => ({
    id,
    label: en ? labelsEn[id] : labelEs,
    required: ['goal', 'amount', 'useOfFunds', 'market'].includes(id),
  }));
}
