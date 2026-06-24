import { describe, it, expect } from 'vitest';
import {
  generateDocumentAlerts,
  generateReviewAlerts,
  evaluateCovenants,
  computeComplianceScore,
  normalizeCovenants,
  normalizeReviewSchedule
} from './complianceMonitorService.js';

const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};

describe('generateDocumentAlerts', () => {
  it('returns empty array for docs without expires_at', () => {
    const docs = [{ id: '1', filename: 'doc.pdf' }];
    expect(generateDocumentAlerts(docs)).toEqual([]);
  });

  it('flags expired document as critical', () => {
    const docs = [{ id: '1', filename: 'INE.jpg', expires_at: daysFromNow(-5) }];
    const alerts = generateDocumentAlerts(docs);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe('critical');
    expect(alerts[0].type).toBe('document_expired');
  });

  it('flags document expiring in 15 days as high', () => {
    const docs = [{ id: '1', filename: 'Pasaporte.jpg', expires_at: daysFromNow(15) }];
    const alerts = generateDocumentAlerts(docs);
    expect(alerts[0].severity).toBe('high');
  });

  it('flags document expiring in 45 days as medium', () => {
    const docs = [{ id: '1', filename: 'RFC.pdf', expires_at: daysFromNow(45) }];
    const alerts = generateDocumentAlerts(docs);
    expect(alerts[0].severity).toBe('medium');
  });

  it('flags document expiring in 75 days as low', () => {
    const docs = [{ id: '1', filename: 'Constitutiva.pdf', expires_at: daysFromNow(75) }];
    const alerts = generateDocumentAlerts(docs);
    expect(alerts[0].severity).toBe('low');
  });

  it('ignores document expiring beyond 90 days', () => {
    const docs = [{ id: '1', filename: 'Contrato.pdf', expires_at: daysFromNow(120) }];
    expect(generateDocumentAlerts(docs)).toHaveLength(0);
  });

  it('sorts alerts by days until expiry ascending', () => {
    const docs = [
      { id: '2', filename: 'B.pdf', expires_at: daysFromNow(50) },
      { id: '1', filename: 'A.pdf', expires_at: daysFromNow(-1) }
    ];
    const alerts = generateDocumentAlerts(docs);
    expect(alerts[0].documentId).toBe('1');
  });
});

describe('generateReviewAlerts', () => {
  it('returns empty array if no schedule', () => {
    expect(generateReviewAlerts({})).toEqual([]);
    expect(generateReviewAlerts(null)).toEqual([]);
  });

  it('flags overdue review as high severity', () => {
    const schedule = { nextReviewDate: daysFromNow(-3) };
    const alerts = generateReviewAlerts(schedule);
    expect(alerts[0].severity).toBe('high');
    expect(alerts[0].type).toBe('review_overdue');
  });

  it('flags review in 10 days as medium', () => {
    const schedule = { nextReviewDate: daysFromNow(10) };
    const alerts = generateReviewAlerts(schedule);
    expect(alerts[0].severity).toBe('medium');
  });

  it('does not alert for review more than 14 days away', () => {
    const schedule = { nextReviewDate: daysFromNow(20) };
    expect(generateReviewAlerts(schedule)).toHaveLength(0);
  });
});

describe('evaluateCovenants', () => {
  it('marks covenant as cumple when min direction is met', () => {
    const cov = [{ id: '1', name: 'DSCR', requiredValue: 1.25, currentValue: 1.5, direction: 'min' }];
    expect(evaluateCovenants(cov)[0].computedStatus).toBe('cumple');
  });

  it('marks covenant as incumple when min direction is not met', () => {
    const cov = [{ id: '1', name: 'DSCR', requiredValue: 1.25, currentValue: 1.0, direction: 'min' }];
    expect(evaluateCovenants(cov)[0].computedStatus).toBe('incumple');
  });

  it('marks covenant as cumple when max direction is met', () => {
    const cov = [{ id: '1', name: 'LTV', requiredValue: 0.7, currentValue: 0.65, direction: 'max' }];
    expect(evaluateCovenants(cov)[0].computedStatus).toBe('cumple');
  });

  it('marks covenant as pendiente when currentValue is null', () => {
    const cov = [{ id: '1', name: 'DSCR', requiredValue: 1.25, currentValue: null, direction: 'min' }];
    expect(evaluateCovenants(cov)[0].computedStatus).toBe('pendiente');
  });
});

describe('computeComplianceScore', () => {
  it('returns score 100 and Verde for no alerts and no incumple', () => {
    const result = computeComplianceScore([], []);
    expect(result.score).toBe(100);
    expect(result.semaforo).toBe('Verde');
    expect(result.status).toBe('al_dia');
  });

  it('returns Rojo for critical alert', () => {
    const alerts = [{ severity: 'critical' }];
    const result = computeComplianceScore(alerts, []);
    expect(result.semaforo).toBe('Rojo');
  });

  it('deducts 30 per critical alert', () => {
    const alerts = [{ severity: 'critical' }, { severity: 'critical' }];
    const result = computeComplianceScore(alerts, []);
    expect(result.score).toBe(40);
  });

  it('returns Amarillo when score is between 50-79 with no critical', () => {
    const alerts = [{ severity: 'high' }, { severity: 'high' }];
    const result = computeComplianceScore(alerts, []);
    expect(result.score).toBe(70);
    expect(result.semaforo).toBe('Amarillo');
  });
});

describe('normalizeCovenants', () => {
  it('filters entries without name', () => {
    const raw = [{ name: 'DSCR', requiredValue: 1.25 }, { name: '', requiredValue: 0 }];
    expect(normalizeCovenants(raw)).toHaveLength(1);
  });

  it('converts numeric strings', () => {
    const raw = [{ name: 'DSCR', requiredValue: '1.25', currentValue: '1.50' }];
    const result = normalizeCovenants(raw);
    expect(result[0].requiredValue).toBe(1.25);
    expect(result[0].currentValue).toBe(1.5);
  });

  it('assigns uuid when id is missing', () => {
    const raw = [{ name: 'LTV', requiredValue: 0.7 }];
    const result = normalizeCovenants(raw);
    expect(result[0].id).toBeTruthy();
  });

  it('returns empty array for non-array input', () => {
    expect(normalizeCovenants(null)).toEqual([]);
    expect(normalizeCovenants('nope')).toEqual([]);
  });
});

describe('normalizeReviewSchedule', () => {
  it('defaults frequency to quarterly', () => {
    const result = normalizeReviewSchedule({ nextReviewDate: '2026-09-01' });
    expect(result.frequency).toBe('quarterly');
  });

  it('rejects invalid frequency', () => {
    const result = normalizeReviewSchedule({ frequency: 'daily' });
    expect(result.frequency).toBe('quarterly');
  });

  it('accepts valid frequencies', () => {
    for (const freq of ['monthly', 'quarterly', 'biannual', 'annual']) {
      expect(normalizeReviewSchedule({ frequency: freq }).frequency).toBe(freq);
    }
  });
});
