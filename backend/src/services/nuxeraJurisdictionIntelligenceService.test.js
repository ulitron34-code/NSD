import { describe, expect, it } from 'vitest';
import { buildJurisdictionEvidenceFromTimeline } from './nuxeraJurisdictionIntelligenceService.js';

describe('nuxeraJurisdictionIntelligenceService', () => {
  it('builds UAE grantor jurisdiction evidence with sector-specific regulators', () => {
    const timeline = {
      orderId: 'order-uae-001',
      order: {
        id: 'order-uae-001',
        riskLevel: 'medium',
        metadata: {
          country: 'AE',
          emirate: 'Dubai',
          city: 'Dubai',
          companyName: 'GulfPay MENA FZ-LLC',
          sector: 'Payments and virtual assets',
          regulatoryClaims: ['payments', 'virtual assets', 'VASP', 'TRN', 'trade license']
        }
      }
    };

    const evidence = buildJurisdictionEvidenceFromTimeline(timeline, {
      language: 'en',
      workspaceRole: 'grantor'
    });

    const sourceIds = evidence.findings.map((source) => source.id);

    expect(evidence.country).toBe('AE');
    expect(evidence.territory.label).toBe('Dubai');
    expect(evidence.riskTier).toBe('high');
    expect(sourceIds).toContain('uae-pass');
    expect(sourceIds).toContain('eocn-uae');
    expect(sourceIds).toContain('sca-cma');
    expect(sourceIds).toContain('cbuae');
    expect(sourceIds).toContain('vara');
    expect(sourceIds).toContain('fta-trn');
    expect(sourceIds).toContain('ner-ded');
    expect(evidence.coverage.reviewed).toBeGreaterThanOrEqual(5);
    expect(evidence.providerPlan.privateOrAgreement).toContain('UAE PASS');
    expect(evidence.providerPlan.privateOrAgreement).toContain('SCA/CMA structured register');
    expect(evidence.sourceAcquisitionPlan.status).toBe('partial-public-plus-agreement-required');
    expect(evidence.sourceAcquisitionPlan.sourceRows.map((source) => source.sourceId)).toContain('uae-pass');
    expect(evidence.sourceAcquisitionPlan.operationalCycle.join(' ')).toContain('Applicant uploads');
    expect(evidence.guardrails.join(' ')).toContain('cannot approve');
  });

  it('falls back safely for unprofiled countries without approving the case', () => {
    const evidence = buildJurisdictionEvidenceFromTimeline({
      orderId: 'order-zz-001',
      order: { metadata: { country: 'ZZ', companyName: 'UnknownCo' } }
    }, { language: 'en', workspaceRole: 'admin' });

    expect(evidence.country).toBe('ZZ');
    expect(evidence.countryName).toBe('Unprofiled country');
    expect(evidence.findings.map((source) => source.id)).toContain('fatf-global');
    expect(evidence.decisionImpact).toContain('documented human review');
  });
});
