import React, { useState } from "react";
import { COLORS } from "../../utils/constants";
import Icon from "../common/icons";

const GROUPS_BY_ROLE = {
  solicitante: [
    { id: "preparacion", title: (L) => L("Preparacion", "Preparation"), tabIds: ["perfil", "readiness", "subir_proyecto", "data_room_index"] },
    { id: "revision", title: (L) => L("Revision y Cumplimiento", "Review and Compliance"), tabIds: ["document_intel", "scoring_ae", "cumplimiento"] },
    { id: "expedientes_grupo", title: (L) => L("Mis Expedientes", "My Files"), tabIds: ["expedientes"] },
    { id: "instituciones", title: (L) => L("Instituciones Compatibles", "Compatible Institutions"), tabIds: ["matches"] },
    { id: "actividad_grupo", title: (L) => L("Panel de Actividad", "Activity Panel"), tabIds: ["actividad"] },
  ],
  otorgante: [
    { id: "resumen", title: (L) => L("Resumen", "Overview"), tabIds: ["command", "expedientes"] },
    { id: "intake", title: (L) => L("Revision de Oportunidad", "Deal Review"), tabIds: ["pipeline", "data_room_index", "document_intel"] },
    { id: "validacion", title: (L) => L("Validacion", "Validation"), tabIds: ["forensic_analysis", "scoring_ae", "analytics"] },
    { id: "decision", title: (L) => L("Decision", "Decision"), tabIds: ["decision_room", "requirements", "committee_memo"] },
    { id: "operacion", title: (L) => L("Operacion", "Operations"), tabIds: ["biometricos", "transaction_oversight", "nagmar_cases"] },
  ],
  nsd_admin: [
    { id: "operaciones", title: (L) => L("Operaciones", "Operations"), tabIds: ["admin_proyectos", "scoring_ae", "data_room_index", "document_intel", "traceability", "admin_comisiones", "biometricos", "transaction_oversight", "nagmar_cases"] },
    { id: "gobernanza", title: (L) => L("Gobernanza y Config", "Governance and Config"), tabIds: ["governance", "predeploy"] },
    { id: "pilotos", title: (L) => L("Pilotos", "Pilots"), tabIds: ["traction_pilots", "pilot_playbook", "due_diligence"] },
    { id: "inversion", title: (L) => L("Inversion", "Investor Relations"), tabIds: ["one_pager", "investor_war_room", "investor_view", "pitch_demo", "fundraising_room", "competitive_moat", "investor_qa", "implementation_roadmap"] },
    { id: "producto", title: (L) => L("Producto / IA", "Product / AI"), tabIds: ["ai_agent_ops"] },
  ],
};

export default function GuidedSidebar({ tabs, activeTab, onSelect, userMode, L, collapsed = false }) {
  const groups = GROUPS_BY_ROLE[userMode] || [];
  // Tracks collapsed group ids instead of open ones, so switching roles (new group ids)
  // always defaults to "open" without needing to reset state on userMode change.
  const [closedGroups, setClosedGroups] = useState(() => new Set());

  if (import.meta.env.DEV) {
    const groupedIds = new Set(groups.flatMap((group) => group.tabIds));
    const knownIds = new Set(tabs.map((tab) => tab.id));
    const missing = tabs.filter((tab) => !groupedIds.has(tab.id));
    const extra = [...groupedIds].filter((id) => !knownIds.has(id));
    if (missing.length > 0) {
      console.warn("[GuidedSidebar] Tabs sin grupo asignado:", missing.map((t) => t.id));
    }
    if (extra.length > 0) {
      console.warn("[GuidedSidebar] Ids agrupados que ya no existen en tabs:", extra);
    }
  }

  const tabsById = Object.fromEntries(tabs.map((tab) => [tab.id, tab]));
  const toggleGroup = (groupId) => {
    setClosedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  return (
    <nav style={{ display: "flex", flexDirection: "column", gap: collapsed ? "0.9rem" : "0.5rem" }}>
      {groups.map((group, index) => {
        const isOpen = collapsed || !closedGroups.has(group.id);
        const groupTabs = group.tabIds.map((id) => tabsById[id]).filter(Boolean);
        if (groupTabs.length === 0) return null;

        return (
          <div key={group.id}>
            {collapsed ? (
              <div title={group.title(L)} style={{
                width: "22px", height: "22px", borderRadius: "50%",
                background: COLORS.gold, color: COLORS.navy,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 900, fontSize: "0.72rem", margin: "0 auto 0.4rem",
              }}>
                {index + 1}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  padding: "0.5rem 0.5rem",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  background: COLORS.gold,
                  color: COLORS.navy,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: "0.72rem",
                  flexShrink: 0,
                }}>
                  {index + 1}
                </span>
                <span style={{
                  flex: 1,
                  color: "rgba(255,255,255,0.55)",
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}>
                  {group.title(L)}
                </span>
                <Icon name={isOpen ? "chevronDown" : "chevronRight"} size={12} color="rgba(255,255,255,0.35)" />
              </button>
            )}

            {isOpen && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", paddingLeft: collapsed ? 0 : "0.5rem" }}>
                {groupTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => onSelect(tab.id)}
                    title={collapsed ? tab.label : undefined}
                    className={`sidebar-tab ${activeTab === tab.id ? "active" : ""}`}
                    style={collapsed ? { justifyContent: "center", padding: "0.6rem" } : undefined}
                  >
                    <span style={{ fontSize: "0.78rem", marginRight: collapsed ? 0 : "0.5rem", fontWeight: 800 }}>{tab.icon}</span>
                    {!collapsed && (
                      <span style={{ fontSize: "0.85rem", minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.25 }}>{tab.label}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
