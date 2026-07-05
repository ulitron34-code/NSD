import { describe, it, expect } from 'vitest';
import { reviewReadinessChecklist } from './aiEngine.js';

function buildItems(overrides = {}) {
  const base = [
    { id: 'doc_corporativa', categoria: 'documentacion', label: { es: 'Documentación Corporativa', en: 'Corporate Documentation' }, critico: false, estado: 'listo' },
    { id: 'marco_riesgos', categoria: 'documentacion', label: { es: 'Marco de Gestión de Riesgos', en: 'Risk Management Framework' }, critico: true, estado: 'pendiente' },
    { id: 'esg', categoria: 'impacto', label: { es: 'Apartado ESG & Impact Financing', en: 'ESG & Impact Financing' }, critico: true, estado: 'pendiente' },
  ];
  return base.map((item) => ({ ...item, ...(overrides[item.id] || {}) }));
}

describe('reviewReadinessChecklist (fallback heurístico, sin ANTHROPIC_API_KEY en test env)', () => {
  it('marca como bloqueantes los requisitos críticos pendientes', async () => {
    const result = await reviewReadinessChecklist(buildItems(), 'es');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.findings.some((f) => f.toLowerCase().includes('bloqueante'))).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('reporta 100 y sin bloqueantes cuando todo está listo', async () => {
    const items = buildItems({
      marco_riesgos: { estado: 'listo' },
      esg: { estado: 'listo' },
    });
    const result = await reviewReadinessChecklist(items, 'es');
    expect(result.score).toBe(100);
    expect(result.findings.some((f) => f.includes('completos'))).toBe(true);
  });

  it('responde en inglés cuando se pide', async () => {
    const result = await reviewReadinessChecklist(buildItems(), 'en');
    expect(result.findings.some((f) => f.toLowerCase().includes('blocking'))).toBe(true);
  });
});
