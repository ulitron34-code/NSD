# NUXERA - Detailed Functional Manual

Date: 2026-07-29  
Audience: business specialists, compliance teams, originators, funding providers, commercial teams and investors.  
Status: live NUXERA experience for demonstration, with sensitive operations protected by gates and final production evidence still pending.

## 1. What NUXERA Is

NUXERA is a financial intelligence and compliance platform for preparing, reviewing and monitoring financing files. Its core purpose is to transform scattered information about a company, project, beneficial owners, documents and jurisdictional context into a structured file that humans can review and defend.

NUXERA is not an automatic credit approval engine. It is a controlled operating layer that organizes evidence, exposes gaps, triggers reviews, prepares decision packets and records what is known, what is missing and what requires external validation.

The platform has four main surfaces: public site, applicant workspace, funding provider workspace and administration.

![NUXERA public site](./assets/qa-2026-07-29/public-home-en.png)

## 2. Public Site

The public site is the commercial and institutional entry point. It explains NUXERA as a global compliance and risk platform for evidence-based financial decisions.

How to use it:

1. Open the public NUXERA URL.
2. Review the value proposition, global coverage, industries, integrations and implementation model.
3. Switch between Spanish and English for local or international presentations.
4. Use Login or Sign Up to move from public information into the operational workspace.

What each area does:

- Home: presents identity, product promise and summary capabilities.
- Platform: explains the system as a file, intelligence and traceability workspace.
- Global coverage: presents the jurisdictional and regulatory coverage logic.
- Industries: shows sectors that can prepare funding files.
- Integrations: communicates connection potential with APIs, public sources, AI providers, email and regulatory registers.
- Implementation: frames onboarding and migration.

Expected result: visitors understand NUXERA as a compliance and financial intelligence platform, not just a financing landing page.

## 3. Applicant Workspace

The applicant workspace is where a company, sponsor or project owner prepares the file before requesting capital.

![Applicant workspace](./assets/qa-2026-07-29/applicant-dashboard-en.png)

How to enter:

1. Sign in as applicant.
2. Open the dashboard.
3. Confirm the shell reads NUXERA / Applicant.
4. Review the overall readiness state.

Recommended workflow:

1. Complete company and responsible-party profile. Add legal entity details, corporate structure, representatives, beneficial owners and file owners.
2. Prepare project information. Explain funding amount, use of funds, location, sector, impact, maturity and financial assumptions.
3. Upload documents. Depending on the file type, documents may include corporate, tax, financial, identity, permits, contracts, collateral, technical and compliance evidence.
4. Review gaps. NUXERA shows missing data or documents required for review.
5. Resolve observations. When the funding provider or system marks a gap, the applicant uploads, corrects or explains the evidence.
6. Track progress. The applicant follows status, next steps, open risks and pending requests.

Document upload behavior:

- Each document should be mapped to a category and requirement.
- Metadata should include type, date, owner, version, linked requirement and review status.
- Documents must not be emailed automatically or exposed to a funding provider without authorization rules.
- In production, evidence must persist through secure storage, RLS and access logs.

Expected result: a structured funding file with visible gaps, categorized documents and clear conditions before funding-provider review.

## 4. Funding Provider Workspace

The funding provider workspace is for authorized reviewers: funds, banks, lenders, analysts, family offices and investment committees.

![Funding provider decision desk](./assets/qa-2026-07-29/grantor-workspace-en.png)

How to enter:

1. Sign in as funding provider.
2. Use Decision desk for executive and committee review.
3. Use Case management for operational follow-up, ownership and SLAs.
4. Use Finance, Intelligence, Markets or Strategy according to the review need.

Decision desk vs Case management:

- Decision desk answers whether the file is ready for committee, what evidence supports the review, what questions remain and what human conditions are required.
- Case management answers which cases are open, who owns them, what SLA applies, what evidence blocks progress and which follow-ups must be sent.

Jurisdiction and country/state/city analysis:

Funding providers need to understand where the project will operate. NUXERA should surface economic, political, social, regulatory and territorial context at country, state/province and city level when reliable data exists.

The analysis should cover:

- Economic conditions: growth, inflation, currency, FX exposure, relevant sectors, debt, foreign investment and macro stability.
- Political conditions: institutional stability, elections, regulatory changes, sanctions, conflict, perceived corruption and governance.
- Social and territorial conditions: security, local conflict, permits, community risk, infrastructure, employment, poverty or local pressure.
- Regulatory conditions: public registers, licenses, restricted sectors, financial authorities, tax standing, beneficial owners and sanctions lists.
- Local granularity: province/state/city indicators where public data or reliable APIs can support the conclusion.

Middle East and UAE regulatory coverage:

NUXERA models UAE PASS, EOCN, SCA/CMA, CBUAE, DFSA, FSRA/ADGM, ADGM Registration Authority, VARA, FTA, National Economic Registry and local economic departments as public, conditional or private sources. In the applicant workspace these sources should feed score, checklist and gaps quietly. In the funding provider workspace they should be explicit: source, scope, limitation, last review and next action.

Expected result: faster, better structured and more defensible committee review with traceable evidence and clear human conditions.

## 5. Administration

Administration controls operations, security, sources, agents, notifications, persistence and production readiness.

![Admin operations](./assets/qa-2026-07-29/admin-operations-en.png)

How to enter:

1. Sign in as administrator.
2. Open Operations for operating state.
3. Open Security for RLS, protected routes and authorization evidence.
4. Open AI & agents for agent policy.
5. Open System for health, gates, sources and deployment posture.

What admin does:

- Supervises users and permissions.
- Reviews protected modules.
- Manages regulatory source posture: live, public, private, agreement required or unavailable.
- Controls automatic notifications and email sandbox.
- Defines conversational agent limits.
- Reviews operational persistence before enabling real writes.
- Prepares cutover evidence from Nexus to NUXERA.

Notifications:

The notification service should email applicants and funding providers about file creation, missing documents, evidence requests, status changes, data room invitations, SLA reminders, risk alerts and human decisions. It must start in sandbox/dry-run mode with approved templates and without sensitive attachments.

Agent/chat:

The chat should explain requirements, summarize file state, identify risks, guide document upload and prepare committee questions. It should be grounded in authorized data: file metadata, checklist, permitted documents, timeline, regulatory sources and jurisdictional context. It must not invent evidence, approve transactions, send email without authorization or expose another user's data.

## 6. Overall Result

NUXERA is investor-ready as a demonstrable live product experience. Full production operation still requires controlled real-data testing, RLS phase 2 evidence, final SQL persistence, email sandbox/live provider approval, cutover decision and agreements/APIs for private regulatory sources.
