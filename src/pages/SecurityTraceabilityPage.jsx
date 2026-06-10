import React from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../utils/constants";

export default function SecurityTraceabilityPage() {
  const { t } = useTranslation();
  const controlBlocks = t("securityPage.controls", { returnObjects: true });
  const operatingPrinciples = t("securityPage.principles", { returnObjects: true });

  return (
    <main style={{ background: COLORS.bg, minHeight: "100vh" }}>
      <section style={{ padding: "5rem 2rem 3rem", background: COLORS.white }}>
        <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
          <p style={{ color: COLORS.gold, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700 }}>{t("securityPage.eyebrow")}</p>
          <h1 style={{ color: COLORS.navy, fontSize: "clamp(2rem, 4vw, 3.6rem)", margin: "1rem 0", lineHeight: 1.1 }}>{t("securityPage.title")}</h1>
          <p style={{ color: COLORS.textMuted, maxWidth: "760px", lineHeight: 1.7, fontSize: "1.08rem" }}>{t("securityPage.description")}</p>
        </div>
      </section>
      <section style={{ padding: "3rem 2rem" }}><div style={{ maxWidth: "1120px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>{controlBlocks.map((block) => <article key={block.title} style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "1.5rem" }}><h2 style={{ color: COLORS.navy, fontSize: "1.2rem", marginBottom: "0.75rem" }}>{block.title}</h2><p style={{ color: COLORS.textMuted, lineHeight: 1.6 }}>{block.text}</p></article>)}</div></section>
      <section style={{ padding: "2rem 2rem 5rem" }}><div style={{ maxWidth: "1120px", margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 0.8fr)", gap: "1.5rem" }}><div style={{ background: COLORS.navy, color: COLORS.white, borderRadius: "8px", padding: "2rem" }}><h2 style={{ fontSize: "1.6rem", marginBottom: "1rem" }}>{t("securityPage.minimumTitle")}</h2><p style={{ color: "rgba(255,255,255,0.82)", lineHeight: 1.7 }}>{t("securityPage.minimumText")}</p></div><div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "2rem" }}><h2 style={{ color: COLORS.navy, fontSize: "1.35rem", marginBottom: "1rem" }}>{t("securityPage.principlesTitle")}</h2><ul style={{ margin: 0, paddingLeft: "1.2rem", color: COLORS.textMuted, lineHeight: 1.8 }}>{operatingPrinciples.map((item) => <li key={item}>{item}</li>)}</ul></div></div></section>
    </main>
  );
}
