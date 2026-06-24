import { describe, it, expect } from 'vitest';
import { getOrderReadinessSignal } from '../utils/readinessSignal';

describe('getOrderReadinessSignal', () => {
  it('returns green when canShareWithFunders is true', () => {
    const result = getOrderReadinessSignal({ canShareWithFunders: true });
    expect(result.key).toBe('green');
    expect(result.label).toBe('Verde');
  });

  it('returns green for readinessGrade A', () => {
    const result = getOrderReadinessSignal({ readinessGrade: 'A' });
    expect(result.key).toBe('green');
  });

  it('returns green for readinessGrade B', () => {
    const result = getOrderReadinessSignal({ readinessGrade: 'b' });
    expect(result.key).toBe('green');
  });

  it('returns green for complianceStatus aprobado_para_presentacion', () => {
    const result = getOrderReadinessSignal({ complianceStatus: 'aprobado_para_presentacion' });
    expect(result.key).toBe('green');
  });

  it('returns amber for readinessGrade C', () => {
    const result = getOrderReadinessSignal({ readinessGrade: 'C' });
    expect(result.key).toBe('amber');
    expect(result.label).toBe('Ambar');
  });

  it('returns amber for complianceStatus en_revision', () => {
    const result = getOrderReadinessSignal({ complianceStatus: 'en_revision' });
    expect(result.key).toBe('amber');
  });

  it('returns red for readinessGrade D', () => {
    const result = getOrderReadinessSignal({ readinessGrade: 'D' });
    expect(result.key).toBe('red');
    expect(result.label).toBe('Rojo');
  });

  it('returns red for readinessGrade E', () => {
    const result = getOrderReadinessSignal({ readinessGrade: 'E' });
    expect(result.key).toBe('red');
  });

  it('returns red for complianceStatus rechazado_por_cumplimiento', () => {
    const result = getOrderReadinessSignal({ complianceStatus: 'rechazado_por_cumplimiento' });
    expect(result.key).toBe('red');
  });

  it('returns pending for empty order', () => {
    const result = getOrderReadinessSignal({});
    expect(result.key).toBe('pending');
    expect(result.label).toBe('Pend.');
  });

  it('returns pending for undefined order', () => {
    const result = getOrderReadinessSignal();
    expect(result.key).toBe('pending');
  });

  it('all signals include color and background', () => {
    const statuses = [
      { canShareWithFunders: true },
      { readinessGrade: 'C' },
      { readinessGrade: 'D' },
      {}
    ];
    for (const s of statuses) {
      const result = getOrderReadinessSignal(s);
      expect(result.color).toBeTruthy();
      expect(result.background).toBeTruthy();
      expect(result.title).toBeTruthy();
      expect(result.detail).toBeTruthy();
    }
  });
});
