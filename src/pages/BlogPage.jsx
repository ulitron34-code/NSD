import React, { useState } from "react";
import { COLORS } from "../utils/constants";
import Footer from "../components/Landing/Footer";

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState("todos");

  const articles = [
    {
      id: 1,
      title: "Cómo mejorar tu score crediticio en 30 días",
      excerpt: "Consejos prácticos para aumentar tu score y acceder a mejores tasas...",
      category: "finanzas",
      date: "15 May 2026",
      readTime: "5 min",
      author: "Ana García",
      image: "📊",
    },
    {
      id: 2,
      title: "Guía completa: KYC/KYB para startups",
      excerpt: "Todo lo que necesitas saber sobre procesos de cumplimiento normativo...",
      category: "compliance",
      date: "12 May 2026",
      readTime: "8 min",
      author: "Carlos López",
      image: "✓",
    },
    {
      id: 3,
      title: "5 errores comunes en expedientes financieros",
      excerpt: "Errores que pueden costar millones en financiamiento...",
      category: "finanzas",
      date: "10 May 2026",
      readTime: "6 min",
      author: "Ulises Salgado",
      image: "⚠️",
    },
    {
      id: 4,
      title: "Tendencias de financiamiento 2026",
      excerpt: "Cómo los family offices y fondos están cambiando sus criterios...",
      category: "tendencias",
      date: "8 May 2026",
      readTime: "10 min",
      author: "Ana García",
      image: "📈",
    },
    {
      id: 5,
      title: "LGPD vs GDPR: Diferencias y cumplimiento",
      excerpt: "Guía comparativa para estar en regla en México y UE...",
      category: "compliance",
      date: "5 May 2026",
      readTime: "12 min",
      author: "Carlos López",
      image: "🔐",
    },
  ];

  const categories = [
    {id: "todos", label: "Todos"},
    {id: "finanzas", label: "Finanzas"},
    {id: "compliance", label: "Cumplimiento"},
    {id: "tendencias", label: "Tendencias"},
  ];

  const filtered = selectedCategory === "todos"
    ? articles
    : articles.filter((a) => a.category === selectedCategory);

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
          Blog y Recursos
        </h1>
        <p style={{color: COLORS.textMuted, marginBottom: "3rem", fontSize: "1.1rem"}}>
          Aprende sobre finanzas, cumplimiento normativo y tendencias del mercado.
        </p>

        {/* Categories Filter */}
        <div style={{display: "flex", gap: "1rem", marginBottom: "3rem", flexWrap: "wrap"}}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: "0.75rem 1.5rem",
                background: selectedCategory === cat.id ? COLORS.gold : COLORS.white,
                color: selectedCategory === cat.id ? COLORS.navy : COLORS.navy,
                border: selectedCategory === cat.id ? "none" : `1px solid ${COLORS.border}`,
                borderRadius: "6px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => {
                if (selectedCategory !== cat.id) {
                  e.target.style.borderColor = COLORS.gold;
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCategory !== cat.id) {
                  e.target.style.borderColor = COLORS.border;
                }
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Articles Grid */}
        <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "2rem", marginBottom: "3rem"}}>
          {filtered.map((article) => (
            <div key={article.id} style={{
              background: COLORS.white,
              borderRadius: "8px",
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              transition: "transform 0.3s, box-shadow 0.3s",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-5px)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
            }}>
              {/* Image */}
              <div style={{
                background: COLORS.bg,
                padding: "2rem",
                textAlign: "center",
                fontSize: "3rem",
                borderBottom: `1px solid ${COLORS.border}`,
              }}>
                {article.image}
              </div>

              {/* Content */}
              <div style={{padding: "1.5rem"}}>
                <p style={{
                  color: COLORS.gold,
                  fontWeight: "600",
                  fontSize: "0.8rem",
                  marginBottom: "0.5rem",
                  textTransform: "uppercase",
                }}>
                  {article.category}
                </p>
                <h3 style={{
                  color: COLORS.navy,
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  marginBottom: "0.75rem",
                }}>
                  {article.title}
                </h3>
                <p style={{
                  color: COLORS.textMuted,
                  fontSize: "0.9rem",
                  marginBottom: "1rem",
                  lineHeight: "1.6",
                }}>
                  {article.excerpt}
                </p>

                {/* Meta */}
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: "1rem",
                  borderTop: `1px solid ${COLORS.border}`,
                  fontSize: "0.8rem",
                  color: COLORS.textMuted,
                }}>
                  <span>{article.date}</span>
                  <span>{article.readTime} lectura</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div style={{
          background: `linear-gradient(135deg, ${COLORS.navy} 0%, ${COLORS.navyLight} 100%)`,
          color: COLORS.white,
          padding: "3rem",
          borderRadius: "8px",
          textAlign: "center",
          marginBottom: "3rem",
        }}>
          <h2 style={{fontSize: "1.5rem", marginBottom: "1rem"}}>
            Recibe nuestro Newsletter
          </h2>
          <p style={{marginBottom: "2rem", opacity: 0.9}}>
            Las mejores prácticas financieras directamente en tu inbox
          </p>
          <div style={{display: "flex", gap: "1rem", maxWidth: "500px", margin: "0 auto"}}>
            <input
              type="email"
              placeholder="tu@email.com"
              style={{
                flex: 1,
                padding: "0.75rem 1rem",
                border: "none",
                borderRadius: "6px",
              }}
            />
            <button style={{
              padding: "0.75rem 2rem",
              background: COLORS.gold,
              color: COLORS.navy,
              border: "none",
              borderRadius: "6px",
              fontWeight: "600",
              cursor: "pointer",
            }}>
              Suscribirse
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
