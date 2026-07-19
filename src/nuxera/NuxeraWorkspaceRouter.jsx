import React from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
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

function RoleWorkspace({ role }) {
  const { section = "home" } = useParams();
  const resolvedSection = resolveNuxeraSection(section);

  if (role === "admin" && ["operations", "security", "ai", "system"].includes(section)) {
    return <AdminWorkspaceAdapter section={section} />;
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
  const role = resolveNuxeraRole(user, demoMode);

  return (
    <NuxeraExpedientProvider role={role}>
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
