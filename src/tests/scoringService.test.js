import { describe, it, expect } from 'vitest';
import { calculateScore, getScoreColor, getScoreStatus } from '../services/scoringService';

const makeDoc = (status, risk = null) => ({ filename: 'doc.pdf', status, risk });

describe('calculateScore', () => {
  it('returns 100 when all documents are approved and no risks', () => {
    const docs = [makeDoc('approved'), makeDoc('approved'), makeDoc('approved')];
    const result = calculateScore(docs, {});
    expect(result.totalScore).toBe(100);
    expect(result.status).toBe('VERDE');
    expect(result.canPublish).toBe(true);
  });

  it('returns 0 document points when no docs are approved', () => {
    const docs = [makeDoc('uploaded'), makeDoc('uploaded')];
    const result = calculateScore(docs, {});
    expect(result.breakdown[0].earned).toBe(0);
  });

  it('computes partial score for partial approval', () => {
    const docs = [makeDoc('approved'), makeDoc('uploaded'), makeDoc('uploaded')];
    const result = calculateScore(docs, {});
    expect(result.summary.docsApproved).toBe(1);
    expect(result.summary.docsTotal).toBe(3);
  });

  it('deducts risk points for critical/high risk documents', () => {
    const docs = [makeDoc('approved', 'Critico'), makeDoc('approved', 'Critico')];
    const result = calculateScore(docs, {});
    expect(result.breakdown[1].earned).toBe(1);
  });

  it('deducts consistency points when hasInconsistencies is true', () => {
    const docs = [makeDoc('approved')];
    const result = calculateScore(docs, { hasInconsistencies: true });
    expect(result.breakdown[2].earned).toBe(0);
  });

  it('returns ROJO for score below 50', () => {
    const docs = [makeDoc('uploaded'), makeDoc('uploaded')];
    const result = calculateScore(docs, { hasInconsistencies: true });
    expect(result.status).toBe('ROJO');
    expect(result.canPublish).toBe(false);
  });

  it('returns AMARILLO for score between 50 and 69', () => {
    // 4/6 aprobados sin inconsistencias = (4/6)*60 + 25 + 0 = 40+25=65 → AMARILLO
    const docs = [
      makeDoc('approved'), makeDoc('approved'), makeDoc('approved'), makeDoc('approved'),
      makeDoc('uploaded'), makeDoc('uploaded')
    ];
    const result = calculateScore(docs, { hasInconsistencies: true });
    expect(result.status).toBe('AMARILLO');
    expect(result.canPublish).toBe(false);
  });

  it('includes breakdown with correct categories', () => {
    const result = calculateScore([makeDoc('approved')], {});
    const categories = result.breakdown.map(b => b.category);
    expect(categories).toContain('Documentos');
    expect(categories).toContain('Riesgos Documentales');
    expect(categories).toContain('Consistencia');
  });

  it('returns 0 document score for empty document list', () => {
    const result = calculateScore([], {});
    expect(result.breakdown[0].earned).toBe(0);
  });

  it('includes nextActions array in result', () => {
    const result = calculateScore([makeDoc('approved')], {});
    expect(Array.isArray(result.nextActions)).toBe(true);
  });
});

describe('getScoreColor', () => {
  it('returns green color for score >= 70', () => {
    expect(getScoreColor(70)).toBe('#2E7D32');
    expect(getScoreColor(100)).toBe('#2E7D32');
  });

  it('returns yellow color for score between 50 and 69', () => {
    expect(getScoreColor(50)).toBe('#F59E0B');
    expect(getScoreColor(69)).toBe('#F59E0B');
  });

  it('returns red color for score below 50', () => {
    expect(getScoreColor(0)).toBe('#C62828');
    expect(getScoreColor(49)).toBe('#C62828');
  });
});

describe('getScoreStatus', () => {
  it('returns VERDE for score >= 70', () => {
    expect(getScoreStatus(70)).toBe('VERDE');
    expect(getScoreStatus(100)).toBe('VERDE');
  });

  it('returns AMARILLO for score between 50 and 69', () => {
    expect(getScoreStatus(50)).toBe('AMARILLO');
    expect(getScoreStatus(69)).toBe('AMARILLO');
  });

  it('returns ROJO for score below 50', () => {
    expect(getScoreStatus(0)).toBe('ROJO');
    expect(getScoreStatus(49)).toBe('ROJO');
  });
});
