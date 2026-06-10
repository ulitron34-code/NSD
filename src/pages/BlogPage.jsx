import React, { useState } from "react";
import { COLORS } from "../utils/constants";
import Footer from "../components/Landing/Footer";

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState("todos");

  const articles = [
    {
      id: 1,
      title: "Como preparar un expediente auditable",
      excerpt: "Criterios practicos para reducir observaciones y acelerar revisiones internas.",
      category: "expedientes",
      date: "15 May 2026",
      readTime: "5 min",
      author: "Ana Garcia",
      image: "EX",
    },
    {
      id: 2,
      title: "Guia completa: KYC/KYB para empresas",
      excerpt: "Flujos, documentos y controles para evaluar personas, empresas y beneficiarios finales.",
      category: "compliance",
      date: "12 May 2026",
      readTime: "8 min",
      author: "Carlos Lopez",
      image: "KY",
    },
    {
      id: 3,
      title: "5 errores comunes en revision documental",
      excerpt: "Hallazgos frecuentes que generan retrasos, riesgo operativo o retrabajo.",
      category: "expedientes",
      date: "10 May 2026",
      readTime: "6 min",
      author: "Ulises Salgado",
      image: "AL",
    },
    {
      id: 4,
      title: "Tendencias de cumplimiento 2026",
      excerpt: "Automatizacion, trazabilidad y evidencia como base de equipos compliance modernos.",
      category: "tendencias",
      date: "8 May 2026",
      readTime: "10 min",
      author: "Ana Garcia",
      image: "TR",
    },
    {
      id: 5,
      title: "Privacidad y auditoria: controles minimos",
      excerpt: "Buenas practicas para operar con datos sensibles, bitacoras y accesos por rol.",
      category: "seguridad",
      date: "5 May 2026",
      readTime: "12 min",
      author: "Carlos Lopez",
      image: "SE",
    },
  ];

  const categories = [
    { id: "todos", label: "Todos" },
    { id: "compliance", label: "Cumplimiento" },
    { id: "expedientes", label: "Expedientes" },
    { id: "seguridad", label: "Seguridad" },
    { id: "tendencias", label: "Tendencias" },
  ];

  const filtered = selectedCategory === "todos"
    ? articles
    : articles.filter((article) => article.category === selectedCategory);

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "4rem 2rem 2rem" }}>
        <h1 style={{
          color: COLORS.navy,
          fontSize: "2.5rem",
          marginBottom: "1rem",
          borderLeft: `4px solid ${COLORS.gold}`,
          paddingLeft: "1rem",
        }}>
          Blog y Recursos
        </h1>
        <p style={{ color: COLORS.textMuted, marginBottom: "3rem", fontSize: "1.1rem" }}>
          Guias sobre KYC/KYB, expedientes, auditoria, privacidad y operaciones de cumplimiento.
        </p>

        <div style={{ display: "flex", gap: "1rem", marginBottom: "3rem", flexWrap: "wrap" }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: "0.75rem 1.5rem",
                background: selectedCategory === cat.id ? COLORS.gold : COLORS.white,
                color: COLORS.navy,
                border: selectedCategory === cat.id ? "none" : `1px solid ${COLORS.border}`,
                borderRadius: "6px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "2rem", marginBottom: "3rem" }}>
          {filtered.map((article) => (
            <article key={article.id} style={{
              background: COLORS.white,
              borderRadius: "8px",
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}>
              <div style={{
                background: COLORS.bg,
                padding: "2rem",
                textAlign: "center",
                fontSize: "1.7rem",
                fontWeight: 800,
                color: COLORS.navy,
                borderBottom: `1px solid ${COLORS.border}`,
              }}>
                {article.image}
              </div>
              <div style={{ padding: "1.5rem" }}>
                <p style={{
                  color: COLORS.gold,
                  fontWeight: "600",
                  fontSize: "0.8rem",
                  marginBottom: "0.5rem",
                  textTransform: "uppercase",
                }}>
                  {article.category}
                </p>
                <h3 style={{ color: COLORS.navy, fontSize: "1.1rem", fontWeight: "700", marginBottom: "0.75rem" }}>
                  {article.title}
                </h3>
                <p style={{ color: COLORS.textMuted, fontSize: "0.9rem", marginBottom: "1rem", lineHeight: "1.6" }}>
                  {article.excerpt}
                </p>
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
            </article>
          ))}
        </div>

        <div style={{
          background: `linear-gradient(135deg, ${COLORS.navy} 0%, ${COLORS.navyLight} 100%)`,
          color: COLORS.white,
          padding: "3rem",
          borderRadius: "8px",
          textAlign: "center",
          marginBottom: "3rem",
        }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: COLORS.white }}>
            Recibe nuestro newsletter
          </h2>
          <p style={{ marginBottom: "2rem", opacity: 0.9 }}>
            Buenas practicas de cumplimiento directamente en tu inbox.
          </p>
          <div className="case-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", maxWidth: "500px", margin: "0 auto" }}>
            <input type="email" placeholder="tu@email.com" />
            <button style={{
              padding: "0.75rem 2rem",
              background: COLORS.gold,
              color: COLORS.navy,
              border: "none",
              borderRadius: "6px",
              fontWeight: "700",
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
