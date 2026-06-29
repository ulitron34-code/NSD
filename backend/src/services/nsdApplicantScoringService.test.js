import { describe, it, expect } from 'vitest';
import { calculateNsdScore, calculateGlobalRisk, detectFlags } from './nsdApplicantScoringService.js';

// ─── calculateNsdScore ────────────────────────────────────────────────────────

describe('calculateNsdScore', () => {
  it('devuelve AAA/APROBADO con datos excelentes', () => {
    const result = calculateNsdScore({
      rfcData:    { valid: true },
      bureauData: { score: 820, delinquency: 0 },
      ofacData:   { verdict: 'clear' },
      clarityData:{ score: 95 }
    });
    expect(result.final_score).toBeGreaterThanOrEqual(85);
    expect(result.grade).toBe('AAA');
    expect(result.recommendation).toBe('APROBADO');
  });

  it('devuelve B/RECHAZAR con RFC invalido, OFAC hit y score bajo', () => {
    const result = calculateNsdScore({
      rfcData:    { valid: false },
      bureauData: { score: 400, delinquency: 8 },
      ofacData:   { verdict: 'hit' },
      clarityData:{ score: 10 }
    });
    expect(result.final_score).toBeLessThan(45);
    expect(result.recommendation).toBe('RECHAZAR');
  });

  it('devuelve REVISAR_MANUALMENTE con RFC invalido y datos medios', () => {
    // RFC invalid (0*0.25) + score600 (54.5*0.30=16.4) + OFAC clear (20) + clarity80 (12) + delinq2 (75*0.10=7.5) = ~55.9
    const result = calculateNsdScore({
      rfcData:    { valid: false },
      bureauData: { score: 600, delinquency: 2 },
      ofacData:   { verdict: 'clear' },
      clarityData:{ score: 80 }
    });
    expect(result.recommendation).toBe('REVISAR_MANUALMENTE');
  });

  it('usa defaults seguros cuando faltan datos', () => {
    const result = calculateNsdScore({});
    expect(result.final_score).toBeGreaterThanOrEqual(0);
    expect(result.final_score).toBeLessThanOrEqual(100);
    expect(['AAA','AA','A','BBB','BB','B']).toContain(result.grade);
  });

  it('breakdown suma correctamente segun pesos', () => {
    const result = calculateNsdScore({
      rfcData:    { valid: true },
      bureauData: { score: 700, delinquency: 0 },
      ofacData:   { verdict: 'clear' },
      clarityData:{ score: 75 }
    });
    const { rfc_score, credit_score, ofac_score, clarity_score, delinquency_score } = result.breakdown;
    const manual = Math.round((
      rfc_score      * 0.25 +
      credit_score   * 0.30 +
      ofac_score     * 0.20 +
      clarity_score  * 0.15 +
      delinquency_score * 0.10
    ) * 100) / 100;
    expect(result.final_score).toBe(manual);
  });
});

// ─── calculateGlobalRisk ─────────────────────────────────────────────────────

describe('calculateGlobalRisk', () => {
  it('retorna CRITICO con OFAC hit', () => {
    const result = calculateGlobalRisk({
      rfcData:  { valid: true },
      ofacData: { verdict: 'hit' }
    });
    expect(result.global_risk).toBe('CRITICO');
    expect(result.risk_factors.some(f => f.severity === 4)).toBe(true);
  });

  it('retorna CRITICO con RFC invalido', () => {
    const result = calculateGlobalRisk({ rfcData: { valid: false } });
    expect(result.global_risk).toBe('CRITICO');
  });

  it('retorna ALTO con score Buro muy bajo', () => {
    const result = calculateGlobalRisk({
      rfcData:    { valid: true },
      bureauData: { score: 450, delinquency: 0 }
    });
    expect(result.global_risk).toBe('ALTO');
  });

  it('retorna BAJO con todos los datos limpios', () => {
    const result = calculateGlobalRisk({
      rfcData:     { valid: true },
      bureauData:  { score: 780, delinquency: 0, utilization: 30 },
      ofacData:    { verdict: 'clear' },
      pepData:     { status: 'clear' },
      equifaxData: { global_score: 720 }
    });
    expect(result.global_risk).toBe('BAJO');
    expect(result.risk_count).toBe(0);
  });

  it('incluye morosidad alta como factor ALTO', () => {
    const result = calculateGlobalRisk({
      rfcData:    { valid: true },
      bureauData: { delinquency: 8 }
    });
    expect(result.risk_factors.some(f => f.factor === 'Morosidad alta')).toBe(true);
  });
});

// ─── detectFlags ─────────────────────────────────────────────────────────────

describe('detectFlags', () => {
  it('sin datos problemáticos → 0 flags, severity BAJO', () => {
    const result = detectFlags({
      rfcData:    { valid: true },
      bureauData: { score: 750, delinquency: 0, utilization: 40 },
      ofacData:   { verdict: 'clear' },
      pepData:    { status: 'clear' }
    });
    expect(result.flag_count).toBe(0);
    expect(result.severity_level).toBe('BAJO');
  });

  it('RFC invalido → flag CRITICO', () => {
    const result = detectFlags({ rfcData: { valid: false, status: 'Cancelado' } });
    expect(result.flags.some(f => f.code === 'RFC_INVALID' && f.severity === 'CRITICO')).toBe(true);
    expect(result.severity_level).toBe('CRITICO');
  });

  it('OFAC hit → flag CRITICO SANCTIONS_HIT', () => {
    const result = detectFlags({
      rfcData:  { valid: true },
      ofacData: { verdict: 'hit', matchedIn: ['OFAC'] }
    });
    expect(result.flags.some(f => f.code === 'SANCTIONS_HIT')).toBe(true);
    expect(result.severity_level).toBe('CRITICO');
  });

  it('PEP hit → flag CRITICO PEP_MATCH', () => {
    const result = detectFlags({
      rfcData: { valid: true },
      pepData: { status: 'hit', matchedCategory: 'Servidor Publico Federal' }
    });
    expect(result.flags.some(f => f.code === 'PEP_MATCH')).toBe(true);
  });

  it('score bajo → LOW_SCORE CRITICO', () => {
    const result = detectFlags({
      rfcData:    { valid: true },
      bureauData: { score: 480, delinquency: 0 }
    });
    expect(result.flags.some(f => f.code === 'LOW_SCORE' && f.severity === 'CRITICO')).toBe(true);
  });

  it('score moderado → MEDIUM_SCORE ALTO', () => {
    const result = detectFlags({
      rfcData:    { valid: true },
      bureauData: { score: 620, delinquency: 0 }
    });
    expect(result.flags.some(f => f.code === 'MEDIUM_SCORE' && f.severity === 'ALTO')).toBe(true);
  });

  it('utilizacion alta → HIGH_UTILIZATION MEDIO', () => {
    const result = detectFlags({
      rfcData:    { valid: true },
      bureauData: { utilization: 85 }
    });
    expect(result.flags.some(f => f.code === 'HIGH_UTILIZATION' && f.severity === 'MEDIO')).toBe(true);
  });

  it('multiples flags → severity_level es el mas grave', () => {
    const result = detectFlags({
      rfcData:    { valid: true },
      bureauData: { score: 620, delinquency: 2, utilization: 90 },
      ofacData:   { verdict: 'clear' }
    });
    // Hay MEDIUM_SCORE(ALTO) + SOME_DELINQUENCY(MEDIO) + HIGH_UTILIZATION(MEDIO)
    expect(result.severity_level).toBe('ALTO');
    expect(result.flag_count).toBeGreaterThanOrEqual(2);
  });
});
