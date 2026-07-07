import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { searchLegalEntity } from './gleifService.js';

describe('searchLegalEntity', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('regresa vacio y una nota clara cuando no hay nombre', async () => {
    const result = await searchLegalEntity('');
    expect(result.matches).toEqual([]);
    expect(result.note).toBeTruthy();
  });

  it('parsea coincidencias reales de la respuesta de GLEIF', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{
          id: '549300ABCDEF1234567',
          attributes: {
            entity: { legalName: { name: 'Empresa Test SA de CV' }, status: 'ACTIVE', jurisdiction: 'MX', legalAddress: { country: 'MX' } },
            registration: { status: 'ISSUED' }
          }
        }]
      })
    });

    const result = await searchLegalEntity('Empresa Test');
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].lei).toBe('549300ABCDEF1234567');
    expect(result.matches[0].status).toBe('ACTIVE');
    expect(result.source).toBe('GLEIF_API');
  });

  it('regresa matches vacios y una nota de error si la API falla, sin inventar datos', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 });

    const result = await searchLegalEntity('Empresa Test');
    expect(result.matches).toEqual([]);
    expect(result.note).toContain('Error al consultar GLEIF');
  });
});
