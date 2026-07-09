import { describe, it, expect } from 'vitest';
import { getRubric, sectorHasSpecificDocuments, getModuleWeights, READINESS_MODULE_WEIGHTS, computeWeightedGlobalScore } from './readinessRubrics.js';

describe('sectorHasSpecificDocuments (sección 19.1 del plan)', () => {
  it('es verdadero para los 8 sectores con reglas especificas', () => {
    const sectores = ['Inmobiliario', 'Energía', 'Agroindustrial', 'Turismo', 'Manufactura', 'Fintech', 'Salud', 'Exportación'];
    for (const sector of sectores) {
      expect(sectorHasSpecificDocuments(sector)).toBe(true);
    }
  });

  it('es falso para un sector sin reglas especificas o sin declarar', () => {
    expect(sectorHasSpecificDocuments('Tecnología')).toBe(false);
    expect(sectorHasSpecificDocuments(null)).toBe(false);
    expect(sectorHasSpecificDocuments('')).toBe(false);
  });

  it('hace match por substring, sin importar mayusculas/acentos', () => {
    expect(sectorHasSpecificDocuments('proyecto inmobiliario residencial')).toBe(true);
    expect(sectorHasSpecificDocuments('ENERGÍA SOLAR')).toBe(true);
  });

  it('hace match via alias para sectores del dropdown que no coinciden textualmente (ej. "Agricola")', () => {
    expect(sectorHasSpecificDocuments('Agricola')).toBe(true);
    expect(getRubric('permisos_sectoriales', 'MX', 'Agricola').documentosEsperados).toContain('Tenencia de tierra');
  });
});

describe('getRubric("permisos_sectoriales", country, sector)', () => {
  it('devuelve los documentos esperados del sector inmobiliario', () => {
    const rubric = getRubric('permisos_sectoriales', 'MX', 'Inmobiliario');
    expect(rubric.documentosEsperados).toContain('Uso de suelo');
    expect(rubric.documentosEsperados).toContain('Licencia de construcción');
    expect(rubric.label).toContain('Inmobiliario');
  });

  it('devuelve documentos distintos para energía vs. salud', () => {
    const energia = getRubric('permisos_sectoriales', 'MX', 'Energía');
    const salud = getRubric('permisos_sectoriales', 'MX', 'Salud');
    expect(energia.documentosEsperados).toContain('Contratos PPA si existen');
    expect(salud.documentosEsperados).toContain('Permisos sanitarios');
    expect(energia.documentosEsperados).not.toEqual(salud.documentosEsperados);
  });

  it('devuelve lista vacia cuando no hay sector reconocido', () => {
    const rubric = getRubric('permisos_sectoriales', 'MX', null);
    expect(rubric.documentosEsperados).toEqual([]);
  });
});

describe('getModuleWeights (secciones 11.3/19.2 del plan)', () => {
  function sumWeights(weights) {
    return Object.values(weights).reduce((a, b) => a + b, 0);
  }

  it('sin sector ni tipo de financiamiento, regresa exactamente READINESS_MODULE_WEIGHTS (sin regresion)', () => {
    expect(getModuleWeights()).toEqual(READINESS_MODULE_WEIGHTS);
    expect(getModuleWeights(null, null)).toEqual(READINESS_MODULE_WEIGHTS);
  });

  it('siempre suma exactamente 100, con o sin ajustes', () => {
    expect(sumWeights(getModuleWeights())).toBe(100);
    expect(sumWeights(getModuleWeights('Inmobiliario', null))).toBe(100);
    expect(sumWeights(getModuleWeights('Tecnología', 'Project Finance'))).toBe(100);
    expect(sumWeights(getModuleWeights('Energía', 'Financiamiento ESG'))).toBe(100);
  });

  it('aumenta el peso de ESG/ESIA para un sector sensible (nota de la seccion 11.3)', () => {
    const base = getModuleWeights();
    const boosted = getModuleWeights('Inmobiliario', null);
    expect(boosted.esg).toBeGreaterThan(base.esg);
    expect(boosted.esia).toBeGreaterThan(base.esia);
  });

  it('no aumenta ESG/ESIA para un sector no sensible', () => {
    const base = getModuleWeights();
    const result = getModuleWeights('Tecnología', null);
    expect(result.esg).toBe(base.esg);
    expect(result.esia).toBe(base.esia);
  });

  it('agrega el peso de permisos_sectoriales solo cuando el sector lo requiere', () => {
    expect(getModuleWeights('Inmobiliario').permisos_sectoriales).toBeGreaterThan(0);
    expect(getModuleWeights('Tecnología').permisos_sectoriales).toBeUndefined();
  });

  it('Project Finance da mas peso a marco_riesgos que el perfil base', () => {
    const base = getModuleWeights();
    const projectFinance = getModuleWeights(null, 'Project Finance');
    expect(projectFinance.marco_riesgos).toBeGreaterThan(base.marco_riesgos);
  });

  it('Financiamiento ESG da mas peso a esg/ods/esia que el perfil base', () => {
    const base = getModuleWeights();
    const esgFinancing = getModuleWeights(null, 'Financiamiento ESG');
    expect(esgFinancing.esg).toBeGreaterThan(base.esg);
    expect(esgFinancing.ods).toBeGreaterThan(base.ods);
    expect(esgFinancing.esia).toBeGreaterThan(base.esia);
  });

  it('un tipo de financiamiento no reconocido no rompe nada, usa el perfil base', () => {
    expect(getModuleWeights(null, 'Tipo Inventado XYZ')).toEqual(READINESS_MODULE_WEIGHTS);
  });
});

describe('computeWeightedGlobalScore con sector/financingType', () => {
  it('el score global cambia si el sector/tipo de financiamiento redistribuye pesos', () => {
    const items = [
      { id: 'esg', reviewScore: 100 },
      { id: 'plan_negocios', reviewScore: 0 }
    ];
    const sinAjuste = computeWeightedGlobalScore(items);
    const conBoostEsg = computeWeightedGlobalScore(items, 'Inmobiliario', 'Financiamiento ESG');
    expect(conBoostEsg.score).toBeGreaterThan(sinAjuste.score);
  });
});
