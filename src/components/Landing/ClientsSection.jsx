import React from "react";
import { useTranslation } from "react-i18next";
import { uiText } from "../../utils/runtimeCopy";

export default function ClientsSection() {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);
  const clients = [
    { tag: "PYME", titulo: L("PyMEs y empresas familiares", "SMEs and family businesses"), desc: L("Expediente, analisis financiero y requisitos listos para solicitudes de credito.", "File, financial analysis and requirements ready for credit applications.") },
    { tag: "START", titulo: L("Startups y scaleups", "Startups and scaleups"), desc: L("Narrativa de inversion, modelo financiero, pitch deck, data room y documentos de capital.", "Investment narrative, financial model, pitch deck, data room and capital documents.") },
    { tag: "PROY", titulo: L("Proyectos productivos", "Productive projects"), desc: L("Estructuracion del caso, viabilidad, riesgos, garantias y documentacion para fondeo.", "Case structuring, viability, risks, guarantees and funding documentation.") },
    { tag: "REAL", titulo: L("Desarrolladores inmobiliarios", "Real estate developers"), desc: L("Expedientes, preventas, permisos, garantias, flujo esperado y presentacion para capital.", "Files, pre-sales, permits, guarantees, expected cash flow and capital presentation.") },
    { tag: "FIN", titulo: L("Bancos, SOFOMES, fintechs y fondos", "Banks, non-bank lenders, fintechs and funds"), desc: L("Pipeline de prospectos, KYC/KYB, antifraude, data rooms y revision institucional.", "Prospect pipeline, KYC/KYB, anti-fraud, data rooms and institutional review.") },
    { tag: "COMP", titulo: L("Legal, riesgo y cumplimiento", "Legal, risk and compliance"), desc: L("Control documental, biometricos, auditoria, alertas, roles, aprobaciones e integraciones.", "Document control, biometrics, audit, alerts, roles, approvals and integrations.") },
  ];

  return (
    <section style={{ padding: "6rem 2rem", background: "white" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <p style={{ color: "#C9A84C", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
            {L("A QUIEN SERVIMOS", "WHO WE SERVE")}
          </p>
          <h2 style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", color: "#1B3A5C", fontWeight: 800 }}>
            {L("Solicitantes, otorgantes, proyectos y equipos de cumplimiento", "Applicants, funders, projects and compliance teams")}
          </h2>
          <p style={{ color: "#6B6560", maxWidth: "720px", margin: "1rem auto 0", fontSize: "1.05rem", lineHeight: 1.7 }}>
            {L("NSD atiende a quienes buscan financiamiento y a quienes lo evaluan: prepara expedientes, acelera revisiones, organiza evidencia y reduce idas y vueltas entre solicitantes y entidades financieras.", "NSD serves those who seek financing and those who evaluate it: prepares files, accelerates review, organizes evidence and reduces back-and-forth times between applicants and financial entities.")}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
          {clients.map((cliente) => (
            <div
              key={cliente.titulo}
              style={{
                padding: "1.75rem",
                borderRadius: "12px",
                border: "1px solid rgba(27,58,92,0.09)",
                background: "#F2EFE9",
                display: "flex",
                gap: "1rem",
                alignItems: "flex-start",
              }}
            >
              <div style={{
                fontSize: "0.72rem",
                fontWeight: 900,
                color: "#1B3A5C",
                flexShrink: 0,
                width: "52px",
                height: "52px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(201,168,76,0.1)",
                borderRadius: "10px",
                border: "1px solid rgba(201,168,76,0.2)",
              }}>
                {cliente.tag}
              </div>
              <div>
                <h3 style={{ color: "#1B3A5C", fontWeight: 700, marginBottom: "0.4rem", fontSize: "0.98rem" }}>
                  {cliente.titulo}
                </h3>
                <p style={{ color: "#6B6560", fontSize: "0.87rem", lineHeight: 1.6 }}>
                  {cliente.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
