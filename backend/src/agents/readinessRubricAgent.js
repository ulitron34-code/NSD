// Evaluador parametrizado para los 12 items del checklist de 12 Requisitos
// Mínimos — un módulo, 12 rúbricas reales (backend/src/config/readinessRubrics.js)
// en vez de 12 archivos casi idénticos. Para doc_kyc reusa el agente de
// screening ya existente (nsdApplicantAgent.js: SAT + Buró + OFAC/sanciones + PEP
// real). Para estudio_mercado enriquece el prompt con datos reales de INEGI/Banxico.
import Anthropic from '@anthropic-ai/sdk';
import { getRubric, isAutomatedKycCountry, READINESS_RUBRICS } from '../config/readinessRubrics.js';
import { runApplicantScreen } from './nsdApplicantAgent.js';
import { getBusinessDensity } from '../services/inegiService.js';
import { getKeyIndicators } from '../services/banxicoService.js';
import { extractFinancialWithAI } from './agentFinancial.js';
import { getCrossReferences } from '../services/documentIntelligenceService.js';
import { validateRegulatoryProfile } from '../services/regulatoryValidation.js';
import { searchLegalEntity } from '../services/gleifService.js';

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const anthropic = ANTHROPIC_KEY ? new Anthropic({ apiKey: ANTHROPIC_KEY }) : null;
const MODEL = 'claude-sonnet-4-6';

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
function auditEntries({ agentName, modelName, rubricVersion = RUBRIC_VERSION, promptVersion = PROMPT_VERSION }) {
  return [
    { key: 'agent_name', value: agentName },
    { key: 'model_name', value: modelName },
    { key: 'prompt_version', value: promptVersion },
    { key: 'rubric_version', value: rubricVersion }
  ];
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
    summary: `Revisión heurística de "${rubric?.label || 'documento'}" — Claude no está configurado, no se evaluó contenido real.`,
    findings: hasText
      ? ['Documento cargado; requiere revisión con IA real (falta ANTHROPIC_API_KEY) o revisión manual.']
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
      ...auditEntries({ agentName: 'readinessRubricAgent', modelName: 'heuristic-fallback' })
    ],
    warnings: ['Advertencia: ANTHROPIC_API_KEY no configurada, usando revisión heurística por reglas.']
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

async function evaluateWithClaude(rubric, extractedText, extraContext) {
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
  "extracted_fields": {
    "monto_solicitado": "string o null si no aplica/no se menciona",
    "razon_social": "string o null si no aplica/no se menciona",
    "fecha_documento": "string o null si no aplica/no se menciona"
  }
}
Status: green si score >= 80, yellow si 60-79, red si < 60.
"extracted_fields" es para comparar este documento contra los otros del mismo expediente — usa null si el documento no menciona ese dato, no inventes un valor.`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1400,
    system: BASE_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }]
  });

  const parsed = JSON.parse(response.content[0].text);
  const extractedFields = Object.entries(parsed.extracted_fields || {})
    .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '')
    .map(([key, value]) => ({ key, value }));
  const { structureScore, missingStructuralSections } = computeStructureReview(rubric, extractedText);
  const { mentionedFrameworks } = checkFrameworkMentions(rubric, extractedText);
  const recommendation = parsed.recommendation || buildFallbackRecommendation(parsed.missing_items, parsed.red_flags);

  return {
    status: parsed.status,
    score: parsed.score,
    summary: parsed.summary,
    findings: parsed.findings || [],
    missing_items: [...(parsed.missing_items || []), ...missingStructuralSections.map((s) => `Estructura: ${s}`)],
    extracted_data: [
      ...extractedFields,
      ...(parsed.red_flags || []).map((flag) => ({ key: 'Bandera roja', value: flag })),
      ...(structureScore != null ? [{ key: 'structure_score', value: structureScore }] : []),
      ...(mentionedFrameworks.length ? [{ key: 'marcos_mencionados', value: mentionedFrameworks.join(', ') }] : []),
      { key: 'recomendacion', value: recommendation },
      ...auditEntries({ agentName: 'readinessRubricAgent', modelName: MODEL })
    ],
    warnings: []
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
async function evaluateKyc(order) {
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

  return {
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
      ...auditEntries({ agentName: 'nsdApplicantAgent', modelName: MODEL })
    ],
    warnings: result.mock_warning ? [result.mock_warning] : []
  };
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

async function enrichResult(itemId, result, { extractedText, order }) {
  let enriched = enrichWithTypeMatchCheck(itemId, result, extractedText);
  if (FINANCIAL_ITEM_IDS.has(itemId)) {
    enriched = await enrichFinancialConsistency(enriched, extractedText);
  }
  if (itemId === 'marco_riesgos') {
    enriched = await enrichRiskWithCrossReferences(enriched, order);
  }
  if (itemId === 'esia') {
    enriched = enrichEsiaWithSemarnatRule(enriched, order);
  }
  return enriched;
}

export async function evaluateReadinessDocument({ documentTypeCode, extractedText, order }) {
  const itemId = itemIdFromCode(documentTypeCode);
  const country = order?.metadata?.country || 'MX';
  const rubric = getRubric(itemId, country);

  if (itemId === 'doc_kyc') {
    return evaluateKyc(order);
  }

  if (!anthropic) {
    const fallback = heuristicFallback(rubric, extractedText);
    return enrichResult(itemId, fallback, { extractedText, order });
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
    const result = await evaluateWithClaude(rubric, extractedText, extraContext);
    return enrichResult(itemId, result, { extractedText, order });
  } catch (err) {
    console.error('[readinessRubricAgent] Error evaluando con Claude:', err);
    const fallback = heuristicFallback(rubric, extractedText);
    return enrichResult(itemId, fallback, { extractedText, order });
  }
}
