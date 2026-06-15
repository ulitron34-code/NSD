import React from "react";
import { COLORS } from "../../utils/constants";

function getStatusConfig(canPublish) {
  if (canPublish) {
    return {
      label: "Verde",
      title: "Expediente listo para presentacion",
      color: COLORS.green,
      background: "rgba(46, 125, 50, 0.08)",
    };
  }

  return {
    label: "Rojo",
    title: "Pendiente antes de presentar",
    color: "#C62828",
    background: "rgba(198, 40, 40, 0.07)",
  };
}

function getChecklist(scoring, shareReadiness) {
  const missingMandatory = Number(scoring?.summary?.missingMandatory || 0);
  const reviewRisks = Number(scoring?.summary?.reviewRisks || 0);
  const uploadedDocuments = Number(scoring?.summary?.uploadedDocuments || 0);
  const grade = String(shareReadiness?.grade || scoring?.readinessGrade?.grade || "pendiente").toUpperCase();

  return [
    {
      label: "Documentos base cargados",
      complete: uploadedDocuments > 0,
      detail: uploadedDocuments > 0 ? `${uploadedDocuments} documento(s) cargado(s)` : "Carga al menos la documentacion inicial.",
    },
    {
      label: "Obligatorios cubiertos",
      complete: missingMandatory === 0,
      detail: missingMandatory === 0 ? "Sin faltantes obligatorios." : `${missingMandatory} obligatorio(s) faltante(s).`,
    },
    {
      label: "Observaciones IA controladas",
      complete: reviewRisks === 0,
      detail: reviewRisks === 0 ? "Sin riesgos documentales criticos." : `${reviewRisks} documento(s) requieren revision.`,
    },
    {
      label: "Grado institucional",
      complete: ["A", "B", "C"].includes(grade),
      detail: grade === "PENDIENTE" ? "Aun no hay grado definitivo." : `Grado actual ${grade}.`,
    },
  ];
}

export default function ComplianceReadinessPanel({ scoring, shareReadiness, loading }) {
  const config = getStatusConfig(Boolean(shareReadiness?.canPublish));
  const checklist = getChecklist(scoring, shareReadiness);
  const blockers = shareReadiness?.blockers || [];
  const warnings = shareReadiness?.warnings || [];

  return (
    <section style={{
      padding: "1rem",
      border: `1px solid ${COLORS.border}`,
      borderRadius: "8px",
      background: config.background,
      marginBottom: "1rem",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "flex-start", marginBottom: "0.85rem" }}>
        <div>
          <p style={{ color: COLORS.textMuted, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "0.2rem" }}>
            Semaforo de cumplimiento
          </p>
          <p style={{ color: COLORS.navy, fontWeight: 900, fontSize: "0.95rem", lineHeight: 1.3 }}>
            {loading ? "Evaluando expediente..." : config.title}
          </p>
          <p style={{ color: COLORS.textMuted, fontSize: "0.76rem", lineHeight: 1.45, marginTop: "0.3rem" }}>
            {shareReadiness?.nextAction || "NSD revisa documentos, observaciones IA, matriz y publicabilidad institucional."}
          </p>
        </div>
        <span style={{
          minWidth: "54px",
          height: "54px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "white",
          border: `4px solid ${config.color}`,
          color: config.color,
          fontWeight: 900,
          fontSize: "0.82rem",
        }}>
          {config.label}
        </span>
      </div>

      <div style={{ display: "grid", gap: "0.45rem", marginBottom: blockers.length || warnings.length ? "0.85rem" : 0 }}>
        {checklist.map((item) => (
          <div key={item.label} style={{
            display: "grid",
            gridTemplateColumns: "18px 1fr",
            gap: "0.5rem",
            alignItems: "flex-start",
            padding: "0.55rem",
            border: `1px solid ${COLORS.border}`,
            borderRadius: "6px",
            background: "white",
          }}>
            <span style={{
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              marginTop: "0.15rem",
              background: item.complete ? COLORS.green : COLORS.amber,
            }} />
            <div>
              <p style={{ color: COLORS.navy, fontSize: "0.78rem", fontWeight: 900 }}>
                {item.label}
              </p>
              <p style={{ color: COLORS.textMuted, fontSize: "0.72rem", lineHeight: 1.35 }}>
                {item.detail}
              </p>
            </div>
          </div>
        ))}
      </div>

      {!!blockers.length && (
        <div style={{ display: "grid", gap: "0.28rem", marginBottom: "0.55rem" }}>
          {blockers.slice(0, 4).map((item) => (
            <p key={item} style={{ color: "#C62828", fontSize: "0.74rem", fontWeight: 800, lineHeight: 1.35 }}>
              Bloqueo: {item}
            </p>
          ))}
        </div>
      )}

      {!!warnings.length && (
        <div style={{ display: "grid", gap: "0.28rem" }}>
          {warnings.slice(0, 3).map((item) => (
            <p key={item} style={{ color: COLORS.amber, fontSize: "0.74rem", fontWeight: 800, lineHeight: 1.35 }}>
              Alerta: {item}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
