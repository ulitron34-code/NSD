# NUXERA Product and Migration Master Package

This package is the single source of truth for the controlled migration of the current NSD/NEXUS platform into the NUXERA platform.

Earlier package files may still say N&U, NU, or NEXUS. For all new user-facing work, read those names through `NUXERA_IDENTITY_ADENDA.md`.

Earlier package files may still say N&U, NU, or NEXUS. For all new user-facing work, read those names through `NUXERA_IDENTITY_ADENDA.md`.

## Core principle

Do not rebuild the platform from zero. Preserve the current backend, services, integrations, data, roles and working business logic. Build the new experience in parallel with the legacy experience, validate every module, then retire legacy code only after formal acceptance.

## Four visible engines

1. NUXERA Finance
2. NUXERA Intelligence
3. NUXERA Markets
4. NUXERA Strategy

## Transversal infrastructure

Compliance, Projects, Agents, Documents, Integrations, Knowledge, Analytics, Security and Automation.

## Required reading order for Codex and Claude Code

1. `NUXERA_IDENTITY_ADENDA.md`
2. `docs/MASTER_IMPLEMENTATION_PLAN.md`
3. `docs/AGENT_OPERATING_PROTOCOL.md`
4. `docs/migration/PROJECT_STATE.md`
5. `docs/migration/MIGRATION_MATRIX.md`
6. The assigned task file in `docs/migration/tasks/`
