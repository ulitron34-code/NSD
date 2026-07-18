import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { useExperience } from "../experience/ExperienceContext";
import { EXPERIENCE_VALUES } from "../experience/experienceStorage";
import NuxeraWorkspaceRouter from "../nuxera/NuxeraWorkspaceRouter";
import { COLORS } from "../utils/constants";
import NotificationCenter from "../components/NotificationCenter";
import DashboardStats from "../components/Dashboard/DashboardStats";
import RecentActivityFeed from "../components/Dashboard/RecentActivityFeed";
import GuidedSidebar from "../components/Dashboard/GuidedSidebar";
import SectionGuide, { getGuideFor } from "../components/Dashboard/SectionGuide";
import Icon from "../components/common/icons";
import SectionBackground from "../components/common/SectionBackground";
import { overlays } from "../utils/visualStyle";

import { ordersAPI, otorganteAPI } from "../services/api";
import { demoServiceOrders } from "../data/demoServiceOrders";
import { buildOtorganteAnalytics, buildOtorgantePipeline, buildOtorgantePipelineFromEntries } from "../data/otorgantePipeline";
import { buildInternationalLaunchPlan } from "../utils/localization";
import { uiText, translateCopy } from "../utils/runtimeCopy";
import { BRAND } from "../config/brand";

const MiPerfilTab = lazy(() => import("../components/Dashboard/Solicitante/MiPerfilTab"));
const FundingReadinessTab = lazy(() => import("../components/Dashboard/Solicitante/FundingReadinessTab"));
const MatchesTab = lazy(() => import("../components/Dashboard/Solicitante/MatchesTab"));
const SubirProyectoTab = lazy(() => import("../components/Dashboard/Solicitante/SubirProyectoTab"));
const CumplimientoTab = lazy(() => import("../components/Dashboard/CumplimientoTab"));
const RequirementsTab = lazy(() => import("../components/Dashboard/RequirementsTab"));
const ExpedientesTab = lazy(() => import("../components/Dashboard/ExpedientesTab"));
const MilestonesTimeline = lazy(() => import("../components/Dashboard/MilestonesTimeline"));
const ControlCenter = lazy(() => import("../components/Dashboard/ControlCenter"));
const PipelineTab = lazy(() => import("../components/Dashboard/Otorgante/PipelineTab"));
const AnalyticsTab = lazy(() => import("../components/Dashboard/Otorgante/AnalyticsTab"));
const DecisionRoomTab = lazy(() => import("../components/Dashboard/Otorgante/DecisionRoomTab"));
const ForensicAnalysisTab = lazy(() => import("../components/Dashboard/Otorgante/ForensicAnalysisTab"));
const CommitteeMemoTab = lazy(() => import("../components/Dashboard/Otorgante/CommitteeMemoTab"));
const DataRoomIndexTab = lazy(() => import("../components/Dashboard/DataRoomIndexTab"));
const TraceabilityLogTab = lazy(() => import("../components/Dashboard/TraceabilityLogTab"));
const ScoringAETab = lazy(() => import("../components/Dashboard/ScoringAETab"));
const GovernanceDisclosureTab = lazy(() => import("../components/Dashboard/GovernanceDisclosureTab"));
const PredeployGoNoGoTab = lazy(() => import("../components/Dashboard/PredeployGoNoGoTab"));
const BiometricosTab = lazy(() => import("../components/Dashboard/BiometricosTab"));
const InvestorPitchTab = lazy(() => import("../components/Dashboard/InvestorPitchTab"));
const InvestorWarRoomTab = lazy(() => import("../components/Dashboard/InvestorWarRoomTab"));
const AIAgentOpsTab = lazy(() => import("../components/Dashboard/AIAgentOpsTab"));
const PitchDemoModeTab = lazy(() => import("../components/Dashboard/PitchDemoModeTab"));
const FundraisingRoomTab = lazy(() => import("../components/Dashboard/FundraisingRoomTab"));
const TractionPilotsTab = lazy(() => import("../components/Dashboard/TractionPilotsTab"));
const CompetitiveMoatTab = lazy(() => import("../components/Dashboard/CompetitiveMoatTab"));
const InvestorQATab = lazy(() => import("../components/Dashboard/InvestorQATab"));
const InvestorOnePagerTab = lazy(() => import("../components/Dashboard/InvestorOnePagerTab"));
const PilotPlaybookTab = lazy(() => import("../components/Dashboard/PilotPlaybookTab"));
const DueDiligenceRoomTab = lazy(() => import("../components/Dashboard/DueDiligenceRoomTab"));
const ImplementationRoadmapTab = lazy(() => import("../components/Dashboard/ImplementationRoadmapTab"));
const AdminUsersTab = lazy(() => import("../components/Dashboard/Admin/AdminUsersTab"));
const AdminReferenceSourcesTab = lazy(() => import("../components/Dashboard/Admin/AdminReferenceSourcesTab"));
const AdminRubricsTab = lazy(() => import("../components/Dashboard/Admin/AdminRubricsTab"));
const AdminHumanReviewTab = lazy(() => import("../components/Dashboard/Admin/AdminHumanReviewTab"));
const AdminMetricsTab = lazy(() => import("../components/Dashboard/Admin/AdminMetricsTab"));
const ServiceOrdersPage = lazy(() => import("../pages/ServiceOrdersPage"));
const CommissionsPage = lazy(() => import("../pages/CommissionsPage"));
const DocumentIntelligenceTab = lazy(() => import("../components/Dashboard/DocumentIntelligenceTab"));
const TransactionOversightTab = lazy(() => import("../components/Dashboard/TransactionOversightTab"));
const NagmarCaseManagerTab = lazy(() => import("../components/Dashboard/NagmarCaseManagerTab"));

function DashboardLoadingFallback() {
  return (
    <div style={{
      background: COLORS.white,
      border: `1px solid ${COLORS.border}`,
      borderRadius: "10px",
      padding: "1rem",
      color: COLORS.textMuted,
      fontWeight: 700,
      boxShadow: COLORS.shadowSm,
    }}>
      Cargando modulo...
    </div>
  );
}
export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { allowedExperiences, experience, setExperience } = useExperience();
  const nuxeraEnabled = allowedExperiences.includes(EXPERIENCE_VALUES.NUXERA);
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);
  const copy = (value) => translateCopy(value, i18n.language);
  const [userMode, setUserMode] = useState(() => localStorage.getItem("nsd_demo_profile") || "solicitante");
  const [activeTab, setActiveTab] = useState("perfil");
  const [uiView, setUiView] = useState(() => {
    const stored = localStorage.getItem("nsd_ui_view");
    return stored === EXPERIENCE_VALUES.CLASSIC ? EXPERIENCE_VALUES.CLASSIC : EXPERIENCE_VALUES.CURRENT;
  });
  const [otorganteOpportunities, setOtorganteOpportunities] = useState([]);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("nsd_sidebar_collapsed") === "1");
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("nsd_sidebar_collapsed", next ? "1" : "0");
      return next;
    });
  };

  useEffect(() => {
    let active = true;

    async function loadOtorganteOrders() {
      if (userMode !== "otorgante") return;

      try {
        let mapped = [];

        if (user?.demo) {
          mapped = buildOtorgantePipeline(demoServiceOrders);
        } else {
          const { data } = await otorganteAPI.pipeline();
          mapped = buildOtorgantePipelineFromEntries(data || []);

          if (mapped.length === 0) {
            const sourceOrders = (await ordersAPI.list()).data || [];
            mapped = buildOtorgantePipeline(sourceOrders);
          }
        }

        if (active) setOtorganteOpportunities(mapped);
      } catch {
        if (active) setOtorganteOpportunities(buildOtorgantePipeline(demoServiceOrders));
      }
    }

    loadOtorganteOrders();

    return () => {
      active = false;
    };
  }, [userMode, user?.demo]);

  useEffect(() => {
    const onDemoProfileChange = (event) => {
      const mode = event.detail?.mode || localStorage.getItem("nsd_demo_profile");
      if (["solicitante", "otorgante", "nsd_admin"].includes(mode)) {
        handleModeSwitch(mode);
      }
    };

    window.addEventListener("nsd:demo-profile-change", onDemoProfileChange);
    return () => window.removeEventListener("nsd:demo-profile-change", onDemoProfileChange);
  }, []);

  const otorganteAnalytics = useMemo(() => buildOtorganteAnalytics(otorganteOpportunities), [otorganteOpportunities]);
  const topOtorganteOpportunities = useMemo(
    () => otorganteOpportunities
      .slice()
      .sort((a, b) => Number(b.averageScore || 0) - Number(a.averageScore || 0))
      .slice(0, 3),
    [otorganteOpportunities]
  );
  const internationalPlan = useMemo(() => buildInternationalLaunchPlan(), []);

  const getTabs = () => {
    if (userMode === "solicitante") {
      return [
        { id: "actividad", label: L("Panel de Actividad", "Activity Panel"), icon: "ACT" },
        { id: "perfil", label: L("Mi Perfil Financiero", "My Financial Profile"), icon: "PF" },
        { id: "readiness", label: L("Preparacion", "Readiness"), icon: "RDY" },
        { id: "subir_proyecto", label: L("Subir proyecto / IA", "Upload Project / AI"), icon: "UP" },
        { id: "data_room_index", label: L("Data Room", "Data Room"), icon: "DR" },
        { id: "document_intel", label: L("Inteligencia Doc.", "Document Intelligence"), icon: "IDI" },
        { id: "scoring_ae", label: L("Scoring A-E", "A-E Scoring"), icon: "AE" },
        { id: "cumplimiento", label: L("Cumplimiento", "Compliance"), icon: "CUM" },
        { id: "matches", label: L("Instituciones Compatibles", "Compatible Institutions"), icon: "FI" },
        { id: "expedientes", label: L("Mis Expedientes", "My Files"), icon: "EXP" },
      ];
    }
    if (userMode === "otorgante") {
      return [
        { id: "expedientes", label: L("Mis Expedientes", "My Files"), icon: "EXP" },
        { id: "command", label: L("Centro de comando", "Command Center"), icon: "CC" },
        { id: "pipeline", label: L("Oportunidades / Data room", "Opportunities / Data Room"), icon: "DR" },
        { id: "decision_room", label: L("Sala de decision 360", "360 Decision Room"), icon: "360" },
        { id: "forensic_analysis", label: L("Analisis forense", "Forensic Analysis"), icon: "FOR" },
        { id: "data_room_index", label: L("Indice Data Room", "Data Room Index"), icon: "IDX" },
        { id: "document_intel", label: L("Inteligencia Doc.", "Document Intelligence"), icon: "IDI" },
        { id: "requirements", label: L("Informacion solicitada", "Requested Information"), icon: "REQ" },
        { id: "analytics", label: L("Inteligencia y Riesgo", "Intelligence and Risk"), icon: "BI" },
        { id: "scoring_ae", label: L("Scoring A-E", "A-E Scoring"), icon: "AE" },
        { id: "committee_memo", label: L("Memo Comite", "Committee Memo"), icon: "COM" },
        { id: "biometricos", label: L("Biometricos", "Biometrics"), icon: "BIO" },
        { id: "transaction_oversight", label: L("Supervision TX", "TX Oversight"), icon: "TX" },
        { id: "nagmar_cases", label: L("NAGMAR Screening", "NAGMAR Screening"), icon: "NGM" },
      ];
    }
    return [
      { id: "one_pager", label: L("One Pager", "One Pager"), icon: "ONE" },
      { id: "investor_war_room", label: L("War Room inversion", "Investor War Room"), icon: "WAR" },
      { id: "ai_agent_ops", label: L("Agentes IA", "AI Agents"), icon: "AIA" },
      { id: "investor_view", label: L("Vista inversion", "Investor View"), icon: "INV" },
      { id: "pitch_demo", label: L("Demo 10 min", "10-min Demo"), icon: "PIT" },
      { id: "fundraising_room", label: L("Ronda", "Round"), icon: "ROU" },
      { id: "traction_pilots", label: L("Traccion", "Traction"), icon: "TRC" },
      { id: "pilot_playbook", label: L("Piloto", "Pilot"), icon: "PLT" },
      { id: "due_diligence", label: L("Due Diligence", "Due Diligence"), icon: "DD" },
      { id: "competitive_moat", label: L("Moat", "Moat"), icon: "MOT" },
      { id: "investor_qa", label: L("Q&A", "Q&A"), icon: "QA" },
      { id: "implementation_roadmap", label: L("Roadmap", "Roadmap"), icon: "MAP" },
      { id: "scoring_ae", label: L("Scoring A-E", "A-E Scoring"), icon: "AE" },
      { id: "governance", label: L("Gobernanza", "Governance"), icon: "GOV" },
      { id: "predeploy", label: L("Go/No-Go", "Go/No-Go"), icon: "GO" },
      { id: "admin_proyectos", label: L("Gestion de servicios", "Service Management"), icon: "GS" },
      { id: "admin_usuarios", label: L("Usuarios y permisos", "Users and permissions"), icon: "USR" },
      { id: "admin_fuentes", label: L("Fuentes de referencia", "Reference sources"), icon: "SRC" },
      { id: "admin_rubricas", label: L("Rúbricas", "Rubrics"), icon: "RUB" },
      { id: "admin_revision_humana", label: L("Revisión humana pendiente", "Pending human review"), icon: "REV" },
      { id: "admin_metricas", label: L("Métricas Readiness", "Readiness metrics"), icon: "MET" },
      { id: "data_room_index", label: L("Indice Data Room", "Data Room Index"), icon: "IDX" },
      { id: "traceability", label: L("Auditoria", "Audit"), icon: "AUD" },
      { id: "document_intel", label: L("Inteligencia Doc.", "Document Intelligence"), icon: "IDI" },
      { id: "admin_comisiones", label: L("Comisiones y Cierres", "Commissions and Closings"), icon: "CO" },
      { id: "biometricos", label: L("Biometricos", "Biometrics"), icon: "BIO" },
      { id: "transaction_oversight", label: L("Supervision TX", "TX Oversight"), icon: "TX" },
      { id: "nagmar_cases", label: L("NAGMAR Screening", "NAGMAR Screening"), icon: "NGM" },
    ];
  };

  const tabs = getTabs();

  const toggleUiView = () => {
    const next = uiView === EXPERIENCE_VALUES.CLASSIC ? EXPERIENCE_VALUES.CURRENT : EXPERIENCE_VALUES.CLASSIC;
    setExperience(next);
    setUiView(next);
  };

  const openNuxeraExperience = () => {
    setExperience(EXPERIENCE_VALUES.NUXERA);
    setUiView(EXPERIENCE_VALUES.NUXERA);
  };

  const exitNuxeraExperience = () => {
    setExperience(EXPERIENCE_VALUES.CURRENT);
    setUiView(EXPERIENCE_VALUES.CURRENT);
  };

  const handleModeSwitch = (mode) => {
    localStorage.setItem("nsd_demo_profile", mode);
    setUserMode(mode);
    if (mode === "solicitante") setActiveTab("perfil");
    else if (mode === "otorgante") setActiveTab("command");
    else setActiveTab("one_pager");
  };

  const renderOtorganteCommand = () => (
    <div>
      <div className="dashboard-hero" style={{
        background: "linear-gradient(135deg, #0F1F2E 0%, #1B3A5C 60%, #2A527A 100%)",
        borderRadius: "16px",
        padding: "2rem 2.5rem",
        marginBottom: "2rem",
        color: "white",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 8px 32px rgba(15,31,46,0.35)",
        gap: "1.5rem",
      }}>
        <div>
          <p style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: "0.35rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            {L("Entidad financiera / socio de capital", "Financial institution / capital partner")}
          </p>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "white", marginBottom: "0.5rem" }}>
            {L("Centro de comando de oportunidades", "Opportunity Command Center")}
          </h1>
          <p style={{ opacity: 0.75, fontSize: "0.95rem" }}>{user?.email}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{
            background: "rgba(46,125,50,0.18)",
            border: "1px solid rgba(46,125,50,0.4)",
            borderRadius: "12px",
            padding: "1rem 1.5rem",
          }}>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.75rem", marginBottom: "0.25rem" }}>{L("Exposicion de riesgo", "Risk Exposure")}</p>
            <p style={{ color: "#9BE29B", fontWeight: 700, fontSize: "1.1rem" }}>{L("Controlada", "Controlled")}</p>
          </div>
        </div>
      </div>

      <DashboardStats />

      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
        <p style={{ color: COLORS.textMuted, fontSize: "0.72rem", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.35rem" }}>
          {L("Como se alimenta este centro", "How this center is powered")}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem" }}>
          {[
            ["Pipeline", user?.demo ? L("Datos demo locales enriquecidos", "Enriched local demo data") : "Supabase: otorganteAPI.pipeline()"],
            ["AI Engine", L("score, semaforo, faltantes, hallazgos y memo ejecutivo", "score, traffic light, gaps, findings and executive memo")],
            ["Data room", L("documentos, permisos, shares, evidencias y requerimientos", "documents, permissions, shares, evidence and requests")],
            [L("Acciones", "Actions"), L("registrar interes, pedir informacion, solicitar contacto y preparar comite", "register interest, request information, request contact and prepare committee")]
          ].map(([label, value]) => (
            <div key={label} style={{ padding: "0.8rem", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: "8px" }}>
              <p style={{ color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "0.25rem" }}>{label}</p>
              <p style={{ color: COLORS.navy, fontSize: "0.84rem", fontWeight: 800, lineHeight: 1.4 }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: "1.5rem", background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.2rem", boxShadow: COLORS.shadowSm }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap", marginBottom: "1rem" }}>
          <div>
            <p style={{ color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.35rem" }}>
              {L("Flujo accionable del otorgante", "Actionable funder flow")}
            </p>
            <h2 style={{ color: COLORS.navy, fontSize: "1.1rem" }}>
              {L("De oportunidad a decision interna", "From opportunity to internal decision")}
            </h2>
          </div>
          <button type="button" onClick={() => setActiveTab("pipeline")} style={{ padding: "0.7rem 1rem", borderRadius: "6px", border: "none", background: COLORS.gold, color: COLORS.navy, fontWeight: 900, cursor: "pointer" }}>
            {L("Abrir pipeline", "Open pipeline")}
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "0.75rem" }}>
          {[
            [L("Ver data room", "View data room"), L("Documentos, score, hallazgos y estado del expediente.", "Documents, score, findings and file status.")],
            [L("Pedir informacion", "Request information"), L("Requerimientos trazables con evidencia y responsable.", "Traceable requests with evidence and owner.")],
            [L("Registrar interes", "Register interest"), L("Marca apetito institucional antes de abrir contacto.", "Marks institutional appetite before opening contact.")],
            [L("Preparar comite", "Prepare committee"), L("Memo ejecutivo y resumen de riesgos para revision interna.", "Executive memo and risk summary for internal review.")],
          ].map(([title, detail]) => (
            <div key={title} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.9rem" }}>
              <strong style={{ display: "block", color: COLORS.navy, fontSize: "0.86rem", marginBottom: "0.25rem" }}>{title}</strong>
              <p style={{ color: COLORS.textMuted, fontSize: "0.78rem", lineHeight: 1.45 }}>{detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-two-column" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginTop: "1.5rem" }}>
        <RecentActivityFeed />
        <div className="card">
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: COLORS.navy, marginBottom: "1.25rem", letterSpacing: "0.03em" }}>
            {L("TAREAS CRITICAS", "CRITICAL TASKS")}
          </h2>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {[
              { label: L("Oportunidades por revisar", "Opportunities to Review"), value: String(otorganteAnalytics.total), color: COLORS.amber },
              { label: L("Data rooms abiertos", "Open Data Rooms"), value: String(otorganteAnalytics.dataRooms), color: COLORS.amber },
              { label: L("Prospectos en riesgo alto", "High-Risk Prospects"), value: String(otorganteAnalytics.highRisk), color: "#C62828" },
              { label: L("Reportes listos para comite", "Reports Ready for Committee"), value: String(otorganteAnalytics.offers), color: COLORS.green },
            ].map((stat) => (
              <div key={stat.label} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.875rem 1rem",
                background: COLORS.bg,
                borderRadius: "8px",
              }}>
                <p style={{ color: COLORS.text, fontWeight: 500, fontSize: "0.9rem" }}>{stat.label}</p>
                <p style={{ color: stat.color, fontWeight: 800, fontSize: "1.3rem" }}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: "1.5rem", display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(300px, 0.9fr)", gap: "1.5rem" }}>
        <div className="card">
          <h2 style={{ fontSize: "1rem", fontWeight: 800, color: COLORS.navy, marginBottom: "1rem", letterSpacing: "0.03em" }}>
            {L("OPORTUNIDADES PRIORITARIAS", "PRIORITY OPPORTUNITIES")}
          </h2>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {topOtorganteOpportunities.length ? topOtorganteOpportunities.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab("pipeline")}
                style={{
                  width: "100%",
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "0.8rem",
                  alignItems: "center",
                  textAlign: "left",
                  padding: "0.9rem 1rem",
                  background: COLORS.bg,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                <span>
                  <strong style={{ display: "block", color: COLORS.navy, fontSize: "0.92rem", marginBottom: "0.2rem" }}>{copy(item.name)}</strong>
                  <span style={{ display: "block", color: COLORS.textMuted, fontSize: "0.78rem" }}>{copy(item.sector)} / {item.amountLabel} / {copy(item.readinessLevel)}</span>
                </span>
                <span style={{ color: item.risk === "Bajo" ? COLORS.green : item.risk === "Medio" ? COLORS.amber : "#C62828", fontWeight: 900 }}>
                  {item.averageScore}/100
                </span>
              </button>
            )) : (
              <p style={{ color: COLORS.textMuted }}>{L("No hay oportunidades cargadas.", "No opportunities loaded.")}</p>
            )}
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: "1rem", fontWeight: 800, color: COLORS.navy, marginBottom: "1rem", letterSpacing: "0.03em" }}>
            {L("FLUJO DEL OTORGANTE", "FUNDER WORKFLOW")}
          </h2>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {[
              ["1", L("Revisar pipeline", "Review pipeline"), L("Filtrar por apetito, ticket, riesgo y preparacion.", "Filter by appetite, ticket size, risk and readiness.")],
              ["2", L("Abrir data room", "Open data room"), L("Consultar documentos, score y reporte ejecutivo.", "Review documents, score and executive report.")],
              ["3", L("Pedir informacion", "Request information"), L("Solicitar aclaraciones con evidencia trazable.", "Request clarifications with traceable evidence.")],
              ["4", L("Comite / contacto", "Committee / contact"), L("Generar memo y pedir contacto autorizado.", "Generate memo and request authorized contact.")]
            ].map(([num, title, detail]) => (
              <div key={title} style={{ display: "grid", gridTemplateColumns: "32px 1fr", gap: "0.75rem", alignItems: "start" }}>
                <span style={{ width: "30px", height: "30px", borderRadius: "50%", background: COLORS.gold, color: COLORS.navy, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>{num}</span>
                <span>
                  <strong style={{ display: "block", color: COLORS.navy, fontSize: "0.88rem" }}>{title}</strong>
                  <span style={{ color: COLORS.textMuted, fontSize: "0.78rem", lineHeight: 1.45 }}>{detail}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 800, color: COLORS.navy, marginBottom: "1rem", letterSpacing: "0.03em" }}>
          {L("CAPA INTERNACIONAL", "INTERNATIONAL LAYER")}
        </h2>
        <p style={{ color: COLORS.textMuted, fontSize: "0.85rem", lineHeight: 1.6, marginBottom: "1rem" }}>
          {L("Esta seccion viene del analisis de implementacion internacional. Sirve para preparar el producto por mercados sin lanzar todo a la vez.", "This section comes from the international implementation analysis. It prepares the product by markets without launching everything at once.")}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.8rem" }}>
          {internationalPlan.map((item) => (
            <div key={item.phase} style={{ padding: "1rem", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: "8px" }}>
              <p style={{ color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "0.25rem" }}>{item.status}</p>
              <h3 style={{ color: COLORS.navy, fontSize: "0.98rem", marginBottom: "0.25rem" }}>{item.phase}</h3>
              <p style={{ color: COLORS.navy, fontWeight: 900, fontSize: "0.85rem", marginBottom: "0.45rem" }}>{item.markets}</p>
              <p style={{ color: COLORS.textMuted, fontSize: "0.78rem", lineHeight: 1.45 }}>{item.scope}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    // Tabs compartidos
    if (activeTab === "expedientes") return <ExpedientesTab />;
    if (activeTab === "timeline") return <MilestonesTimeline />;
    if (activeTab === "actividad") return <ControlCenter />;
    if (activeTab === "data_room_index") return <DataRoomIndexTab />;
    if (activeTab === "scoring_ae") return <ScoringAETab />;
    if (activeTab === "biometricos") return <BiometricosTab />;
    if (activeTab === "document_intel") return <DocumentIntelligenceTab />;
    if (activeTab === "nagmar_cases") return <NagmarCaseManagerTab />;

    if (userMode === "solicitante") {
      if (activeTab === "readiness") return <FundingReadinessTab />;
      if (activeTab === "subir_proyecto") return <SubirProyectoTab />;
      if (activeTab === "cumplimiento") return <CumplimientoTab onGoToPreparacion={() => setActiveTab("readiness")} />;
      if (activeTab === "matches") return <MatchesTab />;
      return <MiPerfilTab />;
    }

    if (userMode === "otorgante") {
      if (activeTab === "pipeline") return <PipelineTab />;
      if (activeTab === "decision_room") return <DecisionRoomTab />;
      if (activeTab === "forensic_analysis") return <ForensicAnalysisTab />;
      if (activeTab === "requirements") return <RequirementsTab />;
      if (activeTab === "analytics") return <AnalyticsTab />;
      if (activeTab === "committee_memo") return <CommitteeMemoTab />;
      if (activeTab === "transaction_oversight") return <TransactionOversightTab />;
      return renderOtorganteCommand();
    }

    if (activeTab === "one_pager") return <InvestorOnePagerTab />;
    if (activeTab === "investor_war_room") return <InvestorWarRoomTab />;
    if (activeTab === "ai_agent_ops") return <AIAgentOpsTab />;
    if (activeTab === "investor_view") return <InvestorPitchTab />;
    if (activeTab === "pitch_demo") return <PitchDemoModeTab />;
    if (activeTab === "fundraising_room") return <FundraisingRoomTab />;
    if (activeTab === "traction_pilots") return <TractionPilotsTab />;
    if (activeTab === "pilot_playbook") return <PilotPlaybookTab />;
    if (activeTab === "due_diligence") return <DueDiligenceRoomTab />;
    if (activeTab === "competitive_moat") return <CompetitiveMoatTab />;
    if (activeTab === "investor_qa") return <InvestorQATab />;
    if (activeTab === "implementation_roadmap") return <ImplementationRoadmapTab />;
    if (activeTab === "governance") return <GovernanceDisclosureTab />;
    if (activeTab === "predeploy") return <PredeployGoNoGoTab />;
    if (activeTab === "traceability") return <TraceabilityLogTab />;
    if (activeTab === "admin_usuarios") return <AdminUsersTab />;
    if (activeTab === "admin_fuentes") return <AdminReferenceSourcesTab />;
    if (activeTab === "admin_rubricas") return <AdminRubricsTab />;
    if (activeTab === "admin_revision_humana") return <AdminHumanReviewTab />;
    if (activeTab === "admin_metricas") return <AdminMetricsTab />;
    if (activeTab === "admin_comisiones") return <CommissionsPage />;
    if (activeTab === "transaction_oversight") return <TransactionOversightTab />;
    return <ServiceOrdersPage />;
  };

  if (experience === EXPERIENCE_VALUES.NUXERA) {
    return <NuxeraWorkspaceRouter demoMode={userMode} onExit={exitNuxeraExperience} />;
  }

  const railWidth = "76px";
  const fullWidth = "260px";
  const sidebarOpen = isMobile ? mobileNavOpen : true;
  const sidebarCollapsed = !isMobile && collapsed;

  return (
    <div className="dashboard-shell" style={{ display: "flex", minHeight: "calc(100vh - 72px)", position: "relative" }}>
      {isMobile && (
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          title={L("Abrir menu", "Open menu")}
          style={{
            position: "fixed",
            top: "84px",
            left: "1rem",
            zIndex: 210,
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            background: "#1B3A5C",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "white",
            display: mobileNavOpen ? "none" : "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: COLORS.shadowMd,
          }}
        >
          <Icon name="chevronsRight" size={18} color="white" />
        </button>
      )}

      {isMobile && mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 199 }}
        />
      )}

      <aside className="dashboard-sidebar" style={{
        width: sidebarCollapsed ? railWidth : fullWidth,
        background: "linear-gradient(180deg, #0F1F2E 0%, #1B3A5C 100%)",
        padding: sidebarCollapsed ? "1.5rem 0.75rem" : "2rem 1.25rem",
        position: isMobile ? "fixed" : "sticky",
        top: isMobile ? 0 : "72px",
        left: 0,
        bottom: isMobile ? 0 : "auto",
        height: isMobile ? "100vh" : "auto",
        maxHeight: isMobile ? "100vh" : "calc(100vh - 72px)",
        overflowY: "auto",
        overflowX: "hidden",
        flexShrink: 0,
        zIndex: 200,
        transition: "width 0.25s ease, padding 0.25s ease, transform 0.25s ease",
        transform: isMobile ? (sidebarOpen ? "translateX(0)" : "translateX(-100%)") : "none",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: sidebarCollapsed ? "center" : "space-between",
          marginBottom: "1rem",
        }}>
          {!sidebarCollapsed && (
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {BRAND.name}
            </span>
          )}
          <button
            type="button"
            onClick={isMobile ? () => setMobileNavOpen(false) : toggleCollapsed}
            title={isMobile ? L("Cerrar menu", "Close menu") : (collapsed ? L("Expandir menu", "Expand menu") : L("Contraer menu", "Collapse menu"))}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <Icon name={isMobile || !collapsed ? "chevronsLeft" : "chevronsRight"} size={16} color="rgba(255,255,255,0.7)" />
          </button>
        </div>

        <div style={{
          padding: sidebarCollapsed ? "0.75rem 0.5rem" : "1.25rem",
          background: "rgba(255,255,255,0.06)",
          borderRadius: "14px",
          marginBottom: "1.75rem",
          border: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          flexDirection: "column",
          alignItems: sidebarCollapsed ? "center" : "stretch",
        }}>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #C9A84C, #E4C878)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: "1rem",
            color: "#1B3A5C",
            marginBottom: sidebarCollapsed ? 0 : "0.75rem",
            flexShrink: 0,
          }} title={user?.email}>
            {user?.email?.[0]?.toUpperCase() || "U"}
          </div>
          {!sidebarCollapsed && (
            <>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", marginBottom: "0.2rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {userMode === "solicitante" ? L("Empresa Solicitante", "Applicant Company") : userMode === "otorgante" ? L("Fondo / institucion", "Fund / Institution") : `${BRAND.name} Admin`}
              </p>
              <p style={{ color: "white", fontWeight: 600, fontSize: "0.82rem", wordBreak: "break-word" }}>{user?.email}</p>
            </>
          )}
        </div>

        {!sidebarCollapsed && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: "0.5rem", marginBottom: "0.75rem" }}>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>
              {L("Navegacion", "Navigation")}
            </p>
            <button
              type="button"
              onClick={toggleUiView}
              title={L("Cambiar de vista sin perder nada", "Switch views without losing anything")}
              style={{
                padding: "0.3rem 0.6rem",
                fontSize: "0.68rem",
                fontWeight: 800,
                borderRadius: "999px",
                background: "rgba(201,168,76,0.18)",
                color: COLORS.goldLight,
                border: "1px solid rgba(201,168,76,0.4)",
                cursor: "pointer",
              }}
            >
              {uiView === "classic" ? L("Vista nueva", "New view") : L("Vista clasica", "Classic view")}
            </button>
          </div>
        )}

        {!sidebarCollapsed && nuxeraEnabled && (
          <button
            type="button"
            onClick={openNuxeraExperience}
            title={L("Abrir experiencia NUXERA", "Open NUXERA experience")}
            style={{
              width: "100%",
              marginBottom: "0.75rem",
              padding: "0.7rem 0.85rem",
              fontSize: "0.8rem",
              fontWeight: 900,
              borderRadius: "8px",
              background: "rgba(201,168,76,0.24)",
              color: COLORS.goldLight,
              border: "1px solid rgba(201,168,76,0.48)",
              cursor: "pointer",
            }}
          >
            NUXERA
          </button>
        )}

        {uiView === "classic" ? (
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                title={sidebarCollapsed ? tab.label : undefined}
                className={`sidebar-tab ${activeTab === tab.id ? "active" : ""}`}
                style={sidebarCollapsed ? { justifyContent: "center", padding: "0.6rem" } : undefined}
              >
                <span style={{ fontSize: "0.78rem", marginRight: sidebarCollapsed ? 0 : "0.5rem", fontWeight: 800 }}>{tab.icon}</span>
                {!sidebarCollapsed && (
                  <span style={{ fontSize: "0.85rem", minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.25 }}>{tab.label}</span>
                )}
              </button>
            ))}
          </nav>
        ) : (
          <GuidedSidebar tabs={tabs} activeTab={activeTab} onSelect={setActiveTab} userMode={userMode} L={L} collapsed={sidebarCollapsed} />
        )}

        <div style={{ paddingTop: "2rem" }}>
          <div style={{ height: "1px", background: "rgba(255,255,255,0.08)", marginBottom: "1rem" }} />
          {!sidebarCollapsed && (
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", paddingLeft: "0.5rem", marginBottom: "0.75rem" }}>
              {L("Cambiar perfil demo", "Switch demo profile")}
            </p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.25rem" }}>
            {[
              ["solicitante", L("Solicitante", "Applicant"), "S"],
              ["otorgante", L("Otorgante", "Funding Provider"), "O"],
              ["nsd_admin", `${BRAND.name} Admin`, "N"],
            ].map(([mode, label, initial]) => (
              <button
                key={mode}
                type="button"
                onClick={() => handleModeSwitch(mode)}
                title={sidebarCollapsed ? label : undefined}
                style={{
                  width: "100%",
                  padding: sidebarCollapsed ? "0.6rem" : "0.72rem 0.85rem",
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  borderRadius: "6px",
                  background: userMode === mode ? "linear-gradient(135deg, #C9A84C, #F3E8A6)" : "rgba(255,255,255,0.08)",
                  color: userMode === mode ? COLORS.navy : "rgba(255,255,255,0.86)",
                  border: userMode === mode ? "none" : "1px solid rgba(255,255,255,0.08)",
                  cursor: "pointer",
                  textAlign: "center",
                  lineHeight: 1.2,
                }}
              >
                {sidebarCollapsed ? initial : label}
              </button>
            ))}
          </div>
          <div style={{ height: "1px", background: "rgba(255,255,255,0.08)", marginBottom: "1rem" }} />
          <button
            onClick={() => {
              logout();
            }}
            title={sidebarCollapsed ? L("Cerrar sesion", "Sign out") : undefined}
            style={{
              width: "100%",
              padding: sidebarCollapsed ? "0.6rem" : "0.75rem",
              fontSize: "0.85rem",
              fontWeight: 700,
              borderRadius: "4px",
              background: "rgba(198, 40, 40, 0.2)",
              color: "#FF6B6B",
              border: `1px solid #FF6B6B`,
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(198, 40, 40, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "rgba(198, 40, 40, 0.2)";
            }}
          >
            <Icon name="logout" size={15} color="#FF6B6B" />
            {!sidebarCollapsed && L("Cerrar sesion", "Sign out")}
          </button>
        </div>
      </aside>

      <main className="dashboard-main" style={{
        flex: 1,
        padding: "2rem",
        background: "var(--bg)",
        overflowY: "auto",
        minWidth: 0,
        position: "relative",
      }}>
        <SectionBackground image="/dashboard-bg.jpg" overlay={overlays.creamSoft} />
        <div style={{
          position: "absolute",
          top: "2rem",
          right: "2rem",
          zIndex: 100,
        }}>
          <NotificationCenter userId={user?.id || 'current-user'} />
        </div>
        <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative", zIndex: 3 }}>
          {uiView === "new" && <SectionGuide {...(getGuideFor(activeTab, userMode, L) || {})} />}
          <Suspense fallback={<DashboardLoadingFallback />}>
            {renderContent()}
          </Suspense>
        </div>
      </main>
    </div>
  );
}



