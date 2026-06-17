import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/documentIntelligenceService.js', () => ({
  saveVerifications: vi.fn().mockResolvedValue(undefined),
  saveScore: vi.fn().mockResolvedValue(undefined),
  getExtraction: vi.fn().mockResolvedValue(null),
  logAgentAction: vi.fn().mockResolvedValue(undefined)
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
});
