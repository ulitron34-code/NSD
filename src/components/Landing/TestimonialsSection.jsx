import React from "react";
import { useTranslation } from "react-i18next";
import { uiText } from "../../utils/runtimeCopy";

export default function TestimonialsSection() {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);

  const testimonials = [
    {
      company: "Fintech Regional",
      quote: L(
        "NSD nos permitio reducir retrabajo documental y responder auditorias internas con evidencia ordenada.",
        "NSD allowed us to reduce document rework and answer internal audits with ordered evidence."
      ),
      author: L("Compliance Officer", "Compliance Officer"),
      sector: "Fintech",
      avatar: "F",
      color: "#1B3A5C",
    },
    {
      company: "Grupo Empresarial ABC",
      quote: L(
        "La trazabilidad por expediente nos dio claridad sobre responsables, observaciones y tiempos de revision.",
        "Traceability per compliance file gave us clarity on responsible parties, observations, and review timelines."
      ),
      author: L("Directora Legal", "Legal Director"),
      sector: L("Corporativo", "Corporate"),
      avatar: "G",
      color: "#C9A84C",
    },
    {
      company: "Operadora de Servicios",
      quote: L(
        "Centralizamos KYC/KYB, vencimientos y listas restrictivas en una sola vista operativa.",
        "We centralized KYC/KYB, expirations, and restrictive screening lists in a single operational view."
      ),
      author: L("Gerente de Riesgo", "Risk Manager"),
      sector: L("Servicios", "Services"),
      avatar: "O",
      color: "#2E7D32",
    },
  ];

  return (
    <section style={{ padding: "6rem 2rem", background: "#F2EFE9" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <p style={{ color: "#C9A84C", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
            {L("TESTIMONIOS", "TESTIMONIALS")}
          </p>
          <h2 style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", color: "#1B3A5C", fontWeight: 800 }}>
            {L("Lo que dicen nuestros clientes", "What our clients say")}
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
          {testimonials.map((item) => (
            <div key={item.company} style={{
              background: "white",
              borderRadius: "8px",
              padding: "2rem",
              border: "1px solid rgba(27,58,92,0.08)",
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
            }}>
              <div style={{ color: "#C9A84C", fontSize: "0.95rem", letterSpacing: "2px" }}>★★★★★</div>
              <p style={{ color: "#1A1A1A", fontSize: "0.95rem", lineHeight: 1.8, fontStyle: "italic", flex: 1 }}>
                "{item.quote}"
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", paddingTop: "1rem", borderTop: "1px solid rgba(27,58,92,0.08)" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: item.color, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "1rem", flexShrink: 0 }}>
                  {item.avatar}
                </div>
                <div>
                  <p style={{ color: "#1B3A5C", fontWeight: 700, fontSize: "0.9rem" }}>{item.company}</p>
                  <p style={{ color: "#6B6560", fontSize: "0.8rem" }}>{item.author}</p>
                </div>
                <span style={{ marginLeft: "auto", background: "rgba(201,168,76,0.1)", color: "#C9A84C", fontSize: "0.72rem", fontWeight: 700, padding: "0.25rem 0.6rem", borderRadius: "999px", border: "1px solid rgba(201,168,76,0.25)", whiteSpace: "nowrap" }}>
                  {item.sector}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
