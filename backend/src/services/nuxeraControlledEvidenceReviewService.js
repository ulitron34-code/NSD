import { getNuxeraControlledVerificationPlan } from './nuxeraControlledVerificationService.js';

const REQUIRED_SECTIONS = Object.freeze([
  'Run metadata',
  'Required SQL drafts',
  'Required RLS identities',
  'Required endpoint evidence',
  'No-go criteria',
  'Rollback rehearsal evidence',
  'Decision'
]);

const REQUIRED_DECISIONS = Object.freeze([
  'Controlled RLS pass complete?',
  'Endpoint pass complete?',
  'Rollback rehearsal complete?',
  'Approved to enable applicant checklist writes outside local fallback?'
]);

function countMatches(content, pattern) {
  return (content.match(pattern) || []).length;
}

function hasSection(markdown, section) {
  const escaped = section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^##\\s+${escaped}\\s*$`, 'im').test(markdown);
}

function hasIncompleteToken(markdown) {
  return /\bTODO\b|Pass\/Fail\s*\|\s*TODO|Observed[^\n|]*\|\s*TODO/i.test(markdown);
}

function hasApproval(markdown, field) {
  const escaped = field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const row = new RegExp(`\\|\\s*${escaped}\\s*\\|\\s*(Yes|Si|Sí|Complete|Completed|Pass|Aprobado|Approved)\\s*\\|`, 'i');
  return row.test(markdown);
}

function hasNoGoIndicator(markdown) {
  return /\|\s*(fail|failed|no-go|bloqueado|blocked)\s*\|/i.test(markdown)
    || /no-go\s+(observed|detectado|true|yes|si|sí)/i.test(markdown);
}

export function reviewNuxeraControlledEvidence(input = {}) {
  const plan = getNuxeraControlledVerificationPlan();
  const markdown = typeof input.markdown === 'string' ? input.markdown : '';
  const trimmed = markdown.trim();

  if (!trimmed) {
    return {
      id: 'nuxera-controlled-evidence-review',
      status: 'missing-evidence-markdown',
      readyForHumanReview: false,
      sourcePlanId: plan.id,
      summary: {
        requiredSections: REQUIRED_SECTIONS.length,
        missingSections: REQUIRED_SECTIONS.length,
        todoMarkers: 0,
        passMarkers: 0,
        failMarkers: 0,
        missingDecisions: REQUIRED_DECISIONS.length,
        noGoIndicators: 0
      },
      missingSections: REQUIRED_SECTIONS.map((section) => ({ id: section, label: section })),
      missingDecisions: [...REQUIRED_DECISIONS],
      blockers: ['Evidence Markdown payload is required before review.'],
      nextDecision: 'Submit completed controlled evidence Markdown for read-only review.',
      guardrails: [
        'Review is read-only; it does not execute endpoints, apply SQL, change RLS or enable writes.'
      ]
    };
  }

  const missingSections = REQUIRED_SECTIONS
    .filter((section) => !hasSection(markdown, section))
    .map((section) => ({ id: section, label: section }));
  const missingDecisions = REQUIRED_DECISIONS.filter((decision) => !hasApproval(markdown, decision));
  const todoMarkers = countMatches(markdown, /\bTODO\b/gi);
  const passMarkers = countMatches(markdown, /\|\s*(pass|passed|yes|si|sí|approved|aprobado|complete|completed)\s*\|/gi);
  const failMarkers = countMatches(markdown, /\|\s*(fail|failed|no-go|blocked|bloqueado)\s*\|/gi);
  const noGoIndicators = hasNoGoIndicator(markdown) ? Math.max(1, failMarkers) : 0;
  const blockers = [
    ...missingSections.map((section) => `Missing section: ${section.label}.`),
    ...missingDecisions.map((decision) => `Missing approved decision: ${decision}.`),
  ];

  if (hasIncompleteToken(markdown)) {
    blockers.push('Evidence still contains TODO or incomplete observed/pass-fail cells.');
  }
  if (noGoIndicators > 0) {
    blockers.push('No-go or failed evidence indicator was detected.');
  }

  const readyForHumanReview = blockers.length === 0;

  return {
    id: 'nuxera-controlled-evidence-review',
    status: readyForHumanReview
      ? 'ready-for-human-approval-review'
      : noGoIndicators > 0
        ? 'blocked-by-no-go-evidence'
        : 'blocked-by-incomplete-evidence',
    readyForHumanReview,
    sourcePlanId: plan.id,
    summary: {
      requiredSections: REQUIRED_SECTIONS.length,
      missingSections: missingSections.length,
      todoMarkers,
      passMarkers,
      failMarkers,
      missingDecisions: missingDecisions.length,
      noGoIndicators
    },
    missingSections,
    missingDecisions,
    blockers,
    nextDecision: readyForHumanReview
      ? 'Route completed evidence to human approval review; do not enable production writes automatically.'
      : 'Complete evidence, clear TODO/no-go blockers and rerun read-only review.',
    guardrails: [
      'Review is read-only; it does not execute endpoints, apply SQL, change RLS or enable writes.',
      'Ready-for-human-review is not production approval.',
      'Any no-go indicator keeps NUXERA writes blocked.'
    ]
  };
}
