import React from "react";
import { useNavigate } from "react-router-dom";
import { COLORS } from "../utils/constants";
import Footer from "../components/Landing/Footer";

const SECTIONS = [
  { title: "Blog y publicaciones", desc: "Análisis regulatorio, guías de cumplimiento y perspectivas sobre los mercados que atendemos.", link: "/blog", linkLabel: "Ver blog" },
  { title: "Certificaciones y estándares", desc: "Información sobre las certificaciones con las que opera la plataforma y los estándares aplicables.", link: "/certifications", linkLabel: "Ver certificaciones" },
  { title: "Documentación técnica", desc: "Guías de integración, referencia de API, esquemas de webhook y documentación del modelo de datos. Disponible para clientes.", link: null, linkLabel: null },
  { title: "Aviso legal", desc: "Alcance de la plataforma, limitaciones, jurisdicciones y condiciones de uso.", link: "/terms", linkLabel: "Leer aviso legal" },
  { title: "Privacidad y datos", desc: "Política de privacidad, tratamiento de datos personales y derechos ARCO.", link: "/privacy", linkLabel: "Leer política" },
];

export default function RecursosPage() {
  const navigate = useNavigate();

  return (
    <div style={{ background: "#F2EFE9", minHeight: "100vh" }}>
      <section style={{ background: `linear-gradient(135deg, ${COLORS.navy} 0%, #0F2D4A 100%)`, padding: "5rem 2rem 4rem", textAlign: "center" }}>
        <p style={{ color: COLORS.gold, fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1rem" }}>RECURSOS</p>
        <h1 style={{ color: "#fff", fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 700, lineHeight: 1.2, maxWidth: "700px", margin: "0 auto 1.25rem" }}>
          Documentación, guías y recursos regulatorios
        </h1>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "1.05rem", maxWidth: "620px", margin: "0 auto", lineHeight: 1.65 }}>
          Acceda a publicaciones, aviso legal, documentación de integración, certificaciones y políticas de privacidad.
        </p>
      </section>

      <section style={{ padding: "4rem 2rem", maxWidth: "860px", margin: "0 auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {SECTIONS.map((s) => (
            <div key={s.title} style={{ background: "#fff", borderRadius: "12px", padding: "1.5rem 2rem", border: "1px solid rgba(27,58,92,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: COLORS.navy, marginBottom: "0.4rem" }}>{s.title}</h3>
                <p style={{ fontSize: "0.88rem", color: COLORS.textMuted, margin: 0, lineHeight: 1.55 }}>{s.desc}</p>
              </div>
              {s.link ? (
                <button onClick={() => navigate(s.link)} style={{ background: "transparent", color: COLORS.navy, border: `1.5px solid ${COLORS.navy}`, borderRadius: "8px", padding: "0.55rem 1.25rem", fontSize: "0.87rem", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                  {s.linkLabel}
                </button>
              ) : (
                <span style={{ fontSize: "0.82rem", color: COLORS.textMuted, fontStyle: "italic", whiteSpace: "nowrap" }}>Solo clientes</span>
              )}
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
