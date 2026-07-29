# N&U Master Implementation Plan

## 1. Objective

Transform the existing platform through a controlled dual-view migration. The new interface must simplify the experience for applicants and granting institutions without deleting working capabilities or breaking current operations.

## 2. Non-negotiable constraints

- Do not rebuild the backend from zero.
- Do not delete the legacy view during construction.
- Do not change authentication, authorization, role semantics or data contracts without a dedicated approved task.
- Reuse current services, hooks, APIs, validation logic and integrations.
- New modules must be enabled through feature flags or explicit view switching.
- Every task must include tests, rollback and documentary evidence.
- Codex and Claude Code execute the same specifications.

## 3. Target product architecture

### Visible engines
- Finance: readiness, applications, financing channels, files, scoring and follow-up.
- Intelligence: deep company, person, sector, reputational and compliance research.
- Markets: monitored assets, global sessions, alerts, events and AI explanations.
- Strategy: decision support, scenario analysis, expansion, capital strategy and recommendations.

### Transversal layers
- Compliance
- Projects
- Agents
- Documents
- Integrations
- Knowledge
- Analytics
- Security
- Automation

## 4. Migration model

The current and new experiences coexist. Each migrated module follows:

Design -> Build in parallel -> Unit tests -> Integration tests -> E2E tests -> Internal QA -> Pilot users -> Stabilization -> Approval -> Legacy retirement.

## 5. Program phases

### Phase 0 - Repository and behavior baseline
Inventory routes, layouts, roles, services, APIs, feature flags, tests, environment variables and deployment pipelines.

### Phase 1 - Shared shell
Create the N&U design system, new navigation shell, role-aware workspace selector, feature flag system and compatibility adapters.

### Phase 2 - Applicant experience
Implement goal-oriented onboarding, progress dashboard, company/project/file wizard, document center, readiness result and follow-up.

### Phase 3 - Grantor experience
Implement decision dashboard, unified case workbench, comparison, alerts, review queue, decision package and reporting.

### Phase 4 - Admin console
Separate operations, configuration, security, AI orchestration, integrations, catalogs, logs and system health.

### Phase 5 - N&U Intelligence
Implement research missions, source curation, evidence, confidence, citations, monitoring and reusable reports.

### Phase 6 - N&U Markets
Implement watchlists, market sessions, licensed real-time data adapters, event detection, AI explanations and alert policies.

### Phase 7 - N&U Strategy
Implement guided strategic questions, scenario workspaces, recommendations, assumptions, evidence and action plans.

### Phase 8 - Legacy retirement
Retire only modules that have functional parity, stable telemetry, accepted QA and an approved rollback window.

## 6. Global definition of done

A module is complete only when:
- Acceptance criteria pass.
- Build, lint and tests pass.
- Role and permission behavior is verified.
- No unauthorized API contract was changed.
- Legacy view remains operational.
- Rollback is documented and tested.
- PROJECT_STATE and MIGRATION_MATRIX are updated.
