import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { COLORS } from "../utils/constants";
import Footer from "../components/Landing/Footer";

const INDUSTRIES = [
  { id: "banca", name: "Banca y financieras", desc: "Onboarding, debida diligencia, PEP, sanciones, monitoring y reportes regulatorios para instituciones financieras con operaciones multijurisdiccionales." },
  { id: "sofomes", name: "SOFOM / SOFIPO / Cooperativas", desc: "Expediente digital, KYC/KYB, checklists por producto, riesgo configurable y cumplimiento CNBV / CONDUSEF." },
  { id: "seguros", name: "Seguros y fianzas", desc: "Due diligence de tomadores, agentes y beneficiarios, screening de sanciones, monitoreo de siniestros y expediente de suscripción." },
  { id: "valores", name: "Casas de bolsa y fondos", desc: "KYC, perfil inversionista, origen de recursos, sanciones, cumplimiento CNBV, reporte antilavado e idoneidad." },
  { id: "bienes-raices", name: "Bienes raíces", desc: "Due diligence de compradores, vendedores, arrendadores, agentes y partes relacionadas. Checklist PLDFT y cumplimiento por estado." },
  { id: "family-office", name: "Family office / Wealth management", desc: "Expediente de inversionistas, UBO, origen de recursos, custodias, contratos e información fiscal para operaciones multijurisdiccionales." },
  { id: "fintech", name: "Fintech y neobancos", desc: "Incorporación digital, biometría, validaciones automáticas, sanciones, riesgo transaccional y flujos regulatorios configurables." },
  { id: "manufactura", name: "Manufactura y comercio", desc: "Due diligence de proveedores y clientes, verificación corporativa, beneficiarios finales y cumplimiento de cadena de valor." },
  { id: "mineria", name: "Minería y energía", desc: "Licencias, permisos, socios, contratistas y compradores sujetos a PLDFT. Expediente regulatorio y screening de sanciones internacionales." },
  { id: "gaming", name: "Casinos y juegos con apuesta", desc: "KYC estricto, scoring de riesgo por cliente, sanciones, monitoreo de clientes frecuentes y gestión de casos con SLA." },
  { id: "legal", name: "Despachos y servicios profesionales", desc: "Due diligence de clientes, conflictos de interés, beneficiarios finales, origen de recursos y cumplimiento como actividad vulnerable." },
  { id: "crypto", name: "Activos digitales / VASP", desc: "Viaje de la regla FATF, KYC para VASP, screening en blockchain, sanciones, monitoreo de wallets y reportes regulatorios." },
  { id: "publico", name: "Sector público y supervisores", desc: "Expedientes institucionales, evidencia auditora, gestión de investigaciones, trazabilidad de decisiones y reportes de supervisión." },
  { id: "salud", name: "Salud y farmacéutico", desc: "Due diligence de socios comerciales, distribuidores y proveedores, con checklists regulatorios por país y sector." },
  { id: "tecnologia", name: "Tecnología y SaaS", desc: "Cumplimiento para empresas que onboardean clientes institucionales, integran datos sensibles o operan en múltiples jurisdicciones." },
];

export default function IndustriasPage() {
  const { sector } = useParams();
  const navigate = useNavigate();
  const industry = sector ? INDUSTRIES.find((i) => i.id === sector) : null;

  if (industry) {
    return (
      <div style={{ background: "#F2EFE9", minHeight: "100vh" }}>
        <section style={{ background: `linear-gradient(135deg, ${COLORS.navy} 0%, #0F2D4A 100%)`, padding: "5rem 2rem 4rem", textAlign: "center" }}>
          <button onClick={() => navigate("/industrias")} style={{ background: "transparent", color: "rgba(255,255,255,0.65)", border: "none", cursor: "pointer", fontSize: "0.88rem", marginBottom: "1rem", display: "block", margin: "0 auto 1rem" }}>
            ← Todas las industrias
          </button>
          <p style={{ color: COLORS.gold, fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1rem" }}>INDUSTRIA</p>
          <h1 style={{ color: "#fff", fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 700, lineHeight: 1.2, maxWidth: "700px", margin: "0 auto 1.25rem" }}>
            {industry.name}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "1.05rem", maxWidth: "620px", margin: "0 auto 2rem", lineHeight: 1.65 }}>{industry.desc}</p>
          <button onClick={() => navigate("/contacto")} style={{ background: COLORS.gold, color: COLORS.navy, border: "none", borderRadius: "8px", padding: "0.85rem 2rem", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer" }}>
            Ver aplicación en su organización →
          </button>
        </section>
        <section style={{ padding: "4rem 2rem", maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <p style={{ color: COLORS.textMuted, fontSize: "1rem", lineHeight: 1.7 }}>
            El contenido detallado de esta industria estará disponible próximamente. Contáctenos para conocer cómo NSD se adapta a los requerimientos regulatorios específicos de su sector.
          </p>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ background: "#F2EFE9", minHeight: "100vh" }}>
      <section style={{ background: `linear-gradient(135deg, ${COLORS.navy} 0%, #0F2D4A 100%)`, padding: "5rem 2rem 4rem", textAlign: "center" }}>
        <p style={{ color: COLORS.gold, fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1rem" }}>INDUSTRIAS</p>
        <h1 style={{ color: "#fff", fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 700, lineHeight: 1.2, maxWidth: "700px", margin: "0 auto 1.25rem" }}>
          Cumplimiento configurado para su industria
        </h1>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "1.05rem", maxWidth: "620px", margin: "0 auto", lineHeight: 1.65 }}>
          NSD se adapta a los requerimientos regulatorios de 15 sectores con checklists, reglas, fuentes y flujos específicos para cada industria y jurisdicción.
        </p>
      </section>

      <section style={{ padding: "4rem 2rem", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "1.25rem" }}>
          {INDUSTRIES.map((ind) => (
            <div
              key={ind.id}
              onClick={() => navigate(`/industrias/${ind.id}`)}
              style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "1.5rem",
                border: "1px solid rgba(27,58,92,0.08)",
                cursor: "pointer",
                transition: "box-shadow 0.2s, border-color 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(27,58,92,0.12)"; e.currentTarget.style.borderColor = COLORS.navy; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "rgba(27,58,92,0.08)"; }}
            >
              <h3 style={{ fontSize: "0.97rem", fontWeight: 700, color: COLORS.navy, marginBottom: "0.5rem" }}>{ind.name}</h3>
              <p style={{ fontSize: "0.85rem", color: COLORS.textMuted, lineHeight: 1.55, margin: "0 0 0.75rem" }}>{ind.desc}</p>
              <span style={{ fontSize: "0.8rem", color: COLORS.gold, fontWeight: 700 }}>Ver aplicación →</span>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
