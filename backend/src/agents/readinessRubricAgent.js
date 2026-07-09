// Evaluador parametrizado para los 12 items del checklist de 12 Requisitos
// Mínimos — un módulo, 12 rúbricas reales (backend/src/config/readinessRubrics.js)
// en vez de 12 archivos casi idénticos. Para doc_kyc reusa el agente de
// screening ya existente (nsdApplicantAgent.js: SAT + Buró + OFAC/sanciones + PEP
// real). Para estudio_mercado enriquece el prompt con datos reales de INEGI/Banxico.
import { supabaseAdmin } from '../config/supabase.js';
import { getRubric, isAutomatedKycCountry, READINESS_RUBRICS } from '../config/readinessRubrics.js';
import { runApplicantScreen } from './nsdApplicantAgent.js';
import { getBusinessDensity } from '../services/inegiService.js';
import { getKeyIndicators } from '../services/banxicoService.js';
import { extractFinancialWithAI } from './agentFinancial.js';
import { getCrossReferences } from '../services/documentIntelligenceService.js';
import { validateRegulatoryProfile } from '../services/regulatoryValidation.js';
import { searchLegalEntity } from '../services/gleifService.js';
import { screenRfcAgainstSat69b } from '../services/satBlacklistScreening.js';
import { findDatesInText } from './agentValidator.js';
import { screenBeneficiaryOwners, normalizeBeneficiaryOwnerList } from '../services/beneficiaryOwners.js';
import { generateJsonWithFallback, hasAnyJsonProvider } from '../services/aiJsonProvider.js';

// Bitacora auditable (seccion 28 del plan): version del prompt/rubrica usados
// por cada evaluacion, guardada dentro de extracted_data (sin migracion de
// esquema nueva) para poder rastrear que criterio produjo cada score.
const PROMPT_VERSION = 'v1';
const RUBRIC_VERSION = '2026-07-06';
const FINANCIAL_ITEM_IDS = new Set(['modelo_financiero', 'viabilidad_financiera']);

const BASE_SYSTEM_PROMPT = `Eres un agente especializado en due diligence documental y preparación de expedientes para financiamiento.
Tu tarea no es aprobar ni rechazar créditos. Tu tarea es evaluar la preparación, estructura, consistencia, evidencia y riesgos del documento analizado.

Reglas obligatorias:
1. No inventes información.
2. No asumas datos que no estén en el documento o fuentes autorizadas.
3. Distingue claramente entre hecho, inferencia y recomendación.
4. Califica con base en la rúbrica proporcionada.
5. Entrega hallazgos concretos y accionables.
6. Identifica faltantes, contradicciones y banderas rojas.
7. No premies lenguaje elegante si no hay evidencia.
8. No castigues redacción simple si el contenido es sólido.
9. Usa tono profesional, objetivo y sin sesgo.
10. Devuelve salida en JSON válido conforme al schema solicitado.`;

// System prompt del agente estructural (sección 10.4 del plan: "opinión sin
// sesgo") -- reglas adicionales para que Claude no premie redacción elegante,
// diseño visual o palabras de moda sin evidencia real.
const STRUCTURE_SYSTEM_PROMPT = `${BASE_SYSTEM_PROMPT}

Reglas adicionales para esta revisión estructural (evalúas forma, no el fondo del contenido):
11. No califiques mejor por redacción elegante sin evidencia, diseño visual atractivo, longitud excesiva, lenguaje corporativo, promesas de crecimiento sin sustento, ni por palabras de moda ("disruptivo", "escalable", "blockchain", "IA", "impacto") usadas sin datos.
12. Califica por estructura, evidencia, consistencia interna y utilidad para que un tercero financiero lo revise, no por estética o entusiasmo del solicitante.`;

function itemIdFromCode(documentTypeCode) {
  return String(documentTypeCode || '').replace(/^READY_/, '').toLowerCase();
}

function normalizeForMatch(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

// Revisión de estructura documental (sección 10 del plan) como pieza
// independiente del score de contenido: heurística determinista de presencia
// de secciones/elementos esperados en el texto extraído -- no depende de
// Claude, siempre corre, y es explícita sobre ser una señal de keywords, no
// comprensión real del documento.
function computeStructureReview(rubric, extractedText) {
  const expected = rubric?.estructuraEsperada || rubric?.documentosEsperados || rubric?.validacionesMinimas
    || rubric?.evaluacionesMinimas || rubric?.revisionesMinimas || rubric?.revisionMinima || rubric?.reglas || [];

  if (!expected.length) return { structureScore: null, missingStructuralSections: [] };

  const normalizedText = normalizeForMatch(extractedText);
  const missingStructuralSections = [];
  let found = 0;

  for (const section of expected) {
    const keyword = normalizeForMatch(section).split(/[/,(]/)[0].trim();
    if (keyword && normalizedText.includes(keyword)) {
      found += 1;
    } else {
      missingStructuralSections.push(section);
    }
  }

  return { structureScore: Math.round((found / expected.length) * 100), missingStructuralSections };
}

// Agente estructural real (sección 10/15.2 del plan): a diferencia de
// computeStructureReview() (conteo de palabras clave), esta función SÍ le pide
// a Claude que juzgue la estructura -- devuelve weak_sections/strengths/
// confidence que la heurística no puede producir. Corre en paralelo a la
// evaluación de contenido (mismo texto extraído, una sola pasada de lectura).
// Si Claude no está configurado o la llamada falla, evaluateWithClaude() cae
// de vuelta a computeStructureReview(); nunca se deja el documento sin señal
// estructural.
async function evaluateStructureWithClaude(rubric, extractedText, order) {
  const estructura = rubric?.estructuraEsperada || rubric?.documentosEsperados || rubric?.validacionesMinimas
    || rubric?.evaluacionesMinimas || rubric?.revisionesMinimas || rubric?.revisionMinima || rubric?.reglas || [];

  const userContent = `Analiza la estructura del documento cargado.
Evalúa si el documento está organizado de forma profesional para revisión financiera.
No evalúes únicamente el estilo visual. Evalúa orden, secciones, claridad, completitud, anexos, evidencia, consistencia interna y utilidad para un otorgante de financiamiento.

Documento esperado: ${rubric?.label || 'documento'}
País: ${order?.metadata?.country || 'MX'}
Sector: ${order?.metadata?.sector || 'No especificado'}
Tipo de financiamiento: ${order?.metadata?.financingType || 'No especificado'}
Secciones/elementos mínimos esperados:
${estructura.map((s) => `- ${s}`).join('\n')}

Texto extraído del documento:
${String(extractedText || '(sin texto extraído)').slice(0, 12000)}

Responde ÚNICAMENTE un JSON válido con esta forma exacta:
{
  "structure_score": 0,
  "missing_sections": ["string"],
  "weak_sections": [{"section": "string", "issue": "string"}],
  "strengths": ["string"],
  "red_flags": ["string"],
  "recommendation": "string",
  "confidence": 0.0
}
"confidence" (0.0 a 1.0): qué tan seguro estás de este juicio estructural dado el texto disponible -- baja si el texto está incompleto, truncado o es ilegible.`;

  const providerResult = await generateJsonWithFallback(STRUCTURE_SYSTEM_PROMPT, userContent, { maxTokens: 900 });
  const parsed = JSON.parse(providerResult.text);
  return {
    structureScore: parsed.structure_score ?? null,
    missingSections: parsed.missing_sections || [],
    weakSections: parsed.weak_sections || [],
    strengths: parsed.strengths || [],
    redFlags: parsed.red_flags || [],
    recommendation: parsed.recommendation || null,
    confidence: parsed.confidence ?? null,
    provider: providerResult.provider,
    model: providerResult.model,
    usage: providerResult.usage,
    costUsd: providerResult.costUsd
  };
}

// Comparación contra fuentes oficiales y marcos de referencia (sección 2.1
// del plan) para ESG/ODS/impacto: en vez de dejar que la IA opine de ESG en
// abstracto, se busca mención explícita de los marcos reales (IFC PS, Equator
// Principles, GRI, SASB, Taxonomía Sostenible MX, ODS ONU) ya nombrados en la
// rúbrica (sección 6 del plan). Heurística de keywords, corre siempre
// (Claude o fallback), no certifica cumplimiento -- solo detecta ausencia de
// mención.
function checkFrameworkMentions(rubric, extractedText) {
  const marcos = rubric?.marcosReferencia || [];
  if (!marcos.length) return { mentionedFrameworks: [], missingFrameworks: [] };

  const normalized = normalizeForMatch(extractedText);
  const mentionedFrameworks = [];
  const missingFrameworks = [];

  for (const marco of marcos) {
    const keyword = normalizeForMatch(marco).split(/[(—-]/)[0].trim();
    if (keyword && normalized.includes(keyword)) {
      mentionedFrameworks.push(marco);
    } else {
      missingFrameworks.push(marco);
    }
  }

  return { mentionedFrameworks, missingFrameworks };
}

// Verificación de correspondencia documento-tipo (sección 2.1 del plan):
// "clasificar automáticamente" + "verificar que el documento corresponde al
// tipo declarado". El usuario elige el tipo al subir (header X-Document-Type,
// no hay una bandeja genérica que clasificar a ciegas como en Document
// Intelligence), así que el valor real aquí es DETECTAR cuando el contenido
// no corresponde a lo declarado -- ej. subir el acta constitutiva bajo el
// slot de "identificación oficial". Heurística de keywords contra las listas
// ya existentes en cada rúbrica (estructuraEsperada/documentosEsperados/etc.),
// sin necesidad de IA ni de un modelo de clasificación nuevo.
const READINESS_KEYWORD_SETS = Object.fromEntries(
  Object.entries(READINESS_RUBRICS).map(([itemId, rubric]) => {
    const elements = rubric.estructuraEsperada || rubric.documentosEsperados || rubric.validacionesMinimas
      || rubric.evaluacionesMinimas || rubric.revisionesMinimas || rubric.revisionMinima || rubric.reglas || [];
    const words = [rubric.label, ...elements]
      .flatMap((s) => normalizeForMatch(s).split(/[^a-z0-9]+/))
      .filter((w) => w.length > 4);
    return [itemId, [...new Set(words)]];
  })
);

function classifyReadinessDocumentType(extractedText) {
  const normalized = normalizeForMatch(extractedText);
  const scores = {};
  for (const [itemId, words] of Object.entries(READINESS_KEYWORD_SETS)) {
    scores[itemId] = words.reduce((count, w) => count + (normalized.includes(w) ? 1 : 0), 0);
  }
  const [bestItemId, bestScore] = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return { scores, bestItemId, bestScore };
}

const TYPE_MATCH_MIN_SIGNAL = 3;

function checkDeclaredTypeMatch(declaredItemId, extractedText) {
  if (!String(extractedText || '').trim()) return null;

  const { scores, bestItemId, bestScore } = classifyReadinessDocumentType(extractedText);
  if (bestScore < TYPE_MATCH_MIN_SIGNAL) return null;

  const declaredScore = scores[declaredItemId] || 0;
  const clearMismatch = bestItemId !== declaredItemId
    && bestScore >= declaredScore * 1.5
    && bestScore - declaredScore >= 2;

  if (!clearMismatch) return { matches: true, bestGuess: bestItemId };

  return {
    matches: false,
    bestGuess: bestItemId,
    warning: `El contenido de este documento coincide más con "${getRubric(bestItemId)?.label || bestItemId}" que con el tipo declarado "${getRubric(declaredItemId)?.label || declaredItemId}" — verificar que se subió el archivo correcto.`
  };
}

// Recomendación accionable (sección 1.11 del plan): si el modelo no entrega
// una, se deriva una genérica de faltantes/banderas rojas -- nunca se deja
// vacía silenciosamente.
function buildFallbackRecommendation(missingItems, redFlags) {
  if (redFlags?.length) return `Prioridad: resolver "${redFlags[0]}" antes de continuar.`;
  if (missingItems?.length) return `Completar: ${missingItems.slice(0, 2).join('; ')}.`;
  return 'Sin acciones pendientes detectadas para este documento.';
}

// Bitácora auditable (sección 28): qué agente/modelo/versión de prompt y
// rúbrica produjo esta evaluación, empacado en extracted_data para no
// depender de una migración de esquema nueva en document_reviews.
function auditEntries({ agentName, modelName, provider, rubricVersion = RUBRIC_VERSION, promptVersion = PROMPT_VERSION }) {
  return [
    { key: 'agent_name', value: agentName },
    { key: 'model_name', value: modelName },
    ...(provider ? [{ key: 'ai_provider', value: provider }] : []),
    { key: 'prompt_version', value: promptVersion },
    { key: 'rubric_version', value: rubricVersion }
  ];
}

// human_review_required (sección 16 del plan, campo del schema general de
// evaluación): true cuando el score es rojo, hay banderas rojas, o la
// confianza reportada por Claude es baja -- señal explícita de que un
// analista/auditor humano debe revisar esta evaluación antes de confiar en
// ella a ciegas, en vez de dejarlo implícito solo en el color del score.
function requiresHumanReview({ score, confidence, redFlags }) {
  if (score != null && score < 60) return true;
  if (redFlags?.length) return true;
  if (confidence != null && confidence < 0.6) return true;
  return false;
}

// Los pasos de enriquecimiento posteriores (vigencia, consistencia financiera,
// riesgo por cruces documentales, beneficiario controlador) solo pueden bajar
// el score (Math.min), nunca subirlo -- por eso human_review_required se
// recalcula aqui, al final de toda la cadena, para no dejarlo en "false"
// desactualizado si un enriquecimiento tumbo el score despues de que
// evaluateWithClaude()/heuristicFallback() ya lo habian marcado como listo.
function finalizeHumanReviewRequired(result) {
  const alreadyRequired = result.extracted_data.some((e) => e.key === 'human_review_required' && e.value === true);
  if (alreadyRequired) return result;

  const required = requiresHumanReview({ score: result.score, confidence: null, redFlags: [] });
  if (!required) return result;

  return {
    ...result,
    extracted_data: [
      ...result.extracted_data.filter((e) => e.key !== 'human_review_required'),
      { key: 'human_review_required', value: true }
    ]
  };
}

function heuristicFallback(rubric, extractedText) {
  const hasText = Boolean(String(extractedText || '').trim());
  const score = hasText ? 55 : 20;
  const missingItems = (rubric?.criterios || []).map((c) => c.nombre);
  const { structureScore, missingStructuralSections } = computeStructureReview(rubric, extractedText);
  const { mentionedFrameworks, missingFrameworks } = checkFrameworkMentions(rubric, extractedText);
  const noFrameworksMentioned = missingFrameworks.length > 0 && mentionedFrameworks.length === 0;

  return {
    status: score >= 60 ? 'yellow' : 'red',
    score,
    summary: `Revisión heurística de "${rubric?.label || 'documento'}" — ningún proveedor de IA está configurado, no se evaluó contenido real.`,
    findings: hasText
      ? ['Documento cargado; requiere revisión con IA real (falta ANTHROPIC_API_KEY/OPENAI_API_KEY/DEEPSEEK_API_KEY/NVIDIA_API_KEY) o revisión manual.']
      : ['No se pudo extraer texto del documento; requiere revisión manual.'],
    missing_items: [
      ...missingItems,
      ...missingStructuralSections.map((s) => `Estructura: ${s}`),
      ...(noFrameworksMentioned ? [`No se detectó mención explícita de marcos de referencia reconocidos (ej. ${missingFrameworks[0]})`] : [])
    ],
    extracted_data: [
      ...(structureScore != null ? [{ key: 'structure_score', value: structureScore }] : []),
      ...(mentionedFrameworks.length ? [{ key: 'marcos_mencionados', value: mentionedFrameworks.join(', ') }] : []),
      { key: 'recomendacion', value: buildFallbackRecommendation(missingItems, []) },
      { key: 'human_review_required', value: true },
      ...auditEntries({ agentName: 'readinessRubricAgent', modelName: 'heuristic-fallback' })
    ],
    warnings: ['Advertencia: ningún proveedor de IA configurado (ANTHROPIC_API_KEY/OPENAI_API_KEY/DEEPSEEK_API_KEY/NVIDIA_API_KEY), usando revisión heurística por reglas.']
  };
}

function buildRubricPromptSection(rubric) {
  const estructura = rubric.estructuraEsperada || rubric.documentosEsperados || rubric.validacionesMinimas
    || rubric.evaluacionesMinimas || rubric.revisionesMinimas || rubric.revisionMinima || rubric.reglas || [];
  const criterios = (rubric.criterios || []).map((c) => `- ${c.nombre} (peso ${c.peso})`).join('\n');
  const banderas = (rubric.banderasRojas || []).map((b) => `- ${b}`).join('\n');
  const marcos = rubric.marcosReferencia || [];

  return `Documento a evaluar: ${rubric.label}

Estructura/contenido mínimo esperado:
${estructura.map((s) => `- ${s}`).join('\n')}

Criterios de evaluación (peso sobre 100):
${criterios}

Banderas rojas conocidas para este tipo de documento:
${banderas || '(ninguna específica, usar criterio profesional general)'}
${marcos.length ? `
Marcos de referencia externos contra los que debes contrastar explícitamente (no aceptes ESG/impacto genérico sin evidencia de alineación real con alguno de estos):
${marcos.map((m) => `- ${m}`).join('\n')}
Si el documento no menciona ni se alinea con ninguno de estos marcos, dilo explícitamente en "missing_items" (ej. "No se referencia ningún marco reconocido de sostenibilidad/impacto").` : ''}`;
}

async function evaluateWithClaude(rubric, extractedText, extraContext, order) {
  const userContent = `${buildRubricPromptSection(rubric)}
${extraContext ? `\nContexto adicional verificado (fuentes externas reales):\n${extraContext}\n` : ''}
Texto extraído del documento:
${String(extractedText || '(sin texto extraído)').slice(0, 12000)}

Responde ÚNICAMENTE un JSON válido con esta forma exacta:
{
  "score": 0,
  "status": "green|yellow|red",
  "summary": "string",
  "findings": ["string"],
  "missing_items": ["string"],
  "red_flags": ["string"],
  "recommendation": "string — la accion mas importante y concreta que el solicitante debe tomar para mejorar este documento",
  "confidence": 0.0,
  "extracted_fields": {
    "monto_solicitado": "string o null si no aplica/no se menciona",
    "razon_social": "string o null si no aplica/no se menciona",
    "fecha_documento": "string o null si no aplica/no se menciona",
    "rfc": "string o null si no aplica/no se menciona",
    "representante_legal": "string o null si no aplica/no se menciona",
    "capex": "string o null si no aplica/no se menciona",
    "deuda_total": "string o null si no aplica/no se menciona"
  }
}
Status: green si score >= 80, yellow si 60-79, red si < 60.
"confidence" (0.0 a 1.0): qué tan seguro estás de esta evaluación dado el texto disponible — baja si el texto está incompleto, es ilegible o el documento es ambiguo, no la infles solo porque el score fue alto.
"extracted_fields" es para comparar este documento contra los otros del mismo expediente — usa null si el documento no menciona ese dato, no inventes un valor. Usa solo datos atómicos (RFC, nombres, montos, fechas), no resumas texto narrativo aquí.`;

  const [contentResult, structureReview] = await Promise.all([
    generateJsonWithFallback(BASE_SYSTEM_PROMPT, userContent, { maxTokens: 1400 }),
    evaluateStructureWithClaude(rubric, extractedText, order).catch((err) => {
      console.warn('[readinessRubricAgent] Error en revisión estructural con Claude, se usa heurística de respaldo:', err.message);
      return null;
    })
  ]);

  const parsed = JSON.parse(contentResult.text);
  const extractedFields = Object.entries(parsed.extracted_fields || {})
    .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '')
    .map(([key, value]) => ({ key, value }));
  const { mentionedFrameworks } = checkFrameworkMentions(rubric, extractedText);
  const recommendation = parsed.recommendation || buildFallbackRecommendation(parsed.missing_items, parsed.red_flags);

  // Estructura (sección 10/15.2): usa el juicio real de Claude cuando está
  // disponible; si la llamada estructural falló, cae al conteo de palabras
  // clave (computeStructureReview) -- nunca se queda sin señal estructural.
  const heuristicStructure = computeStructureReview(rubric, extractedText);
  const structureScore = structureReview?.structureScore ?? heuristicStructure.structureScore;
  const missingStructuralSections = structureReview
    ? structureReview.missingSections
    : heuristicStructure.missingStructuralSections;

  const allRedFlags = [...(parsed.red_flags || []), ...(structureReview?.redFlags || [])];
  const confidence = parsed.confidence != null ? Number(parsed.confidence) : null;
  const humanReviewRequired = requiresHumanReview({ score: parsed.score, confidence, redFlags: allRedFlags });

  // Costo/tokens por evaluación (sección 21.3/30 del plan): suma la llamada de
  // contenido + la estructural (dos llamadas reales por documento) para dar
  // una cifra honesta de "costo IA por expediente", no solo de la llamada
  // principal.
  const usageEntries = [contentResult.usage, structureReview?.usage].some(Boolean)
    ? [
        { key: 'tokens_entrada', value: (contentResult.usage?.inputTokens || 0) + (structureReview?.usage?.inputTokens || 0) },
        { key: 'tokens_salida', value: (contentResult.usage?.outputTokens || 0) + (structureReview?.usage?.outputTokens || 0) }
      ]
    : [];
  const totalCostUsd = (contentResult.costUsd || 0) + (structureReview?.costUsd || 0);

  return {
    status: parsed.status,
    score: parsed.score,
    summary: parsed.summary,
    findings: [
      ...(parsed.findings || []),
      ...(structureReview?.weakSections || []).map((w) => `Estructura débil: ${w.section} — ${w.issue}`),
      ...(structureReview?.redFlags || []).map((f) => `Bandera roja estructural: ${f}`)
    ],
    missing_items: [...(parsed.missing_items || []), ...missingStructuralSections.map((s) => `Estructura: ${s}`)],
    extracted_data: [
      ...extractedFields,
      ...(parsed.red_flags || []).map((flag) => ({ key: 'Bandera roja', value: flag })),
      ...(structureScore != null ? [{ key: 'structure_score', value: structureScore }] : []),
      ...(structureReview?.strengths?.length ? [{ key: 'fortalezas_estructura', value: structureReview.strengths.join('; ') }] : []),
      ...(mentionedFrameworks.length ? [{ key: 'marcos_mencionados', value: mentionedFrameworks.join(', ') }] : []),
      { key: 'recomendacion', value: recommendation },
      ...(confidence != null ? [{ key: 'confidence', value: confidence }] : []),
      { key: 'human_review_required', value: humanReviewRequired },
      ...usageEntries,
      ...(totalCostUsd > 0 ? [{ key: 'costo_estimado_usd', value: totalCostUsd }] : []),
      ...auditEntries({ agentName: 'readinessRubricAgent', modelName: contentResult.model, provider: contentResult.provider })
    ],
    warnings: structureReview ? [] : ['Advertencia: la revisión estructural con IA no estuvo disponible, se usó heurística de palabras clave como respaldo.']
  };
}

function statusForScore(score) {
  return score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red';
}

// KYC/KYB para paises sin el agente profundo de Mexico (nsdApplicantAgent.js,
// acoplado a RFC + Buro de Credito): usa validateRegulatoryProfile(), que YA
// hace screening real de OFAC (sanciones globales) + PEP (cargo declarado,
// valido para cualquier pais) + validacion de formato del ID fiscal local
// cuando existe matriz conocida (MX/US/UK/CA/AE + CO/EC/AR/PE/CL/BO/PY/UY).
// No reemplaza un buro de credito local (eso requiere contrato comercial,
// como BURO_API_URL en Mexico) -- ese hueco se reporta honestamente como
// "pendiente", no se inventa.
async function evaluateRegulatoryKyc(order, country) {
  const regulatoryResult = validateRegulatoryProfile({ country, applicant: order?.metadata || {}, order });
  const companyName = order?.metadata?.companyName;
  const gleifResult = companyName ? await searchLegalEntity(companyName) : { matches: [] };

  let score = 65; // baseline: screening real de OFAC/PEP corrio limpio, pero sin buro local
  const findings = [];
  const missingItems = [];
  const gleifExtractedData = [];

  for (const check of regulatoryResult.checks) {
    if (check.status === 'fail') {
      score -= check.severity === 'high' ? 50 : check.severity === 'medium' ? 15 : 5;
      findings.push(`${check.label}: ${check.detail}`);
    } else if (check.status === 'pass' || check.status === 'configured') {
      score += 5;
      findings.push(`${check.label}: ${check.detail}`);
    } else if (check.status === 'skipped') {
      missingItems.push(`Pendiente: ${check.label} — ${check.detail}`);
    }
  }

  // GLEIF (API pública gratuita): confirma existencia real en el registro
  // global de LEI. No es un sustituto de un buro de credito, es una señal
  // adicional de existencia/KYB internacional.
  if (gleifResult.matches?.length) {
    const bestMatch = gleifResult.matches[0];
    score += 5;
    findings.push(`GLEIF: entidad encontrada en el registro global de LEI (${bestMatch.legalName || companyName}, estatus ${bestMatch.status || 'N/D'}, LEI ${bestMatch.lei}).`);
    gleifExtractedData.push({ key: 'gleif_lei', value: bestMatch.lei }, { key: 'gleif_status', value: bestMatch.status || 'N/D' });
  } else if (companyName) {
    missingItems.push(`GLEIF: no se encontró un LEI registrado para "${companyName}" — no todas las empresas tienen uno, verificar si aplica para este caso.`);
  }

  score = Math.max(0, Math.min(100, score));

  const criticalFail = regulatoryResult.checks.find((c) => c.status === 'fail' && c.severity === 'high');
  const recommendation = criticalFail
    ? `Atender de inmediato: ${criticalFail.label} — ${criticalFail.detail}`
    : missingItems.length
      ? `Contratar/configurar: ${missingItems[0].replace('Pendiente: ', '')}`
      : 'Sin hallazgos bloqueantes en el screening regulatorio real (OFAC/PEP/formato/GLEIF).';

  return {
    status: statusForScore(score),
    score,
    summary: `Screening regulatorio real para ${country}: OFAC y PEP declarado revisados, ${regulatoryResult.summary.passed} check(s) conformes, ${regulatoryResult.summary.failed} con hallazgo, GLEIF ${gleifResult.matches?.length ? 'con coincidencia' : 'sin coincidencia'}. Sin buró de crédito local todavía (requiere contrato comercial).`,
    findings,
    missing_items: missingItems,
    extracted_data: [
      { key: 'recomendacion', value: recommendation },
      ...gleifExtractedData,
      // human_review_required se calcula al final en evaluateKyc() (ver
      // comentario ahi), no aqui -- cualquier valor puesto en este punto
      // se filtraria y recalcularia de todos modos.
      ...auditEntries({ agentName: 'readinessRubricAgent', modelName: 'validateRegulatoryProfile+GLEIF' })
    ],
    warnings: regulatoryResult.checks.some((c) => c.provider === 'nsd')
      ? [`Advertencia: no hay matriz regulatoria específica para "${country}" — solo corrieron OFAC y PEP declarado.`]
      : []
  };
}

// Caso especial doc_kyc: reusa el agente ya existente (SAT + Buró + OFAC/sanciones + PEP real).
// Ese agente (nsdApplicantAgent.js) esta acoplado al RFC/Buro de Credito de
// Mexico -- para otros paises se usa evaluateRegulatoryKyc() (screening real
// de OFAC/PEP/formato, sin buro de credito local).
// doc_kyc no pasa por enrichResult() (retorna directo desde
// evaluateReadinessDocument), asi que el chequeo de beneficiario controlador
// se aplica aqui explicitamente para las 3 rutas posibles (MX, no-MX, error).
async function evaluateKyc(order) {
  const result = await evaluateKycCore(order);
  const enriched = enrichWithBeneficiaryOwners(result, order);
  return finalizeHumanReviewRequired(enriched);
}

async function evaluateKycCore(order) {
  const country = order?.metadata?.country || 'MX';

  if (!isAutomatedKycCountry(country)) {
    return evaluateRegulatoryKyc(order, country);
  }

  const rfc = order?.metadata?.rfc;
  const name = order?.metadata?.companyName;

  if (!rfc) {
    return {
      status: 'red',
      score: 0,
      summary: 'No hay RFC registrado en el expediente para ejecutar el screening KYC/KYB.',
      findings: ['Falta capturar el RFC del expediente antes de poder screenear KYC/KYB.'],
      missing_items: ['RFC del expediente'],
      extracted_data: [
        { key: 'recomendacion', value: 'Capturar el RFC del expediente para poder ejecutar el screening KYC/KYB.' },
        ...auditEntries({ agentName: 'readinessRubricAgent', modelName: 'blocked-missing-rfc' })
      ],
      warnings: []
    };
  }

  const result = await runApplicantScreen({ rfc, name });

  if (result?.error) {
    return {
      status: 'yellow',
      score: 50,
      summary: result.error,
      findings: [result.error],
      missing_items: [],
      extracted_data: [
        { key: 'recomendacion', value: 'Configurar ANTHROPIC_API_KEY para habilitar el screening KYC/KYB automatizado, o completar la revisión manualmente.' },
        ...auditEntries({ agentName: 'readinessRubricAgent', modelName: 'nsdApplicantAgent-unavailable' })
      ],
      warnings: ['Advertencia: agente de screening KYC no disponible (falta ANTHROPIC_API_KEY).']
    };
  }

  const score = result.nsd_score?.final_score ?? 50;
  const status = score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red';
  const findings = [
    `RFC ${result.checks?.rfc_validation?.valid ? 'válido' : 'inválido'} (${result.checks?.rfc_validation?.source || 'desconocido'}).`,
    `Score Buró: ${result.checks?.credit_score?.score ?? 'N/D'} (${result.checks?.credit_score?.source || 'desconocido'}).`,
    `Riesgo global: ${result.global_risk?.global_risk || 'N/D'}.`,
    ...(result.flags || []).map((f) => `${f.severity}: ${f.message}`)
  ];
  const recommendation = (result.flags || []).length
    ? `Atender: ${result.flags[0].message}`
    : 'Sin acciones pendientes detectadas en el screening KYC/KYB.';

  const kycResult = {
    status,
    score,
    summary: result.agent_summary || 'Screening KYC/KYB completado.',
    findings,
    missing_items: [],
    extracted_data: [
      { key: 'RFC', value: result.rfc },
      { key: 'Score Buró', value: result.checks?.credit_score?.score ?? 'N/D' },
      { key: 'Riesgo global', value: result.global_risk?.global_risk || 'N/D' },
      ...(result.name ? [{ key: 'razon_social', value: result.name }] : []),
      { key: 'recomendacion', value: recommendation },
      ...auditEntries({ agentName: 'nsdApplicantAgent', modelName: 'claude-sonnet-4-6', provider: 'anthropic' })
    ],
    warnings: result.mock_warning ? [result.mock_warning] : []
  };

  return enrichKycWithSat69b(kycResult, rfc, name);
}

// Bandera roja critica (seccion 12.1 del plan: "Coincidencia en SAT 69-B como
// definitivo sin justificacion o regularizacion"). satBlacklistScreening.js ya
// existe y funciona (usado hoy solo en el screening manual de CumplimientoTab.jsx,
// /api/screening/sat69b) pero nunca corria dentro del checklist de Readiness --
// evaluateKyc() dependia 100% de que nsdApplicantAgent.js lo mencionara
// espontaneamente, cosa que nunca hace porque ese agente no tiene esa tool.
async function enrichKycWithSat69b(result, rfc, name) {
  try {
    const screening = screenRfcAgainstSat69b(rfc, name);
    if (screening.status !== 'hit') {
      return { ...result, extracted_data: [...result.extracted_data, { key: 'sat_69b', value: screening.status }] };
    }

    const esDefinitivo = screening.matches.some((m) => /definitivo/i.test(m.situacion || ''));
    const score = Math.min(result.score, esDefinitivo ? 15 : 45);

    return {
      ...result,
      score,
      status: statusForScore(score),
      findings: [
        ...result.findings,
        `Bandera roja${esDefinitivo ? ' crítica' : ''}: ${screening.detail}`
      ],
      extracted_data: [
        ...result.extracted_data,
        { key: 'sat_69b', value: esDefinitivo ? 'definitivo' : 'hit_no_definitivo' }
      ]
    };
  } catch (err) {
    console.warn('[readinessRubricAgent] Error en screening SAT 69-B:', err.message);
    return result;
  }
}

// Revisión de consistencia financiera real (no solo la opinión libre de
// Claude sobre el rubric): reusa extractFinancialWithAI() de agentFinancial.js
// -- la misma extracción que ya usa Document Intelligence -- para calcular
// DSCR/apalancamiento reales del texto extraído y aplicar la bandera roja
// "DSCR insuficiente" que ya define la sección 12.1 del plan.
async function enrichFinancialConsistency(result, extractedText) {
  try {
    const financials = await extractFinancialWithAI(extractedText);
    if (!financials) return result;

    const financialEntries = Object.entries(financials)
      .filter(([, value]) => value !== null && value !== undefined && String(value).trim?.() !== '')
      .map(([key, value]) => ({ key: `financiero_${key}`, value }));

    if (!financialEntries.length) return result;

    const dscr = financials.dscr != null ? Number(financials.dscr) : null;
    const findings = [...result.findings];
    let score = result.score;

    if (dscr != null && Number.isFinite(dscr)) {
      if (dscr < 1.0) {
        findings.push(`Bandera roja: DSCR calculado de ${dscr} es insuficiente para cubrir el servicio de deuda (< 1.0).`);
        score = Math.min(score, 40);
      } else {
        findings.push(`DSCR calculado a partir del documento: ${dscr}.`);
      }
    }

    return {
      ...result,
      score,
      status: statusForScore(score),
      findings,
      extracted_data: [...result.extracted_data, ...financialEntries]
    };
  } catch (err) {
    console.warn('[readinessRubricAgent] Error enriqueciendo consistencia financiera:', err.message);
    return result;
  }
}

// Revisión de riesgos real (sección 1.8): incorpora las contradicciones
// documentales YA detectadas y guardadas por readinessCrossRefAgent.js para
// este expediente (misma tabla cross_references) como señal de riesgo real,
// en vez de reusar agentRiskScorer.js -- ese agente lee document_verifications,
// tabla que solo llena el pipeline de Document Intelligence, no Readiness;
// conectarlo ahi devolveria siempre "sin riesgo" por falta de datos, no por
// ausencia real de riesgo.
async function enrichRiskWithCrossReferences(result, order) {
  if (!order?.id) return result;

  try {
    const crossReferences = await getCrossReferences(order.id);
    const failing = (crossReferences || []).filter((ref) => ref.status === 'fail');
    if (!failing.length) return result;

    const penalty = Math.min(20, failing.length * 5);
    const score = Math.max(0, result.score - penalty);

    return {
      ...result,
      score,
      status: statusForScore(score),
      findings: [
        ...result.findings,
        `Riesgo real detectado por auditoría cruzada: ${failing.length} contradicción(es) entre documentos del expediente (ej. ${failing[0].details || failing[0].cross_reference_type}).`
      ],
      extracted_data: [...result.extracted_data, { key: 'contradicciones_detectadas', value: failing.length }]
    };
  } catch (err) {
    console.warn('[readinessRubricAgent] Error enriqueciendo riesgo con cruces documentales:', err.message);
    return result;
  }
}

function enrichWithTypeMatchCheck(itemId, result, extractedText) {
  const check = checkDeclaredTypeMatch(itemId, extractedText);
  if (!check || check.matches) return result;

  const score = Math.min(result.score, 50);
  return {
    ...result,
    score,
    status: statusForScore(score),
    findings: [...result.findings, `Bandera roja: ${check.warning}`],
    extracted_data: [
      ...result.extracted_data,
      { key: 'tipo_declarado_coincide', value: false },
      { key: 'tipo_sugerido', value: check.bestGuess }
    ]
  };
}

// Regla condicional SEMARNAT/MIA (sección 5.1 del plan: "Identificar si un
// proyecto requiere MIA, permisos ambientales o evaluación sectorial" — y
// sección 19.1, reglas por sector). No consulta a SEMARNAT (sin API pública),
// es una regla de negocio real: ciertos sectores suelen requerir Manifestación
// de Impacto Ambiental antes de presentar el expediente.
const SEMARNAT_MIA_SECTOR_KEYWORDS = ['inmobiliario', 'energia', 'agroindustrial', 'agroindustria', 'turismo', 'mineria', 'petrolero', 'hidrocarburos'];

function requiresSemarnatMiaCheck(order) {
  const sector = normalizeForMatch(order?.metadata?.sector || '');
  if (!sector) return false;
  return SEMARNAT_MIA_SECTOR_KEYWORDS.some((keyword) => sector.includes(keyword));
}

function enrichEsiaWithSemarnatRule(result, order) {
  if (!requiresSemarnatMiaCheck(order)) return result;

  const sector = order?.metadata?.sector;
  return {
    ...result,
    findings: [
      ...result.findings,
      `Recordatorio regulatorio: el sector declarado ("${sector}") suele requerir evaluar si aplica Manifestación de Impacto Ambiental (MIA) ante SEMARNAT antes de presentar el expediente.`
    ],
    extracted_data: [...result.extracted_data, { key: 'semarnat_mia_aplicable', value: true }]
  };
}

// Bandera amarilla "Documentos con fechas vencidas" (seccion 12.2 del plan):
// usa expiration_months de document_type_catalog (columna ya poblada por
// 2026-07-04_readiness_document_types.sql, hoy solo con valor real en
// READY_IDENTIFICACION_OFICIAL) + findDatesInText, la misma extraccion de
// fechas que ya usa y prueba agentValidator.js en el pipeline viejo de
// Document Intelligence -- no se duplica la logica, se reusa exportada.
async function enrichWithExpirationCheck(documentTypeCode, result, extractedText) {
  try {
    const { data } = await supabaseAdmin
      .from('document_type_catalog')
      .select('expiration_months')
      .eq('code', documentTypeCode)
      .maybeSingle();

    const expirationMonths = data?.expiration_months;
    if (!expirationMonths) return result;

    const dates = findDatesInText(extractedText);
    if (!dates.length) return result;

    const mostRecent = new Date(Math.max(...dates.map((d) => d.getTime())));
    const ageDays = (Date.now() - mostRecent.getTime()) / (1000 * 60 * 60 * 24);
    const maxAllowedDays = expirationMonths * 30;
    if (ageDays <= maxAllowedDays) return result;

    const score = Math.min(result.score, 65);
    return {
      ...result,
      score,
      status: statusForScore(score),
      findings: [
        ...result.findings,
        `Bandera amarilla: documento vencido — fecha detectada ${mostRecent.toLocaleDateString('es-MX')}, antigüedad ${Math.round(ageDays)} días (vigencia máxima ${expirationMonths} meses).`
      ],
      extracted_data: [...result.extracted_data, { key: 'documento_vencido', value: true }]
    };
  } catch (err) {
    console.warn('[readinessRubricAgent] Error verificando vigencia documental:', err.message);
    return result;
  }
}

// Bandera roja critica "Beneficiario controlador no identificado" (seccion
// 12.1 del plan): screenBeneficiaryOwners() ya existia y funciona (OFAC+PEP
// real sobre cada UBO declarado en service_orders.metadata.beneficiaryOwners)
// pero nunca se conectaba a la evaluacion del checklist -- ademas, una lista
// vacia nunca generaba ningun hallazgo, aunque "nadie declarado" es
// exactamente el caso que el plan pide señalar.
function enrichWithBeneficiaryOwners(result, order) {
  const owners = normalizeBeneficiaryOwnerList(order?.metadata?.beneficiaryOwners);

  if (!owners.length) {
    const score = Math.min(result.score, 40);
    return {
      ...result,
      score,
      status: statusForScore(score),
      findings: [...result.findings, 'Bandera roja: no se identificó ningún beneficiario controlador (UBO) para este expediente.'],
      extracted_data: [...result.extracted_data, { key: 'beneficiario_controlador_identificado', value: false }]
    };
  }

  const screening = screenBeneficiaryOwners(owners);
  const hits = screening.filter((o) => o.status === 'review_required');
  if (!hits.length) {
    return {
      ...result,
      extracted_data: [
        ...result.extracted_data,
        { key: 'beneficiario_controlador_identificado', value: true },
        { key: 'beneficiarios_revisados', value: owners.length }
      ]
    };
  }

  const score = Math.min(result.score, 20);
  return {
    ...result,
    score,
    status: statusForScore(score),
    findings: [
      ...result.findings,
      `Bandera roja crítica: ${hits.length} beneficiario(s) controlador(es) con coincidencia OFAC/PEP sin aclarar (${hits.map((h) => h.fullName).join(', ')}).`
    ],
    extracted_data: [
      ...result.extracted_data,
      { key: 'beneficiario_controlador_identificado', value: true },
      { key: 'beneficiarios_con_hallazgo', value: hits.length }
    ]
  };
}

async function enrichResult(itemId, documentTypeCode, result, { extractedText, order }) {
  let enriched = enrichWithTypeMatchCheck(itemId, result, extractedText);
  enriched = await enrichWithExpirationCheck(documentTypeCode, enriched, extractedText);
  if (FINANCIAL_ITEM_IDS.has(itemId)) {
    enriched = await enrichFinancialConsistency(enriched, extractedText);
  }
  if (itemId === 'marco_riesgos') {
    enriched = await enrichRiskWithCrossReferences(enriched, order);
  }
  if (itemId === 'esia') {
    enriched = enrichEsiaWithSemarnatRule(enriched, order);
  }
  if (itemId === 'doc_corporativa') {
    enriched = enrichWithBeneficiaryOwners(enriched, order);
  }
  return finalizeHumanReviewRequired(enriched);
}

export async function evaluateReadinessDocument({ documentTypeCode, extractedText, order }) {
  const itemId = itemIdFromCode(documentTypeCode);
  const country = order?.metadata?.country || 'MX';
  const rubric = getRubric(itemId, country);

  if (itemId === 'doc_kyc') {
    return evaluateKyc(order);
  }

  if (!hasAnyJsonProvider()) {
    const fallback = heuristicFallback(rubric, extractedText);
    return enrichResult(itemId, documentTypeCode, fallback, { extractedText, order });
  }

  let extraContext = '';
  if (itemId === 'estudio_mercado') {
    try {
      const [densidad, macro] = await Promise.all([
        getBusinessDensity(order?.metadata?.sector || '', order?.metadata?.stateCode || '00'),
        getKeyIndicators()
      ]);
      extraContext = `Densidad de negocios (INEGI DENUE): ${densidad.establishmentCount ?? 'no disponible'} establecimientos encontrados para "${densidad.term}" (fuente: ${densidad.source}).
Indicadores macro (Banxico SIE): tipo de cambio FIX ${macro.exchangeRateFix?.valor ?? 'no disponible'}, tasa de referencia ${macro.referenceRate?.valor ?? 'no disponible'}, INPC ${macro.inpc?.valor ?? 'no disponible'} (fuente: ${macro.source}).`;
    } catch (err) {
      console.warn('[readinessRubricAgent] Error obteniendo contexto INEGI/Banxico:', err.message);
    }
  }

  try {
    const result = await evaluateWithClaude(rubric, extractedText, extraContext, order);
    return enrichResult(itemId, documentTypeCode, result, { extractedText, order });
  } catch (err) {
    console.error('[readinessRubricAgent] Error evaluando con Claude:', err);
    const fallback = heuristicFallback(rubric, extractedText);
    return enrichResult(itemId, documentTypeCode, fallback, { extractedText, order });
  }
}
