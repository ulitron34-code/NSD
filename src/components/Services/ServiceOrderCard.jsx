import React from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../utils/constants";
import { getOrderReadinessSignal } from "../../utils/readinessSignal";
import { translateCopy, uiText } from "../../utils/runtimeCopy";

export default function ServiceOrderCard({ order, onViewDetails, statusColor, statusLabel }) {
  const { i18n } = useTranslation();
  const formatDateOrPending = (value) => {
    if (!value || value === "Pendiente" || value === "TBD") return uiText(i18n, "Pendiente", "Pending");
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? uiText(i18n, "Pendiente", "Pending") : date.toLocaleDateString(i18n.language?.startsWith("en") ? "en-US" : "es-MX");
  };

  const getProgressColor = (progress) => {
    if (progress < 33) return COLORS.amber;
    if (progress < 66) return COLORS.navy;
    return COLORS.green;
  };

  const formatStage = (stage = "captura") => ({
    captura: uiText(i18n, "Captura", "Intake"),
    revision_documental: uiText(i18n, "Revision documental", "Document Review"),
    scoring: uiText(i18n, "Scoring", "Scoring"),
    data_room: uiText(i18n, "Data room", "Data Room"),
    presentado_otorgantes: uiText(i18n, "Con otorgantes", "With Funding Providers"),
    cerrado: uiText(i18n, "Cerrado", "Closed"),
  }[stage] || stage);

  const getGradeColor = (grade = "pendiente") => ({
    A: COLORS.green,
    B: COLORS.navy,
    C: COLORS.amber,
    D: "#C62828",
    E: "#8A1C1C",
  }[String(grade).toUpperCase()] || COLORS.textMuted);

  const readinessGrade = String(order.readinessGrade || "pendiente").toUpperCase();
  const readinessSignal = getOrderReadinessSignal(order);

  return (
    <div style={{
      background: "white",
      padding: "1.5rem",
      borderRadius: "8px",
      border: `1px solid ${COLORS.border}`,
      display: "grid",
      gridTemplateColumns: "1fr auto",
      alignItems: "center",
      gap: "2rem",
      transition: "all 0.3s",
      cursor: "pointer",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
      e.currentTarget.style.transform = "translateY(-2px)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = "none";
      e.currentTarget.style.transform = "translateY(0)";
    }}>
      {/* Left side */}
      <div>
        <div style={{ marginBottom: "1rem" }}>
          <p style={{
            color: COLORS.gold,
            fontSize: "0.8rem",
            fontWeight: 600,
            marginBottom: "0.25rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}>
            {order.caseNumber} · {translateCopy(order.serviceName, i18n.language)}
          </p>
          <h3 style={{
            color: COLORS.navy,
            fontSize: "1.2rem",
            fontWeight: 700,
            marginBottom: "0.5rem",
          }}>
            {order.projectName}
          </h3>
          <p style={{ color: COLORS.textMuted, fontSize: "0.9rem" }}>
            {uiText(i18n, "Iniciado", "Started")}: {new Date(order.createdAt).toLocaleDateString(i18n.language?.startsWith("en") ? "en-US" : "es-MX")}
          </p>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.65rem" }}>
            <span style={{
              padding: "0.28rem 0.55rem",
              borderRadius: "999px",
              background: "rgba(27,58,92,0.08)",
              color: COLORS.navy,
              fontSize: "0.72rem",
              fontWeight: 800,
            }}>
              {formatStage(order.stage)}
            </span>
            <span style={{
              padding: "0.28rem 0.55rem",
              borderRadius: "999px",
              background: "rgba(201,168,76,0.12)",
              color: getGradeColor(readinessGrade),
              fontSize: "0.72rem",
              fontWeight: 900,
            }}>
              {uiText(i18n, "Grado", "Grade")} {readinessGrade}
            </span>
            <span style={{
              padding: "0.28rem 0.55rem",
              borderRadius: "999px",
              background: "rgba(0,0,0,0.04)",
              color: COLORS.textMuted,
              fontSize: "0.72rem",
              fontWeight: 800,
            }}>
              {uiText(i18n, "Riesgo", "Risk")} {translateCopy(order.riskLevel || "pendiente", i18n.language)}
            </span>
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "56px 1fr",
          gap: "0.75rem",
          alignItems: "center",
          padding: "0.75rem",
          border: `1px solid ${COLORS.border}`,
          borderRadius: "8px",
          background: readinessSignal.background,
          marginBottom: "1rem",
          maxWidth: "620px",
        }}>
          <div style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            border: `4px solid ${readinessSignal.color}`,
            background: "white",
            color: readinessSignal.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
            fontSize: "0.72rem",
            textTransform: "uppercase",
          }}>
            {translateCopy(readinessSignal.label, i18n.language)}
          </div>
          <div>
            <p style={{ color: COLORS.navy, fontSize: "0.86rem", fontWeight: 900, marginBottom: "0.15rem" }}>
              {translateCopy(readinessSignal.title, i18n.language)}
            </p>
            <p style={{ color: COLORS.textMuted, fontSize: "0.76rem", lineHeight: 1.35 }}>
              {translateCopy(readinessSignal.detail, i18n.language)}
            </p>
          </div>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "0.5rem",
          }}>
            <p style={{
              color: COLORS.textMuted,
              fontSize: "0.85rem",
              fontWeight: 600,
            }}>
              {uiText(i18n, "Progreso", "Progress")}
            </p>
            <p style={{
              color: getProgressColor(order.progress),
              fontSize: "0.85rem",
              fontWeight: 700,
            }}>
              {order.progress}%
            </p>
          </div>
          <div style={{
            height: "6px",
            background: COLORS.bg,
            borderRadius: "999px",
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${order.progress}%`,
              background: getProgressColor(order.progress),
              transition: "width 0.6s ease",
            }} />
          </div>
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}>
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: COLORS.gold,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: "0.85rem",
            color: COLORS.navy,
          }}>
            {order.specialist.avatar}
          </div>
          <div>
            <p style={{
              color: COLORS.navy,
              fontWeight: 600,
              fontSize: "0.9rem",
            }}>
              {order.specialist.name}
            </p>
            <p style={{
              color: COLORS.textMuted,
              fontSize: "0.8rem",
            }}>
              {uiText(i18n, "Especialista", "Specialist")}
            </p>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "1.5rem",
      }}>
        <div style={{ textAlign: "right" }}>
          <div style={{
            display: "inline-block",
            padding: "0.4rem 0.9rem",
            background: statusColor,
            color: "white",
            borderRadius: "20px",
            fontWeight: 600,
            fontSize: "0.8rem",
            marginBottom: "0.75rem",
          }}>
            {translateCopy(statusLabel, i18n.language)}
          </div>
          <p style={{
            color: COLORS.navy,
            fontSize: "1.4rem",
            fontWeight: 800,
          }}>
            ${order.amount.toLocaleString()}
          </p>
          <p style={{
            color: COLORS.textMuted,
            fontSize: "0.85rem",
          }}>
            {uiText(i18n, "Entrega", "Delivery")}: {formatDateOrPending(order.expectedDelivery || order.completedAt)}
          </p>
        </div>

        <button
          onClick={() => onViewDetails(order)}
          style={{
            padding: "0.7rem 1.5rem",
            background: COLORS.navy,
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-1px)";
            e.target.style.boxShadow = "0 4px 12px rgba(27,58,92,0.3)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "none";
          }}
        >
          {uiText(i18n, "Ver Detalles", "View Details")}
        </button>
      </div>
    </div>
  );
}
