import React from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../utils/constants";
import { uiText } from "../../utils/runtimeCopy";

const folders = [
  ["00", "Resumen Ejecutivo", "Memo, score, semaforo, uso de recursos", "Completo", "Otorgantes"],
  ["01", "Identidad y KYB", "RFC, poderes, beneficiario controlador, identificaciones", "Completo", "NSD + Otorgantes"],
  ["02", "Corporativo Legal", "Actas, estatutos, estructura, autorizaciones", "En revision", "NSD"],
  ["03", "Financiero", "Estados financieros, flujo, deuda, ingresos", "Faltantes", "NSD + Otorgantes"],
  ["04", "Proyecto", "Plan, presupuesto, hitos, contratos, soporte operativo", "En revision", "Otorgantes"],
  ["05", "Cumplimiento", "Declaraciones, antifraude, PLD/KYC, listas internas", "Completo", "NSD"],
  ["06", "Comite", "Memo, condiciones, term sheet, observaciones", "Pendiente", "Otorgantes"],
];

const statusColor = {
  Completo: ["rgba(46,125,50,0.12)", "#2E7D32"],
  "En revision": ["rgba(201,162,39,0.18)", "#8A6A00"],
  Faltantes: ["rgba(198,40,40,0.12)", "#B3261E"],
  Pendiente: ["rgba(27,58,92,0.10)", COLORS.navy],
};

export default function DataRoomIndexTab() {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <section style={{
        background: "linear-gradient(135deg, #0F1F2E 0%, #1B3A5C 70%, #C9A227 140%)",
        color: COLORS.white,
        borderRadius: "16px",
        padding: "1.55rem",
        boxShadow: COLORS.shadowMd,
      }}>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.72)", fontSize: "0.75rem", fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {L("Indice documental del expediente", "File document index")}
        </p>
        <h1 style={{ margin: "0.35rem 0", color: COLORS.white, fontSize: "1.55rem" }}>
          {L("Data room ordenado por carpetas de decision", "Data room organized by decision folders")}
        </h1>
        <p style={{ margin: 0, maxWidth: "820px", color: "rgba(255,255,255,0.82)", lineHeight: 1.6 }}>
          {L(
            "Esta estructura ayuda a solicitantes, NSD IF y otorgantes a revisar el mismo expediente sin perder trazabilidad, permisos ni version documental.",
            "This structure helps applicants, NSD IF and funders review the same file without losing traceability, permissions or document versioning."
          )}
        </p>
      </section>

      <section style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "760px" }}>
          <thead>
            <tr style={{ background: COLORS.navy, color: COLORS.white }}>
              {[L("Carpeta", "Folder"), L("Nombre", "Name"), L("Contenido", "Contents"), L("Estado", "Status"), L("Visibilidad", "Visibility")].map((head) => (
                <th key={head} style={{ padding: "0.75rem", textAlign: "left", fontSize: "0.78rem" }}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {folders.map(([code, name, content, status, visibility]) => {
              const [bg, fg] = statusColor[status] || statusColor.Pendiente;
              return (
                <tr key={code} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td style={{ padding: "0.72rem", color: COLORS.gold, fontWeight: 900 }}>{code}</td>
                  <td style={{ padding: "0.72rem", color: COLORS.navy, fontWeight: 900 }}>{L(name, name)}</td>
                  <td style={{ padding: "0.72rem", color: COLORS.text, fontSize: "0.86rem" }}>{L(content, content)}</td>
                  <td style={{ padding: "0.72rem" }}>
                    <span style={{ display: "inline-flex", borderRadius: "999px", padding: "0.22rem 0.55rem", background: bg, color: fg, fontWeight: 900, fontSize: "0.75rem" }}>
                      {L(status, status)}
                    </span>
                  </td>
                  <td style={{ padding: "0.72rem", color: COLORS.textMuted, fontSize: "0.84rem", fontWeight: 700 }}>{L(visibility, visibility)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.85rem" }}>
        {[
          ["Control de versiones", "Cada documento debe conservar fecha, propietario, estado y sustitucion."],
          ["Permisos por rol", "El solicitante carga, NSD revisa y el otorgante ve solo lo autorizado."],
          ["Evidencia para comite", "El data room debe alimentar memo, score y checklist de decision."],
        ].map(([title, detail]) => (
          <article key={title} style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
            <h2 style={{ margin: 0, color: COLORS.navy, fontSize: "1rem" }}>{L(title, title)}</h2>
            <p style={{ margin: "0.45rem 0 0", color: COLORS.text, fontSize: "0.86rem", lineHeight: 1.5 }}>{L(detail, detail)}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
