import React from "react";
import { useTranslation } from "react-i18next";

const avatarColors = ["#1B3A5C", "#C9A84C", "#2E7D32"];
const avatarLetters = ["T", "D", "A"];

export default function TestimonialsSection() {
  const { t } = useTranslation();
  const items = t("testimonials.items", { returnObjects: true });

  return (
    <section style={{ padding: "6rem 2rem", background: "#F2EFE9" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <p style={{ color: "#C9A84C", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
            {t("testimonials.eyebrow")}
          </p>
          <h2 style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", color: "#1B3A5C", fontWeight: 800 }}>
            {t("testimonials.title")}
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
          {items.map((item, i) => (
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
              <div style={{ color: "#C9A84C", fontSize: "1rem", letterSpacing: "2px" }}>★★★★★</div>

              <p style={{ color: "#1A1A1A", fontSize: "0.95rem", lineHeight: 1.8, fontStyle: "italic", flex: 1 }}>
                "{item.quote}"
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", paddingTop: "1rem", borderTop: "1px solid rgba(27,58,92,0.08)" }}>
                <div style={{
                  width: "42px", height: "42px", borderRadius: "50%",
                  background: avatarColors[i], display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", fontWeight: 800, fontSize: "1rem", flexShrink: 0,
                }}>
                  {avatarLetters[i]}
                </div>
                <div>
                  <p style={{ color: "#1B3A5C", fontWeight: 700, fontSize: "0.9rem" }}>{item.company}</p>
                  <p style={{ color: "#6B6560", fontSize: "0.8rem" }}>{item.author}</p>
                </div>
                <span style={{
                  marginLeft: "auto",
                  background: "rgba(201,168,76,0.1)", color: "#C9A84C",
                  fontSize: "0.72rem", fontWeight: 700, padding: "0.25rem 0.6rem",
                  borderRadius: "999px", border: "1px solid rgba(201,168,76,0.25)",
                  whiteSpace: "nowrap",
                }}>
                  {item.sector}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
