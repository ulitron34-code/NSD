import { describe, it, expect } from 'vitest';
import { buildReadinessMemo } from './readinessMemoService.js';

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
});
