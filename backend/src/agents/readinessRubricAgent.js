// Evaluador parametrizado para los 12 items del checklist de 12 Requisitos
// Mínimos — un módulo, 12 rúbricas reales (backend/src/config/readinessRubrics.js)
// en vez de 12 archivos casi idénticos. Para doc_kyc reusa el agente de
// screening ya existente (nsdApplicantAgent.js: SAT + Buró + OFAC/sanciones + PEP
// real). Para estudio_mercado enriquece el prompt con datos reales de INEGI/Banxico.
import Anthropic from '@anthropic-ai/sdk';
import { getRubric } from '../config/readinessRubrics.js';
import { runApplicantScreen } from './nsdApplicantAgent.js';
import { getBusinessDensity } from '../services/inegiService.js';
import { getKeyIndicators } from '../services/banxicoService.js';

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const anthropic = ANTHROPIC_KEY ? new Anthropic({ apiKey: ANTHROPIC_KEY }) : null;
const MODEL = 'claude-sonnet-4-6';

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

function heuristicFallback(rubric, extractedText) {
  const hasText = Boolean(String(extractedText || '').trim());
  const score = hasText ? 55 : 20;
  return {
    status: score >= 60 ? 'yellow' : 'red',
    score,
    summary: `Revisión heurística de "${rubric?.label || 'documento'}" — Claude no está configurado, no se evaluó contenido real.`,
    findings: hasText
      ? ['Documento cargado; requiere revisión con IA real (falta ANTHROPIC_API_KEY) o revisión manual.']
      : ['No se pudo extraer texto del documento; requiere revisión manual.'],
    missing_items: (rubric?.criterios || []).map((c) => c.nombre),
    extracted_data: [],
    warnings: ['Advertencia: ANTHROPIC_API_KEY no configurada, usando revisión heurística por reglas.']
  };
}

function buildRubricPromptSection(rubric) {
  const estructura = rubric.estructuraEsperada || rubric.documentosEsperados || rubric.validacionesMinimas
    || rubric.evaluacionesMinimas || rubric.revisionesMinimas || rubric.revisionMinima || rubric.reglas || [];
  const criterios = (rubric.criterios || []).map((c) => `- ${c.nombre} (peso ${c.peso})`).join('\n');
  const banderas = (rubric.banderasRojas || []).map((b) => `- ${b}`).join('\n');

  return `Documento a evaluar: ${rubric.label}

Estructura/contenido mínimo esperado:
${estructura.map((s) => `- ${s}`).join('\n')}

Criterios de evaluación (peso sobre 100):
${criterios}

Banderas rojas conocidas para este tipo de documento:
${banderas || '(ninguna específica, usar criterio profesional general)'}`;
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

  return {
    status: parsed.status,
    score: parsed.score,
    summary: parsed.summary,
    findings: parsed.findings || [],
    missing_items: parsed.missing_items || [],
    extracted_data: [
      ...extractedFields,
      ...(parsed.red_flags || []).map((flag) => ({ key: 'Bandera roja', value: flag }))
    ],
    warnings: []
  };
}

// Caso especial doc_kyc: reusa el agente ya existente (SAT + Buró + OFAC/sanciones + PEP real).
async function evaluateKyc(order) {
  const rfc = order?.metadata?.rfc;
  const name = order?.metadata?.companyName;

  if (!rfc) {
    return {
      status: 'red',
      score: 0,
      summary: 'No hay RFC registrado en el expediente para ejecutar el screening KYC/KYB.',
      findings: ['Falta capturar el RFC del expediente antes de poder screenear KYC/KYB.'],
      missing_items: ['RFC del expediente'],
      extracted_data: [],
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
      extracted_data: [],
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
      ...(result.name ? [{ key: 'razon_social', value: result.name }] : [])
    ],
    warnings: result.mock_warning ? [result.mock_warning] : []
  };
}

export async function evaluateReadinessDocument({ documentTypeCode, extractedText, order }) {
  const itemId = itemIdFromCode(documentTypeCode);
  const rubric = getRubric(itemId);

  if (itemId === 'doc_kyc') {
    return evaluateKyc(order);
  }

  if (!anthropic) {
    return heuristicFallback(rubric, extractedText);
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
    return await evaluateWithClaude(rubric, extractedText, extraContext);
  } catch (err) {
    console.error('[readinessRubricAgent] Error evaluando con Claude:', err);
    return heuristicFallback(rubric, extractedText);
  }
}
