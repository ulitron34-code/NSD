import { describe, it, expect } from 'vitest';
import { buildReadinessMemo, buildReadinessMemoPdf, buildReadinessTechnicalMemo, buildReadinessTechnicalMemoPdf } from './readinessMemoService.js';

function buildChecklist(overrides = {}) {
  const items = [
    { id: 'doc_corporativa', critico: false, estado: 'listo', reviewScore: 85, reviewFindings: ['Documentación completa'] },
    { id: 'marco_riesgos', critico: true, estado: 'pendiente', reviewScore: null, reviewFindings: [] },
    { id: 'esg', critico: true, estado: 'pendiente', enRevision: true, reviewScore: null, reviewFindings: [] },
  ];
  return { items: items.map((item) => ({ ...item, ...(overrides[item.id] || {}) })) };
}

describe('buildReadinessMemo', () => {
  it('marca criticosPendientes y readyToSubmit=false cuando hay criticos sin listo', () => {
    const result = buildReadinessMemo(buildChecklist(), { case_number: 'NSD-TEST01', project_name: 'Proyecto Demo' });

    expect(result.criticalPending).toBe(2);
    expect(result.readyToSubmit).toBe(false);
    expect(result.memo.format).toBe('markdown');
    expect(result.memo.content).toContain('NSD-TEST01');
    expect(result.memo.content).toContain('Marco de gestión de riesgos');
  });

  it('readyToSubmit=true cuando no hay criticos pendientes', () => {
    const checklist = buildChecklist({
      marco_riesgos: { estado: 'listo' },
      esg: { estado: 'listo', enRevision: false },
    });
    const result = buildReadinessMemo(checklist, { case_number: 'NSD-TEST02' });

    expect(result.criticalPending).toBe(0);
    expect(result.readyToSubmit).toBe(true);
  });

  it('incluye el score y hallazgos reales en el detalle por requisito', () => {
    const result = buildReadinessMemo(buildChecklist(), {});
    expect(result.memo.content).toContain('Score IA: 85/100');
    expect(result.memo.content).toContain('Documentación completa');
  });

  it('usa el pais del expediente para el resumen y las etiquetas localizadas', () => {
    const checklist = {
      country: 'CO',
      items: [{ id: 'identificacion_oficial', critico: true, estado: 'pendiente', reviewScore: null, reviewFindings: [] }]
    };
    const result = buildReadinessMemo(checklist, { case_number: 'NSD-TEST03' });

    expect(result.memo.content).toContain('País: CO');
    expect(result.memo.content).toContain('Cédula de Ciudadanía');
  });
});

describe('buildReadinessMemoPdf', () => {
  it('genera un PDF válido con el mismo cálculo de críticos pendientes que el Markdown', async () => {
    const checklist = buildChecklist();
    const result = await buildReadinessMemoPdf(checklist, { case_number: 'NSD-TEST01', project_name: 'Proyecto Demo' });

    expect(result.criticalPending).toBe(2);
    expect(result.readyToSubmit).toBe(false);
    expect(result.caseNumber).toBe('NSD-TEST01');
    expect(Buffer.isBuffer(result.buffer)).toBe(true);
    expect(result.buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  });

  it('readyToSubmit=true cuando no hay criticos pendientes', async () => {
    const checklist = buildChecklist({
      marco_riesgos: { estado: 'listo' },
      esg: { estado: 'listo', enRevision: false },
    });
    const result = await buildReadinessMemoPdf(checklist, {});

    expect(result.criticalPending).toBe(0);
    expect(result.readyToSubmit).toBe(true);
  });
});

describe('buildReadinessTechnicalMemo', () => {
  it('es un reporte distinto del ejecutivo: incluye score por modulo, resumen, recomendacion e inconsistencias', () => {
    const checklist = {
      country: 'MX',
      items: [
        { id: 'doc_corporativa', critico: false, estado: 'listo', reviewScore: 85, reviewSummary: 'Documentacion completa y vigente.', recommendation: 'Actualizar comprobante de domicilio.', reviewFindings: ['Documentación completa'] },
        { id: 'marco_riesgos', critico: true, estado: 'pendiente', reviewScore: null, reviewFindings: [] },
      ]
    };
    const inconsistencies = [{ field: 'monto_solicitado', message: '"monto_solicitado" no coincide entre plan.pdf (500000) y modelo.xlsx (450000).' }];

    const result = buildReadinessTechnicalMemo(checklist, { case_number: 'NSD-TEST04' }, inconsistencies);

    expect(result.memo.content).toContain('Reporte Técnico de Due Diligence');
    expect(result.memo.content).toContain('peso 10%');
    expect(result.memo.content).toContain('Resumen: Documentacion completa y vigente.');
    expect(result.memo.content).toContain('Recomendación: Actualizar comprobante de domicilio.');
    expect(result.memo.content).toContain('monto_solicitado');
    expect(result.globalScore.score).toBeGreaterThanOrEqual(0);
  });

  it('reporta "ninguna contradiccion" cuando no hay inconsistencias', () => {
    const checklist = { country: 'MX', items: [{ id: 'plan_negocios', critico: false, estado: 'listo', reviewScore: 90, reviewFindings: [] }] };
    const result = buildReadinessTechnicalMemo(checklist, {}, []);
    expect(result.memo.content).toContain('Ninguna contradicción detectada');
  });
});

describe('buildReadinessTechnicalMemoPdf', () => {
  it('genera un PDF valido con score por modulo e inconsistencias', async () => {
    const checklist = { country: 'MX', items: [{ id: 'modelo_financiero', critico: false, estado: 'listo', reviewScore: 70, reviewFindings: [] }] };
    const result = await buildReadinessTechnicalMemoPdf(checklist, { case_number: 'NSD-TEST05' }, []);

    expect(Buffer.isBuffer(result.buffer)).toBe(true);
    expect(result.buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(result.caseNumber).toBe('NSD-TEST05');
  });
});
