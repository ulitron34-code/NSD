# NUXERA — Production Cutover Runbook

Status as of 2026-07-19: **ready to execute, not yet executed**. Nothing in this document has been run against `main` or Vercel/Render Production. It exists so the cutover is a short, pre-verified sequence instead of a fresh investigation when the user decides to go.

## Pre-flight verification already done (dry run only, no real changes)

- `git merge-base origin/main origin/nuxera-controlled-migration` = `3ac37a4` = current `origin/main` HEAD. Main has not moved since the branch point: 0 commits behind, 80 ahead. No divergent history to reconcile.
- Real dry-run merge of `origin/nuxera-controlled-migration` into `origin/main` performed in an isolated git worktree: **0 conflicts**, 292 files changed, all additive/modified.
- GitHub itself independently confirms PR #3 (`nuxera-controlled-migration` → `main`) is `MERGEABLE`.
- Against the merged (post-cutover) code, run in the same isolated worktree:
  - Frontend: `npm run lint` clean, `npx vitest run` → 259/259 passed, `npm run build` succeeds.
  - Backend: `npm test` → 469/469 passed.
  - `npm run go-nogo:local` (backend/scripts/go-nogo-local.js, 24 checks incl. frontend production build and Chromium E2E) → **24/24 GO**.

Conclusion: the code side of the cutover has no open risk. What remains is exclusively real, externally-visible actions (merge, push to main, flip a Production env var, confirm the live redeploy) — each one is the kind of action this repo's autonomy rule requires asking about first (see `CLAUDE.md`).

## The cutover sequence (execute only on explicit user go-ahead)

1. **Merge PR #3 into `main`** on GitHub (`gh pr merge 3 --merge` or the GitHub UI). Prefer a merge commit (not squash/rebase) so the 80-commit history stays intact for rollback granularity.
2. **Flip the feature flag for Production** in the Vercel dashboard: Project → Settings → Environment Variables → `VITE_NUXERA_EXPERIENCE_ENABLED` → set to `true` for the **Production** environment specifically (Preview already effectively runs with it enabled via the branch deploy). This var currently defaults to `false` in `.env.example`; Production has never had it flipped, which is why `main`/production still serves the legacy NEXUS experience today.
   - Optional, not required: the six per-role/per-engine flags (`VITE_NUXERA_APPLICANT_ENABLED`, `..._GRANTOR_ENABLED`, `..._ADMIN_ENABLED`, `..._INTELLIGENCE_ENABLED`, `..._MARKETS_ENABLED`, `..._STRATEGY_ENABLED`) default to **enabled** when unset, so nothing else needs to be set unless the user wants to stage a partial rollout (e.g. applicant-only first).
3. **Trigger/confirm the Production redeploy.** Merging to `main` should auto-trigger it if the Vercel project is connected to `main` for Production; otherwise redeploy manually from the dashboard after step 2 so the new env var takes effect (Vercel only picks up env var changes on a fresh build, not on already-built deployments).
4. **Verify the live production domain**, not just Preview:
   - `curl` the real production URL for `200`.
   - Confirm the NUXERA entry point (button/toggle) is present and the classic dashboard still loads for users who haven't switched.
   - Re-run the same 9-scenario HTTP verification pattern from `NUXERA_CONTROLLED_RLS_ENDPOINT_EVIDENCE_TEMPLATE.md` ("Deployed-preview endpoint evidence" section) but against the production origin instead of the Preview origin, to catch any CORS/env difference between Preview and Production.
5. **Render backend**: confirm `nsd-backend` (the production Render service, not the PR-3 preview service) is the one production Vercel is calling, and that it is healthy (`/health` → 200). If the Anthropic/NVIDIA/DeepSeek/OpenAI keys are being loaded at the same time (see `render.yaml`, all `sync:false`), load them in the Render dashboard *before* this cutover or in the same window, and expect `documentIntelligence.routes.js`/`nsdApplicant.js` to switch from fallback to real AI calls immediately after.
6. If anything looks wrong: `ROLLBACK_PLAN.md` in this same folder covers reverting — the flag flip alone (`VITE_NUXERA_EXPERIENCE_ENABLED=false` back in Production + redeploy) is the fastest rollback and does not require reverting the merge.

## What this does NOT cover

- The Word/PDF walkthrough document with screenshots of the full flow — explicitly deferred by the user until after this real cutover, not before.
- Wiring the 11-agent orchestration (`caseOrchestration.js`) to real model execution — that is trace-only by design today; loading AI provider keys does not change that, it would be new scoped work.
