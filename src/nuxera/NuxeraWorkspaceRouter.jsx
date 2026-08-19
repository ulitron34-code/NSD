import React from "react";
import { useTranslation } from "react-i18next";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { isNuxeraRoleEnabled } from "../experience/experienceFlags";
import { uiText } from "../utils/runtimeCopy";
import DocumentIntelligenceAdapter from "./adapters/DocumentIntelligenceAdapter";
import AdminWorkspaceAdapter from "./adapters/AdminWorkspaceAdapter";
import FinanceWorkspaceAdapter from "./adapters/FinanceWorkspaceAdapter";
import MarketsWorkspace from "./adapters/MarketsWorkspace";
import StrategyWorkspace from "./adapters/StrategyWorkspace";
import { NuxeraExpedientProvider } from "./context/NuxeraExpedientContext";
import { resolveNuxeraRole } from "./navigation/roleResolver";
import NuxeraHome from "./pages/NuxeraHome";
import { resolveNuxeraSection } from "./sections/sectionRegistry";
import NuxeraShell from "./shell/NuxeraShell";

function RoleDisabledNotice({ onExit }) {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);
  return (
    <div style={{ padding: "3rem", textAlign: "center" }}>
      <h1>{L("Esta vista NUXERA no esta habilitada todavia", "This NUXERA view is not enabled yet")}</h1>
      <p>{L("El equipo la activara por fases mediante feature flags.", "The team will roll it out in phases via feature flags.")}</p>
      <button type="button" onClick={onExit}>{L("Volver a vista actual", "Return to current view")}</button>
    </div>
  );
}

function RoleWorkspace({ role }) {
  const { section = "home" } = useParams();
  const resolvedSection = resolveNuxeraSection(section);

  if (role === "admin" && ["operations", "security", "ai", "system"].includes(section)) {
    return <AdminWorkspaceAdapter section={section} />;
  }

  if (role === "applicant" && ["markets", "strategy"].includes(section)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (resolvedSection?.adapter === "finance-workspace") {
    return <FinanceWorkspaceAdapter role={role} />;
  }

  if (resolvedSection?.adapter === "markets-workspace") {
    return <MarketsWorkspace role={role} />;
  }

  if (resolvedSection?.adapter === "strategy-workspace") {
    return <StrategyWorkspace role={role} />;
  }

  if (resolvedSection?.adapter === "document-intelligence") {
    return <DocumentIntelligenceAdapter role={role} />;
  }

  return <NuxeraHome role={role} section={section} />;
}

export default function NuxeraWorkspaceRouter({ demoMode, onExit }) {
  const { user } = useAuth();
  const [selectedDemoMode, setSelectedDemoMode] = React.useState(demoMode || "solicitante");
  const role = resolveNuxeraRole(user, selectedDemoMode);

  if (!isNuxeraRoleEnabled(role)) {
    return <RoleDisabledNotice onExit={onExit} />;
  }

  return (
    <NuxeraExpedientProvider role={role}>
      {/* Selector de Vistas para Testing */}
      <div style={{
        position: "fixed",
        top: "80px",
        right: "20px",
        zIndex: 1000,
        background: "white",
        padding: "0.75rem",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        border: "1px solid #e0e0e0"
      }}>
        <label style={{ fontSize: "0.85rem", fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>
          Vista Actual:
        </label>
        <select
          value={selectedDemoMode}
          onChange={(e) => setSelectedDemoMode(e.target.value)}
          style={{
            padding: "0.5rem",
            borderRadius: "4px",
            border: "1px solid #ccc",
            fontSize: "0.9rem",
            cursor: "pointer",
            width: "100%"
          }}
        >
          <option value="solicitante">Solicitante</option>
          <option value="otorgante">Otorgante</option>
          <option value="nsd_admin">Admin</option>
        </select>
      </div>

      <Routes>
      <Route element={<NuxeraShell workspaceRole={role} onExit={onExit} />}>
        <Route index element={<RoleWorkspace role={role} />} />
        <Route path="nuxera/:section" element={<RoleWorkspace role={role} />} />
        <Route path="nuxera" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
      </Routes>
    </NuxeraExpedientProvider>
  );
}
