import React from "react";
import { useTranslation } from "react-i18next";
import Icon from "../common/icons";

export default function SecuritySection() {
  const { t } = useTranslation();

  const features = [
    {
      icon: "lock",
      title: t("security.encryption.title", "End-to-End Encryption"),
      desc: t("security.encryption.desc", "All financial and documentary information is transmitted and stored under AES-256 encryption. Data in transit is protected with bank-grade TLS 1.3."),
    },
    {
      icon: "shield",
      title: t("security.rbac.title", "Role-Based Access Control"),
      desc: t("security.rbac.desc", "RBAC architecture that ensures only authorized personnel access sensitive data. Each user level has granular permissions auditable by role, department and jurisdiction."),
    },
    {
      icon: "checklist",
      title: t("security.auditLog.title", "Immutable Audit Trail"),
      desc: t("security.auditLog.desc", "Chronological record of every action: access, modifications, downloads and approvals. Prepared for inspections by CNBV, FIU, OFAC and external auditors under ISO 27001 standards."),
    },
    {
      icon: "institution",
      title: t("security.compliance.title", "Multinational Regulatory Compliance"),
      desc: t("security.compliance.desc", "Designed to meet AML/CFT requirements, Federal Personal Data Protection Law (LFPDPPP), European GDPR and international financial privacy standards."),
    },
  ];

  return (
    <section style={{ padding: "5rem 2rem", background: "var(--navy)", color: "white" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <p style={{
            color: "var(--gold)",
            fontWeight: 700,
            fontSize: "0.75rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginBottom: "0.75rem",
          }}>
            {t("security.subtitle", "SECURITY AND PRIVACY")}
          </p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 500, color: "white", marginBottom: "1rem" }}>
            {t("security.title", "Infrastructure Ready for Financial Audits")}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.6)", maxWidth: "650px", margin: "0 auto", fontSize: "1rem", lineHeight: 1.8, fontWeight: 300 }}>
            {t("security.desc", "Financial entities demand the highest standards of information confidentiality and control. Our platform was designed from its architecture to meet each of these requirements.")}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
          {features.map((f) => (
            <div key={f.title} style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              padding: "2rem 1.5rem",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(212,175,55,0.3)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
            >
              <div style={{ marginBottom: "1rem" }}>
                <Icon name={f.icon} size={26} color="#C9A84C" />
              </div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.05rem", fontWeight: 500, marginBottom: "0.75rem", color: "white" }}>
                {f.title}
              </h3>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem", lineHeight: 1.75, fontWeight: 300 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "4rem", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}>
          <img 
            src="/img-dashboard.jpg" 
            alt="NEXUS Security Dashboard"
            style={{ width: "100%", height: "auto", display: "block" }} 
          />
        </div>
      </div>
    </section>
  );
}
