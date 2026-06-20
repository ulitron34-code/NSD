import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../config/supabase.js', () => ({
  supabaseAdmin: { from: vi.fn() }
}));

import { supabaseAdmin } from '../config/supabase.js';
import { saveVerifications, getVerifications, getDocumentRedFlags, saveCrossReferences, getCrossReferences } from './documentIntelligenceService.js';

// Regresion para el bug real encontrado en produccion: la tabla
// document_verifications (NAGMAR_SCHEMA_V3_FINAL.sql) usa la columna
// "result", no "status", y no tiene columna "findings". El codigo de los
// agentes (agentValidator/agentFinancial) sigue trabajando internamente con
// {status, findings} -- estos tests verifican que documentIntelligenceService
// traduzca correctamente hacia/desde el nombre real de las columnas.
describe('saveVerifications', () => {
  beforeEach(() => vi.clearAllMocks());

  it('inserta usando la columna real "result" (no "status") y completa los NOT NULL del esquema', async () => {
    const deleteEq = vi.fn().mockResolvedValue({ data: null, error: null });
    const insertSelect = vi.fn().mockResolvedValue({
      data: [{ document_id: 'doc-1', rule_code: 'RFC_FORMAT', result: 'pass', severity: 'info', details: { findings: 'ok' }, message_es: 'ok' }],
      error: null
    });
    const insert = vi.fn(() => ({ select: insertSelect }));
    supabaseAdmin.from.mockReturnValue({
      delete: () => ({ eq: deleteEq }),
      insert
    });

    await saveVerifications('doc-1', [
      { rule_code: 'RFC_FORMAT', status: 'pass', severity: 'info', findings: 'ok' }
    ], 'AgentValidator');

    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({
        document_id: 'doc-1',
        rule_code: 'RFC_FORMAT',
        result: 'pass',
        verification_type: 'RFC_FORMAT',
        verified_by: 'AgentValidator',
        details: { findings: 'ok' }
      })
    ]);
    const insertedRow = insert.mock.calls[0][0][0];
    expect(insertedRow.status).toBeUndefined();
    expect(insertedRow.findings).toBeUndefined();
  });

  it('marca is_red_flag true para status fail/warning y false para pass', async () => {
    const insert = vi.fn(() => ({ select: vi.fn().mockResolvedValue({ data: [], error: null }) }));
    supabaseAdmin.from.mockReturnValue({ delete: () => ({ eq: vi.fn().mockResolvedValue({}) }), insert });

    await saveVerifications('doc-1', [
      { rule_code: 'A', status: 'fail', severity: 'critical', findings: 'mal' },
      { rule_code: 'B', status: 'pass', severity: 'info', findings: 'bien' }
    ]);

    const rows = insert.mock.calls[0][0];
    expect(rows[0].is_red_flag).toBe(true);
    expect(rows[1].is_red_flag).toBe(false);
  });

  it('devuelve [] sin tocar supabase si no hay verificaciones', async () => {
    const result = await saveVerifications('doc-1', []);
    expect(result).toEqual([]);
    expect(supabaseAdmin.from).not.toHaveBeenCalled();
  });
});

describe('getVerifications', () => {
  beforeEach(() => vi.clearAllMocks());

  it('mapea result -> status y details.findings -> findings al leer', async () => {
    const eq = vi.fn().mockResolvedValue({
      data: [{ document_id: 'doc-1', rule_code: 'X', result: 'warning', severity: 'medium', details: { findings: 'ojo aqui' } }],
      error: null
    });
    supabaseAdmin.from.mockReturnValue({ select: () => ({ eq }) });

    const result = await getVerifications('doc-1');
    expect(result[0].status).toBe('warning');
    expect(result[0].findings).toBe('ojo aqui');
  });
});

describe('getDocumentRedFlags', () => {
  beforeEach(() => vi.clearAllMocks());

  it('filtra por la columna real "result", no "status"', async () => {
    const inFilter = vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) });
    const eq = vi.fn(() => ({ in: inFilter }));
    supabaseAdmin.from.mockReturnValue({ select: () => ({ eq }) });

    await getDocumentRedFlags('doc-1');

    expect(inFilter).toHaveBeenCalledWith('result', ['fail', 'warning']);
  });
});

// Regresion para el mismo tipo de bug en cross_references: la tabla real usa
// expediente_id/document_a_id/document_b_id/field_name/match_result/
// similarity_score/message_es, no order_id/source_document_id/
// target_document_id/cross_reference_type/status/confidence_score/details
// (shape interno que siguen usando agentCrossRef.js y agentRiskScorer.js).
describe('saveCrossReferences', () => {
  beforeEach(() => vi.clearAllMocks());

  it('traduce el shape interno a las columnas reales de cross_references', async () => {
    const deleteEq = vi.fn().mockResolvedValue({ data: null, error: null });
    const insertSelect = vi.fn().mockResolvedValue({ data: [], error: null });
    const insert = vi.fn(() => ({ select: insertSelect }));
    supabaseAdmin.from.mockReturnValue({ delete: () => ({ eq: deleteEq }), insert });

    await saveCrossReferences('exp-1', [{
      order_id: 'exp-1',
      source_document_id: 'doc-a',
      target_document_id: 'doc-b',
      cross_reference_type: 'RFC_MATCH',
      status: 'fail',
      confidence_score: 0,
      details: 'no coincide'
    }]);

    expect(deleteEq).toHaveBeenCalledWith('expediente_id', 'exp-1');
    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({
        expediente_id: 'exp-1',
        document_a_id: 'doc-a',
        document_b_id: 'doc-b',
        field_name: 'RFC_MATCH',
        match_result: 'fail',
        similarity_score: 0,
        is_critical: true,
        message_es: 'no coincide'
      })
    ]);
    const insertedRow = insert.mock.calls[0][0][0];
    expect(insertedRow.order_id).toBeUndefined();
    expect(insertedRow.status).toBeUndefined();
  });

  it('borra los cruces previos aunque la lista nueva venga vacia', async () => {
    const deleteEq = vi.fn().mockResolvedValue({ data: null, error: null });
    const insert = vi.fn();
    supabaseAdmin.from.mockReturnValue({ delete: () => ({ eq: deleteEq }), insert });

    const result = await saveCrossReferences('exp-1', []);
    expect(deleteEq).toHaveBeenCalledWith('expediente_id', 'exp-1');
    expect(insert).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});

describe('getCrossReferences', () => {
  beforeEach(() => vi.clearAllMocks());

  it('filtra por expediente_id y mapea match_result -> status al leer', async () => {
    const eq = vi.fn().mockResolvedValue({
      data: [{ expediente_id: 'exp-1', field_name: 'RFC_MATCH', match_result: 'pass', similarity_score: 100, message_es: 'ok' }],
      error: null
    });
    supabaseAdmin.from.mockReturnValue({ select: () => ({ eq }) });

    const result = await getCrossReferences('exp-1');
    expect(eq).toHaveBeenCalledWith('expediente_id', 'exp-1');
    expect(result[0].status).toBe('pass');
    expect(result[0].cross_reference_type).toBe('RFC_MATCH');
    expect(result[0].details).toBe('ok');
  });
});
