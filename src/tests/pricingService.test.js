import { describe, it, expect } from 'vitest';
import {
  PLANS,
  getPlanById,
  getPlanInfo,
  hasFeature,
  checkLimits,
  getUpgradeRecommendation,
  getDisplayPrice
} from '../services/pricingService';

describe('PLANS', () => {
  it('defines three plans', () => {
    expect(Object.keys(PLANS)).toHaveLength(3);
    expect(PLANS.STARTER).toBeDefined();
    expect(PLANS.GROWTH).toBeDefined();
    expect(PLANS.ENTERPRISE).toBeDefined();
  });

  it('starter plan costs $299 USD', () => {
    expect(PLANS.STARTER.price.USD).toBe(299);
  });

  it('growth plan costs $699 USD', () => {
    expect(PLANS.GROWTH.price.USD).toBe(699);
  });

  it('enterprise plan costs $899 USD', () => {
    expect(PLANS.ENTERPRISE.price.USD).toBe(899);
  });

  it('growth plan is marked as popular', () => {
    expect(PLANS.GROWTH.popular).toBe(true);
    expect(PLANS.STARTER.popular).toBeFalsy();
  });

  it('enterprise plan has unlimited expedientes (-1)', () => {
    expect(PLANS.ENTERPRISE.limits.maxExpedientes).toBe(-1);
  });
});

describe('getPlanById', () => {
  it('returns correct plan for valid id', () => {
    expect(getPlanById('plan_starter')).toBe(PLANS.STARTER);
    expect(getPlanById('plan_growth')).toBe(PLANS.GROWTH);
    expect(getPlanById('plan_enterprise')).toBe(PLANS.ENTERPRISE);
  });

  it('returns undefined for unknown id', () => {
    expect(getPlanById('plan_nonexistent')).toBeUndefined();
  });
});

describe('getPlanInfo', () => {
  it('returns localized plan info in Spanish', () => {
    const info = getPlanInfo(PLANS.STARTER, 'es');
    expect(info.name).toBe('Inicial');
    expect(info.id).toBe('plan_starter');
  });

  it('returns localized plan info in English', () => {
    const info = getPlanInfo(PLANS.STARTER, 'en');
    expect(info.name).toBe('Starter');
  });

  it('defaults to Spanish when language is not provided', () => {
    const info = getPlanInfo(PLANS.STARTER);
    expect(info.name).toBe('Inicial');
  });

  it('returns null for null plan', () => {
    expect(getPlanInfo(null)).toBeNull();
  });

  it('includes features array', () => {
    const info = getPlanInfo(PLANS.GROWTH, 'es');
    expect(Array.isArray(info.features)).toBe(true);
    expect(info.features.length).toBeGreaterThan(0);
  });

  it('marks growth as popular', () => {
    const info = getPlanInfo(PLANS.GROWTH, 'es');
    expect(info.popular).toBe(true);
  });
});

describe('hasFeature', () => {
  it('returns true for included feature in growth plan', () => {
    expect(hasFeature(PLANS.GROWTH, 'ai_forensic')).toBe(true);
  });

  it('returns false for excluded feature in starter plan', () => {
    expect(hasFeature(PLANS.STARTER, 'ai_forensic')).toBe(false);
  });

  it('returns true for data_room in all plans', () => {
    expect(hasFeature(PLANS.STARTER, 'data_room')).toBe(true);
    expect(hasFeature(PLANS.GROWTH, 'data_room')).toBe(true);
    expect(hasFeature(PLANS.ENTERPRISE, 'data_room')).toBe(true);
  });

  it('returns false for null plan', () => {
    expect(hasFeature(null, 'ai_forensic')).toBe(false);
  });

  it('returns false for feature not in plan', () => {
    expect(hasFeature(PLANS.STARTER, 'nonexistent_feature')).toBe(false);
  });
});

describe('checkLimits', () => {
  it('returns withinLimits true when usage is within bounds', () => {
    const usage = { expedientes: 3, usuarios: 2, documentosMes: 50 };
    const result = checkLimits(PLANS.STARTER, usage);
    expect(result.withinLimits).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('detects expediente limit violation', () => {
    const usage = { expedientes: 10, usuarios: 1, documentosMes: 10 };
    const result = checkLimits(PLANS.STARTER, usage);
    expect(result.withinLimits).toBe(false);
    expect(result.violations.some(v => v.type === 'expedientes')).toBe(true);
  });

  it('detects usuario limit violation', () => {
    const usage = { expedientes: 1, usuarios: 5, documentosMes: 10 };
    const result = checkLimits(PLANS.STARTER, usage);
    expect(result.withinLimits).toBe(false);
    expect(result.violations.some(v => v.type === 'usuarios')).toBe(true);
  });

  it('detects documentos limit violation', () => {
    const usage = { expedientes: 1, usuarios: 1, documentosMes: 200 };
    const result = checkLimits(PLANS.STARTER, usage);
    expect(result.withinLimits).toBe(false);
    expect(result.violations.some(v => v.type === 'documentos')).toBe(true);
  });

  it('ignores unlimited (-1) limits in enterprise plan', () => {
    const usage = { expedientes: 1000, usuarios: 500, documentosMes: 99999 };
    const result = checkLimits(PLANS.ENTERPRISE, usage);
    expect(result.withinLimits).toBe(true);
  });
});

describe('getUpgradeRecommendation', () => {
  it('returns null when within limits', () => {
    const usage = { expedientes: 1, usuarios: 1, documentosMes: 10 };
    expect(getUpgradeRecommendation(PLANS.STARTER, usage)).toBeNull();
  });

  it('recommends next plan when limit exceeded', () => {
    const usage = { expedientes: 10, usuarios: 1, documentosMes: 10 };
    const rec = getUpgradeRecommendation(PLANS.STARTER, usage);
    expect(rec).not.toBeNull();
    expect(rec.plan.id).toBe('plan_growth');
  });

  it('returns null for enterprise plan (no higher plan)', () => {
    const usage = { expedientes: 10000, usuarios: 500, documentosMes: 99999 };
    expect(getUpgradeRecommendation(PLANS.ENTERPRISE, usage)).toBeNull();
  });

  it('includes violation reasons in recommendation', () => {
    const usage = { expedientes: 10, usuarios: 1, documentosMes: 10 };
    const rec = getUpgradeRecommendation(PLANS.STARTER, usage);
    expect(Array.isArray(rec.reasons)).toBe(true);
    expect(rec.reasons.length).toBeGreaterThan(0);
  });
});

describe('getDisplayPrice', () => {
  it('returns USD price for starter plan', () => {
    const price = getDisplayPrice(PLANS.STARTER, 'USD');
    expect(price.amount).toBe(299);
    expect(price.currency).toBe('USD');
  });

  it('returns MXN price when currency is MXN', () => {
    const price = getDisplayPrice(PLANS.STARTER, 'MXN');
    expect(price.amount).toBe(5980);
    expect(price.currency).toBe('MXN');
  });

  it('defaults to USD when currency not found', () => {
    const price = getDisplayPrice(PLANS.STARTER, 'EUR');
    expect(price.amount).toBe(299);
  });

  it('returns monthly interval', () => {
    const price = getDisplayPrice(PLANS.GROWTH, 'USD');
    expect(price.interval).toBe('month');
  });

  it('includes formatted price string', () => {
    const price = getDisplayPrice(PLANS.STARTER, 'USD');
    expect(typeof price.formatted).toBe('string');
    expect(price.formatted).toContain('299');
  });
});
