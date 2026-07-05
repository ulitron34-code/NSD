import { describe, it, expect } from 'vitest';
import { isConfigured, checkSupervisedEntity } from './cnbvService.js';

describe('cnbvService (sin proveedor de datos configurado)', () => {
  it('isConfigured() es false', () => {
    expect(isConfigured()).toBe(false);
  });

  it('siempre indica verificacion manual con el link oficial cuando no hay proveedor', async () => {
    const result = await checkSupervisedEntity('Banco de Prueba SA');
    expect(result.source).toBe('MANUAL_ONLY');
    expect(result.verified).toBeNull();
    expect(result.requiresManualCheck).toBe(true);
    expect(result.officialUrl).toContain('cnbv.gob.mx');
  });
});
