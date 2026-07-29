import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { COLORS } from "../utils/constants";
import Footer from "../components/Landing/Footer";
import { BRAND } from "../config/brand";

function copyByLanguage(isEnglish, es, en) {
  return isEnglish ? en : es;
}

function buildModules(t) {
  return [
    { id: "onboarding", name: `${BRAND.name} Global Onboarding`, desc: t("Incorporación digital, consentimiento, cuestionarios dinámicos, carga documental, recordatorios y estatus por país, tipo de persona, producto y riesgo.", "Digital onboarding, consent, dynamic questionnaires, document upload, reminders and status by country, person type, product and risk."), status: "available" },
    { id: "kyc", name: `${BRAND.name} Identity - KYC`, desc: t("Identificación de personas, documentos oficiales, domicilio, residencia fiscal, actividad, representación y evidencias.", "Person identification, official documents, address, tax residency, activity, representation and evidence."), status: "available" },
    { id: "kyb", name: `${BRAND.name} Business - KYB`, desc: t("Verificación de empresas, constitución, registros, licencias, accionistas, administradores, representantes y situación corporativa.", "Business verification, incorporation, registries, licenses, shareholders, officers, representatives and corporate standing."), status: "available" },
    { id: "ownership", name: `${BRAND.name} Ownership`, desc: t("Mapeo de beneficiarios finales, control directo o indirecto, cadenas de propiedad, fideicomisos y relaciones entre entidades.", "Beneficial ownership mapping, direct or indirect control, ownership chains, trusts and entity relationships."), status: "available" },
    { id: "tax", name: `${BRAND.name} Tax & Corporate`, desc: t("Captura, validación y comparación de identificadores fiscales y corporativos según la jurisdicción.", "Capture, validation and comparison of tax and corporate identifiers by jurisdiction."), status: "available" },
    { id: "screening", name: `${BRAND.name} Screening`, desc: t("Sanciones, PEP, listas internas, jurisdicciones, noticias adversas y alertas reputacionales mediante fuentes autorizadas incluyendo OFAC.", "Sanctions, PEP, internal lists, jurisdictions, adverse media and reputational alerts from authorized sources including OFAC."), status: "available" },
    { id: "docai", name: `${BRAND.name} Document AI`, desc: t("Clasificación, extracción, vigencia, integridad, comparación y detección de inconsistencias en documentos.", "Classification, extraction, validity, completeness, comparison and inconsistency detection across documents."), status: "available" },
    { id: "risk", name: `${BRAND.name} Risk Engine`, desc: t("Matrices, reglas, factores, ponderaciones, excepciones, niveles de riesgo y explicación de resultados.", "Matrices, rules, factors, weights, exceptions, risk levels and explainable results."), status: "available" },
    { id: "cases", name: `${BRAND.name} Case Manager`, desc: t("Bandejas, asignaciones, comentarios, solicitudes de aclaración, escalamiento, SLA, dictámenes y aprobaciones.", "Work queues, assignments, comments, clarification requests, escalations, SLAs, opinions and approvals."), status: "available" },
    { id: "monitoring", name: `${BRAND.name} Monitoring`, desc: t("Vencimientos, revisiones periódicas, cambios corporativos, re-screening, eventos y actualización del expediente.", "Expirations, periodic reviews, corporate changes, re-screening, events and file updates."), status: "available" },
    { id: "transaction", name: `${BRAND.name} Transaction Oversight`, desc: t("Reglas y alertas sobre comportamiento u operaciones cuando existan datos e integraciones disponibles.", "Rules and alerts for behavior or transactions when data and integrations are available."), status: "available" },
    { id: "credit", name: `${BRAND.name} Credit Review`, desc: t("Análisis de estados financieros, capacidad de pago, deuda, garantías, contratos y preparación del expediente para la decisión del cliente.", "Financial statement analysis, repayment capacity, debt, guarantees, contracts and file preparation for the client's decision."), status: "available" },
    { id: "investor", name: `${BRAND.name} Investor Due Diligence`, desc: t("Revisión de promotores, empresas, fondos, coinversionistas, origen de recursos, riesgos y data room.", "Review of sponsors, companies, funds, co-investors, source of funds, risks and data room."), status: "available" },
    { id: "regulatory", name: `${BRAND.name} Regulatory Workspace`, desc: t("Expedientes, evidencias, reportes y flujos configurables para responsables, auditores y supervisores.", "Files, evidence, reports and configurable workflows for officers, auditors and supervisors."), status: "available" },
    { id: "audit", name: `${BRAND.name} Audit & Governance`, desc: t("Bitácora, control de versiones, segregación de funciones, evidencia de reglas y trazabilidad de decisiones.", "Audit trail, version control, segregation of duties, rule evidence and decision traceability."), status: "available" },
    { id: "connect", name: `${BRAND.name} Connect`, desc: t("API, webhooks e integraciones con registros, proveedores de identidad, listas, firma, CRM, core y almacenamiento.", "APIs, webhooks and integrations with registries, identity providers, lists, e-signature, CRM, core systems and storage."), status: "available" },
  ];
}

function buildStatusLabels(t) {
  return {
    available: { bg: "#E8F5E9", color: "#2E7D32", label: t("Disponible", "Available") },
    next: { bg: "#FFF8E1", color: "#B45309", label: t("Próximamente", "Coming soon") },
    planned: { bg: "#F5F7FA", color: "#6B6560", label: t("Planificado", "Planned") },
  };
}

export default function PlataformaPage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isEnglish = i18n.language?.startsWith("en");
  const t = (es, en) => copyByLanguage(isEnglish, es, en);
  const modules = buildModules(t);
  const statusLabels = buildStatusLabels(t);
  const lifecycleSteps = isEnglish
    ? ["Onboard", "Verify", "Assess", "Decide", "Monitor"]
    : ["Incorporar", "Verificar", "Evaluar", "Decidir", "Monitorear"];

  return (
    <div style={{ background: "#F2EFE9", minHeight: "100vh" }}>
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
          {t("Una plataforma. Dieciséis módulos. Un expediente institucional.", "One platform. Sixteen modules. One institutional file.")}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "1.05rem", maxWidth: "620px", margin: "0 auto 2rem", lineHeight: 1.65 }}>
          {t("Incorpore, verifique, evalúe, decida y monitoree en un solo entorno trazable, configurable y preparado para operaciones multijurisdiccionales.", "Onboard, verify, assess, decide and monitor in one traceable, configurable environment built for multi-jurisdiction operations.")}
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => navigate("/contacto")} style={{ background: COLORS.gold, color: COLORS.navy, border: "none", borderRadius: "8px", padding: "0.85rem 2rem", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer" }}>
            {t("Conocer la plataforma", "Explore the platform")} →
          </button>
          <button onClick={() => navigate("/cobertura-global")} style={{ background: "transparent", color: "#fff", border: "2px solid rgba(255,255,255,0.4)", borderRadius: "8px", padding: "0.85rem 2rem", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer" }}>
            {t("Ver cobertura global", "View global coverage")}
          </button>
        </div>
      </section>

      <section style={{ padding: "3rem 2rem 1rem", maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
        <p style={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.gold, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
          {t("CICLO DEL EXPEDIENTE", "FILE LIFECYCLE")}
        </p>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap", alignItems: "center" }}>
          {lifecycleSteps.map((step, i, arr) => (
            <React.Fragment key={step}>
              <span style={{ background: COLORS.navy, color: "#fff", borderRadius: "20px", padding: "0.4rem 1rem", fontSize: "0.88rem", fontWeight: 600 }}>
                {step}
              </span>
              {i < arr.length - 1 && <span style={{ color: COLORS.gold, fontWeight: 700 }}>→</span>}
            </React.Fragment>
          ))}
        </div>
      </section>

      <section style={{ padding: "2rem 2rem 4rem", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
          {modules.map((mod) => {
            const st = statusLabels[mod.status];
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
