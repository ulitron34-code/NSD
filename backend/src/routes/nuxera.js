import express from 'express';
import { authMiddleware, requirePermission } from '../middleware/auth.js';
import { getAdminControls } from '../services/nuxeraAdminControlService.js';
import { getNuxeraControlledApprovalPackage } from '../services/nuxeraControlledApprovalPackageService.js';
import { getNuxeraControlledChangeRequest } from '../services/nuxeraControlledChangeRequestService.js';
import { getNuxeraBackendReadiness } from '../services/nuxeraBackendReadinessService.js';
import { getNuxeraControlledContinuationPack } from '../services/nuxeraControlledContinuationPackService.js';
import { getNuxeraControlledEvidenceScaffold } from '../services/nuxeraControlledEvidenceScaffoldService.js';
import { reviewNuxeraControlledEvidence } from '../services/nuxeraControlledEvidenceReviewService.js';
import { getNuxeraControlledReleaseDossier } from '../services/nuxeraControlledReleaseDossierService.js';
import { getNuxeraControlledRunbook } from '../services/nuxeraControlledRunbookService.js';
import { getNuxeraControlledVerificationPlan } from '../services/nuxeraControlledVerificationService.js';
import { getNuxeraControlledWriteGate } from '../services/nuxeraControlledWriteGateService.js';
import { buildNuxeraConversationPreview, getNuxeraConversationAgentReadiness, runNuxeraConversationTurn } from "../services/nuxeraConversationAgentReadinessService.js";
import { getNuxeraAiProviderPolicy } from "../services/nuxeraAiProviderPolicyService.js";
import { getNuxeraTenTrackClosurePlan } from '../services/nuxeraTenTrackClosureService.js';
import { approveNuxeraNotificationRules, buildNuxeraNotificationApprovalPlan, buildNuxeraNotificationDryRunBatch, buildNuxeraNotificationRulesDryRun, enqueueNuxeraNotificationIntent, getNuxeraNotificationApprovalPersistenceReadiness, getNuxeraNotificationOutboxHealth, getNuxeraNotificationOutboxReadiness, getNuxeraNotificationTemplateCatalog, isNuxeraNotificationDeliveryEnabled, listNuxeraNotificationOutbox, processNuxeraNotificationDeliveryBatch } from '../services/nuxeraNotificationOutboxService.js';
import { getAuthorizedGrantorEvidenceLinks, getOwnerEvidenceLinks } from '../services/nuxeraEvidenceLinkService.js';
import { getApplicantChecklistState, upsertApplicantChecklistState } from '../services/nuxeraWorkspaceStateService.js';
import { getAdminCaseTimeline, getApplicantCaseTimeline, getGrantorCaseTimeline } from '../services/nuxeraCaseTimelineService.js';
import { buildNuxeraCaseEventsPersistencePlan, buildNuxeraCaseEventsProjection } from '../services/nuxeraCaseEventsProjectionService.js';
import { getAdminEvidenceCoverage, getGrantorDecisionEvidencePackage } from '../services/nuxeraDecisionEvidencePackageService.js';
import { getAdminRiskHealth, getAdminRiskProfile, getApplicantRiskProfile, getGrantorRiskProfile } from '../services/nuxeraRiskOrchestrationService.js';
import { draftProjectFromAnswers } from '../agents/projectBuilderAgent.js';
import { logAuditEvent } from '../utils/audit.js';

const router = express.Router();

function sendNuxeraError(res, error) {
  const message = String(error?.message || '');

  if (/no encontrado|sin permisos/i.test(message)) {
    return res.status(404).json({
      error: 'Recurso NUXERA no disponible',
      code: 'NUXERA_RESOURCE_UNAVAILABLE'
    });
  }

  if (/invalido|invalida/i.test(message)) {
    return res.status(422).json({
      error: 'Datos NUXERA invalidos',
      code: 'NUXERA_INVALID_DATA'
    });
  }

  return res.status(503).json({
    error: 'Servicio NUXERA no disponible',
    code: 'NUXERA_BACKEND_UNAVAILABLE'
  });
}
router.get(
  '/nuxera/admin/ten-track-closure',
  authMiddleware,
  requirePermission('nuxera:admin:read'),
  async (req, res) => {
    try {
      res.json({
        workspaceRole: 'admin',
        closurePlan: getNuxeraTenTrackClosurePlan(),
        guardrails: [
          'Ten-track closure is read-only and does not execute SQL, deploy, send notifications or enable writes.',
          'Completion percentages are operational estimates, not production approval.'
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);
router.get(
  '/nuxera/admin/verification-plan',
  authMiddleware,
  requirePermission('nuxera:admin:read'),
  async (req, res) => {
    try {
      const verificationPlan = getNuxeraControlledVerificationPlan();

      res.json({
        workspaceRole: 'admin',
        verificationPlan,
        guardrails: [
          'NU-DB-RLS-ENDPOINT-VERIFY-001 exposes the controlled verification plan in read-only mode.',
          'Verification plan does not execute endpoints, apply SQL, change RLS or enable writes.',
          'Completed evidence must come from a controlled non-production Supabase run.'
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);
router.get(
  "/nuxera/admin/ai-provider-policy",
  authMiddleware,
  requirePermission("nuxera:admin:read"),
  async (req, res) => {
    try {
      res.json({
        workspaceRole: "admin",
        aiProviderPolicy: getNuxeraAiProviderPolicy(),
        guardrails: [
          "AI provider policy is read-only and never exposes API key values.",
          "Anthropic/OpenAI remain primary for sensitive document review.",
          "Kimi/DeepSeek/NVIDIA are restricted to explicit low-risk anonymized tasks."
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);
router.get(
  '/nuxera/admin/notification-outbox-readiness',
  authMiddleware,
  requirePermission('nuxera:admin:read'),
  async (req, res) => {
    try {
      res.json({
        workspaceRole: 'admin',
        notificationOutbox: getNuxeraNotificationOutboxReadiness(),
        guardrails: [
          'Notification outbox readiness is read-only and does not send email, WhatsApp or in-app notifications.',
          'Delivery remains disabled until SQL, RLS verification, audit logging and worker approval are completed.',
          'Agents may draft or summarize notification content but cannot deliver messages automatically.'
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);
router.get(
  '/nuxera/admin/notification-outbox-health',
  authMiddleware,
  requirePermission('nuxera:admin:read'),
  async (req, res) => {
    try {
      res.json({
        workspaceRole: 'admin',
        notificationHealth: await getNuxeraNotificationOutboxHealth({ limit: req.query?.limit }),
        guardrails: [
          'Notification health is read-only and cannot send or retry messages.',
          'Failed, suppressed and queued rows require human review before automation.'
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);
router.post(
  "/nuxera/conversation/preview",
  authMiddleware,
  async (req, res) => {
    try {
      const requestedRole = req.body?.role || (req.userRole === 'otorgante' || req.userRole === 'inversionista' ? 'grantor' : req.userRole === 'administrador' ? 'admin' : 'applicant');
      const conversationPreview = buildNuxeraConversationPreview({
        role: requestedRole,
        orderId: req.body?.orderId,
        selectedId: req.body?.selectedId,
        authorized: req.body?.authorized === true,
        runtimeEnabled: process.env.NUXERA_CONVERSATION_RUNTIME_ENABLED,
        message: req.body?.message
      });

      res.json({
        workspaceRole: requestedRole,
        conversationPreview,
        guardrails: [
          "Conversation preview is read-only and does not call an LLM provider.",
          "Runtime remains disabled unless NUXERA_CONVERSATION_RUNTIME_ENABLED=true and context is authorized.",
          "The assistant cannot send notifications, approve financing, issue term sheets or change permissions."
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);
router.get(
  "/nuxera/admin/notification-approval-readiness",
  authMiddleware,
  requirePermission("nuxera:admin:read"),
  async (req, res) => {
    try {
      res.json({
        workspaceRole: "admin",
        approvalPersistence: getNuxeraNotificationApprovalPersistenceReadiness(),
        guardrails: [
          "Approval persistence readiness is read-only and does not apply SQL or write approval history.",
          "nuxera_notification_approvals remains a pending SQL/RLS contract until separate review approves it.",
          "Agents and chat can explain the approval posture but cannot approve or queue notifications."
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);
router.get(
  "/nuxera/admin/notification-templates",
  authMiddleware,
  requirePermission("nuxera:admin:read"),
  async (req, res) => {
    try {
      res.json({
        workspaceRole: "admin",
        templateCatalog: getNuxeraNotificationTemplateCatalog(),
        guardrails: [
          "Template catalog is read-only and does not queue or send notifications.",
          "Templates intentionally exclude evidence, attachments, scores and decisions."
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);
router.get(
  "/nuxera/admin/orders/:orderId/notification-approval-plan",
  authMiddleware,
  requirePermission("nuxera:admin:read"),
  async (req, res) => {
    try {
      const timeline = await getAdminCaseTimeline({ orderId: req.params.orderId });
      const approvalPlan = buildNuxeraNotificationApprovalPlan(timeline, {
        orderId: req.params.orderId,
        applicantRecipientUserId: req.query?.applicantRecipientUserId,
        applicantRecipientEmail: req.query?.applicantRecipientEmail,
        grantorRecipientUserId: req.query?.grantorRecipientUserId,
        grantorRecipientEmail: req.query?.grantorRecipientEmail,
        adminRecipientUserId: req.query?.adminRecipientUserId,
        adminRecipientEmail: req.query?.adminRecipientEmail,
        maxBatchSize: req.query?.maxBatchSize,
        approvalReason: req.query?.approvalReason
      });

      res.json({
        orderId: req.params.orderId,
        workspaceRole: "admin",
        approvalPlan,
        guardrails: [
          "Approval plan is read-only and never queues, sends or updates outbox rows.",
          "Approval items show rendered templates without evidence, attachments or decisions."
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);
router.post(
  "/nuxera/admin/orders/:orderId/notification-rules/approve",
  authMiddleware,
  requirePermission("nuxera:admin:update"),
  async (req, res) => {
    try {
      const timeline = await getAdminCaseTimeline({ orderId: req.params.orderId });
      const approvalResult = await approveNuxeraNotificationRules({
        timeline,
        actorUserId: req.userId,
        req,
        deliveryEnabled: isNuxeraNotificationDeliveryEnabled(),
        context: {
          orderId: req.params.orderId,
          applicantRecipientUserId: req.body?.applicantRecipientUserId,
          applicantRecipientEmail: req.body?.applicantRecipientEmail,
          grantorRecipientUserId: req.body?.grantorRecipientUserId,
          grantorRecipientEmail: req.body?.grantorRecipientEmail,
          adminRecipientUserId: req.body?.adminRecipientUserId,
          adminRecipientEmail: req.body?.adminRecipientEmail,
          maxBatchSize: req.body?.maxBatchSize,
          approvalReason: req.body?.approvalReason
        }
      });

      res.json({
        orderId: req.params.orderId,
        workspaceRole: "admin",
        approvalResult,
        guardrails: [
          "Approval requires nuxera:admin:update but still cannot send messages.",
          "Client input cannot enable persistence; backend delivery flag decides preview vs queued row.",
          "Delivery worker remains a separate manual gated action."
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);
router.get(
  "/nuxera/admin/orders/:orderId/notification-rules-dry-run",
  authMiddleware,
  requirePermission("nuxera:admin:read"),
  async (req, res) => {
    try {
      const timeline = await getAdminCaseTimeline({ orderId: req.params.orderId });
      const notificationRules = buildNuxeraNotificationRulesDryRun(timeline, {
        orderId: req.params.orderId,
        applicantRecipientUserId: req.query?.applicantRecipientUserId,
        applicantRecipientEmail: req.query?.applicantRecipientEmail,
        grantorRecipientUserId: req.query?.grantorRecipientUserId,
        grantorRecipientEmail: req.query?.grantorRecipientEmail,
        adminRecipientUserId: req.query?.adminRecipientUserId,
        adminRecipientEmail: req.query?.adminRecipientEmail,
        maxBatchSize: req.query?.maxBatchSize
      });

      res.json({
        orderId: req.params.orderId,
        workspaceRole: "admin",
        notificationRules,
        guardrails: [
          "Notification rules are dry-run only and never queue, send or update outbox rows.",
          "Recipients come from explicit admin context; no sensitive evidence is included in notices."
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);
router.post(
  "/nuxera/admin/notification-outbox-dry-run",
  authMiddleware,
  requirePermission("nuxera:admin:read"),
  async (req, res) => {
    try {
      res.json({
        workspaceRole: "admin",
        dryRun: buildNuxeraNotificationDryRunBatch(req.body?.intents, {
          channels: req.body?.channels,
          maxBatchSize: req.body?.maxBatchSize
        }),
        guardrails: [
          "Notification dry-run is read-only and never sends messages.",
          "No outbox rows are inserted from this endpoint.",
          "Human approval, dedupe and audit evidence are required before real queueing."
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);
router.post(
  "/nuxera/conversation/turn",
  authMiddleware,
  async (req, res) => {
    try {
      // Unlike /conversation/preview, this route makes a real, billable LLM call, so the
      // role is derived only from the authenticated session (req.userRole) and never from
      // client-supplied req.body.role -- otherwise any authenticated user could claim the
      // admin channel to consume provider quota under a different prompt scope.
      const requestedRole = req.userRole === 'otorgante' || req.userRole === 'inversionista' ? 'grantor' : req.userRole === 'administrador' ? 'admin' : 'applicant';
      const orderId = req.body?.orderId || req.body?.selectedId || null;
      let authorizedContext = null;
      let authorized = false;

      if (requestedRole === 'applicant' && orderId) {
        try {
          authorizedContext = await getOwnerEvidenceLinks({ orderId, userId: req.userId });
          authorized = true;
        } catch {
          authorized = false;
        }
      } else if (requestedRole === 'grantor' && orderId) {
        try {
          authorizedContext = await getAuthorizedGrantorEvidenceLinks({ orderId, userId: req.userId, email: req.user?.email });
          authorized = true;
        } catch {
          authorized = false;
        }
      } else if (requestedRole === 'admin') {
        authorized = true;
        authorizedContext = {
          scope: 'operations-monitor',
          note: 'No file content access by default; limited to audit_logs, nuxera_admin_controls and nuxera_notification_outbox summaries.'
        };
      }

      const turn = await runNuxeraConversationTurn({
        role: requestedRole,
        orderId,
        selectedId: orderId,
        authorized,
        runtimeEnabled: process.env.NUXERA_CONVERSATION_RUNTIME_ENABLED,
        message: req.body?.message,
        authorizedContext,
        actorUserId: req.userId,
        req
      });

      res.json({
        workspaceRole: requestedRole,
        turn,
        guardrails: [
          "Authorization and evidence context are re-derived server-side; a client-supplied authorized flag is never trusted.",
          "Runtime calls a real LLM provider only when NUXERA_CONVERSATION_RUNTIME_ENABLED=true and server-side authorization succeeds.",
          "Chat turns are never persisted; only a metadata-only audit event is recorded.",
          "The assistant cannot send notifications, approve financing, issue term sheets or change permissions."
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);
router.post(
  "/nuxera/admin/notification-outbox",
  authMiddleware,
  requirePermission("nuxera:admin:update"),
  async (req, res) => {
    try {
      const queued = await enqueueNuxeraNotificationIntent({
        intent: req.body?.intent,
        actorUserId: req.userId,
        req,
        deliveryEnabled: isNuxeraNotificationDeliveryEnabled()
      });

      res.json({
        workspaceRole: "admin",
        queued,
        guardrails: [
          "Queueing requires nuxera:admin:update because it may create an outbox row when backend delivery persistence is enabled.",
          "Queueing only persists a row when NUXERA_NOTIFICATION_DELIVERY_ENABLED=true; otherwise it stays a preview.",
          "Duplicate dedupe keys are rejected and audited instead of creating a second row.",
          "The delivery worker remains disabled; no email, WhatsApp or in-app message is ever sent from this route."
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);
router.post(
  "/nuxera/admin/notification-delivery-batch",
  authMiddleware,
  requirePermission("nuxera:admin:update"),
  async (req, res) => {
    try {
      const batch = await processNuxeraNotificationDeliveryBatch({
        actorUserId: req.userId,
        req,
        deliveryEnabled: isNuxeraNotificationDeliveryEnabled(),
        channels: req.body?.channels,
        maxBatchSize: req.body?.maxBatchSize
      });

      res.json({
        workspaceRole: "admin",
        batch,
        guardrails: [
          "Manual delivery batch requires nuxera:admin:update and never trusts client-supplied delivery flags.",
          "The worker only reads or updates rows when backend delivery gates are explicitly enabled.",
          "No cron or automatic delivery is triggered by this endpoint."
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);
router.get(
  "/nuxera/admin/notification-outbox",
  authMiddleware,
  requirePermission("nuxera:admin:read"),
  async (req, res) => {
    try {
      const outbox = await listNuxeraNotificationOutbox({
        status: req.query?.status,
        audience: req.query?.audience,
        orderId: req.query?.orderId,
        limit: req.query?.limit
      });

      res.json({
        workspaceRole: "admin",
        outbox,
        guardrails: [
          "Outbox listing is read-only and never sends messages.",
          "Delivery remains disabled until the worker is explicitly approved."
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);
router.get(
  "/nuxera/admin/conversation-agent-readiness",
  authMiddleware,
  requirePermission("nuxera:admin:read"),
  async (req, res) => {
    try {
      res.json({
        workspaceRole: "admin",
        conversationAgent: getNuxeraConversationAgentReadiness(),
        guardrails: [
          "Conversation agent readiness is read-only and does not call an LLM provider.",
          "Runtime chat remains disabled until role-scoped retrieval, retention and audit rules are approved.",
          "The agent cannot send notifications, approve financing, issue term sheets or change permissions."
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);
router.get(
  "/nuxera/admin/verification-continuation-pack",
  authMiddleware,
  requirePermission('nuxera:admin:read'),
  async (req, res) => {
    try {
      const continuationPack = getNuxeraControlledContinuationPack({
        progressPercent: Number(req.query?.progress),
        resumeFromCommit: req.query?.resumeFrom,
        branch: req.query?.branch,
        localRepo: req.query?.localRepo,
        downloadsRoot: req.query?.downloadsRoot
      });

      res.json({
        workspaceRole: 'admin',
        continuationPack,
        guardrails: [
          'Continuation pack is read-only and does not persist handoff metadata.',
          'Continuation pack does not execute endpoint checks, apply SQL, change RLS or enable writes.',
          'Night continuation must resume from the latest clean commit and keep write enablement separate.'
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);
router.get(
  '/nuxera/admin/verification-evidence-scaffold',
  authMiddleware,
  requirePermission('nuxera:admin:read'),
  async (req, res) => {
    try {
      const evidenceScaffold = getNuxeraControlledEvidenceScaffold({
        repoCommit: req.query?.commit,
        environment: req.query?.environment,
        operator: req.query?.operator,
        reviewer: req.query?.reviewer,
        priorKnownGoodCommit: req.query?.priorKnownGoodCommit,
        rollbackOwner: req.query?.rollbackOwner
      });

      res.json({
        workspaceRole: 'admin',
        evidenceScaffold,
        guardrails: [
          'Evidence scaffold is generated read-only and does not execute endpoint checks.',
          'No SQL, RLS, feature flag, permission, document grant or data-room mutation is performed.',
          'Operators must fill observed evidence from a controlled non-production Supabase run.'
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);
router.post(
  '/nuxera/admin/verification-write-gate',
  authMiddleware,
  requirePermission('nuxera:admin:read'),
  async (req, res) => {
    try {
      const writeGate = getNuxeraControlledWriteGate({
        backendReadiness: req.body?.backendReadiness,
        approvalPackage: req.body?.approvalPackage,
        evidenceReview: req.body?.evidenceReview,
        markdown: req.body?.markdown,
        approver: req.body?.approver,
        approvalDate: req.body?.approvalDate,
        approvalScope: req.body?.approvalScope,
        evidenceHash: req.body?.evidenceHash,
        decision: req.body?.decision,
        requestedScope: req.body?.requestedScope,
        requestedEnvironment: req.body?.requestedEnvironment,
        changeTicket: req.body?.changeTicket
      });

      res.json({
        workspaceRole: 'admin',
        writeGate,
        guardrails: [
          'Write gate is read-only and does not persist approvals or change tickets.',
          'Write gate does not execute endpoint checks, apply SQL, change RLS or enable writes.',
          'Ready-for-controlled-write-change requires separate deploy/change-control.'
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);
router.post(
  '/nuxera/admin/verification-change-request',
  authMiddleware,
  requirePermission('nuxera:admin:read'),
  async (req, res) => {
    try {
      const changeRequest = getNuxeraControlledChangeRequest({
        writeGate: req.body?.writeGate,
        backendReadiness: req.body?.backendReadiness,
        approvalPackage: req.body?.approvalPackage,
        evidenceReview: req.body?.evidenceReview,
        markdown: req.body?.markdown,
        approver: req.body?.approver,
        approvalDate: req.body?.approvalDate,
        approvalScope: req.body?.approvalScope,
        evidenceHash: req.body?.evidenceHash,
        decision: req.body?.decision,
        requestedScope: req.body?.requestedScope,
        requestedEnvironment: req.body?.requestedEnvironment,
        changeTicket: req.body?.changeTicket,
        deploymentWindow: req.body?.deploymentWindow,
        rollbackOwner: req.body?.rollbackOwner,
        releaseReviewer: req.body?.releaseReviewer
      });

      res.json({
        workspaceRole: 'admin',
        changeRequest,
        guardrails: [
          'Change request package is read-only and does not persist tickets.',
          'Change request package does not execute endpoint checks, apply SQL, change RLS or enable writes.',
          'Ready-for-separate-change-review is not deployment approval.'
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);
router.post(
  '/nuxera/admin/verification-release-dossier',
  authMiddleware,
  requirePermission('nuxera:admin:read'),
  async (req, res) => {
    try {
      const releaseDossier = getNuxeraControlledReleaseDossier({
        changeRequest: req.body?.changeRequest,
        writeGate: req.body?.writeGate,
        backendReadiness: req.body?.backendReadiness,
        approvalPackage: req.body?.approvalPackage,
        evidenceReview: req.body?.evidenceReview,
        markdown: req.body?.markdown,
        approver: req.body?.approver,
        approvalDate: req.body?.approvalDate,
        approvalScope: req.body?.approvalScope,
        evidenceHash: req.body?.evidenceHash,
        decision: req.body?.decision,
        requestedScope: req.body?.requestedScope,
        requestedEnvironment: req.body?.requestedEnvironment,
        changeTicket: req.body?.changeTicket,
        deploymentWindow: req.body?.deploymentWindow,
        rollbackOwner: req.body?.rollbackOwner,
        releaseReviewer: req.body?.releaseReviewer,
        dossierOwner: req.body?.dossierOwner,
        dossierDate: req.body?.dossierDate,
        finalReviewer: req.body?.finalReviewer
      });

      res.json({
        workspaceRole: 'admin',
        releaseDossier,
        guardrails: [
          'Release dossier is read-only and does not persist approvals, tickets or deployment windows.',
          'Release dossier does not execute endpoint checks, apply SQL, change RLS or enable writes.',
          'Ready-for-release-readiness-review is not deployment approval.'
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);
router.post(
  '/nuxera/admin/verification-approval-package',
  authMiddleware,
  requirePermission('nuxera:admin:read'),
  async (req, res) => {
    try {
      const approvalPackage = getNuxeraControlledApprovalPackage({
        evidenceReview: req.body?.evidenceReview,
        markdown: req.body?.markdown,
        approver: req.body?.approver,
        approvalDate: req.body?.approvalDate,
        approvalScope: req.body?.approvalScope,
        evidenceHash: req.body?.evidenceHash,
        decision: req.body?.decision
      });

      res.json({
        workspaceRole: 'admin',
        approvalPackage,
        guardrails: [
          'Approval package is read-only and does not persist approvals.',
          'Approval package does not execute endpoint checks, apply SQL, change RLS or enable writes.',
          'Ready-for-human-release-decision is not automatic production approval.'
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);
router.post(
  '/nuxera/admin/verification-evidence-review',
  authMiddleware,
  requirePermission('nuxera:admin:read'),
  async (req, res) => {
    try {
      const evidenceReview = reviewNuxeraControlledEvidence({
        markdown: req.body?.markdown
      });

      res.json({
        workspaceRole: 'admin',
        evidenceReview,
        guardrails: [
          'Evidence review is read-only and does not persist submitted Markdown.',
          'Review does not execute endpoint checks, apply SQL, change RLS or enable writes.',
          'Ready-for-human-review is not production approval.'
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);
router.get(
  '/nuxera/admin/verification-runbook',
  authMiddleware,
  requirePermission('nuxera:admin:read'),
  async (req, res) => {
    try {
      const runbook = getNuxeraControlledRunbook({
        repoCommit: req.query?.commit,
        environment: req.query?.environment,
        operator: req.query?.operator,
        reviewer: req.query?.reviewer,
        priorKnownGoodCommit: req.query?.priorKnownGoodCommit,
        rollbackOwner: req.query?.rollbackOwner
      });

      res.json({
        workspaceRole: 'admin',
        runbook,
        guardrails: [
          'Runbook is generated read-only and does not execute endpoint checks.',
          'No SQL, RLS, feature flag, permission, document grant or data-room mutation is performed.',
          'Production writes remain blocked until observed evidence is attached and reviewed.'
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);
router.get(
  '/nuxera/admin/readiness',
  authMiddleware,
  requirePermission('nuxera:admin:read'),
  async (req, res) => {
    try {
      const readiness = await getNuxeraBackendReadiness();

      res.json({
        workspaceRole: 'admin',
        readiness,
        guardrails: [
          'NU-BE-READINESS-001 exposes backend readiness in read-only mode.',
          'Readiness does not apply SQL, change RLS or enable writes.',
          'RLS must still be verified with controlled identities before production use.'
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);
router.get(
  '/nuxera/admin/controls',
  authMiddleware,
  requirePermission('nuxera:admin:read'),
  async (req, res) => {
    try {
      const controls = await getAdminControls();

      res.json({
        workspaceRole: 'admin',
        controls,
        guardrails: [
          'NU-ADM-CTRL-001 exposes admin controls in read-only mode.',
          'Admin controls do not activate automation, permissions or licensed market data.',
          'No write endpoint is exposed for admin controls.'
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);

router.get(
  '/nuxera/orders/:orderId/timeline',
  authMiddleware,
  requirePermission('case:own:read'),
  async (req, res) => {
    try {
      const timeline = await getApplicantCaseTimeline({
        orderId: req.params.orderId,
        userId: req.userId
      });

      res.json({
        orderId: req.params.orderId,
        workspaceRole: 'applicant',
        timeline,
        guardrails: [
          'Timeline NUXERA owner-scoped read-only; no crea eventos ni cambia estado.',
          'El timeline excluye contenido sensible y solo muestra metadata operacional.'
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);

router.get(
  '/nuxera/orders/:orderId/grantor-timeline',
  authMiddleware,
  requirePermission('data_room:authorized:read'),
  async (req, res) => {
    try {
      const timeline = await getGrantorCaseTimeline({
        orderId: req.params.orderId,
        userId: req.userId,
        email: req.user?.email
      });

      res.json({
        orderId: req.params.orderId,
        workspaceRole: 'grantor',
        timeline,
        guardrails: [
          'Timeline NUXERA grantor-scoped read-only; requires accepted data_room_shares.',
          'Evidence links remain references and do not grant document access.'
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);

router.get(
  '/nuxera/admin/orders/:orderId/timeline',
  authMiddleware,
  requirePermission('nuxera:admin:read'),
  async (req, res) => {
    try {
      const timeline = await getAdminCaseTimeline({
        orderId: req.params.orderId
      });

      res.json({
        orderId: req.params.orderId,
        workspaceRole: 'admin',
        timeline,
        guardrails: [
          'Timeline NUXERA admin read-only; no ejecuta SQL, writes ni delivery.',
          'Admin ve metadata operacional para auditoria sin leer evidencia sensible.'
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);

router.get(
  '/nuxera/orders/:orderId/case-events',
  authMiddleware,
  requirePermission('case:own:read'),
  async (req, res) => {
    try {
      const timeline = await getApplicantCaseTimeline({
        orderId: req.params.orderId,
        userId: req.userId
      });
      const caseEvents = buildNuxeraCaseEventsProjection(timeline);

      res.json({
        orderId: req.params.orderId,
        workspaceRole: 'applicant',
        caseEvents,
        guardrails: [
          'case_events is a read-only projection; no nuxera_case_events row is created.',
          'Owner scope receives operational metadata only.'
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);

router.get(
  '/nuxera/orders/:orderId/grantor-case-events',
  authMiddleware,
  requirePermission('data_room:authorized:read'),
  async (req, res) => {
    try {
      const timeline = await getGrantorCaseTimeline({
        orderId: req.params.orderId,
        userId: req.userId,
        email: req.user?.email
      });
      const caseEvents = buildNuxeraCaseEventsProjection(timeline);

      res.json({
        orderId: req.params.orderId,
        workspaceRole: 'grantor',
        caseEvents,
        guardrails: [
          'Grantor case_events projection requires accepted data_room_shares.',
          'Projection does not grant document access or move the case to Mesa.'
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);

router.get(
  '/nuxera/admin/orders/:orderId/case-events',
  authMiddleware,
  requirePermission('nuxera:admin:read'),
  async (req, res) => {
    try {
      const timeline = await getAdminCaseTimeline({ orderId: req.params.orderId });
      const caseEvents = buildNuxeraCaseEventsProjection(timeline);

      res.json({
        orderId: req.params.orderId,
        workspaceRole: 'admin',
        caseEvents,
        guardrails: [
          'Admin case_events projection is read-only and metadata-only.',
          'Persisted writes require SQL/RLS evidence and controlled approval.'
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);

router.get(
  '/nuxera/admin/orders/:orderId/case-events/persistence-plan',
  authMiddleware,
  requirePermission('nuxera:admin:read'),
  async (req, res) => {
    try {
      const timeline = await getAdminCaseTimeline({ orderId: req.params.orderId });
      const caseEvents = buildNuxeraCaseEventsProjection(timeline);
      const persistencePlan = buildNuxeraCaseEventsPersistencePlan(caseEvents, {
        orderId: req.params.orderId,
        workspaceRole: 'admin'
      });

      res.json({
        orderId: req.params.orderId,
        workspaceRole: 'admin',
        persistencePlan,
        guardrails: [
          'case_events persistence plan is dry-run only; no insert/update/delete is performed.',
          'Client input cannot enable writes; production persistence requires separate SQL/RLS evidence and approval.'
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);
router.get(
  '/nuxera/orders/:orderId/grantor-decision-package',
  authMiddleware,
  requirePermission('data_room:authorized:read'),
  async (req, res) => {
    try {
      const decisionPackage = await getGrantorDecisionEvidencePackage({
        orderId: req.params.orderId,
        userId: req.userId,
        email: req.user?.email
      });

      res.json({
        orderId: req.params.orderId,
        workspaceRole: 'grantor',
        decisionPackage,
        guardrails: [
          'Decision package is non-binding and read-only.',
          'No term sheet, approval, rejection, notification send or permission change is performed.'
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);

router.get(
  '/nuxera/admin/orders/:orderId/evidence-coverage',
  authMiddleware,
  requirePermission('nuxera:admin:read'),
  async (req, res) => {
    try {
      const evidenceCoverage = await getAdminEvidenceCoverage({ orderId: req.params.orderId });

      res.json({
        orderId: req.params.orderId,
        workspaceRole: 'admin',
        evidenceCoverage,
        guardrails: [
          'Evidence coverage is metadata-only and does not return document content.',
          'Coverage gaps are review signals, not automated decisions.'
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);

router.get(
  '/nuxera/orders/:orderId/risk-profile',
  authMiddleware,
  requirePermission('case:own:read'),
  async (req, res) => {
    try {
      const riskProfile = await getApplicantRiskProfile({
        orderId: req.params.orderId,
        userId: req.userId
      });

      res.json({
        orderId: req.params.orderId,
        workspaceRole: 'applicant',
        riskProfile,
        guardrails: [
          'Applicant risk profile shows action-safe operational routing only.',
          'No internal sensitive risk rationale or automated decision is exposed.'
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);

router.get(
  '/nuxera/orders/:orderId/grantor-risk-profile',
  authMiddleware,
  requirePermission('data_room:authorized:read'),
  async (req, res) => {
    try {
      const riskProfile = await getGrantorRiskProfile({
        orderId: req.params.orderId,
        userId: req.userId,
        email: req.user?.email
      });

      res.json({
        orderId: req.params.orderId,
        workspaceRole: 'grantor',
        riskProfile,
        guardrails: [
          'Grantor risk profile uses authorized metadata only.',
          'Policy output routes to human review and cannot approve/reject automatically.'
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);

router.get(
  '/nuxera/admin/orders/:orderId/risk-profile',
  authMiddleware,
  requirePermission('nuxera:admin:read'),
  async (req, res) => {
    try {
      const riskProfile = await getAdminRiskProfile({ orderId: req.params.orderId });

      res.json({
        orderId: req.params.orderId,
        workspaceRole: 'admin',
        riskProfile,
        guardrails: [
          'Admin risk profile is read-only and provider-call-free.',
          'Policy rules are routing signals only until human review/cutover approval.'
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);

router.get(
  '/nuxera/admin/risk-health',
  authMiddleware,
  requirePermission('nuxera:admin:read'),
  async (req, res) => {
    try {
      const riskHealth = await getAdminRiskHealth();

      res.json({
        workspaceRole: 'admin',
        riskHealth,
        guardrails: [
          'Risk health is read-only and does not execute external screening providers.',
          'Provider freshness remains informational until live providers are approved.'
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);
router.get(
  '/nuxera/orders/:orderId/state',
  authMiddleware,
  requirePermission('case:own:read'),
  async (req, res) => {
    try {
      const checklist = await getApplicantChecklistState({
        orderId: req.params.orderId,
        userId: req.userId
      });

      res.json({
        orderId: req.params.orderId,
        workspaceRole: 'applicant',
        states: { checklist },
        guardrails: [
          'NU-BE-002 exposes applicant checklist state only.',
          'No grantor memo, admin controls or document permissions are persisted by this route.'
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);

router.get(
  '/nuxera/orders/:orderId/evidence',
  authMiddleware,
  requirePermission('case:own:read'),
  async (req, res) => {
    try {
      const evidence = await getOwnerEvidenceLinks({
        orderId: req.params.orderId,
        userId: req.userId
      });

      res.json({
        orderId: req.params.orderId,
        workspaceRole: 'applicant',
        evidence,
        guardrails: [
          'NU-BE-EVID-001 exposes owner-scoped evidence links only.',
          'Evidence links do not grant document access or data-room visibility.',
          'No write endpoint is exposed for evidence links.'
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);
router.get(
  '/nuxera/orders/:orderId/grantor-evidence',
  authMiddleware,
  requirePermission('data_room:authorized:read'),
  async (req, res) => {
    try {
      const evidence = await getAuthorizedGrantorEvidenceLinks({
        orderId: req.params.orderId,
        userId: req.userId,
        email: req.user?.email
      });

      await logAuditEvent({
        userId: req.userId,
        action: 'nuxera_grantor_evidence_read',
        entityType: 'nuxera_evidence_links',
        orderId: req.params.orderId,
        metadata: {
          workspaceRole: 'grantor',
          requesterEmail: req.user?.email || null,
          linksCount: Array.isArray(evidence?.links) ? evidence.links.length : 0,
          persisted: Boolean(evidence?.persisted)
        },
        req,
        complianceRelevant: true
      });

      res.json({
        orderId: req.params.orderId,
        workspaceRole: 'grantor',
        evidence,
        guardrails: [
          'NU-GRA-EVID-002 exposes authorized-grantor-scoped evidence links only.',
          'Requires an accepted data_room_shares record for this order and requester.',
          'Evidence links do not grant document access or data-room visibility.',
          'No write endpoint is exposed for evidence links.'
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);
router.post(
  '/nuxera/applicant/project-builder/draft',
  authMiddleware,
  requirePermission('case:own:create'),
  async (req, res) => {
    try {
      const result = await draftProjectFromAnswers(req.body?.answers, {
        language: req.body?.language === 'en' ? 'en' : 'es',
        country: typeof req.body?.country === 'string' ? req.body.country : 'MX'
      });

      res.json({
        workspaceRole: 'applicant',
        ...result,
        guardrails: [
          'NU-APP-PROJECTBUILDER-001 genera un borrador local; no crea ni modifica ningun expediente.',
          'No aprueba credito, no garantiza fondeo ni sustituye asesoria legal, fiscal o financiera.',
          'El borrador requiere revision y edicion del solicitante antes de usarse.'
        ]
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);
router.patch(
  '/nuxera/orders/:orderId/state/:surface',
  authMiddleware,
  requirePermission('case:own:update'),
  async (req, res) => {
    try {
      if (req.params.surface !== 'checklist') {
        return res.status(400).json({ error: 'NUXERA surface no habilitada para persistencia' });
      }

      const checklist = await upsertApplicantChecklistState({
        orderId: req.params.orderId,
        userId: req.userId,
        status: req.body?.status,
        payload: req.body?.payload,
        req
      });

      res.json({
        orderId: req.params.orderId,
        workspaceRole: 'applicant',
        state: checklist
      });
    } catch (error) {
      sendNuxeraError(res, error);
    }
  }
);

export default router;
