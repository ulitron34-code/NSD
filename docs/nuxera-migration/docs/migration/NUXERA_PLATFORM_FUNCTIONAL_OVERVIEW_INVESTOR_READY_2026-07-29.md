# NUXERA Platform Functional Overview for Startup Review

Date: 2026-07-29
Status: production-facing NUXERA experience, with controlled dry-run gates for sensitive operations

## Executive Summary

NUXERA is a financial intelligence and compliance platform for preparing, reviewing and monitoring financing files. It separates three operating audiences:

- Applicants prepare project, company, funding and evidence information before requesting capital.
- Funding providers review authorized files, request missing evidence, assess jurisdiction and risk signals, and prepare non-binding committee materials.
- Administrators supervise controls, readiness, notifications, agent policy, RLS evidence and operational persistence gates.

The platform is intentionally conservative: it can organize evidence, calculate readiness signals, generate decision-support material and orchestrate notifications, but it does not approve financing, issue term sheets, bypass permissions, send sensitive evidence by email or make binding decisions automatically.

## Public Site

The public site presents NUXERA as the external product identity. It explains the platform value proposition, compliance intelligence, applicants, funders, global coverage, integrations, industries, security and service model.

Current verified public signals:

- Production title uses NUXERA Financial Intelligence.
- Social preview image points to `/social-preview.png`.
- User-facing public metadata no longer presents the old Nexus identity as the active brand.

Outcome: visitors understand NUXERA as a compliance and financial intelligence platform before entering role-specific workspaces.

## Applicant Workspace

The applicant workspace helps a company or project owner prepare a funding file. Its main functions are:

- Guided preparation mission.
- Company and responsible-party evidence readiness.
- Project and use-of-funds structure.
- Document center and checklist status.
- Risk, market and impact context.
- Protected agent/chat preview where enabled.

Operational behavior:

- The applicant sees only own-file context when backed by real auth/RLS.
- Local demo sessions are explicitly demo and do not prove production authorization.
- Evidence upload/review should be connected to persisted documents and checklist state before final production cutover.

Output: a prepared file with missing evidence, next action, readiness status and human-review needs clearly visible.

## Funding Provider Workspace

The funding provider workspace is designed for authorized reviewers. It separates daily case management from the decision desk:

- Case management focuses on SLA, assignment, gaps, follow-up and operational movement.
- Decision desk focuses on non-binding memo, committee questions, authorized evidence, jurisdiction context and human conditions.
- Jurisdiction intelligence reviews country, state/province/city context where available, including economic, political, regulatory and social/territorial factors.
- Evidence and risk panels remain source-aware and limitation-aware.

Operational behavior:

- Funding providers should only see files shared through data-room authorization.
- Jurisdiction evidence is advisory and source-traced, not a binding decision engine.
- Regulatory sources requiring private agreement or API approval are shown as conditional, not falsely treated as live coverage.

Output: a human-ready review packet with traceable evidence, risk context, missing items and committee questions.

## Admin Workspace

The admin workspace is the production control layer. It includes:

- Backend readiness and go/no-go gates.
- Admin controls and protected rollout state.
- Notification readiness, outbox health, templates, dry-runs and approval plans.
- Conversation agent readiness and provider risk policy.
- AI provider restrictions for OpenAI, Anthropic, DeepSeek, Kimi and NVIDIA.
- Operational persistence dry-run plan across case events, notification approvals and evidence provenance.
- RLS and HTTP evidence runbooks.

Operational behavior:

- Admin panels are read-only or dry-run by default unless a backend gate explicitly enables writes.
- Service-role writes require separate SQL/RLS evidence and approval.
- Agents may summarize or explain but cannot approve, send, persist or alter permissions.

Output: a controlled operational command center for deciding when NUXERA can safely replace the legacy experience.

## Live, Demo and Pending Boundaries

Live/implemented:

- NUXERA identity and shell.
- Applicant, funding provider and admin role workspaces.
- Jurisdiction intelligence model with public/conditional source posture.
- Notification outbox contracts, approval plans and dry-run worker gates.
- Conversation agent readiness/policy gates.
- Operational persistence dry-run plan.
- English QA automation with production screenshots.

Demo or controlled preview:

- Demo applicant/funding provider/admin sessions seeded by localStorage.
- Notification approval preview when delivery flags are off.
- Agent conversation preview when runtime flag is off.
- Operational persistence candidates before SQL/RLS evidence is accepted.

Pending for full production operation:

- Real RLS phase 2 evidence with production-like applicant, funding provider and admin tokens.
- Non-production SQL migration rehearsal for `nuxera_case_events`, `nuxera_notification_approvals` and evidence provenance.
- Sandbox email provider run with approved recipient and no sensitive evidence.
- Final decision to enable service-role writes per ledger.
- Commercial/API agreements for private regulatory sources.
