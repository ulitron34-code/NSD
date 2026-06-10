import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { COLORS } from "../utils/constants";

export default function ForApplicantsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const steps = t("forApplicants.steps", { returnObjects: true });
  const deliverables = t("forApplicants.deliverables", { returnObjects: true });

  return (
    <main style={{ minHeight: "100vh", background: COLORS.bg }}>
      <section style={{ background: COLORS.white, padding: "5rem 2rem 3rem", borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
          <p style={{ color: COLORS.gold, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 900, marginBottom: "0.75rem" }}>{t("forApplicants.eyebrow")}</p>
          <h1 style={{ color: COLORS.navy, fontSize: "clamp(2rem, 4vw, 3.4rem)", lineHeight: 1.1, marginBottom: "1rem" }}>{t("forApplicants.title")}</h1>
          <p style={{ color: COLORS.textMuted, maxWidth: "780px", lineHeight: 1.7, fontSize: "1rem" }}>{t("forApplicants.description")}</p>
        </div>
      </section>
      <section style={{ padding: "3rem 2rem" }}>
        <div style={{ maxWidth: "1120px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
          {steps.map(([title, detail], index) => <article key={title} style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "1.2rem" }}><p style={{ color: COLORS.gold, fontWeight: 900, fontSize: "0.78rem", marginBottom: "0.35rem" }}>0{index + 1}</p><h2 style={{ color: COLORS.navy, fontSize: "1.05rem", marginBottom: "0.4rem" }}>{title}</h2><p style={{ color: COLORS.textMuted, lineHeight: 1.55, fontSize: "0.88rem" }}>{detail}</p></article>)}
        </div>
      </section>
      <section style={{ padding: "0 2rem 3rem" }}>
        <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
          <h2 style={{ color: COLORS.navy, fontSize: "1.6rem", marginBottom: "1rem" }}>{t("forApplicants.deliverablesTitle")}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
            {deliverables.map(([title, detail]) => <article key={title} style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "1.2rem" }}><h3 style={{ color: COLORS.navy, fontSize: "1rem", marginBottom: "0.4rem" }}>{title}</h3><p style={{ color: COLORS.textMuted, lineHeight: 1.55, fontSize: "0.88rem" }}>{detail}</p></article>)}
          </div>
        </div>
      </section>
      <section style={{ padding: "0 2rem 5rem" }}>
        <div style={{ maxWidth: "1120px", margin: "0 auto", background: COLORS.navy, color: COLORS.white, borderRadius: "8px", padding: "1.5rem", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          <div><p style={{ color: COLORS.gold, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.35rem" }}>{t("forApplicants.next")}</p><h2 style={{ fontSize: "1.35rem", marginBottom: "0.35rem" }}>{t("forApplicants.ctaTitle")}</h2><p style={{ color: "rgba(255,255,255,0.78)", lineHeight: 1.55, maxWidth: "680px" }}>{t("forApplicants.ctaText")}</p></div>
          <button onClick={() => navigate("/services")} style={{ background: COLORS.gold, color: COLORS.navy, border: 0, borderRadius: "8px", padding: "0.85rem 1rem", fontWeight: 900, cursor: "pointer" }}>{t("forApplicants.ctaButton")}</button>
        </div>
      </section>
    </main>
  );
}
