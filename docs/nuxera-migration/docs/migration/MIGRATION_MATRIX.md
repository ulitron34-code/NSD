# Migration Matrix

| Capability | Legacy available | New target | Status | Retirement allowed |
|---|---:|---|---|---:|
| Migration docs | N/A | NUXERA migration package in repo | In progress | N/A |
| Repository baseline | N/A | Verified inventory and dependency map | Baseline complete except E2E deferred by local npm tooling | N/A |
| Backend persistence contracts | N/A | NUXERA state contract over existing service orders/documents/audit | Applicant checklist, owner evidence-link and read-only admin control skeletons implemented; consolidated SQL guard, controlled RLS/endpoint plan guard, protected verification-plan endpoint, evidence scaffold endpoint/CLI, admin evidence package surface and SQL/RLS readiness checklist local | N/A |
| Public landing | Yes | Outcome-led NUXERA landing | Planned | No |
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
