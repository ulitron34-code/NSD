# Migration Matrix

| Capability | Legacy available | New target | Status | Retirement allowed |
|---|---:|---|---|---:|
| Migration docs | N/A | NUXERA migration package in repo | In progress | N/A |
| Repository baseline | N/A | Verified inventory and dependency map | Baseline complete except E2E deferred by local npm tooling | N/A |
| Backend persistence contracts | N/A | NUXERA state contract over existing service orders/documents/audit | All three tables (`nuxera_workspace_states`, `nuxera_evidence_links`, `nuxera_admin_controls`) applied to production Supabase 2026-07-18, RLS enabled and confirmed live via `getNuxeraBackendReadiness()` (100% ready). Applicant checklist read/write, owner evidence-link read and authorized-grantor evidence-link read are implemented and RLS-verified against production with real order/user ids (applicant-owner, different-applicant, authorized-grantor all PASS). Read-only admin control skeleton implemented. Full read-only governance chain (verification plan, evidence scaffold, runbook, evidence review, approval package, write gate, change request, release dossier, continuation pack) implemented locally. Admin-internal RLS identity and all HTTP-level endpoint tests still pending. | N/A |
| Public landing | Yes | Outcome-led NUXERA landing | Full public site (landing, platform/industries/integrations/modalities/services, terms/privacy/disclaimers, login/signup, checkout, shared data room) rebranded behind the flag; verified in Chrome 2026-07-18 | No |
| Authentication | Yes | Reused with compatibility | Baseline mapped and validated | No |
| View switcher | Yes | Formal feature-flag control | Feature-flagged NUXERA entry implemented | No |
| Engine registry | N/A | Shared engine metadata source | Implemented for Finance, Intelligence, Markets and Strategy | N/A |
| Applicant dashboard | Yes | Progress and next-action home | Guided mission with guarded applicant checklist write UX and owner evidence fallback mounted | No |
| Applicant onboarding | Yes | Guided mission wizard | Local three-stage onboarding wizard mounted | No |
| Company and project data | Yes | Unified guided workspace | Local company/project workspace mounted | No |
| Document management | Yes | Contextual document center | Local contextual document center mounted | No |
| Grantor dashboard | Yes | Decision queue and alerts | Local case queue foundation mounted | No |
| Case review | Yes | Unified case workbench | Local workbench, authorized document summary, non-binding memo and grantor read-only evidence ledger mounted | No |
| Admin | Yes | Operations/config/security/AI split | Local readiness, action queue, health signals, incident controls, audit package, grantor document readiness, admin evidence coverage and read-only backend controls mounted | No |
| Compliance | Yes | Transversal services | Preserve | No |
| Intelligence | Partial | Deep research engine | Research mission foundation and read-only evidence ledger mounted | N/A |
| Markets | No/partial | Market intelligence engine | Provider degradation and realtime license gate hardened | N/A |
| Strategy | No/partial | Strategic decision engine | Decision flow gates and local audit package mounted | N/A |
