import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { COLORS } from "../utils/constants";

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";

  return (
    <div style={{
      minHeight: "calc(100vh - 72px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: COLORS.bg,
      padding: "2rem",
      textAlign: "center",
    }}>
      <div>
        <p style={{
          fontSize: "7rem", fontWeight: 900, lineHeight: 1,
          color: "rgba(27,58,92,0.08)",
          fontFamily: "'Playfair Display', Georgia, serif",
          marginBottom: "-1rem",
        }}>
          404
        </p>
        <h1 style={{
          color: COLORS.navy, fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
          fontWeight: 800, marginBottom: "1rem",
          fontFamily: "'Playfair Display', Georgia, serif",
        }}>
          {isEn ? "Page not found" : "Página no encontrada"}
        </h1>
        <p style={{ color: COLORS.textMuted, fontSize: "1.05rem", maxWidth: "400px", margin: "0 auto 2.5rem", lineHeight: 1.7 }}>
          {isEn
            ? "The page you're looking for doesn't exist or has been moved."
            : "La página que buscas no existe o fue movida."}
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/")}
            style={{
              padding: "0.8rem 2rem", fontWeight: 700,
              background: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldLight})`,
              color: COLORS.navy, border: "none", borderRadius: "8px",
              cursor: "pointer", fontSize: "0.95rem",
              boxShadow: "0 4px 16px rgba(201,168,76,0.3)",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => e.target.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.target.style.transform = "translateY(0)"}
          >
            {isEn ? "← Back to Home" : "← Volver al inicio"}
          </button>
          <button
            onClick={() => navigate("/contact")}
            style={{
              padding: "0.8rem 2rem", fontWeight: 600,
              background: "transparent", color: COLORS.navy,
              border: `1.5px solid ${COLORS.border}`, borderRadius: "8px",
              cursor: "pointer", fontSize: "0.95rem",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.gold}
            onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.border}
          >
            {isEn ? "Contact us" : "Contacto"}
          </button>
        </div>
      </div>
    </div>
  );
}
