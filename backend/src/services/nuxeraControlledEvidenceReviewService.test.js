import { describe, expect, it } from 'vitest';
import { getNuxeraControlledEvidenceScaffold } from './nuxeraControlledEvidenceScaffoldService.js';
import { reviewNuxeraControlledEvidence } from './nuxeraControlledEvidenceReviewService.js';

const COMPLETE_EVIDENCE = `# NUXERA Controlled RLS and Endpoint Evidence

## Run metadata

| Field | Value |
|---|---|
| Environment | non-production-supabase |

## Required SQL drafts

| Draft | Applied? | Hash/checksum | Notes |
|---|---:|---|---|
| workspace | Yes | abc | applied in non-prod |

## Required RLS identities

| Scenario id | Identity | Test user/order | Expected allow | Expected deny | Observed result | Pass/Fail | Evidence link |
|---|---|---|---|---|---|---|---|
| applicant-owner | Applicant owner | user/order | Own state | Foreign state | Observed expected behavior | Pass | evidence://owner |

## Required endpoint evidence

| Endpoint | Actor/scenario | Expected status/body | Observed status/body | Audit log required? | Pass/Fail | Evidence link |
|---|---|---|---|---:|---|---|
| GET /api/nuxera/orders/:orderId/state | applicant-owner | Own state | 200 expected shape | No | Pass | evidence://endpoint |

## No-go criteria

- Reviewed; no exception criteria were triggered.

## Rollback rehearsal evidence

| Check | Expected | Observed | Pass/Fail | Notes |
|---|---|---|---|---|
| Feature flag off hides NUXERA UI reads/writes | Legacy remains usable | Observed | Pass | evidence://rollback |

## Decision

| Decision field | Value |
|---|---|
| Controlled RLS pass complete? | Yes |
| Endpoint pass complete? | Yes |
| Rollback rehearsal complete? | Yes |
| Approved to enable applicant checklist writes outside local fallback? | Approved |
`;

describe('nuxeraControlledEvidenceReviewService', () => {
  it('blocks review when evidence markdown is missing', () => {
    const review = reviewNuxeraControlledEvidence();

    expect(review).toMatchObject({
      id: 'nuxera-controlled-evidence-review',
      status: 'missing-evidence-markdown',
      readyForHumanReview: false,
      summary: { missingSections: 7, missingDecisions: 4 }
    });
    expect(review.blockers).toEqual(expect.arrayContaining([
      'Evidence Markdown payload is required before review.'
    ]));
  });

  it('blocks scaffold evidence while TODO values remain', () => {
    const scaffold = getNuxeraControlledEvidenceScaffold({ generatedAt: '2026-07-17T20:00:00.000Z' });
    const review = reviewNuxeraControlledEvidence({ markdown: scaffold.markdown });

    expect(review.status).toBe('blocked-by-incomplete-evidence');
    expect(review.readyForHumanReview).toBe(false);
    expect(review.summary.todoMarkers).toBeGreaterThan(0);
    expect(review.blockers).toEqual(
      expect.arrayContaining([expect.stringContaining('TODO')])
    );
  });

  it('marks completed clean evidence ready for human approval review only', () => {
    const review = reviewNuxeraControlledEvidence({ markdown: COMPLETE_EVIDENCE });

    expect(review.status).toBe('ready-for-human-approval-review');
    expect(review.readyForHumanReview).toBe(true);
    expect(review.summary).toMatchObject({
      missingSections: 0,
      todoMarkers: 0,
      missingDecisions: 0,
      noGoIndicators: 0
    });
    expect(review.nextDecision).toContain('human approval review');
    expect(review.guardrails.join(' ')).toContain('not production approval');
  });

  it('blocks evidence review when no-go indicators are present', () => {
    const review = reviewNuxeraControlledEvidence({
      markdown: COMPLETE_EVIDENCE.replace('| Pass | evidence://endpoint |', '| Fail | evidence://endpoint |')
    });

    expect(review.status).toBe('blocked-by-no-go-evidence');
    expect(review.readyForHumanReview).toBe(false);
    expect(review.summary.noGoIndicators).toBeGreaterThan(0);
  });
});
