import React from "react";
import { useNavigate } from "react-router-dom";
import { COLORS } from "../utils/constants";
import Footer from "../components/Landing/Footer";
import { BRAND } from "../config/brand";

const CATEGORIES = [
  {
    title: "Identidad y biometría",
    items: ["Liveness detection", "Reconocimiento facial", "NFC en documentos", "OCR de identificaciones", "Firma electrónica"],
  },
  {
    title: "Registros y fuentes oficiales",
    items: ["Registros mercantiles por país", "SAT / AFIP / SRI / SUNAT y equivalentes", "Registros de beneficiarios (UBO)", "Licencias y habilitaciones"],
  },
  {
    title: "Sanciones y listas",
    items: ["OFAC (SDN, Consolidated)", "ONU / CSNU", "OSFI (Canadá)", "OFSI (Reino Unido)", "EU Consolidated List", "Listas locales por jurisdicción"],
  },
  {
    title: "Buró de crédito",
    items: ["Equifax (LATAM, CA, US)", "TransUnion (LATAM, US)", "Experian (LATAM)", "Burós locales por país", "AECB (EAU)"],
  },
  {
    title: "Core bancario y ERP",
    items: ["API REST / Webhooks", "Temenos", "Finastra", "SAP (vía adaptador)", "Sistemas propietarios"],
  },
  {
    title: "Almacenamiento y firma",
    items: ["AWS S3 / Azure Blob / GCP Storage", "Firma electrónica avanzada", "Timestamp legal", "Almacenamiento seguro de evidencias"],
  },
];

export default function IntegracionesPage() {
  const navigate = useNavigate();

  return (
    <div style={{ background: "#F2EFE9", minHeight: "100vh" }}>
      <section style={{ background: `linear-gradient(135deg, ${COLORS.navy} 0%, #0F2D4A 100%)`, padding: "5rem 2rem 4rem", textAlign: "center" }}>
        <p style={{ color: COLORS.gold, fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1rem" }}>
          {BRAND.name} CONNECT — INTEGRACIONES
        </p>
        <h1 style={{ color: "#fff", fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 700, lineHeight: 1.2, maxWidth: "700px", margin: "0 auto 1.25rem" }}>
          Conecte {BRAND.name} con sus fuentes, registros y sistemas
        </h1>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "1.05rem", maxWidth: "620px", margin: "0 auto 2rem", lineHeight: 1.65 }}>
          API pública, webhooks e integraciones con proveedores de identidad, registros, listas, firma, CRM, core y almacenamiento. La disponibilidad depende de la jurisdicción y el módulo contratado.
        </p>
        <button onClick={() => navigate("/contacto")} style={{ background: COLORS.gold, color: COLORS.navy, border: "none", borderRadius: "8px", padding: "0.85rem 2rem", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer" }}>
          Consultar integraciones disponibles →
        </button>
      </section>

      <section style={{ padding: "4rem 2rem", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
          {CATEGORIES.map((cat) => (
            <div key={cat.title} style={{ background: "#fff", borderRadius: "12px", padding: "1.5rem", border: "1px solid rgba(27,58,92,0.08)" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: COLORS.navy, marginBottom: "1rem", paddingBottom: "0.6rem", borderBottom: `2px solid ${COLORS.gold}` }}>
                {cat.title}
              </h3>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {cat.items.map((item) => (
                  <li key={item} style={{ fontSize: "0.87rem", color: COLORS.textMuted, marginBottom: "0.45rem", paddingLeft: "0.75rem", borderLeft: `2px solid rgba(27,58,92,0.12)` }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p style={{ marginTop: "2rem", fontSize: "0.8rem", color: COLORS.textMuted, fontStyle: "italic" }}>
          La disponibilidad de cada fuente, registro o conector depende de la jurisdicción, el proveedor, los permisos regulatorios y los módulos habilitados en su contrato.
        </p>
      </section>

      <Footer />
    </div>
  );
}
