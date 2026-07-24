# NUXERA Identity Addendum

This addendum has priority over earlier N&U, NU, NEXUS, NSD, or provisional naming in the migration package.

## Official Working Identity

- Primary brand: `NUXERA`
- Official descriptor: `FINANCIAL INTELLIGENCE`
- Full working name: `NUXERA FINANCIAL INTELLIGENCE`

## Replacement Rule

Any prior user-facing reference to `NEXUS`, `N&U`, `NU`, `N&U Financial Intelligence`, or equivalent provisional naming should be interpreted as `NUXERA`, except for historical records and technical identifiers that must remain stable.

## Do Not Rename Automatically

Do not mass-rename the following without a dedicated migration task:

- GitHub repository name
- Product routes
- API contracts
- Environment variables
- Database tables
- Storage keys
- Local storage keys such as `nsd_ui_view` and `nsd_demo_profile`
- Commit history, audit logs, and legal or historical references

## Product Engine Names

- `NUXERA Finance`
- `NUXERA Intelligence`
- `NUXERA Markets`
- `NUXERA Strategy`

## Code Guidance

New user-facing components should use the `Nuxera` prefix when naming new architecture files or components. Existing legacy names should remain in place until a controlled task explicitly migrates them.

## Operating Rule

Codex and Claude Code must read this addendum before rebranding, shell work, or new visible UI development. The addendum does not authorize destructive renames, backend contract changes, or removal of legacy behavior.
