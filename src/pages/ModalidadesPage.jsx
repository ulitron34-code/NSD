import React from "react";
import { useNavigate } from "react-router-dom";
import { COLORS } from "../utils/constants";
import Footer from "../components/Landing/Footer";

const MODALIDADES = [
  {
    nombre: "Núcleo de Cumplimiento",
    descriptor: "Base operativa para organizaciones que inician su proceso de cumplimiento digital",
    capacidades: [
      "Expediente digital y onboarding configurable",
      "KYC/KYB y beneficiario final",
      "Carga documental y checklists dinámicos",
      "Riesgo básico y gestión de casos",
      "Reportes y trazabilidad de decisiones",
    ],
    ideal: "SOFOM, SOFIPO, cooperativas, despachos y organizaciones que estructuran su primer flujo de cumplimiento.",
    color: COLORS.navy,
    badge: null,
  },
  {
    nombre: "Orquestación Avanzada",
    descriptor: "Para equipos que requieren automatización, agentes de IA y análisis inteligente",
    capacidades: [
      "Todo del Núcleo de Cumplimiento",
      "Reglas configurables por sector y jurisdicción",
      "Agentes de IA especializados (validación, riesgo, cruce, financiero)",
      "Screening de sanciones y monitoreo continuo",
      "Analítica avanzada y automatización de flujos",
    ],
    ideal: "Bancos, aseguradoras, casas de bolsa, fondos de inversión y family offices con operación activa.",
    color: COLORS.navyLight,
    badge: "MÁS ADOPTADO",
  },
  {
    nombre: "Infraestructura Institucional",
    descriptor: "Para instituciones con requerimientos avanzados de integración, gobierno y auditoría",
    capacidades: [
      "Todo de Orquestación Avanzada",
      "API pública, webhooks e integraciones con core/CRM",
      "SSO y gestión avanzada de roles",
      "Segregación de funciones y aprobaciones multinivel",
      "SLA, ambientes diferenciados y auditoría completa",
    ],
    ideal: "Bancos centrales, supervisores, instituciones con múltiples sucursales y operación multijurisdiccional.",
    color: "#0F2D4A",
    badge: null,
  },
  {
    nombre: "Operación Global",
    descriptor: "Paquetes jurisdiccionales para operar en múltiples países con reglas locales",
    capacidades: [
      "Paquetes por país: México, LATAM, EE.UU., Canadá, EAU",
      "Identificadores fiscales y documentos por jurisdicción",
      "Reglas locales y proveedores regionales",
      "Gobierno multijurisdiccional y auditoría consolidada",
      "Selector de jurisdicción que adapta checklist y reglas",
    ],
    ideal: "Organizaciones que operan en más de un país y requieren consistencia documental y regulatoria entre jurisdicciones.",
    color: "#1B5E7A",
    badge: null,
  },
  {
    nombre: "Cumplimiento Administrado",
    descriptor: "Acompañamiento profesional para integración, operación y remediación",
    capacidades: [
      "Configuración inicial asistida por especialistas NSD",
      "Revisión de expedientes y apoyo en remediación",
      "Capacitación del equipo responsable",
      "Soporte operativo continuo según contrato",
      "Actualización de reglas ante cambios regulatorios",
    ],
    ideal: "Organizaciones que prefieren externalizar parte del proceso operativo de cumplimiento.",
    color: "#2A4A6B",
    badge: null,
  },
];

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={16}
    height={16}
    viewBox="0 0 24 24"
    fill="none"
    stroke="#2E7D32"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function ModalidadesPage() {
  const navigate = useNavigate();

  return (
    <div style={{ background: "#F2EFE9", minHeight: "100vh" }}>
      {/* Header */}
      <section
        style={{
          background: `linear-gradient(135deg, ${COLORS.navy} 0%, #0F2D4A 100%)`,
          padding: "5rem 2rem 4rem",
          textAlign: "center",
        }}
      >
        <p
          style={{
            color: COLORS.gold,
            fontSize: "0.78rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "1rem",
          }}
        >
          MODALIDADES DE IMPLEMENTACIÓN
        </p>
        <h1
          style={{
            color: "#fff",
            fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
            fontWeight: 700,
            lineHeight: 1.2,
            marginBottom: "1.25rem",
            maxWidth: "700px",
            margin: "0 auto 1.25rem",
          }}
        >
          Diseñe una implementación para su organización
        </h1>
        <p
          style={{
            color: "rgba(255,255,255,0.75)",
            fontSize: "1.05rem",
            maxWidth: "640px",
            margin: "0 auto 2rem",
            lineHeight: 1.65,
          }}
        >
          Cada organización recibe una configuración conforme a su sector, volumen, países, políticas,
          integraciones y modelo de gobierno. La propuesta económica se determina después de conocer
          sus necesidades específicas.
        </p>
        <button
          onClick={() => navigate("/contacto")}
          style={{
            background: COLORS.gold,
            color: COLORS.navy,
            border: "none",
            borderRadius: "8px",
            padding: "0.85rem 2rem",
            fontSize: "0.95rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Iniciar diagnóstico institucional →
        </button>
      </section>

      {/* Cards */}
      <section style={{ padding: "4rem 2rem", maxWidth: "1100px", margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {MODALIDADES.map((mod) => (
            <div
              key={mod.nombre}
              style={{
                background: "#fff",
                borderRadius: "14px",
                overflow: "hidden",
                boxShadow: "0 2px 16px rgba(27,58,92,0.08)",
                border: "1px solid rgba(27,58,92,0.08)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Card header */}
              <div
                style={{
                  background: mod.color,
                  padding: "1.5rem 1.75rem",
                  position: "relative",
                }}
              >
                {mod.badge && (
                  <span
                    style={{
                      position: "absolute",
                      top: "1rem",
                      right: "1rem",
                      background: COLORS.gold,
                      color: COLORS.navy,
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      padding: "0.25rem 0.6rem",
                      borderRadius: "20px",
                    }}
                  >
                    {mod.badge}
                  </span>
                )}
                <h2
                  style={{
                    color: "#fff",
                    fontSize: "1.15rem",
                    fontWeight: 700,
                    marginBottom: "0.5rem",
                  }}
                >
                  {mod.nombre}
                </h2>
                <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.88rem", lineHeight: 1.5 }}>
                  {mod.descriptor}
                </p>
              </div>

              {/* Capacidades */}
              <div style={{ padding: "1.5rem 1.75rem", flex: 1 }}>
                <p
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: COLORS.textMuted,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginBottom: "0.75rem",
                  }}
                >
                  CAPACIDADES
                </p>
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {mod.capacidades.map((cap) => (
                    <li
                      key={cap}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.5rem",
                        marginBottom: "0.55rem",
                        fontSize: "0.9rem",
                        color: COLORS.text,
                        lineHeight: 1.45,
                      }}
                    >
                      <span style={{ flexShrink: 0, marginTop: "2px" }}>
                        <CheckIcon />
                      </span>
                      {cap}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Ideal para */}
              <div
                style={{
                  padding: "1rem 1.75rem 1.5rem",
                  borderTop: "1px solid rgba(27,58,92,0.08)",
                }}
              >
                <p style={{ fontSize: "0.8rem", color: COLORS.textMuted, lineHeight: 1.5 }}>
                  <strong>Ideal para: </strong>
                  {mod.ideal}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA inferior */}
        <div
          style={{
            marginTop: "3rem",
            textAlign: "center",
            background: "#fff",
            borderRadius: "14px",
            padding: "2.5rem",
            border: "1px solid rgba(27,58,92,0.08)",
          }}
        >
          <p
            style={{
              fontSize: "0.78rem",
              fontWeight: 700,
              color: COLORS.gold,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "0.75rem",
            }}
          >
            SIGUIENTE PASO
          </p>
          <h3
            style={{
              fontSize: "1.4rem",
              fontWeight: 700,
              color: COLORS.navy,
              marginBottom: "0.75rem",
            }}
          >
            Cuéntenos su caso y diseñamos juntos su implementación
          </h3>
          <p style={{ color: COLORS.textMuted, marginBottom: "1.5rem", maxWidth: "560px", margin: "0 auto 1.5rem" }}>
            Las consultas de terceros y fuentes especializadas se cotizan según cobertura y consumo.
            El diagnóstico inicial es sin costo.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/contacto")}
              style={{
                background: COLORS.navy,
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "0.85rem 2rem",
                fontSize: "0.95rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Iniciar diagnóstico institucional
            </button>
            <button
              onClick={() => navigate("/plataforma")}
              style={{
                background: "transparent",
                color: COLORS.navy,
                border: `2px solid ${COLORS.navy}`,
                borderRadius: "8px",
                padding: "0.85rem 2rem",
                fontSize: "0.95rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Ver capacidades de la plataforma
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
