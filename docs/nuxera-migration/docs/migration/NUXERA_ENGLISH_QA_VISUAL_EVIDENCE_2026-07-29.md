# NUXERA English QA and Visual Review Evidence

Date: 2026-07-29
Target: `https://nsd-pi.vercel.app`
Generated at: `2026-07-29T16:39:43.185Z`

## Automated QA Result

- Total scenarios: 4
- Passed: 4
- Failed: 0
- Visible Nexus references: 0

Scenarios covered:

- public-home: PASS at `https://nsd-pi.vercel.app/`
- applicant-dashboard-en: PASS at `https://nsd-pi.vercel.app/dashboard`
- grantor-workspace-en: PASS at `https://nsd-pi.vercel.app/dashboard/nuxera/cases`
- admin-operations-en: PASS at `https://nsd-pi.vercel.app/dashboard/nuxera/operations`

Artifacts generated locally:

- `artifacts/nuxera-english-qa/public-home.png`
- `artifacts/nuxera-english-qa/applicant-dashboard-en.png`
- `artifacts/nuxera-english-qa/grantor-workspace-en.png`
- `artifacts/nuxera-english-qa/admin-operations-en.png`
- `artifacts/nuxera-english-qa/english-qa-evidence.json`

## Findings

- Public identity loads as NUXERA Financial Intelligence.
- Applicant, funding provider and admin demo sessions open in the NUXERA shell.
- English mode works when `localStorage.language = "en"` is set.
- The funding-provider route uses `Funding provider` in the shell and `Grantor` in one workspace eyebrow; this is acceptable, but final presentation copy should standardize one label.
- Local fallback strings that were Spanish in English mode were updated locally to English-neutral fallback text.
- No visible Nexus references were detected by the automated English QA run.

## Code Changes Made from QA

- `scripts/capture-nuxera-english-scenarios.mjs` supports local Chrome/Edge executable fallback when Playwright-managed Chromium is not installed.
- The QA script sets the real i18n key `language=en`.
- The QA script waits for visible content instead of fragile `networkidle`.
- The QA matching is case-insensitive and records visible Nexus signals plus excerpts.
- `src/nuxera/shell/NuxeraShell.jsx` persists language changes to `localStorage.language`.
- Local fallback text in timeline/risk/persistence adapters was converted to English-neutral copy for presentation readiness.

## Remaining Manual Review

After this commit is deployed, rerun:

```bash
npm run qa:nuxera:english
```

Then review the four screenshots visually for layout, text clipping and mixed-language copy.
