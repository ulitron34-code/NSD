import React from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../utils/constants";

export default function AboutSection() {
  const { t } = useTranslation();
  const values = t("about.values", { returnObjects: true });

  return (
    <section style={{ padding: "5rem 2rem", background: COLORS.white, minHeight: "80vh" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <h2 style={{
          color: COLORS.navy,
          fontSize: "2.5rem",
          marginBottom: "1.5rem",
          borderLeft: `4px solid ${COLORS.gold}`,
          paddingLeft: "1rem",
        }}>
          {t("about.title")}
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", marginBottom: "3rem" }}>
          <div>
            <h3 style={{ color: COLORS.navy, fontSize: "1.5rem", marginBottom: "1rem" }}>
              {t("about.whoTitle")}
            </h3>
            <p style={{ color: COLORS.textMuted, lineHeight: "1.8", marginBottom: "1.5rem" }}>
              {t("about.whoText1")}
            </p>
            <p style={{ color: COLORS.textMuted, lineHeight: "1.8" }}>
              {t("about.whoText2")}
            </p>
          </div>

          <div>
            <h3 style={{ color: COLORS.navy, fontSize: "1.5rem", marginBottom: "1rem" }}>
              {t("about.missionTitle")}
            </h3>
            <p style={{
              color: COLORS.textMuted,
              lineHeight: "1.8",
              marginBottom: "2rem",
              fontStyle: "italic",
              borderLeft: `4px solid ${COLORS.gold}`,
              paddingLeft: "1rem",
            }}>
              {t("about.missionText")}
            </p>

            <h3 style={{ color: COLORS.navy, fontSize: "1.5rem", marginBottom: "1rem" }}>
              {t("about.visionTitle")}
            </h3>
            <p style={{
              color: COLORS.textMuted,
              lineHeight: "1.8",
              fontStyle: "italic",
              borderLeft: `4px solid ${COLORS.gold}`,
              paddingLeft: "1rem",
            }}>
              {t("about.visionText")}
            </p>
          </div>
        </div>

        <div style={{ background: COLORS.bg, padding: "2.5rem", borderRadius: "8px", marginBottom: "2rem" }}>
          <h3 style={{ color: COLORS.navy, fontSize: "1.3rem", marginBottom: "1.5rem" }}>
            {t("about.valuesTitle")}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1.5rem" }}>
            {values.map((valor, i) => (
              <div key={i} style={{
                background: COLORS.white,
                padding: "1.5rem",
                borderRadius: "6px",
                textAlign: "center",
                borderLeft: `3px solid ${COLORS.gold}`,
              }}>
                <p style={{ color: COLORS.navy, fontWeight: "600" }}>{valor}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
