import React from "react";
import { useTranslation } from "react-i18next";
import Icon from "../common/icons";

const icons = ["building", "construction", "institution", "heart", "graduationCap", "coin"];

export default function ClientsSection() {
  const { t } = useTranslation();
  const items = t("clients.items", { returnObjects: true });

  return (
    <section style={{ padding: "6rem 2rem", background: "white" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <p style={{ color: "#C9A84C", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
            {t("clients.eyebrow")}
          </p>
          <h2 style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", color: "#1B3A5C", fontWeight: 800 }}>
            {t("clients.title")}
          </h2>
          <p style={{ color: "#6B6560", maxWidth: "550px", margin: "1rem auto 0", fontSize: "1.05rem", lineHeight: 1.7 }}>
            {t("clients.subtitle")}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
          {items.map((cliente, i) => (
            <div
              key={i}
              style={{
                padding: "1.75rem",
                borderRadius: "14px",
                border: "1px solid rgba(27,58,92,0.09)",
                background: "#F2EFE9",
                transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
                display: "flex",
                gap: "1rem",
                alignItems: "flex-start",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "white";
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 12px 30px rgba(27,58,92,0.12)";
                e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "#F2EFE9";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = "rgba(27,58,92,0.09)";
              }}
            >
              <div style={{
                flexShrink: 0,
                width: "48px", height: "48px",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(201,168,76,0.1)", borderRadius: "10px",
                border: "1px solid rgba(201,168,76,0.2)",
              }}>
                <Icon name={icons[i]} size={24} color="#C9A84C" />
              </div>
              <div>
                <h3 style={{ color: "#1B3A5C", fontWeight: 700, marginBottom: "0.4rem", fontSize: "0.98rem" }}>
                  {cliente.titulo}
                </h3>
                <p style={{ color: "#6B6560", fontSize: "0.87rem", lineHeight: 1.6 }}>
                  {cliente.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
