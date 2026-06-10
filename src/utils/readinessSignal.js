import { COLORS } from "./constants";

export function getOrderReadinessSignal(order = {}) {
  const readinessGrade = String(order.readinessGrade || "pendiente").toUpperCase();
  const complianceStatus = order.complianceStatus || "pendiente";
  const canShare = Boolean(order.canShareWithFunders);

  if (canShare || ["A", "B"].includes(readinessGrade) || complianceStatus === "aprobado_para_presentacion") {
    return {
      key: "green",
      label: "Verde",
      title: "Listo para revision",
      detail: "Puede avanzar a data room u otorgantes.",
      color: COLORS.green,
      background: "rgba(46, 125, 50, 0.08)",
    };
  }

  if (readinessGrade === "C" || complianceStatus === "en_revision") {
    return {
      key: "amber",
      label: "Ambar",
      title: "Subsanable",
      detail: "Revisar observaciones antes de compartir.",
      color: COLORS.amber,
      background: "rgba(201, 168, 76, 0.14)",
    };
  }

  if (["D", "E"].includes(readinessGrade) || complianceStatus === "rechazado_por_cumplimiento") {
    return {
      key: "red",
      label: "Rojo",
      title: "Bloqueado",
      detail: "Faltan requisitos criticos del expediente.",
      color: "#C62828",
      background: "rgba(198, 40, 40, 0.08)",
    };
  }

  return {
    key: "pending",
    label: "Pend.",
    title: "En captura",
    detail: "Carga documentos para calcular preparacion.",
    color: COLORS.textMuted,
    background: "rgba(0, 0, 0, 0.04)",
  };
}
