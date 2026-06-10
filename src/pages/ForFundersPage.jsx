import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { COLORS } from "../utils/constants";

export default function ForFundersPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const controls = t("forFunders.controls", { returnObjects: true });
  const operatingFlow = t("forFunders.flow", { returnObjects: true });
  const riskSignals = t("forFunders.signals", { returnObjects: true });

  return (
    <main style={{ minHeight: "100vh", background: COLORS.bg }}>
      <section style={{ background: COLORS.white, padding: "5rem 2rem 3rem", borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
          <p style={{ color: COLORS.gold, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 900, marginBottom: "0.75rem" }}>{t("forFunders.eyebrow")}</p>
          <h1 style={{ color: COLORS.navy, fontSize: "clamp(2rem, 4vw, 3.4rem)", lineHeight: 1.1, marginBottom: "1rem" }}>{t("forFunders.title")}</h1>
          <p style={{ color: COLORS.textMuted, maxWidth: "780px", lineHeight: 1.7, fontSize: "1rem" }}>{t("forFunders.description")}</p>
        </div>
      </section>
      <section style={{ padding: "3rem 2rem" }}><div style={{ maxWidth: "1120px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>{controls.map(([title, detail]) => <article key={title} style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "1.2rem" }}><h2 style={{ color: COLORS.navy, fontSize: "1.05rem", marginBottom: "0.4rem" }}>{title}</h2><p style={{ color: COLORS.textMuted, lineHeight: 1.55, fontSize: "0.88rem" }}>{detail}</p></article>)}</div></section>
      <section style={{ padding: "0 2rem 3rem" }}><div style={{ maxWidth: "1120px", margin: "0 auto" }}><h2 style={{ color: COLORS.navy, fontSize: "1.6rem", marginBottom: "1rem" }}>{t("forFunders.flowTitle")}</h2><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>{operatingFlow.map(([title, detail]) => <article key={title} style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "1.2rem" }}><h3 style={{ color: COLORS.navy, fontSize: "1rem", marginBottom: "0.4rem" }}>{title}</h3><p style={{ color: COLORS.textMuted, lineHeight: 1.55, fontSize: "0.88rem" }}>{detail}</p></article>)}</div></div></section>
      <section style={{ padding: "0 2rem 3rem" }}><div style={{ maxWidth: "1120px", margin: "0 auto", background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "1.5rem" }}><h2 style={{ color: COLORS.navy, fontSize: "1.5rem", marginBottom: "0.75rem" }}>{t("forFunders.signalsTitle")}</h2><p style={{ color: COLORS.textMuted, lineHeight: 1.6, maxWidth: "820px", marginBottom: "1.2rem" }}>{t("forFunders.signalsText")}</p><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.85rem" }}>{riskSignals.map(([title, detail]) => <div key={title} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "1rem" }}><p style={{ color: COLORS.navy, fontWeight: 900, marginBottom: "0.35rem" }}>{title}</p><p style={{ color: COLORS.textMuted, fontSize: "0.84rem", lineHeight: 1.5 }}>{detail}</p></div>)}</div></div></section>
      <section style={{ padding: "0 2rem 5rem" }}><div style={{ maxWidth: "1120px", margin: "0 auto", background: COLORS.navy, color: COLORS.white, borderRadius: "8px", padding: "1.5rem", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}><div><p style={{ color: COLORS.gold, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.35rem" }}>{t("forFunders.institutionalView")}</p><h2 style={{ fontSize: "1.35rem", marginBottom: "0.35rem" }}>{t("forFunders.ctaTitle")}</h2><p style={{ color: "rgba(255,255,255,0.78)", lineHeight: 1.55, maxWidth: "680px" }}>{t("forFunders.ctaText")}</p></div><button onClick={() => navigate("/dashboard")} style={{ background: COLORS.gold, color: COLORS.navy, border: 0, borderRadius: "8px", padding: "0.85rem 1rem", fontWeight: 900, cursor: "pointer" }}>{t("forFunders.ctaButton")}</button></div></section>
    </main>
  );
}
