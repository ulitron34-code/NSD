import { error, debug, info, warn } from '../../utils/logger';
import React from "react";
import { COLORS } from "../../utils/constants";
import { useTranslation } from "react-i18next";
import { translateCopy } from "../../utils/runtimeCopy";
import { demoAuditLog } from "../../data/demoAuditLog";

export default function RecentActivityFeed() {
  const { i18n } = useTranslation();
  const copy = (val) => translateCopy(val, i18n.language);

  const statusMap = {
    success: COLORS.green,
    warning: COLORS.amber,
    neutral: COLORS.navy,
  };

  return (
    <div style={{
      background: COLORS.white,
      padding: "2rem",
      borderRadius: "10px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ color: COLORS.navy, fontSize: "1.2rem", marginBottom: "0.25rem" }}>
            {copy("Bitacora de auditoria")}
          </h2>
          <p style={{ color: COLORS.textMuted, fontSize: "0.86rem" }}>
            {copy("Eventos recientes con actor, accion y evidencia.")}
          </p>
        </div>
        <span style={{
          background: COLORS.goldPale,
          color: COLORS.amber,
          borderRadius: "999px",
          padding: "0.35rem 0.75rem",
          fontWeight: 800,
          fontSize: "0.75rem",
        }}>
          DEMO
        </span>
      </div>

      <div style={{ display: "grid", gap: "1rem" }}>
        {demoAuditLog.map((activity) => (
          <div key={activity.id} style={{
            display: "grid",
            gridTemplateColumns: "12px 1fr auto",
            gap: "1rem",
            padding: "1rem",
            background: COLORS.bg,
            borderRadius: "8px",
            alignItems: "center",
          }}>
            <div style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: statusMap[activity.status],
            }} />

            <div>
              <p style={{ color: COLORS.navy, fontWeight: 800, marginBottom: "0.25rem" }}>
                {copy(activity.title)}
              </p>
              <p style={{ color: COLORS.textMuted, fontSize: "0.9rem", marginBottom: "0.25rem" }}>
                {copy(activity.description)}
              </p>
              <p style={{ color: COLORS.textMuted, fontSize: "0.78rem" }}>
                {copy("Actor")}: {copy(activity.actor)}
              </p>
            </div>

            <p style={{ color: COLORS.textMuted, fontSize: "0.8rem", whiteSpace: "nowrap" }}>
              {copy(activity.timestamp)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
