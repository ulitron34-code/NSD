import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./ofacScreening.js', () => ({
  screenNameAgainstOfac: vi.fn()
}));
vi.mock('./pepScreening.js', () => ({
  screenCargoAgainstPepCatalog: vi.fn(),
  relationshipExtendsPepStatus: vi.fn()
}));

import { normalizeBeneficiaryOwner, normalizeBeneficiaryOwnerList, screenBeneficiaryOwners } from './beneficiaryOwners.js';
import { screenNameAgainstOfac } from './ofacScreening.js';
import { screenCargoAgainstPepCatalog, relationshipExtendsPepStatus } from './pepScreening.js';

describe('normalizeBeneficiaryOwner', () => {
  it('recorta espacios, convierte el porcentaje a numero y deja null lo vacio', () => {
    const result = normalizeBeneficiaryOwner({
      fullName: '  Juan Perez  ',
      ownershipPercentage: '45.5',
      nationality: '',
      declaredPublicPosition: '  Senador  '
    });
    expect(result).toEqual({
      fullName: 'Juan Perez',
      ownershipPercentage: 45.5,
      nationality: null,
      declaredPublicPosition: 'Senador',
      declaredPublicPositionRelationship: null
    });
  });

  it('deja ownershipPercentage en null si no es un numero valido', () => {
    const result = normalizeBeneficiaryOwner({ fullName: 'Ana', ownershipPercentage: 'no-numero' });
    expect(result.ownershipPercentage).toBeNull();
  });
});

describe('normalizeBeneficiaryOwnerList', () => {
  it('descarta entradas sin nombre y entradas que no son array', () => {
    expect(normalizeBeneficiaryOwnerList('no-array')).toEqual([]);
    const result = normalizeBeneficiaryOwnerList([{ fullName: '' }, { fullName: 'Juan' }]);
    expect(result).toHaveLength(1);
    expect(result[0].fullName).toBe('Juan');
  });
});

describe('screenBeneficiaryOwners', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    screenNameAgainstOfac.mockReturnValue({ status: 'clear', detail: 'sin coincidencias', matches: [] });
    screenCargoAgainstPepCatalog.mockReturnValue({ status: 'clear', detail: 'sin coincidencias', matchedCategory: null });
    relationshipExtendsPepStatus.mockReturnValue(false);
  });

  it('marca "clear" cuando ni OFAC ni PEP tienen hallazgos', () => {
    const result = screenBeneficiaryOwners([{ fullName: 'Juan Perez', ownershipPercentage: 50 }]);
    expect(result[0].status).toBe('clear');
  });

  it('marca "review_required" cuando OFAC tiene un hit', () => {
    screenNameAgainstOfac.mockReturnValue({ status: 'hit', detail: 'coincidencia', matches: [{ name: 'X' }] });
    const result = screenBeneficiaryOwners([{ fullName: 'Persona Sancionada' }]);
    expect(result[0].status).toBe('review_required');
  });

  it('marca "review_required" cuando PEP tiene un hit, aunque OFAC este limpio', () => {
    screenCargoAgainstPepCatalog.mockReturnValue({ status: 'hit', detail: 'coincidencia PEP', matchedCategory: 'Ambito estatal' });
    const result = screenBeneficiaryOwners([{ fullName: 'Juan Perez', declaredPublicPosition: 'Gobernador' }]);
    expect(result[0].status).toBe('review_required');
  });

  it('expone si la relacion declarada cae en el alcance LFPIORPI', () => {
    relationshipExtendsPepStatus.mockReturnValue(true);
    const result = screenBeneficiaryOwners([{ fullName: 'Juan Perez', declaredPublicPositionRelationship: 'conyuge' }]);
    expect(result[0].relationshipInPepScope).toBe(true);
  });

  it('procesa una lista vacia sin error', () => {
    expect(screenBeneficiaryOwners([])).toEqual([]);
  });
});
