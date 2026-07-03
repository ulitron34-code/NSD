import React from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../utils/constants";
import { uiText } from "../../utils/runtimeCopy";

export default function OperatingModelSection() {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);
  const flow = [
    [L("1. Recepcion", "1. Intake"), L("El solicitante registra proyecto, monto, uso de fondos, sector, etapa y datos base.", "Applicant registers project, amount, fund use, sector, stage and base data.")],
    [L("2. Matriz", "2. Matrix"), L("NEXUS cruza el tipo de proyecto contra requisitos documentales y cumplimiento esperado.", "NEXUS crosses project type against documentary requirements and expected compliance.")],
    [L("3. Revision con IA", "3. AI Review"), L("Los agentes revisan faltantes, vencimientos, consistencia, riesgos y evidencia disponible.", "Agents review missing items, expirations, consistency, risks and available evidence.")],
    [L("4. Data room", "4. Data Room"), L("El expediente se organiza por carpetas, permisos, trazabilidad y autorizacion de acceso.", "File is organized by folders, permissions, traceability and access authorization.")],
    [L("5. Otorgantes", "5. Funders"), L("Las instituciones revisan oportunidades por apetito, score, riesgo, ticket y data room.", "Institutions review opportunities by appetite, score, risk, ticket and data room.")],
    [L("6. Decision", "6. Decision"), L("Genera memo, requerimientos, controles de contacto y soporte para comite interno.", "Generates memo, requirements, contact gates and support for internal committee.")],
  ];
  const safeguards = [
    [L("No aprueba creditos", "Does not approve credit"), L("NEXUS organiza evidencia y reduce friccion; la decision final corresponde al otorgante.", "NEXUS organizes evidence and reduces friction; final decision is the funder's responsibility.")],
    [L("Trazabilidad", "Traceability"), L("Cada carga, revision, requerimiento y acceso debe ser auditable.", "Every upload, review, requirement and access must be auditable.")],
    [L("Privacidad", "Privacy"), L("El contacto y acceso documental operan con consentimiento y permisos controlados.", "Contact and document access operate with consent and controlled permissions.")],
  ];

  return (
    <section style={{ background: COLORS.white, padding: "4rem 2rem", borderTop: `1px solid ${COLORS.border}`, borderBottom: `1px solid ${COLORS.border}` }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ maxWidth: "840px", marginBottom: "2rem" }}>
          <p style={{ color: COLORS.gold, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 900, fontSize: "0.75rem", marginBottom: "0.65rem" }}>
            {L("Modelo operativo NEXUS", "NEXUS Operating Model")}
          </p>
          <h2 style={{ color: COLORS.navy, fontSize: "clamp(1.8rem, 3vw, 2.6rem)", lineHeight: 1.12, marginBottom: "0.85rem" }}>
            {L("De solicitud dispersa a expediente revisable institucionalmente.", "From scattered application to institutional reviewable file.")}
          </h2>
          <p style={{ color: COLORS.textMuted, lineHeight: 1.7, fontSize: "0.98rem" }}>
            {L("La diferencia no es solo digitalizar documentos. Es convertir la solicitud en un expediente con requisitos, IA, data room, controles, trazabilidad y lenguaje util para otorgantes.", "The difference is not just digitizing documents. It is converting the application into a file with requirements, AI, data room, controls, traceability and language useful for funders.")}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.9rem", marginBottom: "1.5rem" }}>
          {flow.map(([title, detail]) => (
            <article key={title} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "1rem" }}>
              <h3 style={{ color: COLORS.navy, fontSize: "1rem", marginBottom: "0.4rem" }}>{title}</h3>
              <p style={{ color: COLORS.textMuted, fontSize: "0.84rem", lineHeight: 1.55 }}>{detail}</p>
            </article>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0.9rem" }}>
          {safeguards.map(([title, detail]) => (
            <div key={title} style={{ background: "rgba(15,31,46,0.04)", border: `1px solid ${COLORS.border}`, borderLeft: `4px solid ${COLORS.gold}`, borderRadius: "8px", padding: "1rem" }}>
              <p style={{ color: COLORS.navy, fontWeight: 900, marginBottom: "0.25rem" }}>{title}</p>
              <p style={{ color: COLORS.textMuted, fontSize: "0.84rem", lineHeight: 1.5 }}>{detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
