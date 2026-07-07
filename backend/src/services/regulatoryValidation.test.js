import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./ofacScreening.js', () => ({
  screenNameAgainstOfac: vi.fn()
}));

vi.mock('./pepScreening.js', () => ({
  screenCargoAgainstPepCatalog: vi.fn()
}));

import { validateRegulatoryProfile } from './regulatoryValidation.js';
import { screenNameAgainstOfac } from './ofacScreening.js';
import { screenCargoAgainstPepCatalog } from './pepScreening.js';

describe('validateRegulatoryProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    screenNameAgainstOfac.mockReturnValue({ status: 'clear', detail: 'Sin coincidencias', matches: [] });
    screenCargoAgainstPepCatalog.mockReturnValue({ status: 'skipped', detail: 'Sin cargo declarado', matchedCategory: null });
  });

  it('valida formato de RFC para Mexico y agrega el check de OFAC', () => {
    const result = validateRegulatoryProfile({
      country: 'MX',
      applicant: { rfc: 'ABC010101AB1', companyName: 'Comercializadora Azteca SA de CV' }
    });
    expect(result.checks.find((c) => c.provider === 'format').status).toBe('pass');
    expect(result.checks.find((c) => c.provider === 'ofac')).toBeDefined();
    expect(screenNameAgainstOfac).toHaveBeenCalledWith('Comercializadora Azteca SA de CV');
  });

  it('marca el check de OFAC como "fail" con severidad alta cuando hay un hit', () => {
    screenNameAgainstOfac.mockReturnValue({
      status: 'hit',
      detail: '1 coincidencia potencial',
      matches: [{ name: 'EMPRESA SANCIONADA', score: 100 }]
    });
    const result = validateRegulatoryProfile({
      country: 'MX',
      applicant: { rfc: 'ABC010101AB1', companyName: 'Empresa Sancionada' }
    });
    const ofacCheck = result.checks.find((c) => c.provider === 'ofac');
    expect(ofacCheck.status).toBe('fail');
    expect(ofacCheck.severity).toBe('high');
    expect(result.status).toBe('review_required');
  });

  it('marca el check de OFAC como "pass" cuando esta limpio', () => {
    const result = validateRegulatoryProfile({
      country: 'US',
      applicant: { ein: '12-3456789', companyName: 'Clean Co' }
    });
    const ofacCheck = result.checks.find((c) => c.provider === 'ofac');
    expect(ofacCheck.status).toBe('pass');
    expect(ofacCheck.severity).toBe('info');
  });

  it('marca el check de OFAC como "skipped" cuando la lista no esta disponible', () => {
    screenNameAgainstOfac.mockReturnValue({
      status: 'skipped',
      detail: 'La lista SDN de OFAC aun se esta descargando',
      matches: []
    });
    const result = validateRegulatoryProfile({ country: 'MX', applicant: {} });
    const ofacCheck = result.checks.find((c) => c.provider === 'ofac');
    expect(ofacCheck.status).toBe('skipped');
  });

  it('incluye aviso de pais no soportado y aun asi corre el check de OFAC', () => {
    const result = validateRegulatoryProfile({
      country: 'BR',
      applicant: { companyName: 'Empresa Brasil' }
    });
    expect(result.checks.find((c) => c.provider === 'nsd')).toBeDefined();
    expect(result.checks.find((c) => c.provider === 'ofac')).toBeDefined();
  });

  it('para USA ya no expone el check de OFAC como proveedor configurable por env vars', () => {
    const result = validateRegulatoryProfile({
      country: 'US',
      applicant: { ein: '12-3456789', companyName: 'Clean Co' }
    });
    const ofacChecks = result.checks.filter((c) => c.provider === 'ofac');
    expect(ofacChecks).toHaveLength(1);
    expect(ofacChecks[0].detail).not.toMatch(/Pendiente configurar/);
  });

  it('agrega el check de PEP y lo pasa "skipped" cuando no hay cargo declarado', () => {
    const result = validateRegulatoryProfile({ country: 'MX', applicant: {} });
    const pepCheck = result.checks.find((c) => c.provider === 'pep');
    expect(pepCheck.status).toBe('skipped');
    expect(screenCargoAgainstPepCatalog).toHaveBeenCalledWith(undefined, { relationship: undefined });
  });

  it('marca el check de PEP como "fail" con severidad alta cuando hay un hit', () => {
    screenCargoAgainstPepCatalog.mockReturnValue({
      status: 'hit',
      detail: 'Coincide con la categoria PEP "Ambito estatal"',
      matchedCategory: 'Ambito estatal'
    });
    const result = validateRegulatoryProfile({
      country: 'MX',
      applicant: { rfc: 'ABC010101AB1', declaredPublicPosition: 'Gobernador del Estado de Mexico' }
    });
    const pepCheck = result.checks.find((c) => c.provider === 'pep');
    expect(pepCheck.status).toBe('fail');
    expect(pepCheck.severity).toBe('high');
    expect(result.status).toBe('review_required');
    expect(screenCargoAgainstPepCatalog).toHaveBeenCalledWith('Gobernador del Estado de Mexico', { relationship: undefined });
  });

  it('marca el check de PEP como "pass" cuando el cargo declarado no coincide con el catalogo', () => {
    screenCargoAgainstPepCatalog.mockReturnValue({
      status: 'clear',
      detail: 'No coincide con ninguna categoria PEP',
      matchedCategory: null
    });
    const result = validateRegulatoryProfile({
      country: 'MX',
      applicant: { rfc: 'ABC010101AB1', declaredPublicPosition: 'Gerente de ventas' }
    });
    const pepCheck = result.checks.find((c) => c.provider === 'pep');
    expect(pepCheck.status).toBe('pass');
    expect(pepCheck.severity).toBe('info');
  });

  it('toma el cargo declarado y la relacion desde order.metadata si no vienen en applicant', () => {
    validateRegulatoryProfile({
      country: 'MX',
      applicant: {},
      order: { metadata: { declaredPublicPosition: 'Senadora', declaredPublicPositionRelationship: 'madre' } }
    });
    expect(screenCargoAgainstPepCatalog).toHaveBeenCalledWith('Senadora', { relationship: 'madre' });
  });

  it.each([
    ['CO', '900123456-7'],
    ['EC', '1791251237001'],
    ['AR', '20-12345678-9'],
    ['PE', '20123456789'],
    ['CL', '76543210-K'],
    ['BO', '1023456789'],
    ['PY', '80012345-6'],
    ['UY', '210012340012']
  ])('valida formato de ID fiscal para %s y marca screening real de OFAC/PEP (no ya como pais no soportado)', (country, taxId) => {
    const result = validateRegulatoryProfile({ country, applicant: { taxId, companyName: 'Empresa Test' } });

    expect(result.checks.find((c) => c.provider === 'format').status).toBe('pass');
    expect(result.checks.find((c) => c.provider === 'ofac')).toBeDefined();
    expect(result.checks.find((c) => c.provider === 'pep')).toBeDefined();
    expect(result.checks.find((c) => c.provider === 'nsd')).toBeUndefined();
    expect(result.checks.find((c) => c.provider === 'buro_local').status).toBe('skipped');
  });

  it('marca formato invalido cuando el ID fiscal no cumple el patron del pais', () => {
    const result = validateRegulatoryProfile({ country: 'CO', applicant: { taxId: 'no-es-un-nit' } });
    expect(result.checks.find((c) => c.provider === 'format').status).toBe('fail');
  });
});
