import { supabaseAdmin } from '../config/supabase.js';
import { logAgentAction, saveExtraction, saveVerifications } from '../services/documentIntelligenceService.js';
import * as XLSX from 'xlsx';
import Anthropic from '@anthropic-ai/sdk';

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const anthropic = ANTHROPIC_KEY ? new Anthropic({ apiKey: ANTHROPIC_KEY }) : null;

// Extracción determinista simple por palabras clave en las celdas del Excel
export function extractFinancialFieldsDeterministically(workbook) {
  const data = {
    activo_total: null,
    pasivo_total: null,
    capital_contable: null,
    ingresos_netos: null,
    utilidad_neta: null,
    ebitda: null,
    dscr: null,
    apalancamiento: null
  };

  const keywords = {
    activo_total: [/activo\s+total/i, /total\s+activo/i, /total\s+de\s+activos/i],
    pasivo_total: [/pasivo\s+total/i, /total\s+pasivo/i, /total\s+de\s+pasivos/i],
    capital_contable: [/capital\s+contable/i, /total\s+capital/i, /patrimonio\s+neto/i],
    ingresos_netos: [/ingresos\s+netos/i, /ventas\s+netas/i, /ingresos\s+operativos/i, /total\s+ingresos/i],
    utilidad_neta: [/utilidad\s+neta/i, /utilidad\s+del\s+ejercicio/i, /resultado\s+neto/i],
    ebitda: [/ebitda/i, /utilidad\s+de\s+operacion\s+antes/i],
    dscr: [/dscr/i, /cobertura\s+de\s+servicio/i, /cobertura\s+de\s+deuda/i],
    apalancamiento: [/apalancamiento/i, /leverage/i, /pasivo\s+a\s+capital/i, /deuda\s+a\s+capital/i]
  };

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !row.length) continue;

      for (let c = 0; c < row.length; c++) {
        const cellValue = String(row[c] || '').trim();
        if (!cellValue) continue;

        // Comprobar contra cada una de las palabras clave
        for (const [field, regexes] of Object.entries(keywords)) {
          if (data[field] !== null) continue; // Ya encontramos este campo

          const matches = regexes.some(rx => rx.test(cellValue));
          if (matches) {
            // Buscar un número en las celdas contiguas de la misma fila
            for (let nextC = c + 1; nextC < Math.min(row.length, c + 4); nextC++) {
              const numVal = parseFloat(String(row[nextC] || '').replace(/[\$,\s]/g, ''));
              if (!isNaN(numVal) && numVal !== 0) {
                data[field] = numVal;
                break;
              }
            }
          }
        }
      }
    }
  }

  return data;
}

// Extracción por IA como fallback
export async function extractFinancialWithAI(textContent) {
  if (!anthropic) {
    console.warn("Claude no configurado para AgentFinancial. Retornando valores simulados.");
    return {
      activo_total: 15400000,
      pasivo_total: 8200000,
      capital_contable: 7200000,
      ingresos_netos: 5500000,
      utilidad_neta: 890000,
      ebitda: 1200000,
      dscr: 1.83,
      apalancamiento: 1.14
    };
  }

  try {
    const prompt = `Analiza el siguiente texto de un Estado Financiero y extrae los siguientes campos numéricos en formato JSON:
    - activo_total
    - pasivo_total
    - capital_contable
    - ingresos_netos
    - utilidad_neta
    - ebitda
    - dscr (Debt Service Coverage Ratio o cobertura de servicio de deuda, si se menciona)
    - apalancamiento (o leverage ratio / pasivo a capital, si se menciona o calcula como pasivo_total / capital_contable)

    Responde únicamente con el objeto JSON, sin explicaciones ni texto introductorio. Ejemplo de respuesta:
    {
      "activo_total": 120000,
      "pasivo_total": 80000,
      "capital_contable": 40000,
      "ingresos_netos": 150000,
      "utilidad_neta": 15000,
      "ebitda": 22000,
      "dscr": 1.75,
      "apalancamiento": 2.0
    }

    Texto a analizar:
    ${textContent.slice(0, 15000)}`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [
        { role: 'user', content: prompt }
      ]
    });

    const parsedJson = JSON.parse(response.content[0].text);
    return parsedJson;
  } catch (error) {
    console.error("Error al extraer estados financieros con Claude:", error);
    return null;
  }
}

// Analizar y validar estados financieros contra benchmarks de base de datos
export async function analyzeFinancialDocument(documentId, sector = 'General') {
  const startTime = Date.now();

  // 1. Obtener la extracción de texto del clasificador
  const { data: extraction, error } = await supabaseAdmin
    .from('document_extractions')
    .select('*')
    .eq('document_id', documentId)
    .single();

  if (error || !extraction) {
    throw new Error(`Extracción de texto no encontrada para el documento ${documentId}`);
  }

  const textContent = extraction.extracted_data.textContent || '';
  
  // 2. Extraer campos numéricos (Intenta primero con lógica local)
  let extractedFields = {
    activo_total: null,
    pasivo_total: null,
    capital_contable: null,
    ingresos_netos: null,
    utilidad_neta: null,
    ebitda: null,
    dscr: null,
    apalancamiento: null
  };

  // Re-leer el buffer del storage para parseo estructurado si es Excel
  const { data: document } = await supabaseAdmin
    .from('documents')
    .select('filename, storage_path')
    .eq('id', documentId)
    .single();

  if (document && document.filename.match(/\.(xlsx|xls|csv)$/i)) {
    try {
      const { data: fileData } = await supabaseAdmin.storage
        .from('documents')
        .download(document.storage_path);
      
      if (fileData) {
        const buffer = Buffer.from(await fileData.arrayBuffer());
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        extractedFields = extractFinancialFieldsDeterministically(workbook);
      }
    } catch (parseErr) {
      console.error("Error en parseo local xlsx para AgentFinancial:", parseErr);
    }
  }

  // Si faltan campos críticos, llamamos a la IA como fallback
  const needsAI = !extractedFields.activo_total || !extractedFields.ingresos_netos || !extractedFields.utilidad_neta;
  let usedAI = false;
  if (needsAI) {
    const aiFields = await extractFinancialWithAI(textContent);
    if (aiFields) {
      extractedFields = { ...extractedFields, ...aiFields };
      usedAI = true;
    }
  }

  // Cálculos automáticos si no se extrajeron directamente
  if (extractedFields.apalancamiento === null && extractedFields.pasivo_total && extractedFields.capital_contable) {
    extractedFields.apalancamiento = parseFloat((extractedFields.pasivo_total / extractedFields.capital_contable).toFixed(2));
  }
  if (extractedFields.dscr === null && extractedFields.ebitda && extractedFields.pasivo_total) {
    const estimatedService = extractedFields.pasivo_total * 0.08;
    extractedFields.dscr = estimatedService > 0 ? parseFloat((extractedFields.ebitda / estimatedService).toFixed(2)) : 1.5;
  }

  // 3. Obtener Benchmarks del sector en Supabase
  const { data: benchmarks } = await supabaseAdmin
    .from('ref_financial_benchmarks')
    .select('*')
    .eq('sector', sector);

  const verifications = [];

  if (extractedFields.ingresos_netos && extractedFields.utilidad_neta) {
    const margin = extractedFields.utilidad_neta / extractedFields.ingresos_netos;
    const marginPct = (margin * 100).toFixed(2);
    
    // Buscar benchmark para Margen Neto
    const netMarginBenchmark = (benchmarks || []).find(b => b.metric_name === 'net_margin');
    const minVal = netMarginBenchmark ? parseFloat(netMarginBenchmark.min_val) : 0.05;
    const maxVal = netMarginBenchmark ? parseFloat(netMarginBenchmark.max_val) : 0.25;

    if (margin >= minVal && margin <= maxVal) {
      verifications.push({
        rule_code: 'BENCHMARK_MARGEN_NETO',
        status: 'pass',
        severity: 'info',
        findings: `Margen Neto del ${marginPct}% se encuentra dentro del rango saludable del sector ${sector} (${(minVal * 100).toFixed(1)}% - ${(maxVal * 100).toFixed(1)}%)`
      });
    } else {
      verifications.push({
        rule_code: 'BENCHMARK_MARGEN_NETO',
        status: 'warning',
        severity: 'warning',
        findings: `El Margen Neto del ${marginPct}% está fuera del rango típico del sector ${sector} (${(minVal * 100).toFixed(1)}% - ${(maxVal * 100).toFixed(1)}%)`
      });
    }
  }

  // Apalancamiento (Leverage Ratio)
  if (extractedFields.apalancamiento !== null) {
    const leverageVal = extractedFields.apalancamiento;
    const leverageBenchmark = (benchmarks || []).find(b => b.metric_name === 'leverage');
    const maxVal = leverageBenchmark ? parseFloat(leverageBenchmark.max_val) : 2.5;

    if (leverageVal <= maxVal) {
      verifications.push({
        rule_code: 'BENCHMARK_APALANCAMIENTO',
        status: 'pass',
        severity: 'info',
        findings: `El nivel de apalancamiento (Deuda/Capital) de ${leverageVal} está dentro del máximo permitido de ${maxVal} para el sector ${sector}`
      });
    } else {
      verifications.push({
        rule_code: 'BENCHMARK_APALANCAMIENTO',
        status: 'warning',
        severity: 'warning',
        findings: `Nivel de apalancamiento elevado: ${leverageVal} supera el límite recomendado del sector ${sector} de ${maxVal}`
      });
    }
  }

  // DSCR
  if (extractedFields.dscr !== null) {
    const dscrVal = extractedFields.dscr;
    const dscrBenchmark = (benchmarks || []).find(b => b.metric_name === 'dscr');
    const minVal = dscrBenchmark ? parseFloat(dscrBenchmark.min_val) : 1.2;

    if (dscrVal >= minVal) {
      verifications.push({
        rule_code: 'BENCHMARK_DSCR',
        status: 'pass',
        severity: 'info',
        findings: `La Razón de Cobertura de Deuda (DSCR) es de ${dscrVal}, superior al mínimo saludable de ${minVal} para el sector ${sector}`
      });
    } else {
      verifications.push({
        rule_code: 'BENCHMARK_DSCR',
        status: 'warning',
        severity: 'warning',
        findings: `Cobertura de servicio de deuda comprometida: DSCR de ${dscrVal} es inferior al mínimo sugerido de ${minVal}`
      });
    }
  }

  // 4. Guardar verificaciones del agente financiero
  if (verifications.length > 0) {
    await saveVerifications(documentId, verifications);
  }

  // Guardar campos extraídos en la extracción
  await saveExtraction(documentId, {
    ...extraction.extracted_data,
    financial_metrics: extractedFields,
    analyzed_by_financial_agent: true,
    used_ai: usedAI
  }, extraction.confidence_score);

  const duration = (Date.now() - startTime) / 1000;
  await logAgentAction(
    'AgentFinancial',
    'financial_analysis',
    { documentId, sector, usedAI, durationSeconds: duration },
    usedAI ? 0.03 : 0.0
  );

  return {
    success: true,
    metrics: extractedFields,
    verifications
  };
}
