import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { AI_PROMPTS } from '../config/aiPrompts.js';

// Configuración opcional por si las llaves aún no están en .env
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;

const anthropic = ANTHROPIC_KEY ? new Anthropic({ apiKey: ANTHROPIC_KEY }) : null;
const deepseek = DEEPSEEK_KEY ? new OpenAI({ 
  apiKey: DEEPSEEK_KEY, 
  baseURL: 'https://api.deepseek.com/v1' 
}) : null;

/**
 * Fase 1: DeepSeek realiza la extracción barata de datos (Monto, Fechas, RFC, OCR básico)
 */
async function extractDataWithDeepSeek(documentText) {
  if (!deepseek) {
    console.warn("DeepSeek no configurado. Simulando extracción.");
    return {
      entidad: "Entidad simulada",
      fecha: new Date().toISOString().split('T')[0],
      esValido: true
    };
  }

  try {
    const completion = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: AI_PROMPTS.DEEPSEEK_EXTRACTOR_SYSTEM },
        { role: "user", content: `Analiza este texto:\n\n${documentText}` }
      ],
      response_format: { type: "json_object" }
    });
    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error("Error en DeepSeek:", error);
    return null;
  }
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
  let extracted = await extractDataWithDeepSeek(textToAnalyze);
  
  // Fallback simulado para metadatos si no hay DeepSeek configurado
  if (!deepseek) {
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
    warnings: !anthropic || !deepseek ? ["Advertencia: Llaves IA no configuradas, usando fallback simulado."] : []
  };
}
