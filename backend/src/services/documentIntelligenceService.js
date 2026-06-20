import { supabaseAdmin } from '../config/supabase.js';

// Catálogo de tipos de documento mexicanos
const DOCUMENT_TYPES = [
  { code: 'INE_FRENTE', name: 'INE Frente', category: 'Identidad' },
  { code: 'INE_REVERSO', name: 'INE Reverso', category: 'Identidad' },
  { code: 'RFC_CSF', name: 'Constancia de Situación Fiscal (CSF)', category: 'Fiscal' },
  { code: 'OPINION_32D', name: 'Opinión de Cumplimiento 32-D', category: 'Fiscal' },
  { code: 'COMP_DOMICILIO', name: 'Comprobante de Domicilio', category: 'Identidad' },
  { code: 'ACTA_CONST', name: 'Acta Constitutiva', category: 'Legal' },
  { code: 'EDOS_FINANCIEROS', name: 'Estados Financieros', category: 'Financiero' },
  { code: 'DECLARACION_ANUAL', name: 'Declaración Anual', category: 'Fiscal' },
  { code: 'DECLARACION_MENSUAL', name: 'Declaración Mensual', category: 'Fiscal' },
  { code: 'AVALUO', name: 'Avalúo Comercial', category: 'Garantías' },
  { code: 'BURO_CREDITO', name: 'Reporte de Buró de Crédito', category: 'Riesgo' },
  { code: 'CONTRATO_ARRENDAMIENTO', name: 'Contrato de Arrendamiento', category: 'Legal' },
  { code: 'CEDULA_PROFESIONAL', name: 'Cédula Profesional', category: 'Identidad' },
  { code: 'CURP_DOC', name: 'CURP', category: 'Identidad' },
  { code: 'CFDI', name: 'Factura / CFDI', category: 'Fiscal' },
  { code: 'ESTADO_CUENTA', name: 'Estado de Cuenta Bancario', category: 'Financiero' },
  { code: 'PODER_NOTARIAL', name: 'Poder Notarial', category: 'Legal' },
  { code: 'COMPROBANTE_PAGO', name: 'Comprobante de Pago / SPEI', category: 'Financiero' },
  { code: 'ACTA_ASAMBLEA', name: 'Acta de Asamblea', category: 'Legal' },
  { code: 'DIOT', name: 'Declaración Informativa de Operaciones con Terceros (DIOT)', category: 'Fiscal' }
];

// Reglas de clasificación por keywords
const CLASSIFICATION_KEYWORDS = {
  INE_FRENTE: [/credencial para votar/i, /instituto nacional electoral/i, /clave de elector/i, /registro federal de electores/i],
  INE_REVERSO: [/elecciones federales/i, /firma del elector/i, /indice derecho/i],
  RFC_CSF: [/constancia de situacion fiscal/i, /registro federal de contribuyentes/i, /cedula de identificacion fiscal/i, /regimen simplificado de confianza/i, /actividad economica/i],
  OPINION_32D: [/opinion del cumplimiento/i, /opinion de cumplimiento/i, /sat/i, /32-d/i, /sentido de la opinion/i],
  COMP_DOMICILIO: [/comprobante de domicilio/i, /recibo de luz/i, /recibo de agua/i, /telmex/i, /cfe/i, /servicio de energia/i, /totalplay/i],
  ACTA_CONST: [/acta constitutiva/i, /notario publico/i, /notaria/i, /escritura numero/i, /sociedad mercantil/i, /denominacion o razon social/i],
  EDOS_FINANCIEROS: [/estado de situacion financiera/i, /balance general/i, /estado de resultados/i, /activo total/i, /pasivo/i, /capital contable/i, /utilidad neta/i, /ingresos/i],
  DECLARACION_ANUAL: [/declaracion anual/i, /ejercicio fiscal/i, /impuesto sobre la renta/i, /ingresos acumulables/i, /total de deducciones/i],
  DECLARACION_MENSUAL: [/pago provisional/i, /declaracion mensual/i, /declaracion de impuestos/i, /impuesto al valor agregado/i],
  AVALUO: [/avaluo/i, /perito valuador/i, /valor comercial/i, /descripcion del inmueble/i],
  BURO_CREDITO: [/buro de credito/i, /reporte de credito/i, /circulo de credito/i, /comportamiento de pago/i],
  CONTRATO_ARRENDAMIENTO: [/contrato de arrendamiento/i, /arrendador/i, /arrendatario/i, /renta mensual/i, /inmueble arrendado/i],
  CEDULA_PROFESIONAL: [/cedula profesional/i, /secretaria de educacion publica/i, /registro nacional de profesionistas/i],
  CURP_DOC: [/clave unica de registro de poblacion/i, /curp/i, /gobierno de mexico/i],
  CFDI: [/comprobante fiscal digital/i, /factura/i, /cfdi/i, /folio fiscal/i, /uuid/i, /emisor/i, /receptor/i],
  ESTADO_CUENTA: [/estado de cuenta/i, /cuenta bancaria/i, /clabe/i, /saldo/i, /transacciones/i, /deposito/i],
  PODER_NOTARIAL: [/poder notarial/i, /apoderado/i, /mandato/i, /poder general/i],
  COMPROBANTE_PAGO: [/comprobante de pago/i, /transferencia/i, /spei/i, /clave de rastreo/i],
  ACTA_ASAMBLEA: [/acta de asamblea/i, /asamblea general/i, /socios/i, /capital social/i],
  DIOT: [/declaracion informativa operaciones terceros/i, /diot/i, /iva retenido/i]
};

// 1. Clasificación por keywords
export function classifyDocument(filename, textContent = '') {
  const normalizedFilename = String(filename || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  
  const normalizedText = String(textContent || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  let matchedType = 'OTRO';
  let maxMatchedCount = 0;
  let matchedBy = 'none';

  // Primero buscar por coincidencia en el nombre de archivo (peso alto)
  for (const [code, patterns] of Object.entries(CLASSIFICATION_KEYWORDS)) {
    const codeLower = code.toLowerCase();
    const hasNameMatch = normalizedFilename.includes(codeLower) || 
      (codeLower === 'comp_domicilio' && (normalizedFilename.includes('domicilio') || normalizedFilename.includes('recibo') || normalizedFilename.includes('cfe') || normalizedFilename.includes('luz')));
    
    if (hasNameMatch) {
      matchedType = code;
      matchedBy = 'filename';
      maxMatchedCount = 1;
      break;
    }
  }

  // Si no se clasificó por nombre de archivo o se quiere corroborar con texto
  if (matchedBy === 'none' && normalizedText.length > 0) {
    for (const [code, patterns] of Object.entries(CLASSIFICATION_KEYWORDS)) {
      let count = 0;
      patterns.forEach(pattern => {
        if (pattern.test(normalizedText)) {
          count++;
        }
      });

      if (count > maxMatchedCount) {
        maxMatchedCount = count;
        matchedType = code;
        matchedBy = 'content';
      }
    }
  }

  // Si hubo al menos una coincidencia en texto
  const confidence = matchedBy === 'filename' ? 95 : (maxMatchedCount > 0 ? Math.min(50 + maxMatchedCount * 15, 99) : 10);

  return {
    document_type_code: matchedType,
    confidence,
    matched_by: matchedBy,
    matched_count: maxMatchedCount
  };
}

// 2. Operaciones con Extractions
export async function saveExtraction(documentId, extractedData, confidence) {
  const { data, error } = await supabaseAdmin
    .from('document_extractions')
    .upsert({
      document_id: documentId,
      extracted_data: extractedData,
      confidence_score: confidence,
      extracted_at: new Date().toISOString()
    }, { onConflict: 'document_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getExtraction(documentId) {
  const { data, error } = await supabaseAdmin
    .from('document_extractions')
    .select()
    .eq('document_id', documentId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// 3. Operaciones con Verifications
// La tabla document_verifications (NAGMAR_SCHEMA_V3_FINAL.sql) usa columnas
// distintas a las que maneja el resto del codigo internamente
// (rule_code/status/severity/findings): el nombre real es result, no status,
// y no existe una columna findings (se guarda en details/message_es). Estos
// helpers traducen entre el shape interno usado por los agentes y el shape
// real de la tabla, sin tener que tocar agentValidator/agentFinancial ni el
// frontend que ya esperan {status, findings}.
function toDbVerificationRow(documentId, v, agentName) {
  return {
    document_id: documentId,
    verification_type: v.rule_code || 'general',
    rule_code: v.rule_code,
    result: v.status, // 'pass', 'fail', 'warning'
    severity: v.severity || 'warning', // 'info', 'warning', 'error', 'critical'
    details: { findings: v.findings || '' },
    message_es: v.findings || '',
    is_red_flag: v.status === 'fail' || v.status === 'warning',
    red_flag_category: v.status === 'fail' || v.status === 'warning' ? v.rule_code : null,
    verified_by: agentName || 'Sistema',
    verified_at: new Date().toISOString()
  };
}

function fromDbVerificationRow(row) {
  return {
    ...row,
    status: row.result,
    findings: row.details?.findings || row.message_es || ''
  };
}

export async function saveVerifications(documentId, verifications = [], agentName = 'Sistema') {
  if (!verifications.length) return [];

  // Borrar previas para este doc
  await supabaseAdmin
    .from('document_verifications')
    .delete()
    .eq('document_id', documentId);

  const { data, error } = await supabaseAdmin
    .from('document_verifications')
    .insert(verifications.map((v) => toDbVerificationRow(documentId, v, agentName)))
    .select();

  if (error) throw error;
  return (data || []).map(fromDbVerificationRow);
}

export async function getVerifications(documentId) {
  const { data, error } = await supabaseAdmin
    .from('document_verifications')
    .select()
    .eq('document_id', documentId);

  if (error) throw error;
  return (data || []).map(fromDbVerificationRow);
}

export async function getDocumentRedFlags(documentId) {
  const { data, error } = await supabaseAdmin
    .from('document_verifications')
    .select()
    .eq('document_id', documentId)
    .in('result', ['fail', 'warning'])
    .order('severity', { ascending: false });

  if (error) throw error;
  return (data || []).map(fromDbVerificationRow);
}

// 4. Operaciones con Scores
export async function saveScore(documentId, scoreData) {
  // scoreData: { completeness, authenticity, consistency, quality, validity }
  const completeness = scoreData.completeness ?? 100;
  const authenticity = scoreData.authenticity ?? 100;
  const consistency = scoreData.consistency ?? 100;
  const quality = scoreData.quality ?? 100;
  const validity = scoreData.validity ?? 100;

  // Fórmula ponderada:
  // Complejidad/Completitud 30%, Autenticidad 25%, Consistencia 20%, Calidad 15%, Vigencia 10%
  const compositeScore = Math.round(
    completeness * 0.30 +
    authenticity * 0.25 +
    consistency * 0.20 +
    quality * 0.15 +
    validity * 0.10
  );

  let trafficLight = 'green';
  if (compositeScore < 50) trafficLight = 'red';
  else if (compositeScore < 75) trafficLight = 'yellow';

  const { data, error } = await supabaseAdmin
    .from('document_scores')
    .upsert({
      document_id: documentId,
      composite_score: compositeScore,
      completeness_score: completeness,
      authenticity_score: authenticity,
      consistency_score: consistency,
      quality_score: quality,
      validity_score: validity,
      traffic_light: trafficLight,
      scored_at: new Date().toISOString()
    }, { onConflict: 'document_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getScore(documentId) {
  const { data, error } = await supabaseAdmin
    .from('document_scores')
    .select()
    .eq('document_id', documentId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// 5. Bitácora de agentes
export async function logAgentAction(agentName, action, details = {}, cost = 0.0) {
  const { data, error } = await supabaseAdmin
    .from('agent_review_log')
    .insert([{
      agent_name: agentName,
      action,
      details,
      cost_usd: cost,
      created_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 6. Cruce de Referencias
// Igual que document_verifications, la tabla cross_references
// (NAGMAR_SCHEMA_V3_FINAL.sql) usa columnas distintas a las que maneja
// agentCrossRef.js/agentRiskScorer.js internamente:
// expediente_id (no order_id), document_a_id/document_b_id (no
// source_document_id/target_document_id), field_name (no
// cross_reference_type), match_result (no status), similarity_score (no
// confidence_score), message_es (no details).
function toDbCrossReferenceRow(c) {
  return {
    expediente_id: c.order_id,
    document_a_id: c.source_document_id,
    document_b_id: c.target_document_id,
    field_name: c.cross_reference_type,
    match_result: c.status, // 'pass', 'fail', 'warning'
    similarity_score: c.confidence_score ?? null,
    is_critical: c.status === 'fail',
    message_es: c.details || '',
    created_by: 'agent_cross_ref'
  };
}

function fromDbCrossReferenceRow(row) {
  return {
    ...row,
    order_id: row.expediente_id,
    cross_reference_type: row.field_name,
    status: row.match_result,
    confidence_score: row.similarity_score,
    details: row.message_es || ''
  };
}

export async function saveCrossReferences(expedienteId, crossReferences = []) {
  await supabaseAdmin
    .from('cross_references')
    .delete()
    .eq('expediente_id', expedienteId);

  if (!crossReferences.length) return [];

  const { data, error } = await supabaseAdmin
    .from('cross_references')
    .insert(crossReferences.map(toDbCrossReferenceRow))
    .select();

  if (error) throw error;
  return (data || []).map(fromDbCrossReferenceRow);
}

export async function getCrossReferences(expedienteId) {
  const { data, error } = await supabaseAdmin
    .from('cross_references')
    .select()
    .eq('expediente_id', expedienteId);

  if (error) throw error;
  return (data || []).map(fromDbCrossReferenceRow);
}

// 7. Resúmenes de expediente
export async function getExpedienteSummary(expedienteId) {
  // Obtenemos los documentos del expediente
  const { data: documents, error: docError } = await supabaseAdmin
    .from('documents')
    .select('id, filename, document_type, review_status')
    .eq('order_id', expedienteId);

  if (docError) throw docError;
  if (!documents || !documents.length) {
    return {
      total_documents: 0,
      analyzed_documents: 0,
      average_score: null,
      red_flags_count: 0,
      traffic_light: 'white'
    };
  }

  const documentIds = documents.map(d => d.id);

  // Obtener scores
  const { data: scores, error: scoreError } = await supabaseAdmin
    .from('document_scores')
    .select()
    .in('document_id', documentIds);

  if (scoreError) throw scoreError;

  // Obtener red flags (verificaciones fallidas o con warning)
  const { data: verifications, error: verError } = await supabaseAdmin
    .from('document_verifications')
    .select()
    .in('document_id', documentIds)
    .in('result', ['fail', 'warning']);

  if (verError) throw verError;

  const analyzedCount = scores ? scores.length : 0;
  const avgScore = analyzedCount > 0 
    ? Math.round(scores.reduce((acc, s) => acc + s.composite_score, 0) / analyzedCount) 
    : null;

  let finalTrafficLight = 'green';
  if (scores && scores.some(s => s.traffic_light === 'red')) {
    finalTrafficLight = 'red';
  } else if (scores && scores.some(s => s.traffic_light === 'yellow')) {
    finalTrafficLight = 'yellow';
  } else if (analyzedCount === 0) {
    finalTrafficLight = 'white';
  }

  return {
    total_documents: documents.length,
    analyzed_documents: analyzedCount,
    average_score: avgScore,
    red_flags_count: verifications ? verifications.length : 0,
    traffic_light: finalTrafficLight
  };
}

export async function getExpedienteRedFlags(expedienteId) {
  const { data: documents, error: docError } = await supabaseAdmin
    .from('documents')
    .select('id, filename')
    .eq('order_id', expedienteId);

  if (docError) throw docError;
  if (!documents || !documents.length) return [];

  const documentMap = {};
  documents.forEach(d => { documentMap[d.id] = d.filename; });

  const { data: verifications, error: verError } = await supabaseAdmin
    .from('document_verifications')
    .select()
    .in('document_id', Object.keys(documentMap))
    .in('result', ['fail', 'warning']);

  if (verError) throw verError;

  return (verifications || []).map(v => ({
    ...fromDbVerificationRow(v),
    filename: documentMap[v.document_id]
  })).sort((a, b) => {
    const severityOrder = { critical: 4, error: 3, warning: 2, info: 1 };
    return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
  });
}

// 8. Métodos de catálogos
export function getDocumentTypes() {
  return DOCUMENT_TYPES;
}

export async function getValidationRules(typeCode = null) {
  // Usar fallback de datos simulados en memoria o consultar tabla si existe
  const { data, error } = await supabaseAdmin
    .from('ref_validation_rules')
    .select();

  if (error || !data) {
    // Si la tabla no responde o no existe, retornamos un catálogo básico para validar local
    return [
      { rule_code: 'RFC_FORMAT', document_type_code: 'RFC_CSF', name: 'Formato RFC válido' },
      { rule_code: 'CURP_FORMAT', document_type_code: 'CURP_DOC', name: 'Formato CURP válido' },
      { rule_code: 'OPINION_POSITIVA', document_type_code: 'OPINION_32D', name: 'Opinión Positiva SAT' },
      { rule_code: 'BALANCE_CUADRA', document_type_code: 'EDOS_FINANCIEROS', name: 'Activo = Pasivo + Capital' }
    ].filter(r => !typeCode || r.document_type_code === typeCode);
  }

  return typeCode ? data.filter(r => r.document_type_code === typeCode) : data;
}

export async function getBenchmarks(sector) {
  const { data, error } = await supabaseAdmin
    .from('ref_financial_benchmarks')
    .select()
    .eq('sector', sector);

  if (error) throw error;
  return data;
}

export async function getFraudPatterns() {
  const { data, error } = await supabaseAdmin
    .from('ref_fraud_patterns')
    .select();

  if (error) throw error;
  return data;
}

// 9. Pipeline general: clasificar y procesar
export async function processDocument(documentId, filename, textContent = '') {
  // Clasificar
  const classification = classifyDocument(filename, textContent);

  // Actualizar tabla principal `documents`
  const { error: updateError } = await supabaseAdmin
    .from('documents')
    .update({
      document_type: classification.document_type_code,
      review_status: 'in_review'
    })
    .eq('id', documentId);

  if (updateError) throw updateError;

  // Guardar extracción preliminar
  const extractedData = {
    filename,
    classification_method: classification.matched_by,
    matched_keywords_count: classification.matched_count,
    raw_snippet: textContent.slice(0, 1000)
  };
  await saveExtraction(documentId, extractedData, classification.confidence);

  // Log de la acción
  await logAgentAction(
    'AgentClassifier',
    'classify',
    { documentId, filename, type: classification.document_type_code, confidence: classification.confidence },
    0.0
  );

  return {
    documentId,
    classification
  };
}
