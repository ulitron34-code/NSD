import React from "react";
import { COLORS } from "../../utils/constants";

// Mismos valores de severidad que backend/src/agents/agentRiskScorer.js
// (SEVERITY_POINTS) -- unifica 'critical'/'high'/'error'/'medium'/'warning'/
// 'low'/'info' en 4 cubetas visuales, ordenadas de mayor a menor severidad.
const SEVERITY_BUCKETS = [
  { key: "critical", label: "Crítica", color: "#8E0000", severities: ["critical"] },
  { key: "high", label: "Alta", color: "#C62828", severities: ["high", "error"] },
  { key: "medium", label: "Media", color: COLORS.amber || "#B8860B", severities: ["medium", "warning"] },
  { key: "low", label: "Baja", color: COLORS.textMuted, severities: ["low", "info"] },
];

function bucketFor(severidad) {
  return SEVERITY_BUCKETS.find((bucket) => bucket.severities.includes(severidad)) || SEVERITY_BUCKETS[2];
}

// Agrupa banderas rojas estructuradas ({ pilar, rule_code, severidad,
// hallazgo, documento }) por severidad, para no repetir el patrón de lista
// plana sin orden que ya existía en ServiceOrderDetailPanel.jsx.
export default function RedFlagsPanel({ redFlags }) {
  if (!redFlags?.length) return null;

  const grouped = SEVERITY_BUCKETS.map((bucket) => ({
    ...bucket,
    flags: redFlags.filter((flag) => bucketFor(flag.severidad).key === bucket.key),
  })).filter((group) => group.flags.length > 0);

  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      {grouped.map((group) => (
        <div key={group.key} style={{ border: `1px solid ${COLORS.border}`, borderRadius: "8px", overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0.4rem 0.65rem",
              background: group.color,
            }}
          >
            <span style={{ color: "white", fontWeight: 900, fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Severidad {group.label}
            </span>
            <span style={{ color: "white", fontWeight: 900, fontSize: "0.68rem" }}>{group.flags.length}</span>
          </div>
          <div style={{ display: "grid", gap: "0.4rem", padding: "0.55rem 0.65rem" }}>
            {group.flags.map((flag, index) => (
              <div key={`${group.key}-${flag.rule_code}-${index}`} style={{ display: "flex", justifyContent: "space-between", gap: "0.65rem", alignItems: "flex-start" }}>
                <p style={{ color: COLORS.navy, fontSize: "0.74rem", lineHeight: 1.35, margin: 0 }}>
                  [{flag.pilar}] {flag.hallazgo}
                </p>
                {flag.documento && (
                  <span style={{ color: COLORS.textMuted, fontSize: "0.66rem", whiteSpace: "nowrap" }}>{flag.documento}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
