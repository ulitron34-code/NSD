import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../utils/constants";

export default function PricingSection() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const plans = t("pricing.plans", { returnObjects: true });

  return (
    <section style={{ padding: "5rem 2rem", background: COLORS.bg, minHeight: "80vh" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <h2 style={{
          color: COLORS.navy,
          fontSize: "2.5rem",
          marginBottom: "1rem",
          borderLeft: `4px solid ${COLORS.gold}`,
          paddingLeft: "1rem",
        }}>
          {t("pricing.title")}
        </h2>
        <p style={{ color: COLORS.textMuted, marginBottom: "0.5rem", fontSize: "1.1rem" }}>
          {t("pricing.subtitle")}
        </p>
        <p style={{ color: COLORS.textMuted, marginBottom: "3rem", fontSize: "0.85rem" }}>
          * {t("pricing.currency")}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
          {plans.map((plan, i) => (
            <div key={i} style={{
              background: COLORS.white,
              padding: "2.5rem",
              borderRadius: "12px",
              border: plan.popular ? `2px solid ${COLORS.gold}` : `1px solid ${COLORS.border}`,
              position: "relative",
              transform: plan.popular ? "scale(1.05)" : "scale(1)",
              transition: "transform 0.3s",
              boxShadow: plan.popular ? "0 8px 24px rgba(0,0,0,0.12)" : "0 2px 8px rgba(0,0,0,0.08)",
            }}>
              {plan.popular && (
                <div style={{
                  position: "absolute",
                  top: "-12px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: COLORS.gold,
                  color: COLORS.navy,
                  padding: "0.5rem 1rem",
                  borderRadius: "20px",
                  fontWeight: "600",
                  fontSize: "0.8rem",
                }}>
                  {t("pricing.popular")}
                </div>
              )}

              <h3 style={{ color: COLORS.navy, fontSize: "1.5rem", marginBottom: "0.5rem", fontWeight: "600" }}>
                {plan.name}
              </h3>
              <p style={{ color: COLORS.textMuted, fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                {plan.desc}
              </p>

              <div style={{ marginBottom: "1.5rem" }}>
                <span style={{ color: COLORS.navy, fontWeight: "700", fontSize: "2.5rem" }}>
                  {plan.price}
                </span>
                <span style={{ color: COLORS.textMuted, fontSize: "1rem" }}>
                  {plan.period}
                </span>
              </div>

              <button
                onClick={() => navigate("/signup")}
                style={{
                  width: "100%",
                  padding: "0.9rem",
                  background: plan.popular ? COLORS.gold : "transparent",
                  color: plan.popular ? COLORS.navy : COLORS.gold,
                  border: plan.popular ? "none" : `2px solid ${COLORS.gold}`,
                  borderRadius: "6px",
                  fontWeight: "600",
                  cursor: "pointer",
                  marginBottom: "2rem",
                  transition: "all 0.3s",
                }}
                onMouseEnter={e => { e.target.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.target.style.transform = "translateY(0)"; }}
              >
                {plan.cta}
              </button>

              <ul style={{ listStyle: "none" }}>
                {plan.features.map((feature, j) => (
                  <li key={j} style={{
                    color: COLORS.text,
                    padding: "0.5rem 0",
                    borderBottom: `1px solid ${COLORS.border}`,
                    fontSize: "0.95rem",
                  }}>
                    ✓ {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
