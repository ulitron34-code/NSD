import { describe, it, expect } from 'vitest';
import { screenCargoAgainstPepCatalog, relationshipExtendsPepStatus, getPepCatalogSummary } from './pepScreening.js';

describe('screenCargoAgainstPepCatalog', () => {
  it('responde "skipped" cuando no hay cargo declarado', () => {
    const result = screenCargoAgainstPepCatalog('');
    expect(result.status).toBe('skipped');
  });

  it('detecta un cargo del ambito estatal con acentos y mayusculas', () => {
    const result = screenCargoAgainstPepCatalog('Gobernador del Estado de México');
    expect(result.status).toBe('hit');
    expect(result.matchedCategory).toBe('Ambito estatal');
  });

  it('detecta un cargo del poder legislativo federal', () => {
    const result = screenCargoAgainstPepCatalog('Diputado Federal por el Distrito 5');
    expect(result.status).toBe('hit');
    expect(result.matchedCategory).toBe('Poder Legislativo Federal');
  });

  it('incluye la relacion declarada en el detalle cuando se proporciona', () => {
    const result = screenCargoAgainstPepCatalog('Senadora de la Republica', { relationship: 'madre' });
    expect(result.status).toBe('hit');
    expect(result.detail).toContain('madre');
  });

  it('responde "clear" para un cargo que no esta en el catalogo', () => {
    const result = screenCargoAgainstPepCatalog('Gerente de ventas en empresa privada');
    expect(result.status).toBe('clear');
    expect(result.matchedCategory).toBeNull();
  });

  it('no produce falsos positivos por palabras sueltas comunes', () => {
    const result = screenCargoAgainstPepCatalog('Director de recursos humanos en una pyme');
    expect(result.status).toBe('clear');
  });
});

describe('relationshipExtendsPepStatus', () => {
  it('reconoce relaciones de consanguinidad/afinidad y allegados cercanos', () => {
    expect(relationshipExtendsPepStatus('Conyuge')).toBe(true);
    expect(relationshipExtendsPepStatus('Socio comercial')).toBe(true);
    expect(relationshipExtendsPepStatus('Hijo')).toBe(true);
  });

  it('responde false para relaciones fuera del alcance LFPIORPI', () => {
    expect(relationshipExtendsPepStatus('Vecino')).toBe(false);
    expect(relationshipExtendsPepStatus('')).toBe(false);
  });
});

describe('getPepCatalogSummary', () => {
  it('expone el catalogo de categorias para diagnostico/UI', () => {
    const summary = getPepCatalogSummary();
    expect(summary.length).toBeGreaterThan(0);
    expect(summary[0]).toHaveProperty('category');
    expect(summary[0]).toHaveProperty('keywordCount');
  });
});
