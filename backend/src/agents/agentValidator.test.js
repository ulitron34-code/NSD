import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/documentIntelligenceService.js', () => ({
  saveVerifications: vi.fn().mockResolvedValue(undefined),
  saveScore: vi.fn().mockResolvedValue(undefined),
  getExtraction: vi.fn().mockResolvedValue(null),
  logAgentAction: vi.fn().mockResolvedValue(undefined),
  getOrderCountry: vi.fn().mockResolvedValue('MX')
}));

vi.mock('../config/supabase.js', () => ({
  supabase: {},
  supabaseAdmin: {}
}));

import { validateDocumentContent } from './agentValidator.js';
import { getExtraction } from '../services/documentIntelligenceService.js';

function findVerification(result, ruleCode) {
  return result.verifications.find(v => v.rule_code === ruleCode);
}

describe('agentValidator.validateDocumentContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getExtraction.mockResolvedValue(null);
  });

  describe('RFC_FORMAT', () => {
    it('aprueba un RFC de persona moral con formato válido', async () => {
      const result = await validateDocumentContent('doc-1', 'RFC_CSF', 'Contribuyente: ABC010101AB1, estatus ACTIVO');
      expect(findVerification(result, 'RFC_FORMAT').status).toBe('pass');
    });

    it('marca fallo cuando no se detecta ningún RFC', async () => {
      const result = await validateDocumentContent('doc-2', 'RFC_CSF', 'Documento sin identificador fiscal, estatus ACTIVO');
      expect(findVerification(result, 'RFC_FORMAT').status).toBe('fail');
      expect(result.scores.authenticity).toBeLessThan(100);
    });
  });

  describe('CURP_FORMAT', () => {
    it('aprueba una CURP con formato válido', async () => {
      const result = await validateDocumentContent('doc-3', 'INE_FRENTE', 'CURP: GOMJ900101HDFNRN05 vigencia 2030');
      expect(findVerification(result, 'CURP_FORMAT').status).toBe('pass');
    });

    it('marca fallo cuando no hay CURP válida', async () => {
      const result = await validateDocumentContent('doc-4', 'INE_FRENTE', 'Identificación sin CURP legible');
      expect(findVerification(result, 'CURP_FORMAT').status).toBe('fail');
    });
  });

  describe('CSF_ESTATUS_ACTIVO', () => {
    it('aprueba cuando el contribuyente está ACTIVO', async () => {
      const result = await validateDocumentContent('doc-5', 'RFC_CSF', 'RFC ABC010101AB1, estatus: ACTIVO');
      expect(findVerification(result, 'CSF_ESTATUS_ACTIVO').status).toBe('pass');
    });

    it('marca fallo crítico cuando no dice ACTIVO', async () => {
      const result = await validateDocumentContent('doc-6', 'RFC_CSF', 'RFC ABC010101AB1, estatus: SUSPENDIDO');
      const v = findVerification(result, 'CSF_ESTATUS_ACTIVO');
      expect(v.status).toBe('fail');
      expect(v.severity).toBe('critical');
    });
  });

  describe('OPINION_32D_POSITIVA', () => {
    it('aprueba opinión positiva', async () => {
      const result = await validateDocumentContent('doc-7', 'OPINION_32D', 'La opinión del contribuyente es POSITIVA al 01/01/2026');
      expect(findVerification(result, 'OPINION_32D_POSITIVA').status).toBe('pass');
    });

    it('bloquea con score 0 cuando la opinión es negativa', async () => {
      const result = await validateDocumentContent('doc-8', 'OPINION_32D', 'La opinión del contribuyente es NEGATIVA');
      const v = findVerification(result, 'OPINION_32D_POSITIVA');
      expect(v.status).toBe('fail');
      expect(v.severity).toBe('critical');
      expect(result.scores.authenticity).toBe(0);
    });
  });

  describe('VIGENCIA_NO_VENCIDA', () => {
    it('marca vencido un comprobante de domicilio de hace más de 90 días', async () => {
      const oldDate = '01/01/2020';
      const result = await validateDocumentContent('doc-9', 'COMP_DOMICILIO', `Recibo emitido el ${oldDate}`);
      expect(findVerification(result, 'VIGENCIA_NO_VENCIDA').status).toBe('fail');
    });

    it('aprueba un comprobante de domicilio reciente', async () => {
      const today = new Date();
      const recentDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
      const result = await validateDocumentContent('doc-10', 'COMP_DOMICILIO', `Recibo emitido el ${recentDate}`);
      expect(findVerification(result, 'VIGENCIA_NO_VENCIDA').status).toBe('pass');
    });
  });

  describe('BALANCE_CUADRA', () => {
    it('aprueba cuando Activo = Pasivo + Capital', async () => {
      const text = 'Activo Total: 100,000 Pasivo Total: 60,000 Capital Contable: 40,000';
      const result = await validateDocumentContent('doc-11', 'EDOS_FINANCIEROS', text);
      expect(findVerification(result, 'BALANCE_CUADRA').status).toBe('pass');
    });

    it('marca fallo cuando la ecuación contable no cuadra', async () => {
      const text = 'Activo Total: 100,000 Pasivo Total: 60,000 Capital Contable: 10,000';
      const result = await validateDocumentContent('doc-12', 'EDOS_FINANCIEROS', text);
      const v = findVerification(result, 'BALANCE_CUADRA');
      expect(v.status).toBe('fail');
      expect(result.scores.consistency).toBeLessThan(100);
    });
  });

  describe('UTILIDAD_COHERENTE', () => {
    it('aprueba cuando la utilidad es menor o igual a los ingresos', async () => {
      const text = 'Ingresos: 500,000 Utilidad Neta: 80,000';
      const result = await validateDocumentContent('doc-13', 'EDOS_FINANCIEROS', text);
      expect(findVerification(result, 'UTILIDAD_COHERENTE').status).toBe('pass');
    });

    it('marca inconsistencia cuando la utilidad excede los ingresos', async () => {
      const text = 'Ingresos: 500,000 Utilidad Neta: 900,000';
      const result = await validateDocumentContent('doc-14', 'EDOS_FINANCIEROS', text);
      expect(findVerification(result, 'UTILIDAD_COHERENTE').status).toBe('fail');
    });
  });

  describe('FRAUD_METADATA_EDIT', () => {
    it('detecta software de edición sospechoso en los metadatos del PDF', async () => {
      getExtraction.mockResolvedValue({
        extracted_data: { pdfMetadata: { Creator: 'Adobe Photoshop', Producer: 'Photoshop PDF' } }
      });
      const result = await validateDocumentContent('doc-15', 'RFC_CSF', 'RFC ABC010101AB1, estatus ACTIVO');
      const v = findVerification(result, 'FRAUD_METADATA_EDIT');
      expect(v.status).toBe('warning');
      expect(result.scores.authenticity).toBeLessThan(100);
    });

    it('aprueba metadatos limpios sin software sospechoso', async () => {
      getExtraction.mockResolvedValue({
        extracted_data: { pdfMetadata: { Creator: 'Microsoft Word', Producer: 'Microsoft Word' } }
      });
      const result = await validateDocumentContent('doc-16', 'RFC_CSF', 'RFC ABC010101AB1, estatus ACTIVO');
      expect(findVerification(result, 'FRAUD_METADATA_EDIT').status).toBe('pass');
    });
  });

  it('mantiene todos los scores dentro del rango [0, 100]', async () => {
    const result = await validateDocumentContent('doc-17', 'OPINION_32D', 'NEGATIVA');
    Object.values(result.scores).forEach(score => {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  // Expansion multi-pais: IDs fiscales/nacionales con digito verificador.
  describe('IDs fiscales internacionales', () => {
    it('CO_NIT_FORMAT: aprueba un NIT colombiano con digito verificador correcto', async () => {
      const result = await validateDocumentContent('doc-co-1', 'CO_NIT_RUT', 'RUT - DIAN. NIT: 899999068-1. Razon social: Ecopetrol S.A.');
      expect(findVerification(result, 'CO_NIT_FORMAT').status).toBe('pass');
    });

    it('CO_NIT_FORMAT: marca fallo cuando el digito verificador es incorrecto', async () => {
      const result = await validateDocumentContent('doc-co-2', 'CO_NIT_RUT', 'NIT: 899999068-5');
      expect(findVerification(result, 'CO_NIT_FORMAT').status).toBe('fail');
      expect(result.scores.authenticity).toBeLessThan(100);
    });

    it('CO_NIT_FORMAT: marca warning cuando no se detecta ningun NIT', async () => {
      const result = await validateDocumentContent('doc-co-3', 'CO_NIT_RUT', 'Documento sin identificador fiscal visible');
      expect(findVerification(result, 'CO_NIT_FORMAT').status).toBe('warning');
    });

    it('AR_CUIT_FORMAT: aprueba un CUIT argentino valido', async () => {
      const result = await validateDocumentContent('doc-ar-1', 'AR_CUIT', 'CUIT: 20-12345678-6. AFIP - Constancia de Inscripcion');
      expect(findVerification(result, 'AR_CUIT_FORMAT').status).toBe('pass');
    });

    it('AR_CUIT_FORMAT: marca fallo con digito verificador incorrecto', async () => {
      const result = await validateDocumentContent('doc-ar-2', 'AR_CUIT', 'CUIT: 20-12345678-9');
      expect(findVerification(result, 'AR_CUIT_FORMAT').status).toBe('fail');
    });

    it('PE_RUC_FORMAT: aprueba un RUC peruano valido', async () => {
      const result = await validateDocumentContent('doc-pe-1', 'PE_RUC', 'RUC: 20100070971. SUNAT');
      expect(findVerification(result, 'PE_RUC_FORMAT').status).toBe('pass');
    });

    it('CL_RUT_FORMAT: aprueba un RUT chileno con digito verificador K', async () => {
      const result = await validateDocumentContent('doc-cl-1', 'CL_RUT', 'RUT: 1000005-K. Servicio de Impuestos Internos');
      expect(findVerification(result, 'CL_RUT_FORMAT').status).toBe('pass');
    });

    it('US_EIN_FORMAT: aprueba un EIN con prefijo valido', async () => {
      const result = await validateDocumentContent('doc-us-1', 'US_EIN', 'Internal Revenue Service. EIN: 12-3456789');
      expect(findVerification(result, 'US_EIN_FORMAT').status).toBe('pass');
    });

    it('US_EIN_FORMAT: marca fallo con un prefijo que el IRS nunca asigna', async () => {
      const result = await validateDocumentContent('doc-us-2', 'US_EIN', 'EIN: 07-3456789');
      expect(findVerification(result, 'US_EIN_FORMAT').status).toBe('fail');
    });

    it('US_SSN_FORMAT: aprueba un SSN con formato y rangos validos', async () => {
      const result = await validateDocumentContent('doc-us-3', 'US_SSN_CARD', 'Social Security Number: 123-45-6789');
      expect(findVerification(result, 'US_SSN_FORMAT').status).toBe('pass');
    });

    it('CA_SIN_FORMAT: aprueba un SIN canadiense valido (Luhn)', async () => {
      const result = await validateDocumentContent('doc-ca-1', 'CA_SIN', 'Social Insurance Number SIN: 046 454 286');
      expect(findVerification(result, 'CA_SIN_FORMAT').status).toBe('pass');
    });

    it('CA_SIN_FORMAT: marca fallo cuando el Luhn no cuadra', async () => {
      const result = await validateDocumentContent('doc-ca-2', 'CA_SIN', 'SIN: 046 454 287');
      expect(findVerification(result, 'CA_SIN_FORMAT').status).toBe('fail');
    });

    it('BO_NIT_FORMAT: aprueba solo por formato (sin algoritmo de digito verificador)', async () => {
      const result = await validateDocumentContent('doc-bo-1', 'BO_NIT', 'NIT: 1234567015. Servicio de Impuestos Nacionales');
      expect(findVerification(result, 'BO_NIT_FORMAT').status).toBe('pass');
    });

    it('un documentType sin regla de ID asociada no agrega ninguna verificacion de ID', async () => {
      const result = await validateDocumentContent('doc-co-4', 'CO_CERT_EXISTENCIA', 'Certificado de Existencia y Representacion Legal');
      expect(result.verifications.some(v => v.rule_code?.endsWith('_FORMAT'))).toBe(false);
    });
  });

  describe('COUNTRY_MISMATCH', () => {
    it('aprueba cuando el pais detectado coincide con el declarado', async () => {
      const result = await validateDocumentContent(
        'doc-mismatch-1',
        'CO_CEDULA',
        'REPUBLICA DE COLOMBIA REGISTRADURIA NACIONAL CEDULA DE CIUDADANIA',
        'CO'
      );
      expect(findVerification(result, 'COUNTRY_MISMATCH').status).toBe('pass');
    });

    it('marca warning cuando el expediente declara un pais distinto al detectado en el documento', async () => {
      const result = await validateDocumentContent(
        'doc-mismatch-2',
        'CO_CEDULA',
        'INSTITUTO NACIONAL ELECTORAL CLAVE DE ELECTOR ESTADOS UNIDOS MEXICANOS',
        'CO'
      );
      const v = findVerification(result, 'COUNTRY_MISMATCH');
      expect(v.status).toBe('warning');
      expect(result.scores.consistency).toBeLessThan(100);
    });

    it('no agrega la verificacion si no hay señales de pais detectables en el texto', async () => {
      const result = await validateDocumentContent('doc-mismatch-3', 'RFC_CSF', 'texto sin ninguna señal de pais', 'MX');
      expect(findVerification(result, 'COUNTRY_MISMATCH')).toBeUndefined();
    });
  });
});
