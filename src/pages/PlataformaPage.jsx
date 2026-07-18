import React from "react";
import { useNavigate } from "react-router-dom";
import { COLORS } from "../utils/constants";
import Footer from "../components/Landing/Footer";
import { BRAND } from "../config/brand";

const MODULES = [
  { id: "onboarding",    name: `${BRAND.name} Global Onboarding`,        desc: "Incorporación digital, consentimiento, cuestionarios dinámicos, carga documental, recordatorios y estatus por país, tipo de persona, producto y riesgo.", status: "disponible" },
  { id: "kyc",          name: `${BRAND.name} Identity – KYC`,            desc: "Identificación de personas, documentos oficiales, domicilio, residencia fiscal, actividad, representación y evidencias.", status: "disponible" },
  { id: "kyb",          name: `${BRAND.name} Business – KYB`,            desc: "Verificación de empresas, constitución, registros, licencias, accionistas, administradores, representantes y situación corporativa.", status: "disponible" },
  { id: "ownership",    name: `${BRAND.name} Ownership`,                 desc: "Mapeo de beneficiarios finales, control directo o indirecto, cadenas de propiedad, fideicomisos y relaciones entre entidades.", status: "disponible" },
  { id: "tax",          name: `${BRAND.name} Tax & Corporate`,           desc: "Captura, validación y comparación de identificadores fiscales y corporativos según la jurisdicción.", status: "disponible" },
  { id: "screening",    name: `${BRAND.name} Screening`,                 desc: "Sanciones, PEP, listas internas, jurisdicciones, noticias adversas y alertas reputacionales mediante fuentes autorizadas incluyendo OFAC.", status: "disponible" },
  { id: "docai",        name: `${BRAND.name} Document AI`,               desc: "Clasificación, extracción, vigencia, integridad, comparación y detección de inconsistencias en documentos.", status: "disponible" },
  { id: "risk",         name: `${BRAND.name} Risk Engine`,               desc: "Matrices, reglas, factores, ponderaciones, excepciones, niveles de riesgo y explicación de resultados.", status: "disponible" },
  { id: "cases",        name: `${BRAND.name} Case Manager`,              desc: "Bandejas, asignaciones, comentarios, solicitudes de aclaración, escalamiento, SLA, dictámenes y aprobaciones.", status: "disponible" },
  { id: "monitoring",   name: `${BRAND.name} Monitoring`,                desc: "Vencimientos, revisiones periódicas, cambios corporativos, re-screening, eventos y actualización del expediente.", status: "disponible" },
  { id: "transaction",  name: `${BRAND.name} Transaction Oversight`,     desc: "Reglas y alertas sobre comportamiento u operaciones cuando existan datos e integraciones disponibles.", status: "disponible" },
  { id: "credit",       name: `${BRAND.name} Credit Review`,             desc: "Análisis de estados financieros, capacidad de pago, deuda, garantías, contratos y preparación del expediente para la decisión del cliente.", status: "disponible" },
  { id: "investor",     name: `${BRAND.name} Investor Due Diligence`,    desc: "Revisión de promotores, empresas, fondos, coinversionistas, origen de recursos, riesgos y data room.", status: "disponible" },
  { id: "regulatory",   name: `${BRAND.name} Regulatory Workspace`,      desc: "Expedientes, evidencias, reportes y flujos configurables para responsables, auditores y supervisores.", status: "disponible" },
  { id: "audit",        name: `${BRAND.name} Audit & Governance`,        desc: "Bitácora, control de versiones, segregación de funciones, evidencia de reglas y trazabilidad de decisiones.", status: "disponible" },
  { id: "connect",      name: `${BRAND.name} Connect`,                   desc: "API, webhooks e integraciones con registros, proveedores de identidad, listas, firma, CRM, core y almacenamiento.", status: "disponible" },
];

const STATUS_COLORS = {
  disponible: { bg: "#E8F5E9", color: "#2E7D32", label: "Disponible" },
  proximo:    { bg: "#FFF8E1", color: "#B45309", label: "Próximamente" },
  planificado:{ bg: "#F5F7FA", color: "#6B6560", label: "Planificado" },
};

export default function PlataformaPage() {
  const navigate = useNavigate();

  return (
    <div style={{ background: "#F2EFE9", minHeight: "100vh" }}>
      {/* Hero */}
      <section
        style={{
          background: `linear-gradient(135deg, ${COLORS.navy} 0%, #0F2D4A 100%)`,
          padding: "5rem 2rem 4rem",
          textAlign: "center",
        }}
      >
        <p style={{ color: COLORS.gold, fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1rem" }}>
          {BRAND.legalName}
        </p>
        <h1 style={{ color: "#fff", fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 700, lineHeight: 1.2, maxWidth: "700px", margin: "0 auto 1.25rem" }}>
          Una plataforma. Dieciséis módulos. Un expediente institucional.
        </h1>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "1.05rem", maxWidth: "620px", margin: "0 auto 2rem", lineHeight: 1.65 }}>
          Incorpore, verifique, evalúe, decida y monitoree en un solo entorno trazable, configurable y preparado para operaciones multijurisdiccionales.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => navigate("/contacto")} style={{ background: COLORS.gold, color: COLORS.navy, border: "none", borderRadius: "8px", padding: "0.85rem 2rem", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer" }}>
            Conocer la plataforma →
          </button>
          <button onClick={() => navigate("/cobertura-global")} style={{ background: "transparent", color: "#fff", border: "2px solid rgba(255,255,255,0.4)", borderRadius: "8px", padding: "0.85rem 2rem", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer" }}>
            Ver cobertura global
          </button>
        </div>
      </section>

      {/* Ciclo */}
      <section style={{ padding: "3rem 2rem 1rem", maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
        <p style={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.gold, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
          CICLO DEL EXPEDIENTE
        </p>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap", alignItems: "center" }}>
          {["Incorporar", "Verificar", "Evaluar", "Decidir", "Monitorear"].map((step, i, arr) => (
            <React.Fragment key={step}>
              <span style={{ background: COLORS.navy, color: "#fff", borderRadius: "20px", padding: "0.4rem 1rem", fontSize: "0.88rem", fontWeight: 600 }}>
                {step}
              </span>
              {i < arr.length - 1 && <span style={{ color: COLORS.gold, fontWeight: 700 }}>→</span>}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* Módulos */}
      <section style={{ padding: "2rem 2rem 4rem", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
          {MODULES.map((mod) => {
            const st = STATUS_COLORS[mod.status];
            return (
              <div key={mod.id} style={{ background: "#fff", borderRadius: "12px", padding: "1.5rem", border: "1px solid rgba(27,58,92,0.08)", boxShadow: "0 2px 12px rgba(27,58,92,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.6rem" }}>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: COLORS.navy, margin: 0, flex: 1, paddingRight: "0.5rem" }}>
                    {mod.name}
                  </h3>
                  <span style={{ background: st.bg, color: st.color, fontSize: "0.68rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "12px", whiteSpace: "nowrap", flexShrink: 0 }}>
                    {st.label}
                  </span>
                </div>
                <p style={{ fontSize: "0.85rem", color: COLORS.textMuted, lineHeight: 1.55, margin: 0 }}>
                  {mod.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <Footer />
    </div>
  );
}
