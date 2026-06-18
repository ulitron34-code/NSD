import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./ofacScreening.js', () => ({
  screenNameAgainstOfac: vi.fn()
}));

import { validateRegulatoryProfile } from './regulatoryValidation.js';
import { screenNameAgainstOfac } from './ofacScreening.js';

describe('validateRegulatoryProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    screenNameAgainstOfac.mockReturnValue({ status: 'clear', detail: 'Sin coincidencias', matches: [] });
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
});
