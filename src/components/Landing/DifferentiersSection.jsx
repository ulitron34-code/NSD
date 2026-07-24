import React from "react";
import { useTranslation } from "react-i18next";
import Icon from "../common/icons";
import { BRAND } from "../../config/brand";

const icons = ["target", "checklist", "network", "microscope"];
const numbers = ["01", "02", "03", "04"];

export default function DifferentiersSection() {
  const { t } = useTranslation();
  const items = t("differentiators.items", { returnObjects: true });

  return (
    <section style={{ padding: "6rem 2rem", background: "white" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <p style={{
            color: "#C9A84C", fontWeight: 700, fontSize: "0.8rem",
            letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.75rem",
          }}>
            {t("differentiators.eyebrow", { brand: BRAND.name })}
          </p>
          <h2 style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", color: "#1B3A5C", fontWeight: 800 }}>
            {t("differentiators.title")}
          </h2>
          <p style={{ color: "#6B6560", maxWidth: "600px", margin: "1rem auto 0", fontSize: "1.05rem", lineHeight: 1.7 }}>
            {t("differentiators.subtitle")}
          </p>
        </div>

        <img
          src="/img-team.jpg"
          alt={t("differentiators.title")}
          style={{
            width: "100%", maxHeight: "360px", objectFit: "cover",
            borderRadius: "20px", marginBottom: "3rem",
            boxShadow: "0 20px 48px rgba(27,58,92,0.14)",
          }}
        />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem" }}>
          {items.map((diff, i) => (
            <div
              key={i}
              style={{
                background: "#F2EFE9",
                padding: "2rem",
                borderRadius: "16px",
                border: "1px solid rgba(27,58,92,0.08)",
                transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
                cursor: "default",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.boxShadow = "0 20px 40px rgba(27,58,92,0.15)";
                e.currentTarget.style.background = "white";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.background = "#F2EFE9";
              }}
            >
              <p style={{
                position: "absolute", top: "1.5rem", right: "1.5rem",
                fontSize: "2.5rem", fontWeight: 900,
                color: "rgba(201,168,76,0.12)", lineHeight: 1,
              }}>
                {numbers[i]}
              </p>

              <div style={{
                width: "48px", height: "48px", borderRadius: "12px",
                background: "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: "1.25rem",
                border: "1px solid rgba(201,168,76,0.2)",
              }}>
                <Icon name={icons[i]} size={24} color="#C9A84C" />
              </div>

              <h3 style={{ color: "#1B3A5C", fontWeight: 700, marginBottom: "0.75rem", fontSize: "1.05rem" }}>
                {diff.titulo}
              </h3>
              <p style={{ color: "#6B6560", fontSize: "0.92rem", lineHeight: 1.7 }}>
                {diff.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
