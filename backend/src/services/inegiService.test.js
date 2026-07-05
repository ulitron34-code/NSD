import { describe, it, expect } from 'vitest';
import { isConfigured, getBusinessDensity } from './inegiService.js';

// INEGI_API_TOKEN no esta configurado en el entorno de test (igual que en
// local/CI reales sin la variable puesta), asi que ambos casos ejercitan el
// modo MOCK real de este archivo, no un env forzado artificialmente.
describe('inegiService (sin INEGI_API_TOKEN en el entorno)', () => {
  it('isConfigured() es false', () => {
    expect(isConfigured()).toBe(false);
  });

  it('cae a MOCK_INEGI sin inventar un numero de establecimientos', async () => {
    const result = await getBusinessDensity('manufactura', '09');
    expect(result.source).toBe('MOCK_INEGI');
    expect(result.establishmentCount).toBeNull();
    expect(result.term).toBe('manufactura');
  });
});
