import { error, debug, info, warn } from '../../utils/logger';
import React from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../utils/constants";
import { uiText } from "../../utils/runtimeCopy";

export default function DataRoomIndexTab() {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);

  const folders = [
    ["00", L("Resumen Ejecutivo", "Executive Summary"), L("Memo, score, semaforo, uso de recursos", "Memo, score, traffic light, use of funds"), "Completo", L("Otorgantes", "Funding Providers")],
    ["01", L("Identidad y KYB", "Identity & KYB"), L("RFC, poderes, beneficiario controlador, identificaciones", "Tax ID, powers of attorney, beneficial owner, identifications"), "Completo", L("NEXUS + Otorgantes", "NEXUS + Funding Providers")],
    ["02", L("Corporativo Legal", "Corporate Legal"), L("Actas, estatutos, estructura, autorizaciones", "Bylaws, articles, structure, authorizations"), "En revision", "NEXUS"],
    ["03", L("Financiero", "Financial"), L("Estados financieros, flujo, deuda, ingresos", "Financial statements, cash flow, debt, revenue"), "Faltantes", L("NEXUS + Otorgantes", "NEXUS + Funding Providers")],
    ["04", L("Proyecto", "Project"), L("Plan, presupuesto, hitos, contratos, soporte operativo", "Plan, budget, milestones, contracts, operational support"), "En revision", L("Otorgantes", "Funding Providers")],
    ["05", L("Cumplimiento", "Compliance"), L("Declaraciones, antifraude, PLD/KYC, listas internas", "Declarations, anti-fraud, AML/KYC, internal screening lists"), "Completo", "NEXUS"],
    ["06", L("Comite", "Committee"), L("Memo, condiciones, term sheet, observaciones", "Memo, terms, term sheet, observations"), "Pendiente", L("Otorgantes", "Funding Providers")],
  ];

  const statusColor = {
    Completo: ["rgba(46,125,50,0.12)", "#2E7D32", L("Completo", "Complete")],
    "En revision": ["rgba(201,162,39,0.18)", "#8A6A00", L("En revision", "Under Review")],
    Faltantes: ["rgba(198,40,40,0.12)", "#B3261E", L("Faltantes", "Gaps")],
    Pendiente: ["rgba(27,58,92,0.10)", COLORS.navy, L("Pendiente", "Pending")],
  };

  const infoCards = [
    [L("Control de versiones", "Version Control"), L("Cada documento debe conservar fecha, propietario, estado y sustitucion.", "Each document must retain date, owner, status and replacement history.")],
    [L("Permisos por rol", "Permissions by Role"), L("El solicitante carga, NEXUS revisa y el otorgante ve solo lo autorizado.", "The applicant uploads, NEXUS reviews, and the funding provider only sees authorized items.")],
    [L("Evidencia para comite", "Evidence for Committee"), L("El data room debe alimentar memo, score y checklist de decision.", "The data room must populate the memo, score, and decision checklist.")],
  ];

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
            "Esta estructura ayuda a solicitantes, NEXUS y otorgantes a revisar el mismo expediente sin perder trazabilidad, permisos ni version documental.",
            "This structure helps applicants, NEXUS and funders review the same file without losing traceability, permissions or document versioning."
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
              const [bg, fg, statusLabel] = statusColor[status] || statusColor.Pendiente;
              return (
                <tr key={code} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td style={{ padding: "0.72rem", color: COLORS.gold, fontWeight: 900 }}>{code}</td>
                  <td style={{ padding: "0.72rem", color: COLORS.navy, fontWeight: 900 }}>{name}</td>
                  <td style={{ padding: "0.72rem", color: COLORS.text, fontSize: "0.86rem" }}>{content}</td>
                  <td style={{ padding: "0.72rem" }}>
                    <span style={{ display: "inline-flex", borderRadius: "999px", padding: "0.22rem 0.55rem", background: bg, color: fg, fontWeight: 900, fontSize: "0.75rem" }}>
                      {statusLabel}
                    </span>
                  </td>
                  <td style={{ padding: "0.72rem", color: COLORS.textMuted, fontSize: "0.84rem", fontWeight: 700 }}>{visibility}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.85rem" }}>
        {infoCards.map(([title, detail]) => (
          <article key={title} style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
            <h2 style={{ margin: 0, color: COLORS.navy, fontSize: "1rem" }}>{title}</h2>
            <p style={{ margin: "0.45rem 0 0", color: COLORS.text, fontSize: "0.86rem", lineHeight: 1.5 }}>{detail}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
