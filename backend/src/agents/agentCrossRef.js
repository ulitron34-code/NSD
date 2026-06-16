import { supabaseAdmin } from '../config/supabase.js';
import { logAgentAction, getExtraction } from '../services/documentIntelligenceService.js';

// Helper de normalización para Razón Social
function normalizeCompanyName(name = '') {
  return String(name)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '') // Solo letras, números y espacios
    .replace(/\b(SA|CV|SAPI|DE|SAB|RL|MI|S\s*A|C\s*V|S\s*A\s*P\s*I|DE\s*C\s*V)\b/g, '') // Quitar regímenes societarios típicos
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper para calcular similitud de strings (Levenshtein / Jaro-Winkler simplificado)
function getFuzzyMatchScore(str1 = '', str2 = '') {
  const s1 = String(str1).toLowerCase().trim();
  const s2 = String(str2).toLowerCase().trim();
  if (s1 === s2) return 100;
  if (!s1 || !s2) return 0;

  // Si uno contiene al otro, dar peso intermedio
  if (s1.includes(s2) || s2.includes(s1)) return 85;

  // Contar palabras coincidentes
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  const common = words1.filter(w => words2.includes(w));
  const pct = (common.length * 2) / (words1.length + words2.length);

  return Math.round(pct * 100);
}

export async function runCrossReferencesForExpediente(expedienteId) {
  const startTime = Date.now();

  // 1. Obtener documentos del expediente
  const { data: documents, error } = await supabaseAdmin
    .from('documents')
    .select('id, filename, document_type')
    .eq('order_id', expedienteId);

  if (error) throw error;
  if (!documents || documents.length < 2) {
    return { success: true, message: 'Se necesitan al menos 2 documentos para realizar cruces.' };
  }

  // 2. Obtener extracciones de datos de todos los documentos
  const enrichedDocs = [];
  for (const doc of documents) {
    const ext = await getExtraction(doc.id);
    if (ext) {
      enrichedDocs.push({
        ...doc,
        metrics: ext.extracted_data?.financial_metrics || {},
        textContent: ext.extracted_data?.textContent || ''
      });
    }
  }

  const crossReferences = [];

  // Buscar CSF y Acta Constitutiva
  const csf = enrichedDocs.find(d => d.document_type === 'RFC_CSF');
  const acta = enrichedDocs.find(d => d.document_type === 'ACTA_CONST');
  const compDomicilio = enrichedDocs.find(d => d.document_type === 'COMP_DOMICILIO');
  const edosFin = enrichedDocs.find(d => d.document_type === 'EDOS_FINANCIEROS');

  // CRUCE 1: RFC CSF vs Acta Constitutiva
  if (csf && acta) {
    // Buscar RFCs en el texto
    const csfRfcs = csf.textContent.match(/[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}/gi) || [];
    const actaRfcs = acta.textContent.match(/[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}/gi) || [];

    const commonRfcs = csfRfcs.filter(r => actaRfcs.includes(r));
    const match = commonRfcs.length > 0;

    crossReferences.push({
      order_id: expedienteId,
      source_document_id: csf.id,
      target_document_id: acta.id,
      cross_reference_type: 'RFC_MATCH',
      status: match ? 'pass' : 'fail',
      confidence_score: match ? 100 : 0,
      details: match 
        ? `Coincidencia exacta de RFC encontrada entre CSF y Acta Constitutiva: ${commonRfcs[0]}`
        : 'No se encontraron RFCs coincidentes entre CSF y Acta Constitutiva.'
    });
  }

  // CRUCE 2: Razón Social CSF vs Acta Constitutiva
  if (csf && acta) {
    // Extraer posibles nombres (simplificado, usualmente de la primera sección)
    const csfNameMatch = csf.textContent.match(/(?:Denominación o Razón Social|Denominación\/Razón Social|Nombre|Razón Social)[\s\:\$]*([A-Z0-9\s,\.]+)/i);
    const actaNameMatch = acta.textContent.match(/(?:Denominación o Razón Social|Denominación\/Razón Social|Nombre|Razón Social|Sociedad denominada)[\s\:\$]*([A-Z0-9\s,\.]+)/i);

    if (csfNameMatch && actaNameMatch) {
      const name1 = normalizeCompanyName(csfNameMatch[1]);
      const name2 = normalizeCompanyName(actaNameMatch[1]);
      
      const similarity = getFuzzyMatchScore(name1, name2);
      const isMatch = similarity >= 80;

      crossReferences.push({
        order_id: expedienteId,
        source_document_id: csf.id,
        target_document_id: acta.id,
        cross_reference_type: 'RAZON_SOCIAL_MATCH',
        status: isMatch ? 'pass' : 'warning',
        confidence_score: similarity,
        details: isMatch
          ? `Razón social coincide al ${similarity}%: "${name1}" vs "${name2}"`
          : `Discrepancia potencial en Razón Social (${similarity}% similitud): "${name1}" vs "${name2}"`
      });
    }
  }

  // CRUCE 3: Domicilio CSF vs Comprobante de Domicilio
  if (csf && compDomicilio) {
    const postalCodeCsf = csf.textContent.match(/código\s+postal\s+(\d{5})/i) || csf.textContent.match(/c\.p\.\s+(\d{5})/i);
    const postalCodeComp = compDomicilio.textContent.match(/código\s+postal\s+(\d{5})/i) || compDomicilio.textContent.match(/c\.p\.\s+(\d{5})/i);

    if (postalCodeCsf && postalCodeComp) {
      const cpCsf = postalCodeCsf[1];
      const cpComp = postalCodeComp[1];
      const match = cpCsf === cpComp;

      crossReferences.push({
        order_id: expedienteId,
        source_document_id: csf.id,
        target_document_id: compDomicilio.id,
        cross_reference_type: 'DOMICILIO_CP_MATCH',
        status: match ? 'pass' : 'fail',
        confidence_score: match ? 100 : 0,
        details: match
          ? `Coincidencia exacta de Código Postal (${cpCsf}) entre CSF y Comprobante de Domicilio.`
          : `Discrepancia en Código Postal: CSF indica CP ${cpCsf} y el Comprobante indica CP ${cpComp}.`
      });
    }
  }

  // 3. Guardar cruces en la tabla `cross_references`
  if (crossReferences.length > 0) {
    // Eliminar previos de esta orden
    await supabaseAdmin
      .from('cross_references')
      .delete()
      .eq('order_id', expedienteId);

    const { error: insertError } = await supabaseAdmin
      .from('cross_references')
      .insert(crossReferences);

    if (insertError) throw insertError;
  }

  const duration = (Date.now() - startTime) / 1000;
  await logAgentAction(
    'AgentCrossRef',
    'cross_reference_batch',
    { expedienteId, crossCount: crossReferences.length, durationSeconds: duration },
    0.0
  );

  return {
    success: true,
    crossReferences
  };
}
