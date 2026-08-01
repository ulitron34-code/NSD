import express from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/commercialCatalogService.js', () => ({
  listCommercialOffers: vi.fn(async ({ audience } = {}) => {
    if (audience === 'bogus') throw new Error('audience inválida: "bogus".');
    return [{ code: 'applicant_essential', audience: audience || 'applicant' }];
  })
}));

function createApp(router) {
  const app = express();
  app.use(express.json());
  app.use('/api', router);
  return app;
}

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${address.port}` });
    });
  });
}

describe('GET /api/commercial/offers', () => {
  let server;
  let baseUrl;
  const originalEnv = process.env.COMMERCIAL_CATALOG_ENABLED;

  afterEach(() => {
    server?.close();
    process.env.COMMERCIAL_CATALOG_ENABLED = originalEnv;
  });

  it('is fail-closed: returns 404 when the flag is unset', async () => {
    delete process.env.COMMERCIAL_CATALOG_ENABLED;
    vi.resetModules();
    const { default: router } = await import('./commercialCatalog.js');
    ({ server, baseUrl } = await listen(createApp(router)));

    const response = await fetch(`${baseUrl}/api/commercial/offers`);
    expect(response.status).toBe(404);
  });

  it('serves the catalog once explicitly enabled', async () => {
    process.env.COMMERCIAL_CATALOG_ENABLED = 'true';
    vi.resetModules();
    const { default: router } = await import('./commercialCatalog.js');
    ({ server, baseUrl } = await listen(createApp(router)));

    const response = await fetch(`${baseUrl}/api/commercial/offers?audience=applicant`);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.offers).toEqual([{ code: 'applicant_essential', audience: 'applicant' }]);
  });

  it('rejects an invalid audience with 400', async () => {
    process.env.COMMERCIAL_CATALOG_ENABLED = 'true';
    vi.resetModules();
    const { default: router } = await import('./commercialCatalog.js');
    ({ server, baseUrl } = await listen(createApp(router)));

    const response = await fetch(`${baseUrl}/api/commercial/offers?audience=bogus`);
    expect(response.status).toBe(400);
  });
});
