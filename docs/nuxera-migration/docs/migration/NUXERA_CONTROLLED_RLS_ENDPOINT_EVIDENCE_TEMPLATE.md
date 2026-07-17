# NUXERA Controlled RLS and Endpoint Evidence Template v1

## Purpose

Capture controlled non-production evidence before any NUXERA SQL draft or write path is considered production-ready.

This template is evidence-only. It does not apply SQL, change RLS, create grants, mutate documents or enable production writes.

## Run metadata

| Field | Value |
|---|---|
| Verification date | TODO |
| Environment | TODO: non-production Supabase project or isolated branch |
| Repo commit | TODO |
| SQL drafts applied | TODO |
| Operator | TODO |
| Reviewer | TODO |
| Feature flag state | TODO |
| Prior known-good commit | TODO |
| Rollback owner | TODO |

## Required SQL drafts

Record the exact SQL filenames and hashes used for the controlled run.

| Draft | Applied? | Hash/checksum | Notes |
|---|---:|---|---|
| `backend/sql_migrations_pendientes/2026-07-16_nuxera_workspace_states.sql` | TODO | TODO | TODO |
| `backend/sql_migrations_pendientes/2026-07-17_nuxera_evidence_links.sql` | TODO | TODO | TODO |
| `backend/sql_migrations_pendientes/2026-07-17_nuxera_admin_controls.sql` | TODO | TODO | TODO |

## Required RLS identities

Use representative test users and orders. Do not use production customer data.

| Scenario id | Identity | Test user/order | Expected allow | Expected deny | Observed result | Pass/Fail | Evidence link |
|---|---|---|---|---|---|---|---|
| `applicant-owner` | Applicant owner | TODO | Own applicant checklist state and owner-visible evidence. | Foreign orders, grantor/admin state, non-owner evidence. | TODO | TODO | TODO |
| `different-applicant` | Different applicant | TODO | No access for another applicant order. | All foreign state, writes, evidence and admin controls. | TODO | TODO | TODO |
| `authorized-grantor` | Authorized grantor | TODO | Authorized summaries only after existing data-room authorization check. | Applicant writes, owner-only evidence, hidden documents, document grants. | TODO | TODO | TODO |
| `admin-internal` | Admin/internal | TODO | Admin controls and backend readiness only with admin-read permission. | Feature flag mutation, automation activation, document grant mutation. | TODO | TODO | TODO |

## Required endpoint evidence

Every denied response must avoid leaking restricted row existence.

| Endpoint | Actor/scenario | Expected status/body | Observed status/body | Audit log required? | Pass/Fail | Evidence link |
|---|---|---|---|---:|---|---|
| `GET /api/nuxera/orders/:orderId/state` | applicant-owner | Own state only. | TODO | No | TODO | TODO |
| `GET /api/nuxera/orders/:orderId/state` | different-applicant | 403 or 404 without row-existence leak. | TODO | No | TODO | TODO |
| `PATCH /api/nuxera/orders/:orderId/state/checklist` | applicant-owner | Checklist-only write when gates pass. | TODO | Yes | TODO | TODO |
| `PATCH /api/nuxera/orders/:orderId/state/checklist` | different-applicant | Denied without mutation. | TODO | No | TODO | TODO |
| `GET /api/nuxera/orders/:orderId/evidence` | applicant-owner | Owner-visible evidence only. | TODO | No | TODO | TODO |
| `GET /api/nuxera/orders/:orderId/evidence` | authorized-grantor | Authorized visibility only when data-room check exists. | TODO | No | TODO | TODO |
| `GET /api/nuxera/admin/controls` | admin-internal | Read-only admin controls. | TODO | No | TODO | TODO |
| `GET /api/nuxera/admin/controls` | applicant-owner | Denied. | TODO | No | TODO | TODO |
| `GET /api/nuxera/admin/readiness` | admin-internal | Read-only backend readiness. | TODO | No | TODO | TODO |
| `GET /api/nuxera/admin/readiness` | applicant-owner | Denied. | TODO | No | TODO | TODO |

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

## Rollback rehearsal evidence

| Check | Expected | Observed | Pass/Fail | Notes |
|---|---|---|---|---|
| Feature flag off hides NUXERA UI reads/writes | Legacy remains usable. | TODO | TODO | TODO |
| Legacy service order flow ignores `nuxera_*` tables | Legacy flow still works. | TODO | TODO | TODO |
| `nuxera_*` records can be hidden or archived | No audit deletion. | TODO | TODO | TODO |
| Prior known-good commit recorded | Commit is present in run metadata. | TODO | TODO | TODO |
| Rollback owner recorded | Owner is present in run metadata. | TODO | TODO | TODO |

## Decision

| Decision field | Value |
|---|---|
| Controlled RLS pass complete? | TODO |
| Endpoint pass complete? | TODO |
| Rollback rehearsal complete? | TODO |
| Approved to enable applicant checklist writes outside local fallback? | TODO |
| Approver | TODO |
| Approval date | TODO |
| Remaining blockers | TODO |