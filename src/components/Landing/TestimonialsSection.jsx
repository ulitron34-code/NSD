import React from "react";

export default function TestimonialsSection() {
  const testimonials = [
    {
      company: "TechStartup XYZ",
      quote: "Con NSD logramos preparar nuestro expediente en 2 meses en lugar de 6. Conseguimos financiamiento de $2M de un family office europeo.",
      author: "CEO, TechStartup XYZ",
      sector: "Tecnología",
      avatar: "T",
      color: "#1B3A5C",
    },
    {
      company: "Desarrollos Inmobiliarios ABC",
      quote: "El rigor técnico y la estructura que NSD nos ayudó a armar fue crucial para cerrar una ronda de $5M con fondos de capital privado.",
      author: "Director Financiero",
      sector: "Real Estate",
      avatar: "D",
      color: "#C9A84C",
    },
    {
      company: "Asociación Civil de Impacto",
      quote: "NSD transformó nuestra propuesta de valor en números defendibles. Ahora somos elegibles para financiamiento de organismos multilaterales.",
      author: "Directora Ejecutiva",
      sector: "Impacto Social",
      avatar: "A",
      color: "#2E7D32",
    },
  ];

  return (
    <section style={{ padding: "6rem 2rem", background: "#F2EFE9" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <p style={{ color: "#C9A84C", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
            TESTIMONIOS
          </p>
          <h2 style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", color: "#1B3A5C", fontWeight: 800 }}>
            Lo que dicen nuestros clientes
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
          {testimonials.map((t, i) => (
            <div
              key={i}
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "2rem",
                border: "1px solid rgba(27,58,92,0.08)",
                transition: "all 0.3s",
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(27,58,92,0.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              {/* Stars */}
              <div style={{ color: "#C9A84C", fontSize: "1rem", letterSpacing: "2px" }}>★★★★★</div>

              {/* Quote */}
              <p style={{ color: "#1A1A1A", fontSize: "0.95rem", lineHeight: 1.8, fontStyle: "italic", flex: 1 }}>
                "{t.quote}"
              </p>

              {/* Author */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", paddingTop: "1rem", borderTop: "1px solid rgba(27,58,92,0.08)" }}>
                <div style={{
                  width: "42px", height: "42px", borderRadius: "50%",
                  background: t.color, display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", fontWeight: 800, fontSize: "1rem", flexShrink: 0,
                }}>
                  {t.avatar}
                </div>
                <div>
                  <p style={{ color: "#1B3A5C", fontWeight: 700, fontSize: "0.9rem" }}>{t.company}</p>
                  <p style={{ color: "#6B6560", fontSize: "0.8rem" }}>{t.author}</p>
                </div>
                <span style={{
                  marginLeft: "auto",
                  background: "rgba(201,168,76,0.1)", color: "#C9A84C",
                  fontSize: "0.72rem", fontWeight: 700, padding: "0.25rem 0.6rem",
                  borderRadius: "999px", border: "1px solid rgba(201,168,76,0.25)",
                  whiteSpace: "nowrap",
                }}>
                  {t.sector}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
