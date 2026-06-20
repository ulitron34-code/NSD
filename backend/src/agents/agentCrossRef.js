import { supabaseAdmin } from '../config/supabase.js';
import { logAgentAction, getExtraction, saveCrossReferences } from '../services/documentIntelligenceService.js';

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

// Helper para extraer domicilio físico (calle y número)
function extractStreetAddress(text = '') {
  const patterns = [
    /(?:calle|avenida|av\.|calzada|privada|cerrada|bulevar|blvd)\s+([a-z0-9\sñáéíóú\.\-#]+?(?:\d+|-|s\/n))/i,
    /(?:domicilio|direccion)\s*:\s*([a-z0-9\sñáéíóú\.\-#]+?(?:\d+|-|s\/n))/i
  ];
  for (const rx of patterns) {
    const match = text.match(rx);
    if (match) return match[1].trim();
  }
  return '';
}

// Comparación de tokens de domicilio
function getAddressFuzzyScore(addr1 = '', addr2 = '') {
  const cleanAddr = (str) => String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const a1 = cleanAddr(addr1);
  const a2 = cleanAddr(addr2);
  
  if (a1 === a2) return 100;
  if (!a1 || !a2) return 0;
  
  const tokens1 = a1.split(/\s+/).filter(t => t.length > 2);
  const tokens2 = a2.split(/\s+/).filter(t => t.length > 2);
  
  if (tokens1.length === 0 || tokens2.length === 0) return 0;
  
  let matches = 0;
  for (const t of tokens1) {
    if (tokens2.includes(t)) matches++;
  }
  
  return Math.round((matches * 2) / (tokens1.length + tokens2.length) * 100);
}

// Helper para extraer representantes legales
function extractRepresentatives(text = '') {
  const reps = [];
  const patterns = [
    /(?:representante\s+legal|apoderado|administrador\s+unico|comisario)[\s\:\-]*([A-Zñáéíóú\s]{6,40})/gi,
    /(?:firma\s+del\s+representante|firmado\s+por|firmante)[\s\:\-]*([A-Zñáéíóú\s]{6,40})/gi
  ];
  
  for (const rx of patterns) {
    let match;
    while ((match = rx.exec(text)) !== null) {
      const name = match[1].trim().replace(/\s+/g, ' ');
      if (name && name.length > 5 && !/de|el|la|por|del/i.test(name.split(' ')[0])) {
        reps.push(name.toUpperCase());
      }
    }
  }
  
  // Buscar nombres en mayúsculas en la vecindad de keywords
  const lines = text.split('\n');
  for (const line of lines) {
    if (/representante|apoderado|firma|firmante|administrador/i.test(line)) {
      const nameMatch = line.match(/\b([A-ZñÑ]{3,}\s+[A-ZñÑ]{3,}(?:\s+[A-ZñÑ]{3,})?)\b/);
      if (nameMatch) {
        reps.push(nameMatch[1].toUpperCase());
      }
    }
  }
  
  return [...new Set(reps)];
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

  // Buscar documentos específicos
  const csf = enrichedDocs.find(d => d.document_type === 'RFC_CSF');
  const acta = enrichedDocs.find(d => d.document_type === 'ACTA_CONST');
  const compDomicilio = enrichedDocs.find(d => d.document_type === 'COMP_DOMICILIO');
  const edosFin = enrichedDocs.find(d => d.document_type === 'EDOS_FINANCIEROS');

  // CRUCE 1: RFC CSF vs Acta Constitutiva
  if (csf && acta) {
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

  // CRUCE 3: Domicilio CSF vs Comprobante de Domicilio (Código Postal y Calle/Número Fuzzy)
  if (csf && compDomicilio) {
    const postalCodeCsf = csf.textContent.match(/código\s+postal\s+(\d{5})/i) || csf.textContent.match(/c\.p\.\s+(\d{5})/i);
    const postalCodeComp = compDomicilio.textContent.match(/código\s+postal\s+(\d{5})/i) || compDomicilio.textContent.match(/c\.p\.\s+(\d{5})/i);

    let cpCsf = postalCodeCsf ? postalCodeCsf[1] : '';
    let cpComp = postalCodeComp ? postalCodeComp[1] : '';
    const cpMatch = cpCsf && cpComp && cpCsf === cpComp;

    const addrCsf = extractStreetAddress(csf.textContent);
    const addrComp = extractStreetAddress(compDomicilio.textContent);
    const fuzzyAddrScore = getAddressFuzzyScore(addrCsf, addrComp);

    const match = cpMatch && fuzzyAddrScore >= 60;

    crossReferences.push({
      order_id: expedienteId,
      source_document_id: csf.id,
      target_document_id: compDomicilio.id,
      cross_reference_type: 'DOMICILIO_CP_MATCH',
      status: match ? 'pass' : (cpMatch ? 'warning' : 'fail'),
      confidence_score: match ? 100 : (cpMatch ? 50 : 0),
      details: match
        ? `Domicilio verificado con éxito: Código Postal coincide (${cpCsf}) y dirección coincide al ${fuzzyAddrScore}% ("${addrCsf}" vs "${addrComp}").`
        : cpMatch
          ? `Coincidencia de Código Postal (${cpCsf}) pero discrepancia potencial en dirección (${fuzzyAddrScore}%): "${addrCsf}" vs "${addrComp}".`
          : `Discrepancia total de Domicilio. CSF indica CP ${cpCsf || 'N/A'} ("${addrCsf}") y el Comprobante indica CP ${cpComp || 'N/A'} ("${addrComp}").`
    });
  }

  // CRUCE 4: Representantes Acta Constitutiva vs Firmantes Estados Financieros
  if (acta && edosFin) {
    const actaReps = extractRepresentatives(acta.textContent);
    const edosFinReps = extractRepresentatives(edosFin.textContent);

    let matchFound = false;
    let matchName = '';
    let maxScore = 0;

    for (const rep1 of actaReps) {
      for (const rep2 of edosFinReps) {
        const score = getFuzzyMatchScore(rep1, rep2);
        if (score > maxScore) {
          maxScore = score;
        }
        if (score >= 80) {
          matchFound = true;
          matchName = `${rep1} (en Acta) ≈ ${rep2} (en Estados Financieros)`;
        }
      }
    }

    crossReferences.push({
      order_id: expedienteId,
      source_document_id: acta.id,
      target_document_id: edosFin.id,
      cross_reference_type: 'REPRESENTANTE_MATCH',
      status: matchFound ? 'pass' : 'warning',
      confidence_score: maxScore,
      details: matchFound
        ? `Representante legal verificado: Coincidencia del ${maxScore}% para: ${matchName}.`
        : `Sin coincidencia clara de Representante Legal en firma de Estados Financieros (Fuzzy max: ${maxScore}%). Acta: [${actaReps.join(', ') || 'Sin representantes detectados'}], Estados Financieros: [${edosFinReps.join(', ') || 'Sin firmantes detectados'}].`
    });
  }

  // 3. Guardar cruces en la tabla `cross_references`
  await saveCrossReferences(expedienteId, crossReferences);

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
