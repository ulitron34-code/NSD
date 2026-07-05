import { describe, it, expect } from 'vitest';
import { isConfigured, getKeyIndicators } from './banxicoService.js';

// BANXICO_API_TOKEN no esta configurado en el entorno de test, asi que este
// caso ejercita el modo MOCK real del archivo (mismo criterio que inegiService.test.js).
describe('banxicoService (sin BANXICO_API_TOKEN en el entorno)', () => {
  it('isConfigured() es false', () => {
    expect(isConfigured()).toBe(false);
  });

  it('cae a MOCK_BANXICO sin inventar cifras macro', async () => {
    const result = await getKeyIndicators();
    expect(result.source).toBe('MOCK_BANXICO');
    expect(result.exchangeRateFix).toBeNull();
    expect(result.referenceRate).toBeNull();
    expect(result.inpc).toBeNull();
  });
});
