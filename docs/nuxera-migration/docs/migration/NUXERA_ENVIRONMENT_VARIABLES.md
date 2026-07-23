# NUXERA environment variables

Consolidated list of every environment variable that actually gates NUXERA
behavior in this repo, as verified against the code on 2026-07-22. This is a
documentation-only reference; it does not introduce new variable names beyond
what `aiJsonProvider.js`, `nuxeraNotificationOutboxService.js` and
`nuxera.js` already read.

## Frontend rollout flags (`.env.example`)

| Variable | Default | Effect |
| --- | --- | --- |
| `VITE_NUXERA_EXPERIENCE_ENABLED` | `false` | Master switch for the whole NUXERA shell/workspace. Off by default; legacy dashboard remains the only visible experience. |
| `VITE_NUXERA_APPLICANT_ENABLED` | unset (falls back to master flag) | Per-role rollout switch for the applicant workspace. |
| `VITE_NUXERA_GRANTOR_ENABLED` | unset | Per-role rollout switch for the grantor workspace. |
| `VITE_NUXERA_ADMIN_ENABLED` | unset | Per-role rollout switch for the admin workspace. |
| `VITE_NUXERA_INTELLIGENCE_ENABLED` | unset | Per-engine rollout switch. |
| `VITE_NUXERA_MARKETS_ENABLED` | unset | Per-engine rollout switch. |
| `VITE_NUXERA_STRATEGY_ENABLED` | unset | Per-engine rollout switch. |

## Backend controlled-rollout flags (`backend/.env.example`)

| Variable | Default | Effect |
| --- | --- | --- |
| `NUXERA_CONVERSATION_RUNTIME_ENABLED` | `false` | Read directly in `backend/src/routes/nuxera.js` for both `POST /nuxera/conversation/preview` and `POST /nuxera/conversation/turn`. When not `true`, the conversation agent envelope is blocked before any LLM provider is called (`nuxeraConversationAgentReadinessService.js`). When `true`, `/conversation/turn` still requires server-side authorization (real evidence-link lookup, not a client-supplied flag) before calling `generateJsonWithFallback`. |
| `NUXERA_NOTIFICATION_DELIVERY_ENABLED` | `false` | Read by `nuxeraNotificationOutboxService.js` (`isNuxeraNotificationDeliveryEnabled`). Gates whether `POST /nuxera/admin/notification-outbox` actually inserts a row into `nuxera_notification_outbox` (bypassing RLS via `supabaseAdmin`/service role) or only returns an unpersisted preview. It does **not** gate a send worker: `processNuxeraNotificationDeliveryBatch` always returns `delivery-worker-not-implemented` regardless of this flag, because no email/WhatsApp delivery adapter exists yet. |

## AI provider keys (`backend/.env.example`, shared by `aiJsonProvider.js` / `aiEngine.js`)

These are not NUXERA-specific, but the NUXERA conversation runtime and AI
provider policy (`nuxeraAiProviderPolicyService.js`) depend on them:

| Variable | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Primary provider, allowed for sensitive/non-anonymized data. |
| `OPENAI_API_KEY` / `OPENAI_JSON_MODEL` | Primary provider, allowed for sensitive/non-anonymized data. |
| `DEEPSEEK_API_KEY` / `DEEPSEEK_JSON_MODEL` | Restricted provider; only allowed when `dataRisk:'low'`, `anonymized:true` and an explicit low-risk `taskType` are passed to `generateJsonWithFallback`. |
| `KIMI_API_KEY` / `KIMI_BASE_URL` / `KIMI_JSON_MODEL` | Restricted provider, same low-risk-only gate as DeepSeek. |
| `NVIDIA_API_KEY` | Restricted provider, same low-risk-only gate as DeepSeek. |

The NUXERA conversation turn (`runNuxeraConversationTurn`) always calls
`generateJsonWithFallback` with `dataRisk:'sensitive'` and `anonymized:false`,
so it only ever reaches Anthropic/OpenAI, never the restricted providers,
regardless of which keys happen to be configured.

## What is not an environment variable

`NUXERA_HTTP_BASE_URL`, `NUXERA_ADMIN_TOKEN`, `NUXERA_APPLICANT_TOKEN`,
`NUXERA_APPLICANT_ORDER_ID`, `NUXERA_GRANTOR_TOKEN`, `NUXERA_GRANTOR_ORDER_ID`
are read only by the manual operator script
`backend/scripts/verify-nuxera-http-readiness.js`; they are not part of the
running application and must never be set in Render/Vercel.

## Production status as of 2026-07-22

Neither `NUXERA_CONVERSATION_RUNTIME_ENABLED` nor
`NUXERA_NOTIFICATION_DELIVERY_ENABLED` is set in Render production or preview
environments. No AI provider key is confirmed present in Render either (see
`project_backend_ai_infraestructura` operator notes). Until an operator sets
these explicitly in a controlled environment, both the conversation runtime
and the notification outbox persistence path stay in their safe/disabled
default state described above.
