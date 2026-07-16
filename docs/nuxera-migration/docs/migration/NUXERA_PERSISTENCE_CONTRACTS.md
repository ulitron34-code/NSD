# NUXERA Persistence Contracts v1

## Purpose
Define the first backend/API persistence contracts for NUXERA state before any schema migration, route implementation or UI write path is enabled.

This document is a design contract only. It does not create tables, API routes, permissions, RLS policies or production behavior.

## Non-negotiable constraints
- Keep visible identity as NUXERA Financial Intelligence.
- Do not rename existing technical identifiers, routes, storage keys, tables or API contracts.
- Keep legacy/current dashboard available during coexistence.
- Keep NUXERA behind `VITE_NUXERA_EXPERIENCE_ENABLED=true`.
- Preserve existing `service_orders`, `documents`, `document_reviews`, `audit_logs`, data-room shares and role permissions.
- No automatic credit approval, term sheet, investment advice or binding decision may be persisted as final output.
- Market realtime state cannot be marked as licensed unless a licensed provider contract exists.
- Every write must be auditable and rollback-friendly.

## Existing anchors
NUXERA persistence should reference existing records instead of duplicating legacy domain ownership:

| Existing anchor | Current role | NUXERA use |
|---|---|---|
| `service_orders.id` | Case/order owner record | Primary `order_id` for applicant mission, checklist, grantor review and memo state. |
| `documents.order_id` | Data-room documents | Evidence references and checklist item fulfillment. |
| `document_reviews.document_id` | Review/extraction metadata | Evidence quality, cross-check status and AI/provenance snapshots. |
| `audit_logs.order_id` | Compliance audit trail | Required write log for every NUXERA state transition. |
| Data-room share routes | Controlled authorized visibility | Grantor can reference only documents already visible through existing permissions. |
| `ROLE_PERMISSIONS` | Backend authorization | New permissions must be additive and role-scoped. |

## Proposed persistence modules

### 1. `nuxera_workspace_states`
Canonical state container for each NUXERA surface attached to a legacy order.

Suggested columns:
- `id uuid primary key`
- `order_id uuid not null references service_orders(id)`
- `workspace_role text not null check in ('applicant','grantor','admin')`
- `surface text not null check in ('mission','checklist','queue','workbench','memo','readiness','strategy')`
- `status text not null`
- `payload jsonb not null default '{}'::jsonb`
- `version integer not null default 1`
- `created_by uuid references auth.users(id)`
- `updated_by uuid references auth.users(id)`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`
- `archived_at timestamptz null`

Rules:
- One active row per `order_id + workspace_role + surface` unless versioning requires a draft/history split.
- `payload` stores UI state only, not copied document binaries or hidden data-room content.
- Updates increment `version` and create an `audit_logs` event.
- Archiving is soft only.

### 2. `nuxera_evidence_links`
Normalized references from NUXERA state to existing evidence.

Suggested columns:
- `id uuid primary key`
- `workspace_state_id uuid references nuxera_workspace_states(id)`
- `order_id uuid not null references service_orders(id)`
- `document_id uuid null references documents(id)`
- `document_review_id uuid null references document_reviews(id)`
- `engine text not null check in ('finance','intelligence','markets','strategy','admin')`
- `label text not null`
- `visibility text not null check in ('owner','authorized_grantor','internal')`
- `provenance jsonb not null default '{}'::jsonb`
- `created_by uuid references auth.users(id)`
- `created_at timestamptz default now()`

Rules:
- Grantor evidence links must pass existing data-room authorization before being returned.
- Evidence links must not grant new document access.
- Provenance may include source engine, local fixture origin during migration, model version, rubric version and timestamps.

### 3. `nuxera_review_artifacts`
Draft artifacts such as grantor decision memo, strategy package or admin readiness snapshot.

Suggested columns:
- `id uuid primary key`
- `order_id uuid not null references service_orders(id)`
- `artifact_type text not null check in ('grantor_memo','strategy_package','admin_readiness','applicant_summary')`
- `status text not null check in ('draft','evidence_blocked','human_review_required','approved_for_export','archived')`
- `title text not null`
- `body jsonb not null default '{}'::jsonb`
- `guardrails jsonb not null default '[]'::jsonb`
- `created_by uuid references auth.users(id)`
- `updated_by uuid references auth.users(id)`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`
- `exported_at timestamptz null`
- `archived_at timestamptz null`

Rules:
- `grantor_memo` is never a term sheet and cannot carry binding approval status.
- `approved_for_export` means approved to export/share as artifact, not approved credit.
- Artifact exports must write `audit_logs` with artifact type, order id, actor and recipient context.

### 4. `nuxera_admin_controls`
Admin-only rollout and incident control state.

Suggested columns:
- `id uuid primary key`
- `control_type text not null check in ('release_gate','incident','readiness','policy')`
- `scope text not null check in ('global','applicant','grantor','admin','engine')`
- `status text not null`
- `severity text null check in ('low','medium','high','critical')`
- `payload jsonb not null default '{}'::jsonb`
- `created_by uuid references auth.users(id)`
- `updated_by uuid references auth.users(id)`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`
- `resolved_at timestamptz null`

Rules:
- Only admin/internal reviewer roles can write controls.
- Controls do not directly enable automation, permissions or licensed market data.
- Critical incident controls must be auditable and rollback-linked.

## API contract draft
All routes are proposed under `/nuxera` to avoid changing existing legacy endpoints.

| Method | Route | Permission | Purpose |
|---|---|---|---|
| `GET` | `/nuxera/orders/:orderId/state` | `case:own:read` or assigned/internal equivalent | Read role-filtered NUXERA state for an order. |
| `PATCH` | `/nuxera/orders/:orderId/state/:surface` | `case:own:update` for applicant surfaces; internal/admin for admin surfaces | Update mission/checklist/workbench state. |
| `GET` | `/nuxera/orders/:orderId/evidence` | Existing data-room/read permission | Read authorized evidence links. |
| `POST` | `/nuxera/orders/:orderId/evidence-links` | Internal/admin or owner-scoped write | Create evidence reference without changing document visibility. |
| `GET` | `/nuxera/orders/:orderId/artifacts` | Role-filtered read | List allowed artifacts. |
| `POST` | `/nuxera/orders/:orderId/artifacts` | Internal/admin, or grantor draft permission for authorized cases | Create draft artifact. |
| `PATCH` | `/nuxera/orders/:orderId/artifacts/:artifactId` | Artifact owner/internal/admin | Update draft artifact status/body. |
| `POST` | `/nuxera/orders/:orderId/artifacts/:artifactId/export` | Internal/admin only for external export | Export artifact with audit event. |
| `GET` | `/nuxera/admin/controls` | `*` or future `nuxera:admin:read` | Read admin controls. |
| `PATCH` | `/nuxera/admin/controls/:controlId` | `*` or future `nuxera:admin:update` | Update release/incident control. |

## Permission additions draft
Do not replace existing permissions. Add only when implementation starts.

| Permission | Suggested roles | Notes |
|---|---|---|
| `nuxera:state:own:read` | solicitante | Read own applicant state. |
| `nuxera:state:own:update` | solicitante | Update own local mission/checklist state. |
| `nuxera:case:authorized:read` | otorgante, inversionista | Read authorized grantor state after data-room permission check. |
| `nuxera:artifact:draft` | otorgante, inversionista, analista, administrador | Draft non-binding artifacts. |
| `nuxera:artifact:export` | analista, compliance_officer, administrador | Export only after human review. |
| `nuxera:admin:read` | administrador, auditor_interno, compliance_officer | Read controls. |
| `nuxera:admin:update` | administrador | Update controls. |

## Role access matrix

| Surface | Applicant | Grantor | Admin/internal |
|---|---|---|---|
| Applicant mission | Own order read/update | No access unless explicitly shared | Read for support/audit when permitted. |
| Applicant checklist | Own order read/update | Authorized evidence summary only | Read for support/audit when permitted. |
| Grantor queue | No direct access | Authorized cases only | Full operational read. |
| Grantor workbench | No direct access | Authorized cases only | Full operational read/update. |
| Grantor memo | No direct access | Draft/read own authorized memo; no binding approval | Review/export/archive. |
| Admin readiness | No access | No access | Read/update by admin policy. |

## Audit events required
Every write path must call existing `logAuditEvent` and insert into `audit_logs`.

Required event names:
- `nuxera_state_created`
- `nuxera_state_updated`
- `nuxera_evidence_link_created`
- `nuxera_artifact_drafted`
- `nuxera_artifact_updated`
- `nuxera_artifact_exported`
- `nuxera_admin_control_updated`
- `nuxera_state_archived`

Minimum audit metadata:
- `surface` or `artifactType`
- `previousStatus`
- `nextStatus`
- `version`
- `featureFlag: VITE_NUXERA_EXPERIENCE_ENABLED`
- `humanReviewRequired`
- `guardrailsApplied`
- `rollbackReference`

## Rollback requirements
- Every table must support soft archive through `archived_at` or equivalent status.
- Feature flag off must stop NUXERA UI reads/writes but leave data intact.
- Legacy routes continue to read/write existing entities without requiring NUXERA tables.
- If a NUXERA write fails, UI must fall back to local/read-only state and show controlled degradation.
- A rollback cannot delete artifacts; it can hide/archive NUXERA surfaces and preserve audit history.

## Implementation gates before NU-BE-002
- Confirm exact existing production schema for `service_orders`, `documents`, `document_reviews`, `audit_logs`, `users` and data-room shares.
- Decide whether RLS or backend service-role authorization is the primary enforcement layer for each new table.
- Define migration SQL with nullable/defaulted columns only.
- Add backend tests with mocked Supabase builders before connecting UI writes.
- Add at least one read-only endpoint first, then one narrow write path.
- Do not connect grantor memo export until human-review permissions and audit export are validated.

## First implementation candidate
Recommended first real backend slice after this contract:

`NU-BE-002`: create SQL draft and backend route skeleton for `nuxera_workspace_states` read/write on applicant checklist only.

Reason:
- Applicant owns the order, so authorization is simpler.
- Checklist state is lower risk than grantor memo or admin controls.
- Existing `readiness-checklist` services already reference documents/reviews and can coexist with the new state table.
