import React from "react";
import { COLORS } from "../utils/constants";
import Footer from "../components/Landing/Footer";

export default function CertificationsPage() {
  return (
    <div style={{background: COLORS.bg, minHeight: "100vh"}}>
      <div style={{maxWidth: "1200px", margin: "0 auto", padding: "4rem 2rem 2rem"}}>
        <h1 style={{
          color: COLORS.navy,
          fontSize: "2.5rem",
          marginBottom: "1rem",
          borderLeft: `4px solid ${COLORS.gold}`,
          paddingLeft: "1rem",
        }}>
          Certificaciones y Cumplimiento
        </h1>
        <p style={{color: COLORS.textMuted, marginBottom: "3rem", fontSize: "1.1rem"}}>
          NSD cumple con los más altos estándares internacionales de seguridad y privacidad.
        </p>

        {/* Certifications */}
        <div style={{marginBottom: "3rem"}}>
          <h2 style={{
            color: COLORS.navy,
            fontSize: "1.8rem",
            marginBottom: "2rem",
            fontWeight: "600",
          }}>
            Certificaciones
          </h2>

          <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "2rem"}}>
            {[
              {name: "ISO 27001", desc: "Seguridad de la Información", year: "2024"},
              {name: "GDPR", desc: "Regulación de Protección de Datos (EU)", year: "2024"},
              {name: "LGPD", desc: "Lei Geral de Proteção de Dados (Brasil)", year: "2024"},
              {name: "SOC 2 Type II", desc: "Auditoría de Seguridad", year: "2025"},
            ].map((cert, i) => (
              <div key={i} style={{
                background: COLORS.white,
                padding: "2rem",
                borderRadius: "8px",
                border: `1px solid ${COLORS.border}`,
                textAlign: "center",
              }}>
                <div style={{fontSize: "2.5rem", marginBottom: "1rem"}}>✓</div>
                <h3 style={{color: COLORS.navy, fontWeight: "600", marginBottom: "0.5rem"}}>
                  {cert.name}
                </h3>
                <p style={{color: COLORS.textMuted, fontSize: "0.9rem", marginBottom: "1rem"}}>
                  {cert.desc}
                </p>
                <p style={{color: COLORS.gold, fontWeight: "600", fontSize: "0.85rem"}}>
                  Certificado: {cert.year}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance & Regulations */}
        <div style={{marginBottom: "3rem"}}>
          <h2 style={{
            color: COLORS.navy,
            fontSize: "1.8rem",
            marginBottom: "2rem",
            fontWeight: "600",
          }}>
            Marcos Regulatorios
          </h2>

          <div style={{
            background: COLORS.white,
            padding: "2rem",
            borderRadius: "8px",
            border: `1px solid ${COLORS.border}`,
          }}>
            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem"}}>
              {[
                {title: "CNBV", desc: "Comisión Nacional Bancaria y de Valores"},
                {title: "SAT", desc: "Servicio de Administración Tributaria"},
                {title: "Banxico", desc: "Banco de México"},
                {title: "CONDUSEF", desc: "Comisión Nacional para la Protección y Defensa de los Usuarios de Servicios Financieros"},
              ].map((reg, i) => (
                <div key={i} style={{
                  padding: "1.5rem",
                  background: COLORS.bg,
                  borderRadius: "6px",
                  borderLeft: `4px solid ${COLORS.gold}`,
                }}>
                  <p style={{color: COLORS.navy, fontWeight: "600", marginBottom: "0.5rem"}}>
                    {reg.title}
                  </p>
                  <p style={{color: COLORS.textMuted, fontSize: "0.9rem"}}>
                    {reg.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Security Measures */}
        <div>
          <h2 style={{
            color: COLORS.navy,
            fontSize: "1.8rem",
            marginBottom: "2rem",
            fontWeight: "600",
          }}>
            Medidas de Seguridad
          </h2>

          <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem"}}>
            {[
              {icon: "🔐", title: "Encriptación", desc: "SSL/TLS en tránsito"},
              {icon: "🛡️", title: "Firewall", desc: "Protección de perimetro"},
              {icon: "🔒", title: "Access Control", desc: "Autenticación segura"},
              {icon: "📋", title: "Auditorías", desc: "Revisiones regulares"},
              {icon: "⚡", title: "Backup", desc: "Respaldos diarios"},
              {icon: "🚨", title: "Alertas", desc: "Monitoreo 24/7"},
            ].map((measure, i) => (
              <div key={i} style={{
                background: COLORS.white,
                padding: "1.5rem",
                borderRadius: "8px",
                border: `1px solid ${COLORS.border}`,
                textAlign: "center",
              }}>
                <div style={{fontSize: "2rem", marginBottom: "1rem"}}>
                  {measure.icon}
                </div>
                <p style={{color: COLORS.navy, fontWeight: "600", marginBottom: "0.5rem"}}>
                  {measure.title}
                </p>
                <p style={{color: COLORS.textMuted, fontSize: "0.85rem"}}>
                  {measure.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
