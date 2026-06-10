import React from "react";
import { COLORS } from "../../utils/constants";

function cleanText(value = "") {
  return String(value)
    .replaceAll("Ã¡", "á")
    .replaceAll("Ã©", "é")
    .replaceAll("Ã­", "í")
    .replaceAll("Ã³", "ó")
    .replaceAll("Ãº", "ú")
    .replaceAll("Ã±", "ñ")
    .replaceAll("Â·", "·");
}

function buildActions(scoring, shareReadiness) {
  const requirements = scoring?.requirementResults || [];
  const blockers = shareReadiness?.blockers || [];

  const missingMandatory = requirements
    .filter((item) => item.status === "missing" && item.mandatory)
    .map((item) => ({
      priority: 1,
      title: cleanText(item.name || item.code || "Requisito obligatorio"),
      detail: "Cargar documento, sustituir evidencia o justificar dispensa antes de compartir.",
      tag: "Obligatorio",
      color: "#C62828",
    }));

  const observed = requirements
    .filter((item) => item.status === "review")
    .map((item) => ({
      priority: 2,
      title: cleanText(item.name || item.code || "Documento observado"),
      detail: item.documentIssues?.length
        ? cleanText(item.documentIssues.map((issue) => issue.label).join(" "))
        : item.review?.summary || "Revisar observación IA y subsanar hallazgos relevantes.",
      tag: "Observado",
      color: item.documentIssues?.some((issue) => issue.severity === "high") ? "#C62828" : COLORS.amber,
    }));

  const missingOptional = requirements
    .filter((item) => item.status === "missing" && !item.mandatory)
    .slice(0, 3)
    .map((item) => ({
      priority: 3,
      title: cleanText(item.name || item.code || "Requisito opcional"),
      detail: "Agregar si ayuda a robustecer el expediente frente a otorgantes.",
      tag: "Refuerzo",
      color: COLORS.navy,
    }));

  const blockerActions = blockers
    .filter((item) => !requirements.some((req) => cleanText(item).includes(cleanText(req.name || ""))))
    .slice(0, 2)
    .map((item) => ({
      priority: 1,
      title: "Bloqueo institucional",
      detail: cleanText(item),
      tag: "Bloqueo",
      color: "#C62828",
    }));

  return [...blockerActions, ...missingMandatory, ...observed, ...missingOptional]
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 6);
}

function buildMarkdown(actions, scoring, shareReadiness) {
  const grade = shareReadiness?.grade || scoring?.readinessGrade?.grade || "N/D";
  const score = shareReadiness?.finalScore || scoring?.finalScore || 0;
  const status = shareReadiness?.canPublish ? "Listo para presentacion" : "Pendiente de subsanacion";
  const lines = [
    "# Plan de subsanacion NSD",
    "",
    `- Estado: ${status}`,
    `- Grado: ${grade}`,
    `- Score interno: ${score}/100`,
    `- Siguiente accion: ${shareReadiness?.nextAction || "Revisar pendientes documentales."}`,
    "",
    "## Acciones prioritarias",
    ...(actions.length
      ? actions.map((action, index) => `${index + 1}. [${action.tag}] ${action.title}: ${action.detail}`)
      : ["1. Mantener documentos vigentes, bitacora completa y data room actualizado."]),
    "",
    "## Nota",
    "Este plan es una guia operativa de preparacion documental. No constituye aprobacion crediticia ni opinion legal, fiscal o financiera."
  ];

  return lines.join("\n");
}

export default function RemediationPlanPanel({ scoring, shareReadiness }) {
  const actions = buildActions(scoring, shareReadiness);
  const isReady = Boolean(shareReadiness?.canPublish);
  const markdown = buildMarkdown(actions, scoring, shareReadiness);

  const copyPlan = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
    } catch (error) {
      console.warn("No se pudo copiar el plan", error);
    }
  };

  const downloadPlan = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "plan-subsanacion-nsd.md";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section style={{
      border: `1px solid ${COLORS.border}`,
      borderRadius: "8px",
      background: "white",
      overflow: "hidden",
    }}>
      <div style={{ padding: "0.9rem", background: COLORS.bg, borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "flex-start" }}>
          <div>
            <p style={{ color: COLORS.textMuted, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "0.25rem" }}>
              Plan de subsanacion
            </p>
            <p style={{ color: COLORS.navy, fontSize: "0.86rem", fontWeight: 900, lineHeight: 1.35 }}>
              {isReady ? "El expediente no tiene bloqueos principales." : "Acciones prioritarias para desbloquear presentacion."}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={copyPlan}
              style={{
                padding: "0.45rem 0.6rem",
                border: `1px solid ${COLORS.border}`,
                borderRadius: "6px",
                background: "white",
                color: COLORS.navy,
                fontSize: "0.7rem",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Copiar
            </button>
            <button
              type="button"
              onClick={downloadPlan}
              style={{
                padding: "0.45rem 0.6rem",
                border: "none",
                borderRadius: "6px",
                background: COLORS.navy,
                color: "white",
                fontSize: "0.7rem",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              Descargar
            </button>
          </div>
        </div>
      </div>

      {actions.length === 0 ? (
        <div style={{ padding: "0.9rem" }}>
          <p style={{ color: COLORS.green, fontSize: "0.8rem", fontWeight: 900, lineHeight: 1.4 }}>
            Mantener documentos vigentes, bitácora completa y data room actualizado.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "0.65rem", padding: "0.85rem" }}>
          {actions.map((action, index) => (
            <article key={`${action.title}-${index}`} style={{
              display: "grid",
              gridTemplateColumns: "28px 1fr",
              gap: "0.65rem",
              padding: "0.75rem",
              border: `1px solid ${COLORS.border}`,
              borderRadius: "8px",
              background: action.priority === 1 ? "rgba(198, 40, 40, 0.035)" : "white",
            }}>
              <div style={{
                width: "26px",
                height: "26px",
                borderRadius: "50%",
                background: action.color,
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.74rem",
                fontWeight: 900,
              }}>
                {index + 1}
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <p style={{ color: COLORS.navy, fontSize: "0.8rem", fontWeight: 900, lineHeight: 1.3 }}>
                    {action.title}
                  </p>
                  <span style={{ color: action.color, fontSize: "0.68rem", fontWeight: 900, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                    {action.tag}
                  </span>
                </div>
                <p style={{ color: COLORS.textMuted, fontSize: "0.74rem", lineHeight: 1.4 }}>
                  {action.detail}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
