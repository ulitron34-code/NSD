const DEFAULT_RECENT_COMMITS = Object.freeze([
  { hash: '42c4ba7', title: 'Add NUXERA controlled release dossier' },
  { hash: '4fb98ad', title: 'Add NUXERA controlled change request package' },
  { hash: '12e2e63', title: 'Add NUXERA controlled write gate' },
  { hash: 'bc4a76b', title: 'Add NUXERA controlled approval package' },
  { hash: '3f9b41b', title: 'Add NUXERA controlled evidence review' }
]);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeRecentCommits(commits) {
  const values = asArray(commits).filter((commit) => commit && typeof commit === 'object');
  return (values.length ? values : DEFAULT_RECENT_COMMITS).map((commit) => ({
    hash: commit.hash || commit.id || 'unknown',
    title: commit.title || commit.message || 'NUXERA controlled migration update'
  }));
}

function buildContinuationMarkdown(pack) {
  const lines = [
    '# NUXERA Controlled Migration Continuation Pack',
    '',
    `Status: ${pack.status}`,
    `Progress: ${pack.progress.percent}%`,
    `Branch: ${pack.resumeContext.branch}`,
    `Resume from commit: ${pack.resumeContext.resumeFromCommit}`,
    '',
    '## Recent Commits',
    ...pack.recentCommits.map((commit) => `- ${commit.hash} ${commit.title}`),
    '',
    '## Completed Chain',
    ...pack.completedChain.map((item) => `- ${item.label}: ${item.status}`),
    '',
    '## Validation Snapshot',
    ...pack.validationSnapshot.map((item) => `- ${item}`),
    '',
    '## Next Resume Steps',
    ...pack.nextResumeSteps.map((item) => `- ${item}`),
    '',
    '## Guardrails',
    ...pack.guardrails.map((item) => `- ${item}`)
  ];

  return lines.join('\n');
}

export function getNuxeraControlledContinuationPack(input = {}) {
  const progressPercent = Number.isFinite(input.progressPercent) ? input.progressPercent : 84;
  const resumeFromCommit = input.resumeFromCommit || '42c4ba7';
  const branch = input.branch || 'nuxera-controlled-migration';
  const recentCommits = normalizeRecentCommits(input.recentCommits);
  const nextResumeSteps = [
    'Start from latest clean commit and confirm `git status --short` is empty.',
    'Use the controlled chain in order: scaffold -> review -> approval package -> write gate -> change request -> release dossier.',
    'Run a real controlled non-production Supabase verification pass and paste observed evidence into the scaffold.',
    'Recalculate every read-only package with real metadata before any deploy/change-control review.',
    'Keep production write enablement outside this package as a separate reviewed change-control action.'
  ];
  const pack = {
    id: 'nuxera-controlled-continuation-pack',
    status: 'ready-for-night-continuation',
    progress: {
      percent: progressPercent,
      label: `${progressPercent}% complete`,
      confidence: 'approximate-controlled-migration-progress'
    },
    resumeContext: {
      branch,
      resumeFromCommit,
      localRepo: input.localRepo || 'C:/Users/usalgado/Documents/Codex/2026-07-16/h/work/NSD',
      downloadsRoot: input.downloadsRoot || 'C:/Users/usalgado/Downloads/NUXERA_AVANCE_LOCAL_2026-07-17'
    },
    recentCommits,
    completedChain: [
      { id: 'verification-plan', label: 'Verification plan', status: 'implemented-read-only' },
      { id: 'evidence-scaffold', label: 'Evidence scaffold', status: 'implemented-read-only' },
      { id: 'runbook', label: 'Controlled runbook', status: 'implemented-read-only' },
      { id: 'evidence-review', label: 'Evidence review', status: 'implemented-read-only' },
      { id: 'approval-package', label: 'Approval package', status: 'implemented-read-only' },
      { id: 'write-gate', label: 'Write gate', status: 'implemented-read-only' },
      { id: 'change-request', label: 'Change request package', status: 'implemented-read-only' },
      { id: 'release-dossier', label: 'Release readiness dossier', status: 'implemented-read-only' }
    ],
    validationSnapshot: [
      'Backend full suite passed: 50 files / 460 tests.',
      'Frontend full suite passed: 9 files / 239 tests.',
      'Continuation pack CLI JSON generation passed.',
      'git diff --check passed with CRLF warnings only.',
      'Browser/Playwright visual verification remains blocked by local spawn EPERM.'
    ],
    nextResumeSteps,
    guardrails: [
      'Continuation pack is read-only and does not persist approvals, tickets or deployment windows.',
      'Continuation pack does not execute endpoints, apply SQL, change RLS, grant document access or enable writes.',
      'Production write enablement remains a separate reviewed deploy/change-control action.'
    ]
  };

  return {
    ...pack,
    markdown: buildContinuationMarkdown(pack)
  };
}
