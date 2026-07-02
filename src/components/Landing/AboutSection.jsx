import React from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../utils/constants";

export default function AboutSection() {
  const { t } = useTranslation();
  const values = t("about.values", { returnObjects: true });

  return (
    <section style={{ padding: "5rem 2rem", background: COLORS.white }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <h2 style={{
          color: COLORS.navy,
          fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
          marginBottom: "1.5rem",
          borderLeft: `4px solid ${COLORS.gold}`,
          paddingLeft: "1rem",
        }}>
          {t("about.title")}
        </h2>

        {/* Responsive: collapses to 1 col on mobile via min() trick */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 400px), 1fr))",
          gap: "3rem",
          marginBottom: "3rem",
          alignItems: "center",
        }}>
          <img
            src="/img-boardroom.jpg"
            alt={t("about.whoTitle")}
            style={{
              width: "100%", height: "100%", minHeight: "320px",
              objectFit: "cover", borderRadius: "16px",
              boxShadow: COLORS.shadowMd,
            }}
          />

          <div>
            <h3 style={{ color: COLORS.navy, fontSize: "1.4rem", marginBottom: "1rem" }}>
              {t("about.whoTitle")}
            </h3>
            <p style={{ color: COLORS.textMuted, lineHeight: "1.85", marginBottom: "1.5rem" }}>
              {t("about.whoText1")}
            </p>
            <p style={{ color: COLORS.textMuted, lineHeight: "1.85" }}>
              {t("about.whoText2")}
            </p>
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 400px), 1fr))",
          gap: "3rem",
          marginBottom: "3rem",
        }}>
          <div>
            <h3 style={{ color: COLORS.navy, fontSize: "1.4rem", marginBottom: "1rem" }}>
              {t("about.missionTitle")}
            </h3>
            <p style={{
              color: COLORS.textMuted,
              lineHeight: "1.85",
              fontStyle: "italic",
              borderLeft: `4px solid ${COLORS.gold}`,
              paddingLeft: "1rem",
            }}>
              {t("about.missionText")}
            </p>
          </div>

          <div>
            <h3 style={{ color: COLORS.navy, fontSize: "1.4rem", marginBottom: "1rem" }}>
              {t("about.visionTitle")}
            </h3>
            <p style={{
              color: COLORS.textMuted,
              lineHeight: "1.85",
              fontStyle: "italic",
              borderLeft: `4px solid ${COLORS.gold}`,
              paddingLeft: "1rem",
            }}>
              {t("about.visionText")}
            </p>
          </div>
        </div>

        <div style={{ background: COLORS.bg, padding: "2.5rem", borderRadius: "12px" }}>
          <h3 style={{ color: COLORS.navy, fontSize: "1.2rem", marginBottom: "1.5rem" }}>
            {t("about.valuesTitle")}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
            {values.map((valor, i) => (
              <div key={i} style={{
                background: COLORS.white,
                padding: "1.25rem 1rem",
                borderRadius: "8px",
                textAlign: "center",
                borderLeft: `3px solid ${COLORS.gold}`,
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}>
                <p style={{ color: COLORS.navy, fontWeight: "600", fontSize: "0.9rem" }}>{valor}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
