import { describe, it, expect, vi } from 'vitest';

// readinessRubricAgent.js ahora importa agentFinancial.js/documentIntelligenceService.js
// (para consistencia financiera real y riesgo por cruces documentales), que a
// su vez importan config/supabase.js -- ese modulo lanza un error al importarse
// si no hay SUPABASE_URL/SUPABASE_KEY en el entorno (como en CI/tests). Se
// mockea con el mismo patron que ya usan readinessChecklistService.test.js y
// readinessCrossRefAgent.test.js.
vi.mock('../config/supabase.js', () => ({
  supabaseAdmin: { from: vi.fn(() => ({})) }
}));

vi.mock('../services/documentIntelligenceService.js', () => ({
  getCrossReferences: vi.fn(async () => []),
  logAgentAction: vi.fn(async () => {}),
  saveExtraction: vi.fn(async () => {}),
  saveVerifications: vi.fn(async () => {}),
  getExtraction: vi.fn(async () => null)
}));

// GLEIF es una API publica real (sin key) -- se mockea en tests para no
// depender de red/rate-limits; la integracion real se prueba por separado en
// gleifService.test.js.
vi.mock('../services/gleifService.js', () => ({
  searchLegalEntity: vi.fn(async () => ({ matches: [] }))
}));

import { evaluateReadinessDocument } from './readinessRubricAgent.js';
import { getCrossReferences } from '../services/documentIntelligenceService.js';
import { searchLegalEntity } from '../services/gleifService.js';

// Ninguna de estas pruebas tiene ANTHROPIC_API_KEY en el entorno (igual que
// el resto de la suite del backend), asi que ejercitan los caminos de
// fallback reales, no mocks artificiales.
describe('evaluateReadinessDocument', () => {
  it('cae a heuristica por reglas para un item normal sin ANTHROPIC_API_KEY', async () => {
    const result = await evaluateReadinessDocument({
      documentTypeCode: 'READY_PLAN_NEGOCIOS',
      extractedText: 'Resumen ejecutivo del plan de negocios...',
      order: { metadata: {} }
    });

    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(Array.isArray(result.findings)).toBe(true);
  });

  it('doc_kyc sin RFC en el expediente pide capturar el RFC primero', async () => {
    const result = await evaluateReadinessDocument({
      documentTypeCode: 'READY_DOC_KYC',
      extractedText: '',
      order: { metadata: {} }
    });

    expect(result.score).toBe(0);
    expect(result.missing_items).toContain('RFC del expediente');
  });

  it('doc_kyc con RFC pero sin ANTHROPIC_API_KEY reporta el agente no disponible', async () => {
    const result = await evaluateReadinessDocument({
      documentTypeCode: 'READY_DOC_KYC',
      extractedText: '',
      order: { metadata: { rfc: 'ABC123456XYZ', companyName: 'Empresa Test SA de CV' } }
    });

    expect(result.status).toBe('yellow');
    expect(result.warnings.some((w) => w.includes('ANTHROPIC_API_KEY'))).toBe(true);
  });

  it('doc_kyc para un pais distinto de Mexico no pide RFC y corre screening real de OFAC/PEP', async () => {
    const result = await evaluateReadinessDocument({
      documentTypeCode: 'READY_DOC_KYC',
      extractedText: '',
      order: { metadata: { country: 'CO', companyName: 'Empresa Test SAS' } }
    });

    expect(result.missing_items).not.toContain('RFC del expediente');
    expect(result.summary).toContain('CO');
    expect(result.summary).toContain('buró de crédito local');
    expect(result.missing_items.some((m) => m.includes('buro_local') || m.includes('Buró de crédito'))).toBe(true);
  });

  it('doc_kyc para un pais sin matriz regulatoria conocida sigue corriendo OFAC/PEP y avisa que no hay matriz', async () => {
    const result = await evaluateReadinessDocument({
      documentTypeCode: 'READY_DOC_KYC',
      extractedText: '',
      order: { metadata: { country: 'BR', companyName: 'Empresa Brasil' } }
    });

    expect(result.warnings.some((w) => w.includes('no hay matriz regulatoria'))).toBe(true);
  });

  it('doc_kyc reporta coincidencia real de GLEIF cuando existe LEI para la entidad', async () => {
    searchLegalEntity.mockResolvedValueOnce({
      matches: [{ lei: '549300ABCDEF1234567', legalName: 'Empresa Test SAS', status: 'ACTIVE' }]
    });

    const result = await evaluateReadinessDocument({
      documentTypeCode: 'READY_DOC_KYC',
      extractedText: '',
      order: { metadata: { country: 'CO', companyName: 'Empresa Test SAS' } }
    });

    expect(result.findings.some((f) => f.includes('GLEIF') && f.includes('549300ABCDEF1234567'))).toBe(true);
    expect(result.extracted_data.some((e) => e.key === 'gleif_lei' && e.value === '549300ABCDEF1234567')).toBe(true);
  });

  it('doc_kyc marca pendiente honesto cuando GLEIF no encuentra coincidencia', async () => {
    searchLegalEntity.mockResolvedValueOnce({ matches: [] });

    const result = await evaluateReadinessDocument({
      documentTypeCode: 'READY_DOC_KYC',
      extractedText: '',
      order: { metadata: { country: 'CO', companyName: 'Empresa Sin LEI' } }
    });

    expect(result.missing_items.some((m) => m.includes('GLEIF') && m.includes('no se encontró un LEI'))).toBe(true);
  });

  it('identificacion_oficial usa el nombre de documento del pais del expediente', async () => {
    const result = await evaluateReadinessDocument({
      documentTypeCode: 'READY_IDENTIFICACION_OFICIAL',
      extractedText: '',
      order: { metadata: { country: 'AR' } }
    });

    expect(result.summary).toContain('DNI');
  });

  it('incluye score estructural, recomendacion y bitacora de auditoria en extracted_data', async () => {
    const result = await evaluateReadinessDocument({
      documentTypeCode: 'READY_PLAN_NEGOCIOS',
      extractedText: 'Resumen ejecutivo del plan...',
      order: { metadata: {} }
    });

    const keys = result.extracted_data.map((e) => e.key);
    expect(keys).toContain('structure_score');
    expect(keys).toContain('recomendacion');
    expect(keys).toEqual(expect.arrayContaining(['agent_name', 'model_name', 'prompt_version', 'rubric_version']));
  });

  it('marco_riesgos penaliza el score cuando hay contradicciones reales detectadas por el auditor cruzado', async () => {
    getCrossReferences.mockResolvedValueOnce([]);
    const sinRiesgo = await evaluateReadinessDocument({
      documentTypeCode: 'READY_MARCO_RIESGOS',
      extractedText: 'Matriz de riesgos...',
      order: { id: 'order-1', metadata: {} }
    });

    getCrossReferences.mockResolvedValueOnce([
      { status: 'fail', cross_reference_type: 'monto_solicitado', details: '"monto_solicitado" no coincide entre A y B.' }
    ]);
    const conRiesgo = await evaluateReadinessDocument({
      documentTypeCode: 'READY_MARCO_RIESGOS',
      extractedText: 'Matriz de riesgos...',
      order: { id: 'order-1', metadata: {} }
    });

    expect(conRiesgo.score).toBeLessThan(sinRiesgo.score);
    expect(conRiesgo.findings.some((f) => f.includes('Riesgo real detectado'))).toBe(true);
    expect(conRiesgo.extracted_data.some((e) => e.key === 'contradicciones_detectadas')).toBe(true);
  });

  it('modelo_financiero no truena cuando no hay ANTHROPIC_API_KEY (extractFinancialWithAI regresa null)', async () => {
    const result = await evaluateReadinessDocument({
      documentTypeCode: 'READY_MODELO_FINANCIERO',
      extractedText: 'Estado de resultados...',
      order: { metadata: {} }
    });

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.extracted_data)).toBe(true);
  });

  it('detecta cuando el contenido no corresponde al tipo de documento declarado', async () => {
    const textoIdentificacion = 'Identificación oficial vigente, pasaporte con fotografia legible, nombre completo coincide con el resto del expediente, frente y reverso presente.';
    const result = await evaluateReadinessDocument({
      documentTypeCode: 'READY_ESG',
      extractedText: textoIdentificacion,
      order: { metadata: {} }
    });

    expect(result.findings.some((f) => f.includes('coincide más con'))).toBe(true);
    expect(result.extracted_data.some((e) => e.key === 'tipo_declarado_coincide' && e.value === false)).toBe(true);
    expect(result.score).toBeLessThanOrEqual(50);
  });

  it('no marca mismatch cuando el contenido coincide con el tipo declarado', async () => {
    const textoIdentificacion = 'Identificación oficial vigente, pasaporte con fotografia legible, nombre completo coincide con el resto del expediente, frente y reverso presente.';
    const result = await evaluateReadinessDocument({
      documentTypeCode: 'READY_IDENTIFICACION_OFICIAL',
      extractedText: textoIdentificacion,
      order: { metadata: {} }
    });

    expect(result.extracted_data.some((e) => e.key === 'tipo_declarado_coincide')).toBe(false);
  });

  it('esg reporta cuando no se detecta mencion de ningun marco de referencia reconocido', async () => {
    const result = await evaluateReadinessDocument({
      documentTypeCode: 'READY_ESG',
      extractedText: 'Descripcion generica del impacto social del proyecto, sin mencionar marcos externos.',
      order: { metadata: {} }
    });

    expect(result.missing_items.some((m) => m.includes('marcos de referencia reconocidos'))).toBe(true);
  });

  it('esg detecta mencion real de un marco de referencia reconocido (IFC/GRI)', async () => {
    const result = await evaluateReadinessDocument({
      documentTypeCode: 'READY_ESG',
      extractedText: 'El proyecto reporta su impacto alineado con los IFC Performance Standards y reporta bajo GRI Standards.',
      order: { metadata: {} }
    });

    expect(result.extracted_data.find((e) => e.key === 'marcos_mencionados')?.value).toContain('IFC Performance Standards');
  });

  it('esia agrega recordatorio real de MIA/SEMARNAT cuando el sector declarado es sensible', async () => {
    const result = await evaluateReadinessDocument({
      documentTypeCode: 'READY_ESIA',
      extractedText: 'Descripción de impactos del proyecto inmobiliario...',
      order: { metadata: { sector: 'Inmobiliario' } }
    });

    expect(result.findings.some((f) => f.includes('SEMARNAT') && f.includes('MIA'))).toBe(true);
    expect(result.extracted_data.some((e) => e.key === 'semarnat_mia_aplicable' && e.value === true)).toBe(true);
  });

  it('esia no agrega el recordatorio de MIA/SEMARNAT para sectores no sensibles', async () => {
    const result = await evaluateReadinessDocument({
      documentTypeCode: 'READY_ESIA',
      extractedText: 'Descripción de impactos del proyecto de software...',
      order: { metadata: { sector: 'Tecnología' } }
    });

    expect(result.findings.some((f) => f.includes('SEMARNAT'))).toBe(false);
  });
});
