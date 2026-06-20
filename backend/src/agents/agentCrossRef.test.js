import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/documentIntelligenceService.js', () => ({
  getExtraction: vi.fn(),
  logAgentAction: vi.fn().mockResolvedValue(undefined),
  saveCrossReferences: vi.fn().mockResolvedValue([])
}));

vi.mock('../config/supabase.js', () => ({
  supabase: {},
  supabaseAdmin: { from: vi.fn() }
}));

import { runCrossReferencesForExpediente } from './agentCrossRef.js';
import { getExtraction, saveCrossReferences } from '../services/documentIntelligenceService.js';
import { supabaseAdmin } from '../config/supabase.js';

function makeBuilder(result) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    insert: vi.fn(() => Promise.resolve(result)),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject)
  };
  return builder;
}

function setupDocuments(documents) {
  const documentsBuilder = makeBuilder({ data: documents, error: null });
  supabaseAdmin.from.mockImplementation((table) => {
    if (table === 'documents') return documentsBuilder;
    throw new Error(`Tabla inesperada: ${table}`);
  });
  return { documentsBuilder };
}

function mockExtractions(map) {
  getExtraction.mockImplementation(async (docId) => {
    const textContent = map[docId];
    if (textContent === undefined) return null;
    return { extracted_data: { textContent } };
  });
}

describe('agentCrossRef.runCrossReferencesForExpediente', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna mensaje informativo cuando hay menos de 2 documentos', async () => {
    setupDocuments([{ id: 'd1', filename: 'a.pdf', document_type: 'RFC_CSF' }]);
    const result = await runCrossReferencesForExpediente('exp-1');
    expect(result.success).toBe(true);
    expect(result.message).toMatch(/al menos 2 documentos/);
  });

  it('RFC_MATCH: aprueba cuando CSF y Acta comparten el mismo RFC', async () => {
    setupDocuments([
      { id: 'csf', filename: 'csf.pdf', document_type: 'RFC_CSF' },
      { id: 'acta', filename: 'acta.pdf', document_type: 'ACTA_CONST' }
    ]);
    mockExtractions({
      csf: 'Contribuyente con RFC ABC010101AB1 estatus activo',
      acta: 'Sociedad constituida con RFC ABC010101AB1 ante notario'
    });
    const result = await runCrossReferencesForExpediente('exp-2');
    const rfcCheck = result.crossReferences.find(c => c.cross_reference_type === 'RFC_MATCH');
    expect(rfcCheck.status).toBe('pass');
    expect(rfcCheck.confidence_score).toBe(100);
  });

  it('RFC_MATCH: falla cuando no hay RFC en común', async () => {
    setupDocuments([
      { id: 'csf', filename: 'csf.pdf', document_type: 'RFC_CSF' },
      { id: 'acta', filename: 'acta.pdf', document_type: 'ACTA_CONST' }
    ]);
    mockExtractions({
      csf: 'RFC ABC010101AB1',
      acta: 'RFC XYZ020202XY2'
    });
    const result = await runCrossReferencesForExpediente('exp-3');
    const rfcCheck = result.crossReferences.find(c => c.cross_reference_type === 'RFC_MATCH');
    expect(rfcCheck.status).toBe('fail');
    expect(rfcCheck.confidence_score).toBe(0);
  });

  it('RAZON_SOCIAL_MATCH: aprueba cuando el nombre coincide aunque cambie el régimen societario', async () => {
    setupDocuments([
      { id: 'csf', filename: 'csf.pdf', document_type: 'RFC_CSF' },
      { id: 'acta', filename: 'acta.pdf', document_type: 'ACTA_CONST' }
    ]);
    mockExtractions({
      csf: 'Denominación o Razón Social: COMERCIALIZADORA AZTECA SA DE CV',
      acta: 'Denominación o Razón Social COMERCIALIZADORA AZTECA SAPI DE CV'
    });
    const result = await runCrossReferencesForExpediente('exp-4');
    const check = result.crossReferences.find(c => c.cross_reference_type === 'RAZON_SOCIAL_MATCH');
    expect(check.status).toBe('pass');
  });

  it('DOMICILIO_CP_MATCH: warning cuando el código postal coincide pero la calle no', async () => {
    setupDocuments([
      { id: 'csf', filename: 'csf.pdf', document_type: 'RFC_CSF' },
      { id: 'comp', filename: 'comp.pdf', document_type: 'COMP_DOMICILIO' }
    ]);
    mockExtractions({
      csf: 'Código Postal 06600 Calle Reforma 100',
      comp: 'Código Postal 06600 Avenida Insurgentes 500'
    });
    const result = await runCrossReferencesForExpediente('exp-5');
    const check = result.crossReferences.find(c => c.cross_reference_type === 'DOMICILIO_CP_MATCH');
    expect(check.status).toBe('warning');
    expect(check.confidence_score).toBe(50);
  });

  it('REPRESENTANTE_MATCH: aprueba cuando el representante del acta firma los estados financieros', async () => {
    setupDocuments([
      { id: 'acta', filename: 'acta.pdf', document_type: 'ACTA_CONST' },
      { id: 'edos', filename: 'edos.pdf', document_type: 'EDOS_FINANCIEROS' }
    ]);
    mockExtractions({
      acta: 'Representante legal: JUAN PEREZ GOMEZ',
      edos: 'Firmado por: JUAN PEREZ GOMEZ'
    });
    const result = await runCrossReferencesForExpediente('exp-6');
    const check = result.crossReferences.find(c => c.cross_reference_type === 'REPRESENTANTE_MATCH');
    expect(check.status).toBe('pass');
  });

  it('delega el guardado de cruces en saveCrossReferences', async () => {
    setupDocuments([
      { id: 'csf', filename: 'csf.pdf', document_type: 'RFC_CSF' },
      { id: 'acta', filename: 'acta.pdf', document_type: 'ACTA_CONST' }
    ]);
    mockExtractions({ csf: 'RFC ABC010101AB1', acta: 'RFC ABC010101AB1' });
    await runCrossReferencesForExpediente('exp-7');
    expect(saveCrossReferences).toHaveBeenCalledWith('exp-7', expect.arrayContaining([
      expect.objectContaining({ cross_reference_type: 'RFC_MATCH', status: 'pass' })
    ]));
  });
});
