# NUXERA AI provider risk matrix

Grounded in the real, enforced policy code as of 2026-07-22:
`backend/src/services/aiJsonProvider.js` (`resolveJsonProviderPolicy`,
`generateJsonWithFallback`), `backend/src/services/nuxeraAiProviderPolicyService.js`
and `backend/src/services/nuxeraConversationAgentReadinessService.js`
(`ROLE_POLICIES`, `runNuxeraConversationTurn`). This is a description of
what the code already does, not a proposal.

## Provider tiers

| Provider | Tier | Allowed for sensitive/non-anonymized data (document review, case chat) | Allowed for low-risk anonymized tasks |
| --- | --- | --- | --- |
| Anthropic (`claude-sonnet-4-6`) | primary | Yes | Yes |
| OpenAI (`gpt-4o-mini` by default) | primary | Yes | Yes |
| Kimi | restricted | **No** | Yes, only if `dataRisk:'low'`, `anonymized:true` and `taskType` is one of `classification`, `routing`, `schema-normalization`, `public-research-summary`, `template-drafting`, `synthetic-test`, `provider-benchmark` |
| DeepSeek | restricted | **No** | Same low-risk-only gate as Kimi |
| NVIDIA NIM | restricted | **No** | Same low-risk-only gate as Kimi |

The gate is enforced in code (`isRestrictedProviderAllowed` /
`resolveJsonProviderPolicy` in `aiJsonProvider.js`), not just documentation:
`generateJsonWithFallback` skips a restricted provider and records
`skipped: true` in its attempt log whenever the caller did not pass the
required low-risk options, even if that provider is configured with a valid
key.

## What each provider is actually asked to do today

- **Anthropic / OpenAI**: primary reviewers for real applicant documents
  (`readinessRubricAgent.js` pipeline) and the only providers the NUXERA
  conversation runtime (`runNuxeraConversationTurn`) is allowed to reach,
  because that call always passes `dataRisk:'sensitive', anonymized:false`.
- **Kimi / DeepSeek / NVIDIA**: not currently called by any NUXERA route.
  They exist as configured fallback capacity for future low-risk, anonymized,
  non-decisional tasks (e.g. classification, routing, template drafting) —
  never for case-specific chat, document content, or anything that could
  contain a real applicant's PII or financial data.

## What no agent — on any provider — is ever allowed to do

Enforced by `ROLE_POLICIES.*.blockedActions` in
`nuxeraConversationAgentReadinessService.js`, the notification-outbox
guardrails, and the output-guardrail filter in `runNuxeraConversationTurn`:

- Approve financing, issue a term sheet, or otherwise make or imply a binding
  credit decision.
- Grant, change or revoke data-room/document permissions.
- Send an email, WhatsApp message or in-app notification automatically
  (`nuxera_notification_outbox` rows always require a human-reviewed,
  explicitly-enabled delivery path; no send worker exists).
- Change RLS, roles or any backend permission.
- Read file content it wasn't explicitly authorized for. In particular the
  admin agent channel (`admin-agent-operations-monitor`) cannot read case
  file content by default; it is scoped to `audit_logs`,
  `nuxera_admin_controls` and `nuxera_notification_outbox` only.
- Persist a chat turn's message or answer. `runNuxeraConversationTurn`
  intentionally reports `persistence.chatTurnPersisted: false` on every
  response — only a metadata-only audit event (role, provider, model,
  message/answer **length**, never the content) is written via
  `logAuditEvent`.

`runNuxeraConversationTurn` also runs every real provider response through an
output guardrail (`violatesConversationOutputGuardrails`) that withholds and
audits (`nuxera_conversation_turn_output_blocked`) any answer matching
approval, term-sheet, permission-grant or automatic-send language, as a
second line of defense on top of the system prompt instructions — a prompt
instruction alone is not treated as sufficient enforcement.

## Sensitive-data caveat that remains a business/legal decision, not code

As documented in `aiJsonProvider.js` itself: full extracted document text
(identifications, RFC, financial statements, beneficial owners) is sent
as-is to whichever primary provider handles a request, because redacting it
client-side would break the KYC/extraction function the product promises.
Confirming a data-processing agreement with each configured provider before
sending real customer documents in production is a pending legal/business
step, not something this matrix or the code resolves.
