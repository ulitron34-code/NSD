import React from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../utils/constants";
import { uiText } from "../../utils/runtimeCopy";

export default function HistorySection() {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);

  const timeline = [
    { year: 2022, title: L("Fundacion", "Founding"), desc: L("NSD nace para ordenar expedientes, evidencia y controles operativos.", "NSD is born to organize compliance files, evidence and operational controls.") },
    { year: 2023, title: L("Primeros flujos", "First Workflows"), desc: L("Se incorporan validaciones KYC/KYB, revision documental y bitacoras internas.", "KYC/KYB validations, document review and internal logs are incorporated.") },
    { year: 2024, title: L("Expansion regional", "Regional Expansion"), desc: L("La plataforma se adapta a equipos con operaciones en Mexico y Latinoamerica.", "The platform adapts to teams with operations in Mexico and Latin America.") },
    { year: 2025, title: L("Plataforma digital", "Digital Platform"), desc: L("Lanzamiento de modulos SaaS para analisis, auditoria e integraciones.", "Launch of SaaS modules for analysis, auditability and integrations.") },
    { year: 2026, title: L("Hoy", "Today"), desc: L("NSD Platform conecta compliance, servicios profesionales y revision de oportunidades por otorgantes.", "NSD Platform connects compliance, professional services and opportunity review by funding providers.") },
  ];

  const team = [
    { name: "Ulises Salgado", role: L("Fundador & CEO", "Founder & CEO"), bio: L("15+ años en operaciones, tecnologia y procesos regulados.", "15+ years in operations, technology and regulated processes.") },
    { name: "Ana Garcia", role: L("Operaciones", "Operations"), bio: L("Especialista en expedientes, SLA y mejora de flujos internos.", "Specialist in compliance files, SLAs and internal workflow improvement.") },
    { name: "Carlos Lopez", role: L("Legal & Compliance", "Legal & Compliance"), bio: L("Abogado especializado en control documental y cumplimiento.", "Lawyer specializing in document control and compliance.") },
  ];

  return (
    <section style={{ padding: "5rem 2rem", background: COLORS.white, minHeight: "80vh" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <h2 style={{
          color: COLORS.navy,
          fontSize: "2.5rem",
          marginBottom: "1.5rem",
          borderLeft: `4px solid ${COLORS.gold}`,
          paddingLeft: "1rem",
        }}>
          {L("Historia de NSD Platform", "History of NSD Platform")}
        </h2>

        <div style={{ marginTop: "3rem", marginBottom: "3rem" }}>
          {timeline.map((item) => (
            <div key={item.year} style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "2rem", marginBottom: "2rem" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: "700", color: COLORS.gold, paddingTop: "0.5rem" }}>
                {item.year}
              </div>
              <div style={{ padding: "1.5rem", background: COLORS.bg, borderRadius: "8px", borderLeft: `4px solid ${COLORS.gold}` }}>
                <h3 style={{ color: COLORS.navy, marginBottom: "0.5rem", fontWeight: "600" }}>
                  {item.title}
                </h3>
                <p style={{ color: COLORS.textMuted, lineHeight: "1.6" }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "3rem" }}>
          <h3 style={{ color: COLORS.navy, fontSize: "1.8rem", marginBottom: "2rem", borderLeft: `4px solid ${COLORS.gold}`, paddingLeft: "1rem" }}>
            {L("Nuestro equipo", "Our Team")}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "2rem" }}>
            {team.map((member) => (
              <div key={member.name} style={{ background: COLORS.white, padding: "2rem", borderRadius: "8px", border: `1px solid ${COLORS.border}`, textAlign: "center" }}>
                <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: COLORS.gold, margin: "0 auto 1rem" }} />
                <h4 style={{ color: COLORS.navy, fontWeight: "600", marginBottom: "0.25rem" }}>
                  {member.name}
                </h4>
                <p style={{ color: COLORS.gold, fontWeight: "600", fontSize: "0.9rem", marginBottom: "0.75rem" }}>
                  {member.role}
                </p>
                <p style={{ color: COLORS.textMuted, fontSize: "0.9rem" }}>
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
