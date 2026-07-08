import { supabaseAdmin } from '../config/supabase.js';
import {
  saveVerifications,
  saveScore,
  getExtraction,
  logAgentAction,
  getOrderCountry
} from '../services/documentIntelligenceService.js';
import { detectCountryFromText } from '../services/countryDetector.js';
import {
  coValidarNit,
  ecValidarCedula,
  ecValidarRuc,
  arValidarCuit,
  arValidarDniFormato,
  peValidarRuc,
  peValidarDniFormato,
  clValidarRut,
  boValidarNitFormato,
  pyValidarRuc,
  uyValidarRutFormato,
  usValidarEinFormato,
  usValidarSsnFormato,
  caValidarSin,
  caValidarBnFormato
} from '../services/idValidators.js';

// Regex Helpers
const RFC_REGEX = /^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/i;
const CURP_REGEX = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]\d$/i;

// Reglas de validacion de IDs fiscales/nacionales por tipo de documento de la
// expansion multi-pais. Cada regla busca un candidato en el texto (despues
// de una etiqueta tipica del documento, p.ej. "NIT", "RUC", "EIN") y lo
// valida con su algoritmo de digito verificador (o solo formato, donde no
// existe un algoritmo publico confiable -- ver comentarios en idValidators.js).
const ID_VALIDATION_RULES = {
  CO_NIT_RUT: { ruleCode: 'CO_NIT_FORMAT', label: 'NIT', regex: /NIT[:\s.]{0,5}([\d.]{8,12}-?\d)/i, validate: coValidarNit },
  EC_CEDULA: { ruleCode: 'EC_CEDULA_FORMAT', label: 'Cedula ecuatoriana', regex: /(?:CEDULA|C\.?I\.?)[^\d]{0,15}(\d{10})/i, validate: ecValidarCedula },
  EC_RUC: { ruleCode: 'EC_RUC_FORMAT', label: 'RUC ecuatoriano', regex: /RUC[:\s.]{0,5}(\d{13})/i, validate: ecValidarRuc },
  AR_CUIT: { ruleCode: 'AR_CUIT_FORMAT', label: 'CUIT', regex: /CUIT[:\s.]{0,5}([\d-]{11,13})/i, validate: arValidarCuit },
  AR_CUIL: { ruleCode: 'AR_CUIL_FORMAT', label: 'CUIL', regex: /CUIL[:\s.]{0,5}([\d-]{11,13})/i, validate: arValidarCuit },
  AR_DNI: { ruleCode: 'AR_DNI_FORMAT', label: 'DNI argentino', regex: /DNI[:\s.]{0,5}([\d.]{7,10})/i, validate: arValidarDniFormato },
  PE_RUC: { ruleCode: 'PE_RUC_FORMAT', label: 'RUC peruano', regex: /RUC[:\s.]{0,5}(\d{11})/i, validate: peValidarRuc },
  PE_DNI: { ruleCode: 'PE_DNI_FORMAT', label: 'DNI peruano', regex: /DNI[:\s.]{0,5}(\d{8})/i, validate: peValidarDniFormato },
  CL_RUT: { ruleCode: 'CL_RUT_FORMAT', label: 'RUT chileno', regex: /RUT[:\s.]{0,5}([\d.]{7,9}-?[\dkK])/i, validate: clValidarRut },
  CL_CEDULA_RUN: { ruleCode: 'CL_RUN_FORMAT', label: 'RUN chileno', regex: /RU[NT][:\s.]{0,5}([\d.]{7,9}-?[\dkK])/i, validate: clValidarRut },
  BO_NIT: { ruleCode: 'BO_NIT_FORMAT', label: 'NIT boliviano', regex: /NIT[:\s.]{0,5}([\d-]{9,12})/i, validate: boValidarNitFormato },
  PY_RUC: { ruleCode: 'PY_RUC_FORMAT', label: 'RUC paraguayo', regex: /RUC[:\s.]{0,5}([\d-]{7,10})/i, validate: pyValidarRuc },
  UY_RUT: { ruleCode: 'UY_RUT_FORMAT', label: 'RUT uruguayo', regex: /RUT[:\s.]{0,5}([\d.\s-]{10,16})/i, validate: uyValidarRutFormato },
  US_EIN: { ruleCode: 'US_EIN_FORMAT', label: 'EIN', regex: /EIN[:\s.]{0,5}(\d{2}-?\d{7})/i, validate: usValidarEinFormato },
  US_SSN_CARD: { ruleCode: 'US_SSN_FORMAT', label: 'SSN', regex: /(?:SSN|SOCIAL SECURITY(?: NUMBER)?)[:\s.]{0,15}(\d{3}-?\d{2}-?\d{4})/i, validate: usValidarSsnFormato },
  CA_SIN: { ruleCode: 'CA_SIN_FORMAT', label: 'SIN canadiense', regex: /SIN[:\s.]{0,5}(\d{3}[\s-]?\d{3}[\s-]?\d{3})/i, validate: caValidarSin },
  CA_BN: { ruleCode: 'CA_BN_FORMAT', label: 'Business Number', regex: /(?:BN|BUSINESS NUMBER)[:\s.]{0,5}(\d{9})/i, validate: caValidarBnFormato }
};

// Codigos de Estados Financieros de la expansion multi-pais (NIIF/IFRS/GAAP)
// que deben pasar por la misma logica de ecuacion contable que ya aplicaba a
// EDOS_FINANCIEROS (Mexico).
const EEFF_CODES_INTERNACIONALES = [
  'CO_EEFF_NIIF', 'EC_EEFF_NIIF', 'AR_EEFF', 'PE_EEFF_NIIF', 'CL_EEFF_NIIF',
  'BO_EEFF', 'PY_EEFF', 'UY_EEFF', 'US_EEFF_GAAP', 'CA_EEFF_IFRS'
];

// Extraer fecha del texto e intentar parsearla
export function findDatesInText(text) {
  const dates = [];
  // Formatos: DD/MM/AAAA, AAAA-MM-DD
  const regexSlash = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g;
  const regexIso = /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/g;
  
  let match;
  while ((match = regexSlash.exec(text)) !== null) {
    const d = parseInt(match[1]);
    const m = parseInt(match[2]) - 1;
    const y = parseInt(match[3]);
    dates.push(new Date(y, m, d));
  }
  while ((match = regexIso.exec(text)) !== null) {
    const y = parseInt(match[1]);
    const m = parseInt(match[2]) - 1;
    const d = parseInt(match[3]);
    dates.push(new Date(y, m, d));
  }

  // Meses en español
  const months = {
    enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
    julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
  };
  const regexText = /(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+(\d{4})/gi;
  while ((match = regexText.exec(text)) !== null) {
    const d = parseInt(match[1]);
    const m = months[match[2].toLowerCase()];
    const y = parseInt(match[3]);
    dates.push(new Date(y, m, d));
  }

  return dates.filter(d => !isNaN(d.getTime()));
}

// Lógica de validación por tipo. declaredCountry es el pais que el
// solicitante declaro al crear el expediente (service_orders.metadata.
// country, ver runValidatorBatch); se usa solo como señal de cruce contra lo
// que el OCR detecta en el documento (ver countryDetector.js), nunca para
// decidir que reglas de documentType aplicar -- eso ya lo decide el
// documentType mismo (su prefijo ya es el del pais correcto).
export async function validateDocumentContent(documentId, documentType, textContent = '', declaredCountry = 'MX') {
  const verifications = [];
  const scores = {
    completeness: 100,
    authenticity: 100,
    consistency: 100,
    quality: 100,
    validity: 100
  };

  const textNormalized = textContent.toUpperCase();

  // 1. REGLA: RFC (Aplica a CSF, Acta y CFDI)
  if (['RFC_CSF', 'ACTA_CONST', 'CFDI_FACTURA'].includes(documentType)) {
    // Buscar RFCs potenciales
    const rfcMatches = textContent.match(/[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}/gi) || [];
    const uniqueRfcs = [...new Set(rfcMatches)];
    
    if (uniqueRfcs.length > 0) {
      const allValid = uniqueRfcs.every(rfc => RFC_REGEX.test(rfc));
      if (allValid) {
        verifications.push({
          rule_code: 'RFC_FORMAT',
          status: 'pass',
          severity: 'info',
          findings: `RFCs detectados y validados correctamente: ${uniqueRfcs.join(', ')}`
        });
      } else {
        scores.authenticity -= 30;
        verifications.push({
          rule_code: 'RFC_FORMAT',
          status: 'warning',
          severity: 'warning',
          findings: `Algunos RFCs detectados no tienen formato válido. Encontrados: ${uniqueRfcs.join(', ')}`
        });
      }
    } else {
      scores.authenticity -= 50;
      verifications.push({
        rule_code: 'RFC_FORMAT',
        status: 'fail',
        severity: 'error',
        findings: 'No se detectó ningún RFC en el documento'
      });
    }
  }

  // 2. REGLA: CURP (Aplica a INE y CURP)
  if (['INE_FRENTE', 'CURP_DOC'].includes(documentType)) {
    const curpMatches = textContent.match(/[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]\d/gi) || [];
    const uniqueCurps = [...new Set(curpMatches)];

    if (uniqueCurps.length > 0) {
      verifications.push({
        rule_code: 'CURP_FORMAT',
        status: 'pass',
        severity: 'info',
        findings: `CURP detectada y validada correctamente: ${uniqueCurps.join(', ')}`
      });
    } else {
      scores.authenticity -= 40;
      verifications.push({
        rule_code: 'CURP_FORMAT',
        status: 'fail',
        severity: 'error',
        findings: 'No se detectó ninguna CURP con formato válido en el documento'
      });
    }
  }

  // 2.1 REGLA: IDs fiscales/nacionales de la expansion multi-pais (NIT, RUC,
  // CUIT, RUT, EIN, SSN, SIN, etc.) -- ver ID_VALIDATION_RULES mas arriba.
  const idRule = ID_VALIDATION_RULES[documentType];
  if (idRule) {
    const idMatch = textContent.match(idRule.regex);
    if (idMatch) {
      const candidate = idMatch[1];
      if (idRule.validate(candidate)) {
        verifications.push({
          rule_code: idRule.ruleCode,
          status: 'pass',
          severity: 'info',
          findings: `${idRule.label} detectado y validado correctamente: ${candidate}`
        });
      } else {
        scores.authenticity -= 40;
        verifications.push({
          rule_code: idRule.ruleCode,
          status: 'fail',
          severity: 'error',
          findings: `${idRule.label} encontrado (${candidate}) no es válido (formato o dígito verificador incorrecto)`
        });
      }
    } else {
      scores.authenticity -= 20;
      verifications.push({
        rule_code: idRule.ruleCode,
        status: 'warning',
        severity: 'warning',
        findings: `No se detectó ${idRule.label} en el documento`
      });
    }
  }

  // 3. REGLA: Estatus Activo (Aplica a CSF)
  if (documentType === 'RFC_CSF') {
    const isActivo = textNormalized.includes('ACTIVO') || textNormalized.includes('REAPERTURA');
    if (isActivo) {
      verifications.push({
        rule_code: 'CSF_ESTATUS_ACTIVO',
        status: 'pass',
        severity: 'info',
        findings: 'El contribuyente se encuentra en estatus ACTIVO'
      });
    } else {
      scores.authenticity -= 50;
      verifications.push({
        rule_code: 'CSF_ESTATUS_ACTIVO',
        status: 'fail',
        severity: 'critical',
        findings: 'La CSF no indica estatus ACTIVO (contribuyente inactivo o suspendido)'
      });
    }
  }

  // 4. REGLA: Opinión Positiva (Aplica a Opinión 32D)
  if (documentType === 'OPINION_32D') {
    const isPositiva = textNormalized.includes('POSITIVA');
    const isNegativa = textNormalized.includes('NEGATIVA');

    if (isPositiva && !isNegativa) {
      verifications.push({
        rule_code: 'OPINION_32D_POSITIVA',
        status: 'pass',
        severity: 'info',
        findings: 'La opinión del SAT es POSITIVA'
      });
    } else {
      scores.authenticity = 0; // Blocker crítico
      verifications.push({
        rule_code: 'OPINION_32D_POSITIVA',
        status: 'fail',
        severity: 'critical',
        findings: 'La opinión del SAT es NEGATIVA o no es claramente positiva'
      });
    }
  }

  // 5. REGLA: Vigencia (INE, CSF, 32D, Comprobantes de domicilio)
  if (['INE_FRENTE', 'RFC_CSF', 'OPINION_32D', 'COMP_DOMICILIO'].includes(documentType)) {
    const dates = findDatesInText(textContent);
    const today = new Date();
    
    if (dates.length > 0) {
      // Tomamos la fecha más reciente encontrada en el documento
      const docDate = new Date(Math.max(...dates.map(d => d.getTime())));
      const ageMs = today.getTime() - docDate.getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);

      let maxAllowedDays = 365 * 10; // INE dura 10 años
      if (documentType === 'OPINION_32D') maxAllowedDays = 30; // 32-D dura 30 días
      if (documentType === 'COMP_DOMICILIO') maxAllowedDays = 90; // Comprobante domicilio dura 3 meses
      if (documentType === 'RFC_CSF') maxAllowedDays = 90; // CSF usualmente se pide de max 3 meses

      if (ageDays <= maxAllowedDays) {
        verifications.push({
          rule_code: 'VIGENCIA_NO_VENCIDA',
          status: 'pass',
          severity: 'info',
          findings: `Documento vigente. Fecha detectada: ${docDate.toLocaleDateString('es-MX')}. Antigüedad: ${Math.round(ageDays)} días (Límite: ${maxAllowedDays})`
        });
      } else {
        scores.validity = Math.max(0, 100 - Math.round((ageDays / maxAllowedDays) * 30));
        verifications.push({
          rule_code: 'VIGENCIA_NO_VENCIDA',
          status: 'fail',
          severity: documentType === 'OPINION_32D' ? 'critical' : 'error',
          findings: `El documento ha vencido. Fecha detectada: ${docDate.toLocaleDateString('es-MX')}. Antigüedad: ${Math.round(ageDays)} días (Límite: ${maxAllowedDays})`
        });
      }
    } else {
      // Si no hay fechas pero es INE, buscar año de vigencia
      const vigenciaMatch = textContent.match(/vigencia\s+(\d{4})/i);
      if (vigenciaMatch && documentType === 'INE_FRENTE') {
        const year = parseInt(vigenciaMatch[1]);
        if (year >= today.getFullYear()) {
          verifications.push({
            rule_code: 'VIGENCIA_NO_VENCIDA',
            status: 'pass',
            severity: 'info',
            findings: `INE vigente hasta el año: ${year}`
          });
        } else {
          scores.validity = 0;
          verifications.push({
            rule_code: 'VIGENCIA_NO_VENCIDA',
            status: 'fail',
            severity: 'error',
            findings: `INE vencida en el año: ${year}`
          });
        }
      } else {
        scores.validity -= 30;
        verifications.push({
          rule_code: 'VIGENCIA_NO_VENCIDA',
          status: 'warning',
          severity: 'warning',
          findings: 'No se detectaron fechas explícitas de emisión o vigencia'
        });
      }
    }
  }

  // 6. REGLA: Lógica de Estados Financieros / Números Redondos
  // Incluye los codigos de EEFF de la expansion multi-pais (NIIF/IFRS/GAAP):
  // misma ecuacion contable Activo = Pasivo + Capital, distinta terminologia.
  if (['EDOS_FINANCIEROS', 'BALANCE', 'EDO_RES', ...EEFF_CODES_INTERNACIONALES].includes(documentType)) {
    // Buscar números sospechosos (terminados en 000)
    const numbers = textContent.match(/\b\d+[\d,]*\b/g) || [];
    const validNumbers = numbers.map(n => parseInt(n.replace(/,/g, ''))).filter(n => n > 100);
    
    if (validNumbers.length > 5) {
      const roundNumbers = validNumbers.filter(n => n % 1000 === 0);
      const percentage = roundNumbers.length / validNumbers.length;
      
      if (percentage > 0.8) {
        scores.quality -= 40;
        verifications.push({
          rule_code: 'NUMEROS_REDONDOS',
          status: 'warning',
          severity: 'warning',
          findings: `Sospecha de números inventados: ${Math.round(percentage * 100)}% de los valores son múltiplos exactos de 1,000`
        });
      } else {
        verifications.push({
          rule_code: 'NUMEROS_REDONDOS',
          status: 'pass',
          severity: 'info',
          findings: `Distribución numérica normal: ${Math.round(percentage * 100)}% de números redondos`
        });
      }
    }

    // Reglas financieras de coherencia (si se detectan números de balance)
    // Buscamos patrones de Activo Total, Pasivo y Capital
    const activoMatch = textContent.match(/(?:activo\s+total|total\s+activo|total\s+assets)[\s\:\$]*([\d,]+)/i);
    const pasivoMatch = textContent.match(/(?:pasivo\s+total|total\s+pasivo|total\s+liabilities)[\s\:\$]*([\d,]+)/i);
    const capitalMatch = textContent.match(/(?:capital\s+contable|total\s+capital|patrimonio|total\s+equity|stockholders\s+equity)[\s\:\$]*([\d,]+)/i);

    if (activoMatch && pasivoMatch && capitalMatch) {
      const activo = parseFloat(activoMatch[1].replace(/,/g, ''));
      const pasivo = parseFloat(pasivoMatch[1].replace(/,/g, ''));
      const capital = parseFloat(capitalMatch[1].replace(/,/g, ''));

      const diff = Math.abs(activo - (pasivo + capital));
      const margin = diff / (activo || 1);

      if (margin <= 0.001) {
        verifications.push({
          rule_code: 'BALANCE_CUADRA',
          status: 'pass',
          severity: 'info',
          findings: `Ecuación contable cuadra: Activo (${activo}) = Pasivo (${pasivo}) + Capital (${capital})`
        });
      } else {
        scores.consistency -= 50;
        verifications.push({
          rule_code: 'BALANCE_CUADRA',
          status: 'fail',
          severity: 'error',
          findings: `La ecuación contable no cuadra: Activo (${activo}) vs Pasivo + Capital (${pasivo + capital}). Diferencia: ${diff}`
        });
      }
    }

    // Utilidad <= Ingresos
    const ingresosMatch = textContent.match(/(?:ingresos|ventas\s+netas)[\s\:\$]*([\d,]+)/i);
    const utilidadMatch = textContent.match(/(?:utilidad\s+neta|utilidad\s+del\s+ejercicio)[\s\:\$]*([\d,]+)/i);

    if (ingresosMatch && utilidadMatch) {
      const ingresos = parseFloat(ingresosMatch[1].replace(/,/g, ''));
      const utilidad = parseFloat(utilidadMatch[1].replace(/,/g, ''));

      if (utilidad <= ingresos) {
        verifications.push({
          rule_code: 'UTILIDAD_COHERENTE',
          status: 'pass',
          severity: 'info',
          findings: `Coherencia de resultados: Utilidad (${utilidad}) es menor o igual a Ingresos (${ingresos})`
        });
      } else {
        scores.consistency -= 50;
        verifications.push({
          rule_code: 'UTILIDAD_COHERENTE',
          status: 'fail',
          severity: 'error',
          findings: `Inconsistencia: Utilidad (${utilidad}) no puede ser mayor que Ingresos (${ingresos})`
        });
      }
    }
  }

  // 6.1 REGLA: Cruce de pais declarado vs pais detectado por OCR. Es solo una
  // señal de alerta (requiere revision manual) -- nunca cambia que reglas de
  // documentType se aplicaron, y solo dispara con una deteccion de confianza
  // razonable (>= 0.8) para evitar falsos positivos por una sola palabra suelta.
  const countryDetection = detectCountryFromText(textContent);
  if (countryDetection.country && countryDetection.confidence >= 0.8) {
    if (countryDetection.country === declaredCountry) {
      verifications.push({
        rule_code: 'COUNTRY_MISMATCH',
        status: 'pass',
        severity: 'info',
        findings: `El país detectado en el documento (${countryDetection.country}) coincide con el país declarado del expediente.`
      });
    } else {
      scores.consistency -= 20;
      verifications.push({
        rule_code: 'COUNTRY_MISMATCH',
        status: 'warning',
        severity: 'warning',
        findings: `El expediente declara país ${declaredCountry}, pero el documento parece ser de ${countryDetection.country} (señales: ${countryDetection.matches.join(', ')}). Requiere revisión manual.`
      });
    }
  }

  // 7. REGLA: Anti-fraude por metadatos (FRAUD_METADATA_EDIT)
  let pdfMetadata = null;
  try {
    const ext = await getExtraction(documentId);
    if (ext && ext.extracted_data) {
      pdfMetadata = ext.extracted_data.pdfMetadata || null;
    }
  } catch (err) {
    console.error('Error fetching extraction for metadata checks:', err);
  }

  if (pdfMetadata) {
    const creator = String(pdfMetadata.Creator || '').toUpperCase();
    const producer = String(pdfMetadata.Producer || '').toUpperCase();
    
    const suspiciousSoftware = ['PHOTOSHOP', 'ILLUSTRATOR', 'COREL', 'NITRO', 'ACROBAT PRO', 'PDFILL', 'FOXIT PHANTOM', 'SEJDA', 'ILOVEPDF', 'PDF2GO', 'SMALLPDF'];
    let isSuspicious = false;
    let foundSoftware = '';
    
    for (const sw of suspiciousSoftware) {
      if (creator.includes(sw) || producer.includes(sw)) {
        isSuspicious = true;
        foundSoftware = sw;
        break;
      }
    }
    
    if (isSuspicious) {
      scores.authenticity = Math.max(0, scores.authenticity - 40);
      verifications.push({
        rule_code: 'FRAUD_METADATA_EDIT',
        status: 'warning',
        severity: 'warning',
        findings: `Metadatos sospechosos detectados: El archivo fue creado/procesado con software de edición (${foundSoftware}). Creator: ${pdfMetadata.Creator || 'N/A'}, Producer: ${pdfMetadata.Producer || 'N/A'}`
      });
    } else {
      // Comparación de fechas de creación y modificación
      const creationDateStr = pdfMetadata.CreationDate;
      const modDateStr = pdfMetadata.ModDate;
      
      if (creationDateStr && modDateStr && creationDateStr !== modDateStr) {
        // En PDF el formato de fechas es usualmente "D:YYYYMMDDHHmmSSOHH'mm'"
        const getYYYYMMDD = (str) => {
          const match = String(str).match(/D?:?(\d{8})/);
          return match ? match[1] : null;
        };
        
        const creationYYYYMMDD = getYYYYMMDD(creationDateStr);
        const modYYYYMMDD = getYYYYMMDD(modDateStr);
        
        if (creationYYYYMMDD && modYYYYMMDD && creationYYYYMMDD !== modYYYYMMDD) {
          scores.authenticity = Math.max(0, scores.authenticity - 20);
          verifications.push({
            rule_code: 'FRAUD_METADATA_EDIT',
            status: 'warning',
            severity: 'warning',
            findings: `Discrepancia en metadatos del PDF: La fecha de creación (${creationYYYYMMDD}) no coincide con la fecha de modificación (${modYYYYMMDD}), sugiriendo una alteración posterior.`
          });
        } else {
          verifications.push({
            rule_code: 'FRAUD_METADATA_EDIT',
            status: 'pass',
            severity: 'info',
            findings: 'Análisis de metadatos del PDF limpio. No se detectó software sospechoso ni discrepancia de fechas.'
          });
        }
      } else {
        verifications.push({
          rule_code: 'FRAUD_METADATA_EDIT',
          status: 'pass',
          severity: 'info',
          findings: 'Análisis de metadatos del PDF limpio. No se detectó software sospechoso.'
        });
      }
    }
  }

  // Si no se añadieron reglas, agregar una regla de completitud por defecto
  if (verifications.length === 0) {
    verifications.push({
      rule_code: 'COMPLETITUD_GENERAL',
      status: 'pass',
      severity: 'info',
      findings: 'El documento fue procesado sin encontrar fallos estructurales conocidos'
    });
  }

  // Asegurar que los scores estén en rango [0, 100]
  Object.keys(scores).forEach(k => {
    scores[k] = Math.max(0, Math.min(100, scores[k]));
  });

  // Guardar verificaciones y score en la base de datos
  await saveVerifications(documentId, verifications, 'AgentValidator');
  await saveScore(documentId, scores);

  return {
    verifications,
    scores
  };
}

// Ejecutar validador batch para todos los documentos de un expediente
export async function runValidatorBatch(expedienteId = null, targetDocumentId = null) {
  let documents = [];

  if (targetDocumentId) {
    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('id, document_type, order_id')
      .eq('id', targetDocumentId)
      .single();
    if (data) documents = [data];
  } else if (expedienteId) {
    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('id, document_type, order_id')
      .eq('order_id', expedienteId);
    if (data) documents = data;
  }

  const results = [];
  for (const doc of documents) {
    if (!doc.document_type || doc.document_type === 'OTRO') continue;

    try {
      // Obtener la extracción de texto
      const ext = await getExtraction(doc.id);
      if (ext && ext.extracted_data && ext.extracted_data.textContent) {
        const declaredCountry = await getOrderCountry(doc.order_id);
        const valRes = await validateDocumentContent(doc.id, doc.document_type, ext.extracted_data.textContent, declaredCountry);
        
        // Actualizar estatus a 'approved' si no hay fallos graves, o 'observed' si hay flags
        const hasCriticalOrError = valRes.verifications.some(v => v.status === 'fail' && ['critical', 'error'].includes(v.severity));
        const newStatus = hasCriticalOrError ? 'observed' : 'approved';

        await supabaseAdmin
          .from('documents')
          .update({ review_status: newStatus })
          .eq('id', doc.id);

        results.push({ id: doc.id, success: true, scores: valRes.scores });
      }
    } catch (err) {
      console.error(`Error validando documento ${doc.id}:`, err);
      results.push({ id: doc.id, success: false, error: err.message });
    }
  }

  await logAgentAction(
    'AgentValidator',
    'validate_batch',
    { count: documents.length, targetDocumentId, expedienteId },
    0.0
  );

  return results;
}
