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
    apalancamiento: null,
    roe: null,
    roa: null
  };

  const keywords = {
    activo_total: [/activo\s+total/i, /total\s+activo/i, /total\s+de\s+activos/i],
    pasivo_total: [/pasivo\s+total/i, /total\s+pasivo/i, /total\s+de\s+pasivos/i],
    capital_contable: [/capital\s+contable/i, /total\s+capital/i, /patrimonio\s+neto/i],
    ingresos_netos: [/ingresos\s+netos/i, /ventas\s+netas/i, /ingresos\s+operativos/i, /total\s+ingresos/i],
    utilidad_neta: [/utilidad\s+neta/i, /utilidad\s+del\s+ejercicio/i, /resultado\s+neto/i],
    ebitda: [/ebitda/i, /utilidad\s+de\s+operacion\s+antes/i],
    dscr: [/dscr/i, /cobertura\s+de\s+servicio/i, /cobertura\s+de\s+deuda/i],
    apalancamiento: [/apalancamiento/i, /leverage/i, /pasivo\s+a\s+capital/i, /deuda\s+a\s+capital/i],
    roe: [/\broe\b/i, /retorno\s+sobre\s+capital/i, /rentabilidad\s+sobre\s+capital/i, /return\s+on\s+equity/i],
    roa: [/\broa\b/i, /retorno\s+sobre\s+activos/i, /rentabilidad\s+sobre\s+activos/i, /return\s+on\s+assets/i]
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

// Recolecta montos numericos (no las 8 metricas clave, sino TODOS los valores
// monetarios visibles en el workbook) para usarlos como muestra en el test de
// Ley de Benford. Se descartan valores pequenos (<100) porque suelen ser
// porcentajes, indices de fila u otros numeros que no son montos.
export function collectMonetaryAmounts(workbook) {
  const amounts = [];

  for (const sheetName of workbook.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

    for (const row of rows) {
      if (!row || !row.length) continue;

      for (const cell of row) {
        let numVal = null;
        if (typeof cell === 'number') {
          numVal = cell;
        } else if (typeof cell === 'string') {
          const parsed = parseFloat(cell.replace(/[\$,\s]/g, ''));
          if (!isNaN(parsed)) numVal = parsed;
        }
        if (numVal !== null && Math.abs(numVal) >= 100) {
          amounts.push(numVal);
        }
      }
    }
  }

  return amounts;
}

const BENFORD_EXPECTED_DISTRIBUTION = [0.301, 0.176, 0.125, 0.097, 0.079, 0.067, 0.058, 0.051, 0.046];
const BENFORD_MIN_SAMPLE_SIZE = 30;

function firstSignificantDigit(value) {
  const abs = Math.abs(value);
  if (abs === 0) return null;
  const normalized = abs / 10 ** Math.floor(Math.log10(abs));
  const digit = Math.floor(normalized);
  return digit >= 1 && digit <= 9 ? digit : null;
}

// Test del primer digito de la Ley de Benford (Nigrini, "Forensic Analytics", 2012).
// En conjuntos de datos financieros reales, el primer digito de cada monto sigue
// una distribucion logaritmica predecible; datos inventados tienden a una
// distribucion mas uniforme. Es una heuristica estadistica de apoyo, no una
// prueba definitiva de fraude, y requiere una muestra minima para ser confiable.
export function analyzeBenfordLaw(amounts = []) {
  const firstDigits = amounts.map(firstSignificantDigit).filter((d) => d !== null);

  if (firstDigits.length < BENFORD_MIN_SAMPLE_SIZE) {
    return {
      status: 'skipped',
      sampleSize: firstDigits.length,
      detail: `Muestra insuficiente (${firstDigits.length} montos, se requieren al menos ${BENFORD_MIN_SAMPLE_SIZE}) para aplicar la Ley de Benford`
    };
  }

  const counts = new Array(9).fill(0);
  for (const digit of firstDigits) counts[digit - 1] += 1;
  const observedDistribution = counts.map((count) => count / firstDigits.length);

  const meanAbsoluteDeviation = observedDistribution
    .reduce((sum, observed, i) => sum + Math.abs(observed - BENFORD_EXPECTED_DISTRIBUTION[i]), 0) / 9;

  // Umbrales de conformidad MAD segun Nigrini (2012) para el test de primer digito.
  let conformity = 'close';
  if (meanAbsoluteDeviation > 0.015) conformity = 'nonconformity';
  else if (meanAbsoluteDeviation > 0.012) conformity = 'marginal';
  else if (meanAbsoluteDeviation > 0.006) conformity = 'acceptable';

  const status = conformity === 'nonconformity' ? 'anomalous' : 'normal';

  return {
    status,
    sampleSize: firstDigits.length,
    meanAbsoluteDeviation: parseFloat(meanAbsoluteDeviation.toFixed(4)),
    conformity,
    observedDistribution: observedDistribution.map((v) => parseFloat((v * 100).toFixed(1))),
    detail: status === 'anomalous'
      ? `La distribucion de primeros digitos de los montos (muestra de ${firstDigits.length}) se desvia de la Ley de Benford (MAD ${meanAbsoluteDeviation.toFixed(4)}, no conforme). Puede indicar cifras inventadas o manipuladas; es una heuristica estadistica que requiere revision manual, no una prueba definitiva.`
      : `La distribucion de primeros digitos de los montos (muestra de ${firstDigits.length}) es consistente con la Ley de Benford (MAD ${meanAbsoluteDeviation.toFixed(4)}, conformidad ${conformity}).`
  };
}

// Extracción por IA como fallback
export async function extractFinancialWithAI(textContent) {
  if (!anthropic) {
    console.warn("ANTHROPIC_API_KEY no configurada: AgentFinancial omite la extracción por IA (sin datos simulados).");
    return null;
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
      model: 'claude-sonnet-4-6',
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
    apalancamiento: null,
    roe: null,
    roa: null
  };

  // Re-leer el buffer del storage para parseo estructurado si es Excel
  const { data: document } = await supabaseAdmin
    .from('documents')
    .select('filename, storage_path')
    .eq('id', documentId)
    .single();

  let workbook = null;
  if (document && document.filename.match(/\.(xlsx|xls|csv)$/i)) {
    try {
      const { data: fileData } = await supabaseAdmin.storage
        .from('documents')
        .download(document.storage_path);

      if (fileData) {
        const buffer = Buffer.from(await fileData.arrayBuffer());
        workbook = XLSX.read(buffer, { type: 'buffer' });
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
  if (extractedFields.roe === null && extractedFields.utilidad_neta && extractedFields.capital_contable) {
    extractedFields.roe = parseFloat((extractedFields.utilidad_neta / extractedFields.capital_contable).toFixed(4));
  }
  if (extractedFields.roa === null && extractedFields.utilidad_neta && extractedFields.activo_total) {
    extractedFields.roa = parseFloat((extractedFields.utilidad_neta / extractedFields.activo_total).toFixed(4));
  }

  // Analisis forense: distribucion de primeros digitos (Ley de Benford) sobre
  // todos los montos visibles en el Excel, no solo las 8 metricas clave.
  const benfordAnalysis = workbook
    ? analyzeBenfordLaw(collectMonetaryAmounts(workbook))
    : { status: 'skipped', detail: 'El analisis de Ley de Benford solo aplica a documentos Excel/CSV' };

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

  // ROE (Rentabilidad sobre Capital) — Capa 2.1 del analisis forense: un ROE
  // anomalamente ALTO es señal de alerta (no uno bajo, eso ya lo cubre el margen neto).
  if (extractedFields.roe !== null) {
    const roeVal = extractedFields.roe;
    const roeBenchmark = (benchmarks || []).find(b => b.metric_name === 'roe');
    const warningVal = roeBenchmark ? parseFloat(roeBenchmark.max_val) : 0.50;
    const roePct = (roeVal * 100).toFixed(1);

    if (roeVal > 1.0) {
      verifications.push({
        rule_code: 'FORENSE_ROE_ANOMALO',
        status: 'fail',
        severity: 'critical',
        findings: `ROE de ${roePct}% es crítico (>100%): rentabilidad sobre capital extremadamente atípica para una operación legítima, requiere análisis forense adicional`
      });
    } else if (roeVal > warningVal) {
      verifications.push({
        rule_code: 'FORENSE_ROE_ANOMALO',
        status: 'warning',
        severity: 'warning',
        findings: `ROE de ${roePct}% supera el umbral de sospecha de ${(warningVal * 100).toFixed(0)}% para el sector ${sector}`
      });
    } else {
      verifications.push({
        rule_code: 'FORENSE_ROE_ANOMALO',
        status: 'pass',
        severity: 'info',
        findings: `ROE de ${roePct}% dentro de rangos no sospechosos`
      });
    }
  }

  // ROA (Rentabilidad sobre Activos)
  if (extractedFields.roa !== null) {
    const roaVal = extractedFields.roa;
    const roaBenchmark = (benchmarks || []).find(b => b.metric_name === 'roa');
    const warningVal = roaBenchmark ? parseFloat(roaBenchmark.max_val) : 0.30;
    const roaPct = (roaVal * 100).toFixed(1);

    if (roaVal > 0.50) {
      verifications.push({
        rule_code: 'FORENSE_ROA_ANOMALO',
        status: 'fail',
        severity: 'critical',
        findings: `ROA de ${roaPct}% es crítico (>50%): rentabilidad sobre activos extremadamente atípica, requiere análisis forense adicional`
      });
    } else if (roaVal > warningVal) {
      verifications.push({
        rule_code: 'FORENSE_ROA_ANOMALO',
        status: 'warning',
        severity: 'warning',
        findings: `ROA de ${roaPct}% supera el umbral de sospecha de ${(warningVal * 100).toFixed(0)}% para el sector ${sector}`
      });
    } else {
      verifications.push({
        rule_code: 'FORENSE_ROA_ANOMALO',
        status: 'pass',
        severity: 'info',
        findings: `ROA de ${roaPct}% dentro de rangos no sospechosos`
      });
    }
  }

  // Ley de Benford sobre los montos del documento (heurística de fraude contable)
  if (benfordAnalysis.status !== 'skipped') {
    verifications.push({
      rule_code: 'FORENSE_BENFORD_LAW',
      status: benfordAnalysis.status === 'anomalous' ? 'warning' : 'pass',
      severity: benfordAnalysis.status === 'anomalous' ? 'warning' : 'info',
      findings: benfordAnalysis.detail
    });
  }

  // 4. Guardar verificaciones del agente financiero
  if (verifications.length > 0) {
    await saveVerifications(documentId, verifications, 'AgentFinancial');
  }

  // Guardar campos extraídos en la extracción
  await saveExtraction(documentId, {
    ...extraction.extracted_data,
    financial_metrics: extractedFields,
    benford_analysis: benfordAnalysis,
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
    benfordAnalysis,
    verifications
  };
}
