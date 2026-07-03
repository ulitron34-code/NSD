import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Icon from "../common/icons";

const TRUST_ICONS = ["shieldCheck", "bolt", "globe"];

export default function CTASection() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const trustItems = [t("cta.trust1"), t("cta.trust2"), t("cta.trust3")];

  return (
    <section style={{
      padding: "6rem 2rem",
      background: "linear-gradient(135deg, #0F1F2E 0%, #1B3A5C 60%, #2A527A 100%)",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: "600px", height: "400px",
        background: "radial-gradient(ellipse, rgba(201,168,76,0.1) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center", position: "relative" }}>
        <p style={{
          color: "#C9A84C", fontWeight: 700, fontSize: "0.78rem",
          letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "1rem",
        }}>
          {t("cta.eyebrow")}
        </p>
        <h2 style={{
          color: "white", fontSize: "clamp(2rem, 4vw, 3rem)",
          fontWeight: 800, lineHeight: 1.2, marginBottom: "1.25rem",
          whiteSpace: "pre-line",
        }}>
          {t("cta.title")}
        </h2>
        <p style={{
          color: "rgba(255,255,255,0.7)", fontSize: "1.1rem",
          lineHeight: 1.7, maxWidth: "550px", margin: "0 auto 2.5rem",
        }}>
          {t("cta.subtitle")}
        </p>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/signup")}
            style={{
              padding: "1rem 2.5rem", fontWeight: 700, fontSize: "1rem",
              background: "linear-gradient(135deg, #C9A84C, #E4C878)",
              color: "#1B3A5C", border: "none", borderRadius: "8px",
              cursor: "pointer", letterSpacing: "0.01em",
              boxShadow: "0 8px 24px rgba(201,168,76,0.4)",
              transition: "all 0.25s",
            }}
            onMouseEnter={e => { e.target.style.transform = "translateY(-3px)"; e.target.style.boxShadow = "0 14px 32px rgba(201,168,76,0.5)"; }}
            onMouseLeave={e => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 8px 24px rgba(201,168,76,0.4)"; }}
          >
            {t("cta.cta1")}
          </button>
          <button
            onClick={() => navigate("/contact")}
            style={{
              padding: "1rem 2.5rem", fontWeight: 600, fontSize: "1rem",
              background: "rgba(255,255,255,0.08)", color: "white",
              border: "1.5px solid rgba(255,255,255,0.25)", borderRadius: "8px",
              cursor: "pointer", backdropFilter: "blur(8px)",
              transition: "all 0.25s",
            }}
            onMouseEnter={e => { e.target.style.background = "rgba(255,255,255,0.16)"; }}
            onMouseLeave={e => { e.target.style.background = "rgba(255,255,255,0.08)"; }}
          >
            {t("cta.cta2")}
          </button>
        </div>

        <div style={{
          display: "flex", gap: "2.5rem", justifyContent: "center",
          marginTop: "3.5rem", flexWrap: "wrap",
        }}>
          {trustItems.map((item, i) => (
            <p key={i} style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", fontWeight: 500,
            }}>
              <Icon name={TRUST_ICONS[i]} size={16} color="#C9A84C" />
              {item}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
