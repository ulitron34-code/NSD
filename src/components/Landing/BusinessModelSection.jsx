import React from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../utils/constants";
import { uiText } from "../../utils/runtimeCopy";

export default function BusinessModelSection() {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);

  const streams = [
    ["SaaS B2B", "Suscripcion para entidades que requieren pipeline, expedientes, roles, auditoria y data room.", "Recurring software revenue for institutions."],
    ["Fee por expediente", "Cobro por preparacion, checklist, score, revision documental y data room por caso.", "Transaction revenue per reviewed file."],
    ["Servicios NSD IF", "Business plan, analisis financiero, pitch deck, memo de comite y preparacion para fondeo.", "Professional services attached to the platform."],
    ["Modulos premium", "Biometria, OCR, antifraude, KYB, integraciones, monitoreo y reportes avanzados.", "Higher-margin add-ons as adoption grows."],
  ];

  return (
    <section style={{ background: COLORS.navy, padding: "4.5rem 2rem", color: "white" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ maxWidth: "820px", marginBottom: "2rem" }}>
          <p style={{ color: COLORS.gold, fontSize: "0.75rem", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 900, marginBottom: "0.75rem" }}>
            {L("Modelo de negocio", "Business Model")}
          </p>
          <h2 style={{ color: "white", fontSize: "clamp(1.9rem, 3vw, 2.7rem)", lineHeight: 1.1, marginBottom: "0.9rem" }}>
            {L("Una plataforma con ingresos SaaS, expediente y servicios de alto valor.", "A platform with SaaS, file-based and high-value services revenue.")}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.74)", lineHeight: 1.75, fontSize: "0.98rem" }}>
            {L("La tesis de startup no depende de un solo cobro. NSD puede capturar valor cuando prepara al solicitante, cuando el otorgante revisa oportunidades y cuando se agregan modulos avanzados de cumplimiento.", "The startup thesis does not depend on a single fee. NSD can capture value when it prepares the applicant, when the funder reviews opportunities and when advanced compliance modules are added.")}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "1rem" }}>
          {streams.map(([title, es, en]) => (
            <article key={title} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: "10px", padding: "1.2rem" }}>
              <h3 style={{ color: COLORS.gold, fontSize: "1rem", marginBottom: "0.55rem" }}>{title}</h3>
              <p style={{ color: "rgba(255,255,255,0.78)", fontSize: "0.84rem", lineHeight: 1.55 }}>{L(es, en)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
