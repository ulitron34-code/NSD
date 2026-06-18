import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/documentIntelligenceService.js', () => ({
  getExpedienteRedFlags: vi.fn(),
  getCrossReferences: vi.fn(),
  logAgentAction: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('../services/regulatoryValidation.js', () => ({
  validateRegulatoryProfile: vi.fn()
}));

import { computeExpedienteRiskScore } from './agentRiskScorer.js';
import { getExpedienteRedFlags, getCrossReferences, logAgentAction } from '../services/documentIntelligenceService.js';
import { validateRegulatoryProfile } from '../services/regulatoryValidation.js';

function cleanRegulatoryValidation() {
  return {
    country: 'MX',
    status: 'clear',
    checks: [
      { provider: 'format', status: 'pass', severity: 'info', label: 'RFC Mexico', detail: 'Formato valido' },
      { provider: 'sat', status: 'skipped', severity: 'low', label: 'Validacion SAT/RFC', detail: 'Pendiente configurar' },
      { provider: 'uif', status: 'skipped', severity: 'low', label: 'Screening UIF', detail: 'Pendiente configurar' },
      { provider: 'ofac', status: 'pass', severity: 'info', label: 'OFAC sanctions screening (SDN list)', detail: 'Sin coincidencias' }
    ]
  };
}

describe('agentRiskScorer.computeExpedienteRiskScore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getExpedienteRedFlags.mockResolvedValue([]);
    getCrossReferences.mockResolvedValue([]);
    validateRegulatoryProfile.mockReturnValue(cleanRegulatoryValidation());
  });

  it('expediente limpio: score bajo, semaforo Verde, recomendacion APROBADO', async () => {
    const result = await computeExpedienteRiskScore('exp-1');
    expect(result.score_final).toBe(0);
    expect(result.semaforo).toBe('Verde');
    expect(result.recomendacion).toBe('APROBADO');
    expect(result.red_flags).toHaveLength(0);
  });

  it('un hallazgo critico de AgentValidator sube el pilar de cumplimiento', async () => {
    getExpedienteRedFlags.mockResolvedValue([
      { rule_code: 'CSF_ESTATUS_ACTIVO', severity: 'critical', findings: 'Estatus suspendido', filename: 'csf.pdf' }
    ]);
    const result = await computeExpedienteRiskScore('exp-2');
    expect(result.pilares.riesgo_cumplimiento).toBe(12);
    expect(result.pilares.riesgo_financiero).toBe(0);
    expect(result.red_flags[0]).toMatchObject({ pilar: 'cumplimiento', rule_code: 'CSF_ESTATUS_ACTIVO' });
  });

  it('clasifica los hallazgos de AgentFinancial en el pilar financiero', async () => {
    getExpedienteRedFlags.mockResolvedValue([
      { rule_code: 'FORENSE_ROE_ANOMALO', severity: 'critical', findings: 'ROE 500%', filename: 'eeff.xlsx' },
      { rule_code: 'BENCHMARK_APALANCAMIENTO', severity: 'warning', findings: 'Apalancamiento elevado', filename: 'eeff.xlsx' }
    ]);
    const result = await computeExpedienteRiskScore('exp-3');
    expect(result.pilares.riesgo_financiero).toBe(16);
    expect(result.pilares.riesgo_cumplimiento).toBe(0);
  });

  it('un hit de OFAC fuerza recomendacion RECHAZADO sin importar el score promedio', async () => {
    validateRegulatoryProfile.mockReturnValue({
      country: 'MX',
      status: 'review_required',
      checks: [
        { provider: 'ofac', status: 'fail', severity: 'high', label: 'OFAC sanctions screening (SDN list)', detail: '1 coincidencia potencial' }
      ]
    });
    const result = await computeExpedienteRiskScore('exp-4');
    expect(result.recomendacion).toBe('RECHAZADO');
    expect(result.red_flags.some((f) => f.pilar === 'regulatorio' && f.rule_code === 'ofac')).toBe(true);
  });

  it('un cruce documental fallido sube el pilar operacional y fuerza revision', async () => {
    getCrossReferences.mockResolvedValue([
      { cross_reference_type: 'RFC_MATCH', status: 'fail', details: 'RFC no coincide entre CSF y Acta' }
    ]);
    const result = await computeExpedienteRiskScore('exp-5');
    expect(result.pilares.riesgo_operacional).toBe(10);
    expect(result.recomendacion).toBe('RECHAZADO');
  });

  it('reporta informacion_pendiente cuando no hay cruces y hay proveedores regulatorios sin configurar', async () => {
    const result = await computeExpedienteRiskScore('exp-6');
    expect(result.informacion_pendiente.some((msg) => msg.includes('cruces documentales'))).toBe(true);
    expect(result.informacion_pendiente.some((msg) => msg.includes('SAT/RFC'))).toBe(true);
  });

  it('pasa country y applicant del order a validateRegulatoryProfile', async () => {
    const order = { id: 'exp-7', metadata: { country: 'US', companyName: 'Acme Inc', ein: '12-3456789' } };
    await computeExpedienteRiskScore('exp-7', { order });
    expect(validateRegulatoryProfile).toHaveBeenCalledWith(
      expect.objectContaining({ country: 'US', applicant: order.metadata, order })
    );
  });

  it('registra la accion en la bitacora de agentes', async () => {
    await computeExpedienteRiskScore('exp-8', { sector: 'TECH' });
    expect(logAgentAction).toHaveBeenCalledWith(
      'AgentRiskScorer',
      'compute_risk_score',
      expect.objectContaining({ expedienteId: 'exp-8', sector: 'TECH' }),
      0.0
    );
  });
});
