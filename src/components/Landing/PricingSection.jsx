import React from "react";
import { useNavigate } from "react-router-dom";
import { COLORS } from "../../utils/constants";

export default function PricingSection() {
  const navigate = useNavigate();

  const plans = [
    {
      name: "Starter",
      price: "$99",
      currency: "USD",
      period: "/month",
      desc: "For teams that need to organize files and documents.",
      features: [
        "Up to 50 active files",
        "Basic KYC/KYB checklist",
        "Document control and expiration tracking",
        "Expiration alerts",
        "Basic reports",
      ],
      cta: "Create Account",
    },
    {
      name: "Professional",
      price: "$299",
      currency: "USD",
      period: "/month",
      desc: "For companies with document review and internal approvals.",
      features: [
        "Everything in Starter plan",
        "Configurable risk matrix",
        "Review and approval workflows",
        "Analyst and approver roles",
        "Complete audit trail",
        "Executive reports",
      ],
      cta: "Try Platform",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      currency: "",
      period: "",
      desc: "For institutions with advanced rules, integrations and control.",
      features: [
        "Everything in Professional plan",
        "API and webhooks",
        "SSO/MFA",
        "Rules by country, sector or entity",
        "SLA and dedicated support",
        "KYC/list integrations",
      ],
      cta: "Schedule Demo",
    },
  ];

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
          Plans for Compliance Teams
        </h2>
        <p style={{ color: COLORS.textMuted, marginBottom: "3rem", fontSize: "1.1rem" }}>
          Scale from document management to enterprise compliance with rules, audit and integrations.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
          {plans.map((plan) => (
            <div key={plan.name} style={{
              background: COLORS.white,
              padding: "2.5rem",
              borderRadius: "12px",
              border: plan.popular ? `2px solid ${COLORS.gold}` : `1px solid ${COLORS.border}`,
              position: "relative",
              transform: plan.popular ? "scale(1.03)" : "scale(1)",
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
                  MOST POPULAR
                </div>
              )}

              <h3 style={{ color: COLORS.navy, fontSize: "1.5rem", marginBottom: "0.5rem", fontWeight: "600" }}>
                {plan.name}
              </h3>
              <p style={{ color: COLORS.textMuted, fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                {plan.desc}
              </p>

              <div style={{ marginBottom: "1.5rem" }}>
                <span style={{ color: COLORS.navy, fontWeight: "700", fontSize: "2.5rem", fontFamily: "'Playfair Display', serif" }}>
                  {plan.price}
                </span>
                <span style={{ color: COLORS.textMuted, fontSize: "0.9rem" }}>
                  {plan.currency ? ` ${plan.currency}` : ""}{plan.period}
                </span>
              </div>

              <button
                onClick={() => navigate(plan.name === "Enterprise" ? "/contact" : "/signup")}
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
                }}
              >
                {plan.cta}
              </button>

              <ul style={{ listStyle: "none" }}>
                {plan.features.map((feature) => (
                  <li key={feature} style={{
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
