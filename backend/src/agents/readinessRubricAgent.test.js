import { describe, it, expect } from 'vitest';
import { evaluateReadinessDocument } from './readinessRubricAgent.js';

// Ninguna de estas pruebas tiene ANTHROPIC_API_KEY en el entorno (igual que
// el resto de la suite del backend), asi que ejercitan los caminos de
// fallback reales, no mocks artificiales.
describe('evaluateReadinessDocument', () => {
  it('cae a heuristica por reglas para un item normal sin ANTHROPIC_API_KEY', async () => {
    const result = await evaluateReadinessDocument({
      documentTypeCode: 'READY_PLAN_NEGOCIOS',
      extractedText: 'Resumen ejecutivo del plan de negocios...',
      order: { metadata: {} }
    });

    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(Array.isArray(result.findings)).toBe(true);
  });

  it('doc_kyc sin RFC en el expediente pide capturar el RFC primero', async () => {
    const result = await evaluateReadinessDocument({
      documentTypeCode: 'READY_DOC_KYC',
      extractedText: '',
      order: { metadata: {} }
    });

    expect(result.score).toBe(0);
    expect(result.missing_items).toContain('RFC del expediente');
  });

  it('doc_kyc con RFC pero sin ANTHROPIC_API_KEY reporta el agente no disponible', async () => {
    const result = await evaluateReadinessDocument({
      documentTypeCode: 'READY_DOC_KYC',
      extractedText: '',
      order: { metadata: { rfc: 'ABC123456XYZ', companyName: 'Empresa Test SA de CV' } }
    });

    expect(result.status).toBe('yellow');
    expect(result.warnings.some((w) => w.includes('ANTHROPIC_API_KEY'))).toBe(true);
  });
});
