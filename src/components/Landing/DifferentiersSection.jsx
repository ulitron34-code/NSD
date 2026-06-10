import React, { useState } from "react";
import { useTranslation } from "react-i18next";

export default function DifferentiersSection() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState(-1);

  const principles = [
    {
      titulo: t("principles.traceability.title", "Traceability"),
      desc: t("principles.traceability.desc", "Every action within the platform is recorded with date, user and detail. This allows reconstructing the history of any file during an audit, complying with the requirements of CNBV, FIU and international regulators."),
    },
    {
      titulo: t("principles.confidentiality.title", "Confidentiality"),
      desc: t("principles.confidentiality.desc", "Financial and documentary information is handled under AES-256 encryption standards and role-based access protocols (RBAC). Only authorized personnel can view sensitive data, ensuring banking secrecy and personal data protection."),
    },
    {
      titulo: t("principles.docControl.title", "Document Control"),
      desc: t("principles.docControl.desc", "Comprehensive management of each document's lifecycle: upload, validation, expiration, versioning and final archive. The system automatically detects expired or missing documents and generates proactive alerts to the compliance officer."),
    },
    {
      titulo: t("principles.visibleRisk.title", "Visible Risk"),
      desc: t("principles.visibleRisk.desc", "Configurable risk matrix that evaluates documentary, fiscal, reputational, geographical and operational factors. Assigns a standardized NSD Risk Score (1-100) that allows classifying and prioritizing cases objectively and auditably."),
    },
    {
      titulo: t("principles.evidence.title", "Evidence"),
      desc: t("principles.evidence.desc", "Every finding, observation or decision is documented as formal evidence within the digital file. Review notes, screenshots and results of restricted list queries are linked to the corresponding case."),
    },
    {
      titulo: t("principles.audit.title", "Audit"),
      desc: t("principles.audit.desc", "The platform generates consolidated reports ready to present to internal auditors, external auditors and regulatory authorities. Includes access log, change history and export in standard formats (PDF, CSV, XML)."),
    },
    {
      titulo: t("principles.livingRequirements.title", "Living Requirements"),
      desc: t("principles.livingRequirements.desc", "NSD organizes the file against requirements mandated by type of financial entity: KYC/KYB, ultimate beneficial owner, AML/CFT, documentary anti-fraud, expirations, legal evidence, financial information and data room. The goal is for applicants to arrive prepared and for funders to receive a verifiable, updated and auditable file."),
    },
    {
      titulo: t("principles.aiAgents.title", "AI Agents"),
      desc: t("principles.aiAgents.desc", "AI agents review documents in real-time, detect missing items, inconsistencies, expirations, critical fields and potential fraud risks before submitting the application. This reduces time, cost and rework for applicants, while giving greater certainty to banks, non-bank lenders, fintechs and funds about file quality."),
    },
    {
      titulo: t("principles.biometrics.title", "Biometrics"),
      desc: t("principles.biometrics.desc", "The biometric layer is designed to strengthen identity and consent through facial recognition, proof of life and, when applicable, fingerprint or equivalent validations. Its use must be configured with privacy notice, express consent, data minimization and access controls."),
    },
  ];

  return (
    <section id="servicios" style={{ padding: "5rem 2rem", background: "#F5F4F0", borderTop: "1px solid var(--border)" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ marginBottom: "3rem" }}>
          <p style={{
            color: "var(--gold)",
            fontWeight: 700,
            fontSize: "0.75rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginBottom: "0.75rem",
          }}>
            {t("differentiators.subtitle", "PRODUCT PRINCIPLES")}
          </p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "var(--navy)", fontWeight: 500 }}>
            {t("differentiators.mainTitle", "End-to-end operational compliance")}
          </h2>
          <p style={{ color: "var(--text-muted)", maxWidth: "820px", lineHeight: 1.8, marginTop: "1rem", fontSize: "0.98rem", fontWeight: 300 }}>
            {t("differentiators.description", "NSD's difference is combining compliance, financial preparation, biometrics and document review with AI. Applicants can align their file with financial entity requirements before seeking funding, and funders receive more complete evidence regarding identity, anti-fraud, AML/CFT, legal documentation and financial capacity.")}
          </p>
        </div>

        {/* Grid de tarjetas desplegables */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: openIndex >= 0 ? "0" : "0" }}>
          {principles.map((p, i) => {
            const isOpen = openIndex === i;
            return (
              <button
                key={p.titulo}
                onClick={() => setOpenIndex(isOpen ? -1 : i)}
                style={{
                  background: isOpen ? "var(--navy)" : "white",
                  color: isOpen ? "white" : "var(--navy)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  padding: "1.5rem 1rem",
                  cursor: "pointer",
                  textAlign: "center",
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "0.95rem",
                  fontWeight: 500,
                  transition: "all 0.3s ease",
                  boxShadow: isOpen ? "0 4px 16px rgba(10,25,47,0.15)" : "0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
                {p.titulo}
              </button>
            );
          })}
        </div>

        {/* Panel de explicación desplegable */}
        {openIndex >= 0 && (
          <div style={{
            marginTop: "1.5rem",
            background: "white",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "2rem 2.5rem",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            animation: "fadeIn 0.3s ease",
          }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", color: "var(--navy)", fontSize: "1.3rem", fontWeight: 500, marginBottom: "1rem" }}>
              {principles[openIndex].titulo}
            </h3>
            <p style={{ color: "var(--text)", fontSize: "0.95rem", lineHeight: 1.85, fontWeight: 300 }}>
              {principles[openIndex].desc}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
