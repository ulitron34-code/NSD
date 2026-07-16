import React from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import DocumentIntelligenceAdapter from "./adapters/DocumentIntelligenceAdapter";
import FinanceWorkspaceAdapter from "./adapters/FinanceWorkspaceAdapter";
import { resolveNuxeraRole } from "./navigation/roleResolver";
import NuxeraHome from "./pages/NuxeraHome";
import { resolveNuxeraSection } from "./sections/sectionRegistry";
import NuxeraShell from "./shell/NuxeraShell";

function RoleWorkspace({ role }) {
  const { section = "home" } = useParams();
  const resolvedSection = resolveNuxeraSection(section);

  if (resolvedSection?.adapter === "finance-workspace") {
    return <FinanceWorkspaceAdapter role={role} />;
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
    <Routes>
      <Route element={<NuxeraShell workspaceRole={role} onExit={onExit} />}>
        <Route index element={<RoleWorkspace role={role} />} />
        <Route path="nuxera/:section" element={<RoleWorkspace role={role} />} />
        <Route path="nuxera" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}