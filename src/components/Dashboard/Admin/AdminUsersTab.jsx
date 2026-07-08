import { error as logError } from '../../../utils/logger';
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNotification } from "../../../hooks/useNotification";
import { adminAPI } from "../../../services/api";
import { COLORS } from "../../../utils/constants";
import { uiText } from "../../../utils/runtimeCopy";

const ASSIGNABLE_ROLES = [
  "solicitante", "otorgante", "inversionista", "analista",
  "agente_interno", "compliance_officer", "auditor_interno", "administrador"
];

export default function AdminUsersTab() {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);
  const { addNotification } = useNotification();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingId, setSavingId] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await adminAPI.listUsers();
      setUsers(data.users || []);
    } catch (err) {
      logError("SVC", "No se pudo cargar el listado de usuarios", err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRoleChange = async (userId, nextRole) => {
    setSavingId(userId);
    try {
      await adminAPI.updateUserRole(userId, nextRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, profile_type: nextRole } : u)));
      addNotification(L("Rol actualizado.", "Role updated."), "success");
    } catch (err) {
      logError("SVC", "No se pudo actualizar el rol del usuario", err);
      addNotification(err.response?.data?.error || err.message, "error");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.25rem", boxShadow: COLORS.shadowSm }}>
      <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {L("Administrador", "Administrator")}
      </p>
      <h2 style={{ color: COLORS.navy, fontSize: "1.08rem", margin: "0.35rem 0 1rem" }}>
        {L("Usuarios y permisos", "Users and permissions")}
      </h2>

      {loading && <p style={{ color: COLORS.textMuted }}>{L("Cargando usuarios...", "Loading users...")}</p>}
      {error && <p style={{ color: "#C62828", fontWeight: 700 }}>{error}</p>}

      {!loading && !error && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: `2px solid ${COLORS.border}` }}>
                <th style={{ padding: "0.5rem" }}>{L("Email", "Email")}</th>
                <th style={{ padding: "0.5rem" }}>{L("Rol actual", "Current role")}</th>
                <th style={{ padding: "0.5rem" }}>{L("Creado", "Created")}</th>
                <th style={{ padding: "0.5rem" }}>{L("Cambiar rol", "Change role")}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td style={{ padding: "0.5rem" }}>{u.email}</td>
                  <td style={{ padding: "0.5rem", fontWeight: 700 }}>{u.profile_type}</td>
                  <td style={{ padding: "0.5rem", color: COLORS.textMuted }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td>
                  <td style={{ padding: "0.5rem" }}>
                    <select
                      value={u.profile_type || ""}
                      disabled={savingId === u.id}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      style={{ padding: "0.35rem 0.5rem", borderRadius: "6px", border: `1px solid ${COLORS.border}` }}
                    >
                      {ASSIGNABLE_ROLES.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={4} style={{ padding: "1rem", color: COLORS.textMuted }}>{L("Sin usuarios registrados.", "No users registered.")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
