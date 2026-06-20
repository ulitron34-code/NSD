import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as XLSX from 'xlsx';

vi.mock('../services/documentIntelligenceService.js', () => ({
  saveExtraction: vi.fn().mockResolvedValue(undefined),
  saveVerifications: vi.fn().mockResolvedValue(undefined),
  getExtraction: vi.fn(),
  logAgentAction: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('../config/supabase.js', () => ({
  supabase: {},
  supabaseAdmin: { from: vi.fn(), storage: { from: vi.fn() } }
}));

import {
  extractFinancialFieldsDeterministically,
  analyzeFinancialDocument,
  collectMonetaryAmounts,
  analyzeBenfordLaw
} from './agentFinancial.js';
import { saveExtraction, saveVerifications, getExtraction } from '../services/documentIntelligenceService.js';
import { supabaseAdmin } from '../config/supabase.js';

function buildWorkbook(rows) {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, 'EEFF');
  return wb;
}

function makeBuilder(result) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    single: vi.fn(() => Promise.resolve(result)),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject)
  };
  return builder;
}

describe('extractFinancialFieldsDeterministically', () => {
  it('extrae los campos financieros por palabra clave en celdas contiguas', () => {
    const wb = buildWorkbook([
      ['Concepto', 'Valor'],
      ['Activo Total', 500000],
      ['Pasivo Total', 300000],
      ['Capital Contable', 200000],
      ['Ingresos Netos', '$1,200,000'],
      ['Utilidad Neta', 90000],
      ['EBITDA', 150000]
    ]);
    const result = extractFinancialFieldsDeterministically(wb);
    expect(result.activo_total).toBe(500000);
    expect(result.pasivo_total).toBe(300000);
    expect(result.capital_contable).toBe(200000);
    expect(result.ingresos_netos).toBe(1200000);
    expect(result.utilidad_neta).toBe(90000);
    expect(result.ebitda).toBe(150000);
  });

  it('conserva el primer valor encontrado y no lo sobrescribe con coincidencias posteriores', () => {
    const wb = buildWorkbook([
      ['Activo Total', 500000],
      ['Total de Activos', 999999]
    ]);
    const result = extractFinancialFieldsDeterministically(wb);
    expect(result.activo_total).toBe(500000);
  });

  it('deja el campo en null si la etiqueta no tiene un número en las celdas contiguas', () => {
    const wb = buildWorkbook([
      ['Activo Total', 'Ver anexo']
    ]);
    const result = extractFinancialFieldsDeterministically(wb);
    expect(result.activo_total).toBeNull();
  });

  it('extrae ROE y ROA cuando vienen etiquetados explicitamente', () => {
    const wb = buildWorkbook([
      ['ROE', 0.18],
      ['ROA', 0.09]
    ]);
    const result = extractFinancialFieldsDeterministically(wb);
    expect(result.roe).toBe(0.18);
    expect(result.roa).toBe(0.09);
  });
});

describe('collectMonetaryAmounts', () => {
  it('descarta valores pequenos y reconoce montos en formato moneda', () => {
    const wb = buildWorkbook([
      ['Renglon', 5],
      ['Activo Total', 1000000],
      ['Ingresos', '$250,000'],
      ['Porcentaje', 0.15]
    ]);
    const amounts = collectMonetaryAmounts(wb);
    expect(amounts).toContain(1000000);
    expect(amounts).toContain(250000);
    expect(amounts).not.toContain(5);
  });
});

describe('analyzeBenfordLaw', () => {
  it('responde "skipped" cuando la muestra es insuficiente', () => {
    const result = analyzeBenfordLaw([100, 200, 300]);
    expect(result.status).toBe('skipped');
  });

  it('responde "normal" para una distribucion que sigue la Ley de Benford', () => {
    // Una progresion geometrica conforma de manera natural y conocida con Benford.
    const amounts = Array.from({ length: 90 }, (_, i) => 100 * Math.pow(1.05, i));
    const result = analyzeBenfordLaw(amounts);
    expect(result.status).toBe('normal');
  });

  it('responde "anomalous" cuando todos los montos comparten el mismo primer digito', () => {
    const amounts = Array.from({ length: 40 }, (_, i) => 900000 + i * 1000);
    const result = analyzeBenfordLaw(amounts);
    expect(result.status).toBe('anomalous');
  });
});

describe('analyzeFinancialDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function setup({ extraction, document, benchmarks, workbookRows }) {
    const documentBuilder = makeBuilder({ data: document, error: null });
    const benchmarksBuilder = makeBuilder({ data: benchmarks, error: null });

    getExtraction.mockResolvedValue(extraction);
    supabaseAdmin.from.mockImplementation((table) => {
      if (table === 'documents') return documentBuilder;
      if (table === 'ref_financial_benchmarks') return benchmarksBuilder;
      throw new Error(`Tabla inesperada: ${table}`);
    });

    const xlsxBuffer = XLSX.write(buildWorkbook(workbookRows), { type: 'buffer', bookType: 'xlsx' });
    supabaseAdmin.storage.from.mockReturnValue({
      download: vi.fn().mockResolvedValue({
        data: { arrayBuffer: async () => xlsxBuffer },
        error: null
      })
    });
  }

  it('lanza error si no existe la extracción del documento', async () => {
    getExtraction.mockResolvedValue(null);
    await expect(analyzeFinancialDocument('doc-x')).rejects.toThrow(/Extracción de texto no encontrada/);
  });

  it('extrae métricas del Excel, calcula ratios derivados y aprueba benchmarks saludables', async () => {
    setup({
      extraction: { extracted_data: { textContent: '' }, confidence_score: 90 },
      document: { filename: 'eeff.xlsx', storage_path: 'docs/eeff.xlsx' },
      benchmarks: [
        { metric_name: 'net_margin', min_val: '0.05', max_val: '0.25' },
        { metric_name: 'leverage', max_val: '2.5' },
        { metric_name: 'dscr', min_val: '1.2' }
      ],
      workbookRows: [
        ['Activo Total', 1000000],
        ['Pasivo Total', 400000],
        ['Capital Contable', 600000],
        ['Ingresos Netos', 800000],
        ['Utilidad Neta', 100000],
        ['EBITDA', 200000]
      ]
    });

    const result = await analyzeFinancialDocument('doc-1', 'Comercio');

    expect(result.metrics.activo_total).toBe(1000000);
    expect(result.metrics.apalancamiento).toBeCloseTo(0.67, 2);
    expect(result.metrics.dscr).toBeGreaterThan(0);

    const margin = result.verifications.find(v => v.rule_code === 'BENCHMARK_MARGEN_NETO');
    expect(margin.status).toBe('pass');
    const leverage = result.verifications.find(v => v.rule_code === 'BENCHMARK_APALANCAMIENTO');
    expect(leverage.status).toBe('pass');
    expect(result.metrics.roe).toBe(0.1667);
    expect(result.metrics.roa).toBe(0.1);
    expect(result.verifications.find(v => v.rule_code === 'FORENSE_ROE_ANOMALO').status).toBe('pass');
    expect(result.verifications.find(v => v.rule_code === 'FORENSE_ROA_ANOMALO').status).toBe('pass');

    expect(saveVerifications).toHaveBeenCalledWith('doc-1', result.verifications, 'AgentFinancial');
    expect(saveExtraction).toHaveBeenCalled();
  });

  it('marca warning de apalancamiento elevado cuando supera el máximo del sector', async () => {
    setup({
      extraction: { extracted_data: { textContent: '' }, confidence_score: 90 },
      document: { filename: 'eeff.xlsx', storage_path: 'docs/eeff.xlsx' },
      benchmarks: [{ metric_name: 'leverage', max_val: '2.5' }],
      workbookRows: [
        ['Pasivo Total', 900000],
        ['Capital Contable', 100000]
      ]
    });

    const result = await analyzeFinancialDocument('doc-2', 'Comercio');
    const leverage = result.verifications.find(v => v.rule_code === 'BENCHMARK_APALANCAMIENTO');
    expect(leverage.status).toBe('warning');
  });

  it('marca critico un ROE mayor a 100% (rentabilidad extremadamente atipica)', async () => {
    setup({
      extraction: { extracted_data: { textContent: '' }, confidence_score: 90 },
      document: { filename: 'eeff.xlsx', storage_path: 'docs/eeff.xlsx' },
      benchmarks: [],
      workbookRows: [
        ['Utilidad Neta', 500000],
        ['Capital Contable', 100000]
      ]
    });

    const result = await analyzeFinancialDocument('doc-3', 'Comercio');
    const roeCheck = result.verifications.find(v => v.rule_code === 'FORENSE_ROE_ANOMALO');
    expect(roeCheck.status).toBe('fail');
    expect(roeCheck.severity).toBe('critical');
  });

  it('marca warning de Ley de Benford cuando los montos del Excel no conforman con la distribucion esperada', async () => {
    const suspiciousRows = Array.from({ length: 40 }, (_, i) => [`Concepto ${i}`, 900000 + i * 1000]);
    setup({
      extraction: { extracted_data: { textContent: '' }, confidence_score: 90 },
      document: { filename: 'eeff.xlsx', storage_path: 'docs/eeff.xlsx' },
      benchmarks: [],
      workbookRows: suspiciousRows
    });

    const result = await analyzeFinancialDocument('doc-4', 'Comercio');
    const benfordCheck = result.verifications.find(v => v.rule_code === 'FORENSE_BENFORD_LAW');
    expect(benfordCheck.status).toBe('warning');
    expect(result.benfordAnalysis.status).toBe('anomalous');
  });
});
