import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { resolveWorkspaceRole } from "./navigation/roleResolver";
import NUShell from "./shell/NUShell";
import ApplicantHome from "./pages/applicant/ApplicantHome";
import GrantorHome from "./pages/grantor/GrantorHome";
import AdminHome from "./pages/admin/AdminHome";

function RoleHome({ role }) {
  if (role === "grantor") return <GrantorHome />;
  if (role === "admin") return <AdminHome />;
  return <ApplicantHome />;
}

export default function NUWorkspaceRouter({ demoMode, onExitNU }) {
  const { user } = useAuth();
  const role = resolveWorkspaceRole(user, demoMode);

  return (
    <Routes>
      <Route element={<NUShell workspaceRole={role} onExitNU={onExitNU} />}>
        <Route index element={<RoleHome role={role} />} />
        <Route path="nu/*" element={<RoleHome role={role} />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
