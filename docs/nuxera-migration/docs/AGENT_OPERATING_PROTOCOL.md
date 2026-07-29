# Universal Operating Protocol for Codex and Claude Code

## Purpose

Both agents must behave as interchangeable implementation workers. The repository, not the chat session, stores continuity.

## Mandatory start sequence

1. Read `docs/MASTER_IMPLEMENTATION_PLAN.md`.
2. Read this protocol.
3. Read `docs/migration/PROJECT_STATE.md`.
4. Read the assigned task specification.
5. Run `git status` and inspect the active branch.
6. Inspect recent commits relevant to the task.
7. Run baseline build, lint and tests.
8. Write a concise implementation plan before editing.

## Scope discipline

- Modify only authorized files.
- Do not perform opportunistic refactors.
- Do not rename routes, services, schemas or environment variables unless the task explicitly requires it.
- Do not delete legacy code.
- Do not silently replace libraries.
- Do not suppress failing tests or lint rules to obtain a green result.
- When ambiguity affects behavior, stop and document it in PROJECT_STATE.

## Mandatory end sequence

1. Run all required validation commands.
2. Compare results with acceptance criteria.
3. Record every modified file.
4. Record tests and commands executed.
5. Record unresolved risks and technical debt.
6. Update PROJECT_STATE.
7. Update MIGRATION_MATRIX when applicable.
8. Leave an exact handoff note for the next agent.

## Handoff format

- Task ID
- Branch
- Last commit
- Completed work
- Modified files
- Tests executed and results
- Remaining work
- Known risks
- Exact next action

## Parallel-work rule

Codex and Claude Code must not modify the same files simultaneously. Ownership is assigned per task. Shared files require sequential changes or an explicit integration task.
