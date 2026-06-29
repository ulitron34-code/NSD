import React, { useState } from "react";
import { COLORS } from "../utils/constants";
import Footer from "../components/Landing/Footer";

const JURISDICTIONS = [
  { code: "MX", name: "México", region: "LATAM", taxId: "RFC / CURP", documents: ["Constancia de situación fiscal", "INE o pasaporte", "Acta constitutiva", "Poderes notariales", "Beneficiario controlador"], creditBureau: "Buró de Crédito (TransUnion) / Círculo de Crédito", status: "available" },
  { code: "CO", name: "Colombia", region: "LATAM", taxId: "NIT (dentro del RUT)", documents: ["Cédula de ciudadanía", "Cámara de Comercio", "RUT", "Registro de Beneficiarios Finales"], creditBureau: "DataCrédito (Experian) / CIFIN (TransUnion)", status: "available" },
  { code: "AR", name: "Argentina", region: "LATAM", taxId: "CUIT / CDI", documents: ["DNI o pasaporte", "Constancia AFIP", "Estatuto", "IGJ"], creditBureau: "Veraz (Equifax) / Nosis", status: "available" },
  { code: "CL", name: "Chile", region: "LATAM", taxId: "RUT", documents: ["Cédula o pasaporte", "e-RUT", "Estatutos", "Registro de Empresas y Sociedades"], creditBureau: "Equifax Chile (Dicom) / Boletín Comercial", status: "available" },
  { code: "PE", name: "Perú", region: "LATAM", taxId: "RUC", documents: ["DNI o pasaporte", "Ficha RUC", "Partida SUNARP", "Poderes"], creditBureau: "Equifax Perú (Infocorp) / Sentinel", status: "available" },
  { code: "EC", name: "Ecuador", region: "LATAM", taxId: "RUC / Cédula", documents: ["Cédula o pasaporte", "Certificado SRI", "Superintendencia de Compañías", "Nombramientos"], creditBureau: "Equifax Ecuador / Central de Riesgos SB", status: "available" },
  { code: "BO", name: "Bolivia", region: "LATAM", taxId: "NIT", documents: ["Cédula o pasaporte", "Constancia SIN", "Matrícula SEPREC", "Escritura"], creditBureau: "Infocred", status: "available" },
  { code: "PY", name: "Paraguay", region: "LATAM", taxId: "RUC", documents: ["Cédula o pasaporte", "Constancia DNIT", "Registro Público", "Representantes"], creditBureau: "Informconf", status: "available" },
  { code: "UY", name: "Uruguay", region: "LATAM", taxId: "RUT", documents: ["Cédula o pasaporte", "Constancias DGI/BPS", "Estatutos", "Beneficiarios finales"], creditBureau: "Equifax Uruguay (Clearing)", status: "available" },
  { code: "PA", name: "Panamá", region: "LATAM", taxId: "RUC", documents: ["Cédula o pasaporte", "Aviso de operación", "Certificado Registro Público", "Pacto social"], creditBureau: "APC (Asociación Panameña de Crédito – Experian)", status: "available" },
  { code: "CR", name: "Costa Rica", region: "LATAM", taxId: "Cédula jurídica / NITE", documents: ["Cédula, DIMEX o pasaporte", "Constancia Hacienda", "Personería jurídica", "Beneficiarios"], creditBureau: "Equifax CR / CIC (SUGEF)", status: "available" },
  { code: "GT", name: "Guatemala", region: "LATAM", taxId: "NIT", documents: ["DPI o pasaporte", "Constancia RTU", "Patente", "Registro Mercantil"], creditBureau: "TransUnion Guatemala", status: "available" },
  { code: "HN", name: "Honduras", region: "LATAM", taxId: "RTN", documents: ["DNI o pasaporte", "Constancia SAR", "Escritura", "Representantes"], creditBureau: "TransUnion Honduras", status: "available" },
  { code: "SV", name: "El Salvador", region: "LATAM", taxId: "NIT / NRC", documents: ["DUI o pasaporte", "NIT digital", "Documentos CNR", "Representación"], creditBureau: "TransUnion El Salvador", status: "available" },
  { code: "DO", name: "Rep. Dominicana", region: "LATAM", taxId: "RNC", documents: ["Cédula o pasaporte", "Constancia DGII", "Registro Mercantil", "Beneficiarios"], creditBureau: "TransUnion RD (TuCrédito)", status: "available" },
  { code: "US", name: "Estados Unidos", region: "NA", taxId: "EIN / SSN / ITIN", documents: ["Pasaporte o licencia", "W-9 / W-8", "Articles of Formation", "Good Standing", "Ownership docs"], creditBureau: "Equifax, Experian, TransUnion", status: "available" },
  { code: "CA", name: "Canadá", region: "NA", taxId: "BN / SIN / ITN", documents: ["Identificación oficial", "Certificado de incorporación", "Registros CRA", "Beneficiarios FINTRAC"], creditBureau: "Equifax Canada / TransUnion Canada", status: "available" },
  { code: "AE", name: "Emiratos Árabes Unidos", region: "EAU", taxId: "TRN / Trade Licence / Emirates ID", documents: ["Pasaporte", "Emirates ID", "Licencia comercial", "CoI", "MOA", "UBO Declaration"], creditBureau: "Al Etihad Credit Bureau (AECB)", status: "available" },
];

const STATUS = {
  available:    { label: "Disponible",    color: "#2E7D32", bg: "#E8F5E9" },
  coming_soon:  { label: "Próximamente",  color: "#B45309", bg: "#FFF8E1" },
};

const REGIONS = ["Todos", "LATAM", "NA", "EAU"];

export default function GlobalCoveragePage() {
  const [region, setRegion] = useState("Todos");
  const [selected, setSelected] = useState(null);

  const filtered = region === "Todos" ? JURISDICTIONS : JURISDICTIONS.filter((j) => j.region === region);

  return (
    <div style={{ background: "#F2EFE9", minHeight: "100vh" }}>
      {/* Hero */}
      <section style={{ background: `linear-gradient(135deg, ${COLORS.navy} 0%, #0F2D4A 100%)`, padding: "5rem 2rem 4rem", textAlign: "center" }}>
        <p style={{ color: COLORS.gold, fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1rem" }}>
          COBERTURA GLOBAL
        </p>
        <h1 style={{ color: "#fff", fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 700, lineHeight: 1.2, maxWidth: "700px", margin: "0 auto 1.25rem" }}>
          Cobertura fiscal y corporativa multijurisdiccional
        </h1>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "1.05rem", maxWidth: "620px", margin: "0 auto", lineHeight: 1.65 }}>
          Identifique y organice personas y empresas con los documentos fiscales, corporativos y de identidad utilizados en cada jurisdicción.
        </p>
      </section>

      {/* Filtros */}
      <section style={{ padding: "2rem 2rem 0", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {REGIONS.map((r) => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              style={{
                padding: "0.45rem 1.1rem",
                borderRadius: "20px",
                border: region === r ? "none" : `1px solid rgba(27,58,92,0.2)`,
                background: region === r ? COLORS.navy : "#fff",
                color: region === r ? "#fff" : COLORS.navy,
                fontSize: "0.88rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </section>

      {/* Grid de países */}
      <section style={{ padding: "1.5rem 2rem 4rem", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
          {filtered.map((j) => {
            const st = STATUS[j.status];
            const isSelected = selected === j.code;
            return (
              <div
                key={j.code}
                onClick={() => setSelected(isSelected ? null : j.code)}
                style={{
                  background: "#fff",
                  borderRadius: "12px",
                  padding: "1.25rem",
                  border: isSelected ? `2px solid ${COLORS.navy}` : "1px solid rgba(27,58,92,0.08)",
                  cursor: "pointer",
                  boxShadow: isSelected ? "0 4px 20px rgba(27,58,92,0.15)" : "0 2px 10px rgba(27,58,92,0.05)",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                  <div>
                    <span style={{ fontSize: "1.5rem", marginRight: "0.5rem" }}>{j.code === "MX" ? "🇲🇽" : j.code === "CO" ? "🇨🇴" : j.code === "AR" ? "🇦🇷" : j.code === "CL" ? "🇨🇱" : j.code === "PE" ? "🇵🇪" : j.code === "EC" ? "🇪🇨" : j.code === "BO" ? "🇧🇴" : j.code === "PY" ? "🇵🇾" : j.code === "UY" ? "🇺🇾" : j.code === "PA" ? "🇵🇦" : j.code === "CR" ? "🇨🇷" : j.code === "GT" ? "🇬🇹" : j.code === "HN" ? "🇭🇳" : j.code === "SV" ? "🇸🇻" : j.code === "DO" ? "🇩🇴" : j.code === "US" ? "🇺🇸" : j.code === "CA" ? "🇨🇦" : "🇦🇪"}</span>
                    <strong style={{ fontSize: "1rem", color: COLORS.navy }}>{j.name}</strong>
                  </div>
                  <span style={{ background: st.bg, color: st.color, fontSize: "0.68rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "12px" }}>
                    {st.label}
                  </span>
                </div>
                <p style={{ fontSize: "0.8rem", color: COLORS.textMuted, margin: "0 0 0.5rem" }}>
                  <strong>Identificador:</strong> {j.taxId}
                </p>
                {isSelected && (
                  <>
                    <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(27,58,92,0.08)" }}>
                      <p style={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.4rem" }}>Documentos</p>
                      <ul style={{ margin: 0, paddingLeft: "1rem" }}>
                        {j.documents.map((d) => <li key={d} style={{ fontSize: "0.8rem", color: COLORS.text, marginBottom: "0.2rem" }}>{d}</li>)}
                      </ul>
                    </div>
                    <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(27,58,92,0.08)" }}>
                      <p style={{ fontSize: "0.75rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.25rem" }}>Buró de crédito</p>
                      <p style={{ fontSize: "0.8rem", color: COLORS.text, margin: 0 }}>{j.creditBureau}</p>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
        <p style={{ marginTop: "1.5rem", fontSize: "0.8rem", color: COLORS.textMuted, fontStyle: "italic" }}>
          El pasaporte vigente se acepta como documento de identidad válido en todas las jurisdicciones. La disponibilidad de validaciones automáticas depende de las fuentes, proveedores y módulos contratados.
        </p>
      </section>

      <Footer />
    </div>
  );
}
