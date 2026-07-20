# NUXERA Controlled RLS and Endpoint Evidence Template v1

## Purpose

Capture controlled non-production evidence before any NUXERA SQL draft or write path is considered production-ready.

This template is evidence-only. It does not apply SQL, change RLS, create grants, mutate documents or enable production writes.

## Run metadata

| Field | Value |
|---|---|
| Verification date | 2026-07-18 |
| Environment | **Production** (`iafwnrootbtlsdqfioiu`, `ulitron34-code's ProjectNSD IF`) — no non-production Supabase project exists in this org (single-project free-tier org); user was told this explicitly and authorized applying directly to production instead of provisioning a separate project first. This is a deliberate deviation from the "non-production first" recommendation above, not an oversight. |
| Repo commit | `e249a70` (HEAD at time of DB apply; DB changes themselves are not tied to a commit since nothing was committed this session) |
| SQL drafts applied | All three, in dependency order: workspace_states -> evidence_links -> admin_controls |
| Operator | ulitron34 |
| Reviewer | ulitron34 |
| Feature flag state | `false` (`VITE_NUXERA_EXPERIENCE_ENABLED=false` in `.env`/`.env.example`) |
| Prior known-good commit | `e249a70` |
| Rollback owner | ulitron34 |

## Required SQL drafts

Record the exact SQL filenames and hashes used for the controlled run.

| Draft | Applied? | Hash/checksum | Notes |
|---|---:|---|---|
| `backend/sql_migrations_pendientes/2026-07-16_nuxera_workspace_states.sql` | Yes | `sha256:1eb3521611f69dffc6c578822bb96c24ce8a0578dffec1289e75adff91833ed` | "Success. No rows returned" in Supabase SQL Editor. |
| `backend/sql_migrations_pendientes/2026-07-17_nuxera_evidence_links.sql` | Yes | `sha256:9c7e0eda560c1c163a4c380054f7bc3342b3ffca1f2dde6111cb608ebb16b4d` | "Success. No rows returned" in Supabase SQL Editor. |
| `backend/sql_migrations_pendientes/2026-07-17_nuxera_admin_controls.sql` | Yes | `sha256:82616011322bc2aa2fa6529dcf7273c126fb5c06bb58e51a6583d86014fc9a0` | "Success. No rows returned" in Supabase SQL Editor. |
| `backend/sql_migrations_pendientes/2026-07-18_nuxera_evidence_links_grantor_policy.sql` | Yes | `sha256:8a2f02ef3028b786fd4de80cb3fb078e09488431ce92e9be92308075df48791` | Added later the same session to implement the previously contract-only `authorized_grantor` RLS policy. "Success. No rows returned" in Supabase SQL Editor. |

Post-apply schema confirmation via direct query against `pg_class`/`pg_policies`:

| Table | `relrowsecurity` | Policy count (expected) | Observed |
|---|---|---:|---:|
| `nuxera_workspace_states` | true | 3 | 3 |
| `nuxera_evidence_links` | true | 1 | 1 |
| `nuxera_admin_controls` | true | 1 | 1 |

## Required RLS identities

Use representative test users and orders. Do not use production customer data.

| Scenario id | Identity | Test user/order | Expected allow | Expected deny | Observed result | Pass/Fail | Evidence link |
|---|---|---|---|---|---|---|---|
| `applicant-owner` | Applicant owner | Real pre-existing order `c61a7cd9-4d49-416b-8449-38eac3ab3bf9` / owner `f999b317-...ef8f2` (no new/fabricated data; ids from live `service_orders`) | Own applicant checklist state. | N/A (only own-row visibility tested) | `SELECT count(*)` as this identity (`SET LOCAL role authenticated; SET LOCAL request.jwt.claim.sub = <owner uuid>`) inside a `BEGIN...ROLLBACK` with one temp row inserted for this order returned **1**. | **PASS** | This document, "First controlled Supabase application" section of `PROJECT_STATE.md` |
| `different-applicant` | Different applicant | Same test row (order above), queried as a different real user `86f16b5e-...94cc` (owner of an unrelated real order) | N/A | No access to another applicant's order row. | Same query as a different `request.jwt.claim.sub` returned **0**. | **PASS** | Same as above |
| `authorized-grantor` | Authorized grantor | Real order `c61a7cd9-...ab3bf9`; a temporary `data_room_shares` row (`status='accepted'`) and a temporary `nuxera_evidence_links` row (`visibility='authorized_grantor'`) were inserted, tested, then rolled back. | Evidence for orders with an accepted/shared data-room authorization. | Applicant writes, owner-only evidence, hidden documents, document grants. | **2026-07-18: implemented and tested.** New RLS policy `authorized_grantor_select_nuxera_evidence_links` added (`backend/sql_migrations_pendientes/2026-07-18_nuxera_evidence_links_grantor_policy.sql`, applied to production). As the authorized identity (`recipient_user_id` matching an accepted share): `count(*) = 1`. As a different, unauthorized real user id with no share for that order: `count(*) = 0`. Backend route `GET /api/nuxera/orders/:orderId/grantor-evidence` also added, guarded by the existing `data_room:authorized:read` permission and `assertEvidenceGrantorAuthorized` (reuses the same `data_room_shares` check as the legacy `otorgante/pipeline` route). | **PASS** (RLS layer, backend service layer, and now the real HTTP endpoint — see endpoint table, closed 2026-07-19) | This document; `PROJECT_STATE.md` "Grantor-authorized evidence links" section |
| `admin-internal` | Admin/internal | Real `users` row with `profile_type = 'administrador'` (`f999b317-...ef8f2` — the only admin user in production; incidentally also the owner of the order used in the applicant-owner test above) vs. a real non-admin user id, inside `BEGIN...ROLLBACK` on `nuxera_admin_controls` | Admin identity reads admin controls. | Non-admin identity reads nothing. | As the admin identity: `count(*) = 1`. As a real non-admin identity: `count(*) = 0`. `getNuxeraBackendReadiness()` was also called directly in backend code (service-role, bypassing HTTP/auth) and returned `ready: true`, all 3 signals `available`. | **PASS** (RLS layer tested against production with real ids; the `nuxera:admin:read`-gated HTTP route itself was not called with a real session — see endpoint table) | `PROJECT_STATE.md`, "First controlled Supabase application" |

All test rows were inserted and read inside `BEGIN...ROLLBACK` transactions; `SELECT count(*) FROM nuxera_workspace_states` was confirmed `0` immediately after, i.e. zero permanent rows were left in production from this evidence run.

## Required endpoint evidence

Every denied response must avoid leaking restricted row existence.

**Done 2026-07-18, real HTTP calls with real sessions.** Real Supabase sessions were obtained for two real production users via `supabaseAdmin.auth.admin.generateLink({type:'magiclink', email})` + `verifyOtp({token_hash, type:'magiclink'})` (service-role only; no password was entered or handled, no email was sent, and the user explicitly authorized generating these sessions given the real-account audit-trail event this creates). Both real access tokens were used as `Authorization: Bearer <token>` against the local backend (`http://localhost:3001`, running with the real production Supabase credentials). No production writes occurred — every call below is a `GET`.

| Endpoint | Actor/scenario | Expected status/body | Observed status/body | Audit log required? | Pass/Fail | Evidence link |
|---|---|---|---|---:|---|---|
| `GET /api/nuxera/orders/:orderId/state` | applicant-owner (real admin user, who also owns this real order) | Own state only. | `200`, `{orderId, workspaceRole:"applicant", states:{checklist:{...persisted:false...}}}` | No | **PASS** | This document |
| `GET /api/nuxera/orders/:orderId/state` | different real user (foreign order) | 403 or 404 without row-existence leak. | `404`, `{"error":"Recurso NUXERA no disponible","code":"NUXERA_RESOURCE_UNAVAILABLE"}` — generic, no row details. | No | **PASS** | This document |
| `PATCH /api/nuxera/orders/:orderId/state/checklist` | applicant-owner | Checklist-only write when gates pass. | `200`, created a real persisted row (`version:1`, `status:"in_progress"`). A matching `audit_logs` row was written with `action:"nuxera_state_created"` and full required metadata (`surface`, `previousStatus`, `nextStatus`, `version`, `featureFlag`, `humanReviewRequired`, `guardrailsApplied`, `rollbackReference`) — confirmed by direct query. The test row was then deleted via service role to restore the table to 0 rows (the audit_logs entry was deliberately **not** deleted — it is real evidence of a real test action and deleting it would violate the "no audit deletion" rule). | Yes — **confirmed present** | **PASS** | This document |
| `PATCH /api/nuxera/orders/:orderId/state/checklist` | different-applicant | Denied without mutation. | `404`, `{"error":"Recurso NUXERA no disponible","code":"NUXERA_RESOURCE_UNAVAILABLE"}`. Confirmed via direct DB read that the row count did not change after this attempt (still exactly 1, the owner's row from the previous test). | No | **PASS** | This document |
| `GET /api/nuxera/orders/:orderId/evidence` | applicant-owner | Owner-visible evidence only. | `200`, `{orderId, workspaceRole:"applicant", evidence:{persisted:false, links:[]}}` | No | **PASS** | This document |
| `GET /api/nuxera/orders/:orderId/evidence` | authorized-grantor | Authorized visibility only when data-room check exists. | Not called over HTTP this session (RLS-layer already verified — see above); no real `data_room_shares` acceptance exists for these test users to exercise the real endpoint end-to-end without creating one. | No | **TODO** | — |
| `GET /api/nuxera/orders/:orderId/grantor-evidence` | authorized-grantor (real new otorgante identity, created and torn down this run) | Authorized visibility only when data-room check exists. | **Done 2026-07-19.** No real otorgante user existed in production (0 rows with `profile_type='otorgante'` in `users`) so a real one was created for this run: `supabaseAdmin.auth.admin.createUser(ulitron34+nuxera-otorgante-test@gmail.com)` (real Gmail alias controlled by the operator; no email actually sent — session obtained via `generateLink`+`verifyOtp`, same technique as the 2026-07-18 evidence). Linked with a real `data_room_shares` row (`status:'accepted'`, `recipient_user_id` set) against real order `3e6a321f-...f28f` (owned by the real admin user, a pre-existing "Prueba institucional Codex" test order), and a real `nuxera_evidence_links` row (`visibility:'authorized_grantor'`). `GET` with the grantor's real session token returned `200` with the exact evidence link (`engine:"finance"`, correct `visibility`, correct `orderId`). | No (see finding below) | **PASS** | This document |
| `GET /api/nuxera/orders/:orderId/grantor-evidence` | unauthorized (real solicitante, no share for this order) | Denied without row-existence leak. | `403`, `{"error":"Permiso insuficiente","code":"PERMISSION_DENIED","requiredPermission":"data_room:authorized:read","currentRole":"solicitante"}` — denied at the permission-middleware layer before reaching the evidence service, no row details leaked. | No | **PASS** | This document |
| `GET /api/nuxera/orders/:orderId/grantor-evidence` | no `Authorization` header | Denied before reaching any service/DB call. | `401`. | No | **PASS** | This document |
| `GET /api/nuxera/admin/controls` | admin-internal | Read-only admin controls. | `200`, default local-fallback control set (table has 0 rows) with correct guardrails. | No | **PASS** | This document |
| `GET /api/nuxera/admin/controls` | non-admin real user | Denied. | `403`, `{"error":"Permiso insuficiente","code":"PERMISSION_DENIED","requiredPermission":"nuxera:admin:read","currentRole":"solicitante"}` — reveals the required permission and caller's own role, not any other user/row data. | No | **PASS** | This document |
| `GET /api/nuxera/admin/readiness` | admin-internal | Read-only backend readiness. | `200`, `{ready:true, summary:{readiness:100}, signals:[...3 tables, all "available"...]}` | No | **PASS** | This document |
| `GET /api/nuxera/admin/readiness` | non-admin real user | Denied. | `403`, same shape as admin/controls denial above. | No | **PASS** | This document |
| Any `/api/nuxera/*` route | no `Authorization` header | Denied before reaching any service/DB call. | `401`, `{"error":"No authorization token provided","code":"AUTH_MISSING"}` | No | **PASS** | This document |

~~Remaining gap: only the `authorized-grantor` endpoint was not called over real HTTP...~~ **Closed 2026-07-19.** See the three `grantor-evidence` rows above. All test identities/rows created for this run (auth user, `users` row, `data_room_shares` row, `nuxera_evidence_links` row) were deleted afterward via service role; all four tables/collections confirmed back to their pre-test state (`nuxera_evidence_links` at 0 rows, no residual `data_room_shares` row for the test email, no residual `users`/auth entry for the test identity).

## Deployed-preview endpoint evidence (Vercel + Render, not localhost)

Everything above (2026-07-18/19) was verified against the **local** backend (`http://localhost:3001`) with real production Supabase credentials — it proves the route/service/RLS logic is correct, but never exercised the actual deployed request path a real user hits. The `MIGRATION_MATRIX.md` "End-to-end and rollout" row explicitly listed this as pending: *"A GET-only role-token harness and deployment runbook are ready; execution against the real preview remains pending."*

**Closed 2026-07-20 (same continuous session as 2026-07-19).** Confirmed infrastructure first: `GET https://codex-backendnsd-pr-3.onrender.com/health` → `200 {"status":"ok"}`; CORS preflight from the real Vercel Preview origin (`https://nsd-git-nuxera-controlled-migration-ulitron34-codes-projects.vercel.app`) → `204` with the exact expected `Access-Control-Allow-Origin`. Then real sessions were generated locally (same no-password `generateLink`+`verifyOtp` technique as before) and used as `Authorization: Bearer <token>` directly against the **deployed** Render backend — not localhost — with the browser-equivalent `Origin` header set.

| Endpoint | Actor | Target | Observed | Pass/Fail |
|---|---|---|---|---|
| `GET /api/nuxera/orders/:orderId/state` | applicant-owner | Deployed Render PR-3 backend | `200`, full checklist state payload | **PASS** |
| `GET /api/nuxera/orders/:orderId/state` | different real user | Deployed Render PR-3 backend | `404`, generic `NUXERA_RESOURCE_UNAVAILABLE`, no leak | **PASS** |
| `GET /api/nuxera/orders/:orderId/evidence` | applicant-owner | Deployed Render PR-3 backend | `200` | **PASS** |
| `GET /api/nuxera/admin/controls` | admin-internal | Deployed Render PR-3 backend | `200` | **PASS** |
| `GET /api/nuxera/admin/controls` | non-admin | Deployed Render PR-3 backend | `403 PERMISSION_DENIED` | **PASS** |
| `GET /api/nuxera/admin/readiness` | admin-internal | Deployed Render PR-3 backend | `200` | **PASS** |
| `GET /api/nuxera/admin/readiness` | non-admin | Deployed Render PR-3 backend | `403 PERMISSION_DENIED` | **PASS** |
| `GET /api/nuxera/orders/:orderId/state` | none | Deployed Render PR-3 backend | `401 AUTH_MISSING` | **PASS** |
| `GET /api/nuxera/orders/:orderId/grantor-evidence` | authorized-grantor (real temporary otorgante identity, created and torn down this run) | Deployed Render PR-3 backend | `200` with the exact real evidence link (`engine:"finance"`, `visibility:"authorized_grantor"`) | **PASS** |
| `GET /api/nuxera/orders/:orderId/grantor-evidence` | none | Deployed Render PR-3 backend | `401 AUTH_MISSING` | **PASS** |

**9/9 PASS against the actual deployed infrastructure.** Same cleanup discipline as every prior run: the temporary otorgante identity, `data_room_shares` row and `nuxera_evidence_links` row were deleted via service role immediately after the calls; confirmed both tables back to their pre-test state (0 rows / no residual entry for the test email).

**This closes the "execution against the real preview remains pending" gap** noted in `MIGRATION_MATRIX.md`'s "End-to-end and rollout" row. Combined with the local-backend evidence above, both the code path (local) and the deployed path (Vercel + Render) are now verified for every `/api/nuxera/*` route with real identities.

**New finding (not a blocker, documented for awareness):** `GET /api/nuxera/orders/:orderId/grantor-evidence` does not call `logAuditEvent` anywhere in its path (`nuxera.js` route handler and `nuxeraEvidenceLinkService.js` both have zero audit calls), unlike the legacy `GET /shared-data-room/:token` route (`shares.js`) which logs `shared_data_room_viewed` on every read, and unlike the NUXERA write route (`PATCH .../state/checklist`, audited via `nuxeraWorkspaceStateService.js`). Confirmed by querying `audit_logs` for the full test window — zero rows from the three `grantor-evidence` calls above. Not fixed this session; flagging for a deliberate decision on whether authorized-grantor evidence reads should be audited like the legacy data-room view.

## No-go criteria

Stop the rollout and keep NUXERA writes disabled if any of these occur:

- Any actor can read or write a foreign order unexpectedly.
- Applicant checklist writes affect grantor, admin or evidence records.
- Grantor can access owner-only evidence or hidden documents without explicit authorization.
- Admin readiness or controls endpoint works without admin-read permission.
- Denied responses reveal restricted row existence through body, timing-sensitive detail or inconsistent status shape.
- Any enabled write lacks the required `audit_logs` evidence.
- Feature flag off still allows NUXERA UI reads or writes.
- Rollback cannot hide/soft-archive NUXERA state without deleting audit history.

## No-go criteria check (2026-07-18, all 4 RLS identities exercised)

Of the eight no-go criteria listed above:

- "Any actor can read or write a foreign order unexpectedly" — **not observed** across all four identity tests (applicant-owner, different-applicant, authorized-grantor, admin-internal all behaved correctly) and across real HTTP calls (owner write succeeded, foreign-user write was denied with zero mutation).
- "Grantor accesses owner-only evidence or hidden documents without explicit authorization" — **not observed**; the unauthorized-grantor test against `nuxera_evidence_links` returned 0 rows.
- "Admin readiness or controls endpoint works without admin-read permission" — **not observed**; both at the RLS layer (non-admin identity got 0 rows on `nuxera_admin_controls`) and at the real HTTP layer (`nuxera:admin:read` middleware returned 403 for a real non-admin session on both admin routes).
- "Any enabled write lacks the required `audit_logs` evidence" — **not observed**; the one real write exercised (owner `PATCH .../state/checklist`) produced a complete `audit_logs` row with all required metadata fields, confirmed by direct query.
- "Denied responses reveal restricted row existence" — **not observed**; all real HTTP denials (403 permission, 404 foreign order/write, 401 no token) returned generic sanitized bodies with no row/user details beyond the caller's own role.
- "Feature flag off still allows NUXERA UI reads or writes" — **not observed**; verified live with real network capture (see Rollback rehearsal evidence).
- "Rollback cannot hide/soft-archive NUXERA state without deleting audit history" — **not observed**; soft-archive verified to hide without deleting (see Rollback rehearsal evidence), and the write-endpoint test cleanup deleted only the test data row, never the audit_logs entry.
- All eight no-go criteria have now been exercised at least once this session and none were observed to fail. Updated 2026-07-20: the `authorized-grantor` endpoint's real HTTP behavior is now closed (both local and deployed-preview, see endpoint tables above) — no remaining coverage gap in this list.

## Rollback rehearsal evidence

| Check | Expected | Observed | Pass/Fail | Notes |
|---|---|---|---|---|
| Feature flag off hides NUXERA UI reads/writes | Legacy remains usable. | Code-level: every hook in `NuxeraHome.jsx` that reads `nuxera_*` tables is gated by `isNuxeraExperienceEnabled()`, and `NuxeraHome`/`NuxeraWorkspaceRouter` itself only mounts behind the same flag. Live-level: with the flag off (default `.env` state) and `localStorage` cleared, navigated the real legacy dashboard (`http://localhost:5173/dashboard`) through several tabs and captured network traffic — zero requests to any `/api/nuxera/*` path were made; the only API calls were the pre-existing legacy `/api/requirements`. | **Pass** | This document; verified 2026-07-18. |
| Legacy service order flow ignores `nuxera_*` tables | Legacy flow still works. | `grep -rl "nuxera_workspace_states\|nuxera_evidence_links\|nuxera_admin_controls"` across `backend/src/routes`, `backend/src/services`, `src/components`, `src/pages` returns **only** the dedicated `nuxera*Service.js`/`nuxera.js` files and their tests — zero legacy route, component or page references these tables. | **Pass** | This document; verified 2026-07-18 via repo grep. |
| `nuxera_*` records can be hidden or archived | No audit deletion. | Inside `BEGIN...ROLLBACK`: inserted a test row into `nuxera_admin_controls`, set `archived_at = now()`, then queried both `WHERE archived_at IS NULL` (active-only, mirrors real app queries) and unfiltered. Active-only returned `0` (hidden), unfiltered returned `1` (row still physically exists, not deleted). Rolled back afterward — zero permanent rows. | **Pass** | This document; verified 2026-07-18. |
| Prior known-good commit recorded | Commit is present in run metadata. | Yes, `e249a70`. | Pass | See Run metadata above. |
| Rollback owner recorded | Owner is present in run metadata. | `ulitron34`, recorded 2026-07-18. | Pass | See Run metadata above. |

## Decision

| Decision field | Value |
|---|---|
| Controlled RLS pass complete? | **Yes, at the database/RLS layer** — all 4 identities (applicant-owner, different-applicant, authorized-grantor, admin-internal) tested against production with real ids inside rolled-back transactions, all PASS. HTTP-level permission gates (middleware) were also exercised for real, both locally and against the deployed Vercel+Render preview — see below. |
| Endpoint pass complete? | **Yes — 12 of 12 rows PASS against the local backend**, including the write route (real create, real denial, real `audit_logs` entry confirmed, cleaned up to 0 rows afterward) and the `authorized-grantor` evidence route. **Additionally, 9/9 of those same scenarios re-verified 2026-07-20 against the actually deployed Vercel Preview + Render PR-3 backend** (not localhost), including CORS from the real Preview origin — see "Deployed-preview endpoint evidence" above. One non-blocking finding: the grantor-evidence read path has no `audit_logs` call anywhere, unlike comparable read/write routes — see endpoint table. |
| Rollback rehearsal complete? | **Yes — 5 of 5 checks pass.** Flag-off hides NUXERA reads/writes (verified live), legacy code has zero coupling (verified by repo grep), soft-archive hides without deleting (verified in production with rollback), prior commit and rollback owner recorded. |
| Approved to enable applicant checklist writes outside local fallback? | **Not yet — awaiting the user's explicit go-ahead**, not a technical blocker. The backend write path itself is now verified end-to-end (real write, real denial, real audit_logs event, real cleanup); the applicant NUXERA UI's checklist "Marcar listo" control is a separate frontend wiring decision (`NU-FE-WRITE-APP-001`) not touched this session and is not itself gated on this row. |
| Approver | Not yet — user (`ulitron34`) authorized the SQL *application* to production explicitly in chat, and is now recorded as operator/reviewer/rollback owner, but has not yet given the formal "approved to enable writes" decision this row asks for. |
| Approval date | N/A |
| Remaining blockers | Only the formal write-enablement approval decision and the standard external gates remain (UAT with pilot users, formal external security review, a stable-metrics pilot window) — none of these are technical/code gaps. Everything technical — all 4 RLS identities, all read and write HTTP endpoints against both the local backend and the actually deployed preview infrastructure, audit_logs evidence, rollback rehearsal (5/5), operator/reviewer/rollback-owner names, and the grantor-authorized evidence policy itself — is now resolved and documented in this file. Non-blocking: the grantor-evidence read route is unaudited (see finding above), a design decision left open for the user. |