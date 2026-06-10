import React from "react";
import { COLORS } from "../../utils/constants";

const STATUS_CONFIG = {
  present: { label: "Cubierto", color: COLORS.green, background: "rgba(46, 125, 50, 0.08)" },
  review: { label: "Observado", color: COLORS.amber, background: "rgba(201, 168, 76, 0.14)" },
  missing: { label: "Faltante", color: "#C62828", background: "rgba(198, 40, 40, 0.08)" },
};

const CATEGORY_LABELS = {
  identidad: "Identidad / KYC",
  kyc: "Identidad / KYC",
  legal: "Corporativo legal",
  financiero: "Informacion financiera",
  fiscal: "Informacion fiscal",
  garantias: "Garantias / colateral",
  proyecto: "Proyecto",
  cumplimiento: "Cumplimiento",
  otros: "Otros",
};

function cleanText(value = "") {
  return String(value)
    .replaceAll("Ã¡", "á")
    .replaceAll("Ã©", "é")
    .replaceAll("Ã­", "í")
    .replaceAll("Ã³", "ó")
    .replaceAll("Ãº", "ú")
    .replaceAll("Ã±", "ñ")
    .replaceAll("Ã", "Á")
    .replaceAll("Ã‰", "É")
    .replaceAll("Ã", "Í")
    .replaceAll("Ã“", "Ó")
    .replaceAll("Ãš", "Ú")
    .replaceAll("Â·", "·");
}

function getCategoryLabel(category = "otros") {
  const normalized = String(category || "otros").toLowerCase();
  return CATEGORY_LABELS[normalized] || cleanText(category || "Otros");
}

function getAction(item) {
  if (item.documentIssues?.some((issue) => issue.severity === "high")) return "Sustituir documento o resolver bloqueo antes de compartir.";
  if (item.documentIssues?.some((issue) => issue.severity === "medium")) return "Actualizar vigencia o validar excepcion antes de presentar.";
  if (item.status === "review") return "Revisar observación IA y subsanar antes de compartir.";
  if (item.status === "missing" && item.mandatory) return "Cargar o justificar antes de presentar a otorgantes.";
  if (item.status === "missing") return "Agregar si fortalece el expediente.";
  return "Mantener vigente, legible y trazable.";
}

function getMatchedDocument(item) {
  return item.matchedDocument?.filename || item.document?.filename || item.filename || "Sin documento vinculado";
}

export default function DocumentMatrixPanel({ scoring }) {
  const requirements = scoring?.requirementResults || [];
  if (!requirements.length) return null;

  const summary = requirements.reduce(
    (acc, item) => {
      acc.total += 1;
      if (item.status === "present") acc.present += 1;
      if (item.status === "review") acc.review += 1;
      if (item.status === "missing" && item.mandatory) acc.missingMandatory += 1;
      return acc;
    },
    { total: 0, present: 0, review: 0, missingMandatory: 0 }
  );

  const grouped = requirements.reduce((acc, item) => {
    const key = item.category || "otros";
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <section style={{
      border: `1px solid ${COLORS.border}`,
      borderRadius: "8px",
      background: "white",
      overflow: "hidden",
    }}>
      <div style={{ padding: "0.9rem", borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
        <p style={{ color: COLORS.textMuted, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "0.25rem" }}>
          Matriz documental viva
        </p>
        <p style={{ color: COLORS.navy, fontSize: "0.84rem", fontWeight: 800, lineHeight: 1.35 }}>
          Estado del expediente contra requisitos exigibles para revisión institucional.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.45rem", marginTop: "0.75rem" }}>
          {[
            ["Req.", summary.total, COLORS.navy],
            ["OK", summary.present, COLORS.green],
            ["Obs.", summary.review, COLORS.amber],
            ["Bloq.", summary.missingMandatory, "#C62828"],
          ].map(([label, value, color]) => (
            <div key={label} style={{ padding: "0.5rem", border: `1px solid ${COLORS.border}`, borderRadius: "6px", background: "white" }}>
              <p style={{ color: COLORS.textMuted, fontSize: "0.65rem", fontWeight: 900, textTransform: "uppercase" }}>{label}</p>
              <p style={{ color, fontWeight: 900, fontSize: "1rem" }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gap: "0.75rem", padding: "0.85rem" }}>
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} style={{ display: "grid", gap: "0.5rem" }}>
            <p style={{ color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {getCategoryLabel(category)}
            </p>
            {items.map((item) => {
              const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.missing;
              return (
                <article key={item.code || item.name} style={{
                  padding: "0.75rem",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "8px",
                  background: item.status === "missing" && item.mandatory ? "rgba(198, 40, 40, 0.035)" : "white",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.65rem", alignItems: "flex-start", marginBottom: "0.45rem" }}>
                    <div>
                      <p style={{ color: COLORS.navy, fontSize: "0.82rem", fontWeight: 900, lineHeight: 1.3 }}>
                        {cleanText(item.name || item.code || "Requisito")}
                      </p>
                      <p style={{ color: COLORS.textMuted, fontSize: "0.68rem", fontWeight: 800, marginTop: "0.15rem" }}>
                        {item.code || "SIN-CODIGO"} · {item.mandatory ? "Obligatorio" : "Opcional"}
                      </p>
                    </div>
                    <span style={{
                      padding: "0.28rem 0.45rem",
                      borderRadius: "999px",
                      background: status.background,
                      color: status.color,
                      fontSize: "0.68rem",
                      fontWeight: 900,
                      whiteSpace: "nowrap",
                    }}>
                      {status.label}
                    </span>
                  </div>

                  <p style={{ color: COLORS.textMuted, fontSize: "0.74rem", lineHeight: 1.4, marginBottom: "0.35rem" }}>
                    Documento: <strong style={{ color: COLORS.navy }}>{cleanText(getMatchedDocument(item))}</strong>
                  </p>
                  {!!item.documentIssues?.length && (
                    <div style={{ display: "grid", gap: "0.2rem", marginBottom: "0.35rem" }}>
                      {item.documentIssues.slice(0, 2).map((issue) => (
                        <p key={issue.code} style={{ color: issue.severity === "high" ? "#C62828" : COLORS.amber, fontSize: "0.72rem", lineHeight: 1.35, fontWeight: 800 }}>
                          Riesgo: {cleanText(issue.label)}
                        </p>
                      ))}
                    </div>
                  )}
                  <p style={{ color: status.color, fontSize: "0.74rem", lineHeight: 1.4, fontWeight: 800 }}>
                    Siguiente acción: {getAction(item)}
                  </p>
                </article>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
