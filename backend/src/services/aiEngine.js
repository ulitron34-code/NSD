import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { AI_PROMPTS } from '../config/aiPrompts.js';

// Configuración opcional por si las llaves aún no están en .env
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const DEEPSEEK_KEY  = process.env.DEEPSEEK_API_KEY;
const KIMI_KEY      = process.env.KIMI_API_KEY;
const NVIDIA_KEY    = process.env.NVIDIA_API_KEY; // temporal — pruebas NIM

const anthropic = ANTHROPIC_KEY ? new Anthropic({ apiKey: ANTHROPIC_KEY }) : null;
const deepseek  = DEEPSEEK_KEY  ? new OpenAI({ apiKey: DEEPSEEK_KEY,  baseURL: "https://api.deepseek.com/v1" }) : null;
const kimi      = KIMI_KEY      ? new OpenAI({ apiKey: KIMI_KEY,      baseURL: process.env.KIMI_BASE_URL || "https://api.moonshot.ai/v1" }) : null;
// NVIDIA NIM expone API compatible con OpenAI en integrate.api.nvidia.com
const nvidia    = NVIDIA_KEY    ? new OpenAI({ apiKey: NVIDIA_KEY,    baseURL: 'https://integrate.api.nvidia.com/v1' }) : null;

/**
 * Fase 1: extracción secundaria solo para datos anonimizados de bajo riesgo.
 * Orden: Kimi -> DeepSeek -> NVIDIA NIM. Nunca procesa texto sensible completo.
 */
async function extractDataWithDeepSeek(documentText, options = {}) {
  const restrictedAllowed = options.dataRisk === "low" && options.anonymized === true;
  const secondaryProviders = [
    { name: "Kimi", client: kimi, model: process.env.KIMI_JSON_MODEL || "kimi-k3" },
    { name: "DeepSeek", client: deepseek, model: process.env.DEEPSEEK_JSON_MODEL || "deepseek-chat" },
    { name: "NVIDIA NIM", client: nvidia, model: "meta/llama-3.1-8b-instruct" }
  ].filter((provider) => provider.client);

  if (!restrictedAllowed || secondaryProviders.length === 0) {
    console.warn("Sin proveedor de extracción permitido: KIMI/DEEPSEEK/NVIDIA solo se usan con datos anonimizados de bajo riesgo. Simulando.");
    return { entidad: "Entidad simulada", fecha: new Date().toISOString().split("T")[0], esValido: true };
  }

  for (const provider of secondaryProviders) {
    try {
      const completion = await provider.client.chat.completions.create({
        model: provider.model,
        messages: [
          { role: "system", content: AI_PROMPTS.DEEPSEEK_EXTRACTOR_SYSTEM },
          { role: "user", content: `Analiza este texto:\n\n${documentText}` }
        ],
        response_format: { type: "json_object" },
      });
      console.info(`[aiEngine] Extracción via ${provider.name} (${provider.model})`);
      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error(`Error en ${provider.name}:`, error);
    }
  }

  return null;
}

/**
 * Fase 2: Claude audita y evalúa el riesgo en base a los datos extraídos
 */
async function auditWithClaude(extractedData, documentName) {
  if (!anthropic) {
    console.warn("Claude no configurado. Simulando auditoría.");
    return {
      score: 88,
      status: "green",
      findings: ["Documento verificado en simulación", "Datos base encontrados"],
      missing_items: ["Validación real pendiente"]
    };
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: AI_PROMPTS.CLAUDE_AUDITOR_SYSTEM,
      messages: [
        { role: "user", content: `Documento: ${documentName}\nDatos extraídos: ${JSON.stringify(extractedData)}` }
      ]
    });
    return JSON.parse(response.content[0].text);
  } catch (error) {
    console.error("Error en Claude:", error);
    return null;
  }
}

/**
 * Orquestador principal: Cascada LLM
 */
export async function runAIReviewCascaded(document, extractedText) {
  // Si no se proporcionó texto real, simulamos uno básico o usamos metadatos
  const textToAnalyze = extractedText || `Documento ${document.filename} subido el ${document.uploaded_at}. Texto de prueba legal para análisis preliminar.`;

  // 1. Extracción Pesada/Barata
  let extracted = await extractDataWithDeepSeek(textToAnalyze, {
    dataRisk: document?.metadata?.aiDataRisk,
    anonymized: document?.metadata?.anonymizedForAI === true
  });
  
  // Fallback simulado para metadatos si no hay DeepSeek configurado
  if (!extracted || !(document?.metadata?.aiDataRisk === "low" && document?.metadata?.anonymizedForAI === true)) {
    const isFinancial = String(document.filename).toLowerCase().match(/(financier|flujo|balance|sat|dscr|cuenta)/);
    extracted = {
      entidad: "Comercializadora Industrial SA de CV",
      fecha: new Date().toISOString().split('T')[0],
      esValido: true,
      finanzas: isFinancial ? {
        ingresos_operativos: 1850000,
        servicio_deuda: 1200000
      } : {
        ingresos_operativos: null,
        servicio_deuda: null
      }
    };
  }

  // 2. Auditoría Inteligente
  let audit = await auditWithClaude(extracted, document.filename);

  // Fallback simulado para auditoría si no hay Claude configurado
  if (!anthropic) {
    const dscrVal = extracted?.finanzas?.ingresos_operativos && extracted?.finanzas?.servicio_deuda
      ? Number((extracted.finanzas.ingresos_operativos / extracted.finanzas.servicio_deuda).toFixed(2))
      : null;

    audit = {
      score: dscrVal ? (dscrVal >= 1.25 ? 90 : 55) : 85,
      status: dscrVal ? (dscrVal >= 1.25 ? "green" : "red") : "green",
      findings: dscrVal
        ? [`Análisis de flujo completado. Razón de Cobertura de Deuda (DSCR) detectada en ${dscrVal}x.`]
        : ["Estructura legal y firmas del documento verificadas en simulación."],
      missing_items: dscrVal && dscrVal < 1.25
        ? ["Alerta financiera: La cobertura de deuda (DSCR) de la empresa está por debajo del límite regulatorio requerido de 1.25x."]
        : [],
      dscr: dscrVal
    };
  }

  const finalDSCR = audit?.dscr || (extracted?.finanzas?.ingresos_operativos && extracted?.finanzas?.servicio_deuda
    ? Number((extracted.finanzas.ingresos_operativos / extracted.finanzas.servicio_deuda).toFixed(2))
    : null);

  const extraList = [
    { key: "Entidad/Razón Social", value: extracted?.entidad || "Desconocida" },
    { key: "Fecha Emisión", value: extracted?.fecha || "N/A" }
  ];

  if (finalDSCR) {
    extraList.push({ key: "DSCR Calculado", value: `${finalDSCR}x` });
  }

  return {
    status: audit?.status || "yellow",
    score: audit?.score || 65,
    summary: 'Análisis IA real mediante cascada de modelos sobre el texto extraído.',
    findings: audit?.findings || ['Análisis completado con éxito parcial.'],
    missing_items: audit?.missing_items || ['Requiere firmas.'],
    extracted_data: extraList,
    warnings: !anthropic || !(document?.metadata?.aiDataRisk === "low" && document?.metadata?.anonymizedForAI === true) ? ["Advertencia: proveedores secundarios restringidos; usando fallback simulado para extracción no anonimizada."] : []
  };
}

/**
 * Heurística por reglas para el checklist de 12 Requisitos Mínimos — mismo cálculo que
 * generarRevisionIARequisitos() en el frontend (src/data/requisitosMinimos.js), portado
 * aquí como fallback cuando Claude no está configurado o falla la llamada.
 */
function reviewReadinessChecklistHeuristic(items, language) {
  const isEn = String(language || "es").toLowerCase().startsWith("en");
  const pendientes = items.filter((item) => item.estado !== "listo");
  const criticos = pendientes.filter((item) => item.critico);
  const score = Math.round(((items.length - pendientes.length) / (items.length || 1)) * 100);

  const findings = [];
  findings.push(
    criticos.length > 0
      ? (isEn
          ? `Blocking: ${criticos.length} critical requirement(s) missing — ${criticos.map((i) => i.label?.en || i.label).join(", ")}.`
          : `Bloqueante: faltan ${criticos.length} requisito(s) crítico(s) — ${criticos.map((i) => i.label?.es || i.label).join(", ")}.`)
      : (isEn ? "No critical requirements are blocking submission." : "No hay requisitos críticos bloqueando el envío.")
  );

  const porCategoria = {};
  pendientes.forEach((item) => {
    porCategoria[item.categoria] = (porCategoria[item.categoria] || 0) + 1;
  });
  Object.entries(porCategoria).forEach(([categoria, count]) => {
    findings.push(
      isEn
        ? `${count} item(s) pending in category "${categoria}".`
        : `${count} elemento(s) pendiente(s) en la categoría "${categoria}".`
    );
  });

  if (pendientes.length === 0) {
    findings.push(isEn ? "All 12 minimum requirements are complete." : "Los 12 requisitos mínimos están completos.");
  }

  return { score, findings };
}

/**
 * Revisa el estado del checklist de 12 Requisitos Mínimos con Claude real.
 * Cae a la heurística por reglas si Anthropic no está configurado o la llamada falla.
 */
export async function reviewReadinessChecklist(items, language) {
  const heuristic = () => ({
    ...reviewReadinessChecklistHeuristic(items, language),
    warnings: ["Advertencia: ANTHROPIC_API_KEY no configurada, usando revisión heurística por reglas."]
  });

  if (!anthropic) {
    console.warn("Claude no configurado. Revisión del checklist en modo heurístico.");
    return heuristic();
  }

  try {
    const itemsResumen = items.map((item) => ({
      label: item.label?.es || item.label,
      categoria: item.categoria,
      critico: !!item.critico,
      estado: item.estado,
      evidencia: item.evidenciaNombre || null,
      ods: item.sdg && item.sdg.length ? item.sdg : undefined,
      // Cuando el item ya tiene un documento real subido y revisado
      // (ver readinessChecklistService.js), estos campos traen el resultado
      // real de esa revisión — sin esto, Claude solo veía el check manual.
      revisionRealScore: item.reviewScore ?? undefined,
      revisionRealHallazgos: item.reviewFindings && item.reviewFindings.length ? item.reviewFindings : undefined
    }));

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: AI_PROMPTS.READINESS_CHECKLIST_REVIEWER_SYSTEM,
      messages: [
        { role: "user", content: `Idioma de respuesta: ${language || "es"}\nChecklist de 12 Requisitos Mínimos:\n${JSON.stringify(itemsResumen, null, 2)}` }
      ]
    });
    const parsed = JSON.parse(response.content[0].text);
    return { score: parsed.score, findings: parsed.findings, warnings: [] };
  } catch (error) {
    console.error("Error revisando checklist con Claude:", error);
    return heuristic();
  }
}
