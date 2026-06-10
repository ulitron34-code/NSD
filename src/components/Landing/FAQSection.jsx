// FAQSection.jsx
import React, { useState } from "react";
import { COLORS } from "../../utils/constants";

export default function FAQSection() {
  const [openFaq, setOpenFaq] = useState("0-0");

  const faqs = [
    {
      category: "Platform",
      questions: [
        { q: "What is NSD Platform?", a: "A platform with two modules: Compliance SaaS for KYC/KYB, files, biometrics, risk and audit; and NSD IF to prepare credit, capital or funding applications." },
        { q: "What makes it different?", a: "Combines digital files, professional services and AI agents that review documents against institutional requirements, detect missing items and reduce preparation and review times." },
        { q: "What teams would use it?", a: "Applicants, startups, SMEs, projects, funds, non-bank lenders, banks, compliance, legal, risk, operations and internal audit." },
      ],
    },
    {
      category: "Professional Services",
      questions: [
        { q: "What does NSD IF do?", a: "Prepares business plan, financial analysis, pitch deck, data room and file to present a professional application to funders." },
        { q: "Who does it help?", a: "People with business activity, SMEs, startups, developers, productive projects and companies seeking credit, investment, capital or funding." },
        { q: "How does AI-powered review help?", a: "Allows uploading documents, analyzing them against expected requirements, identifying missing items, inconsistencies, expirations and risk points before submitting the file for institutional review." },
      ],
    },
    {
      category: "Compliance",
      questions: [
        { q: "What do I need to get started?", a: "Define applicant types, required documents, review states, roles, risk rules and minimum document acceptance criteria." },
        { q: "Does the platform replace the compliance officer?", a: "No. It helps organize evidence, prioritize risks, document decisions and accelerate review; the final decision remains with the responsible team." },
        { q: "Can it be adapted by country or sector?", a: "Yes. The roadmap includes configurable rules by jurisdiction, sector, entity type, risk level and funder internal policies." },
      ],
    },
    {
      category: "Security",
      questions: [
        { q: "Who sees the data?", a: "Only authorized users according to roles, permissions and rules defined by the organization. Sensitive information must operate under access, confidentiality and traceability controls." },
        { q: "How will biometrics be handled?", a: "The biometric function must operate with express consent, privacy notice, data minimization, enhanced security and limited use to identity, proof of life or authorized validations." },
        { q: "Can it connect with external providers?", a: "Yes. The enterprise version can integrate KYC APIs, restricted lists, biometrics, SSO, webhooks, reports and document analysis providers." },
      ],
    },
  ];

  return (
    <section style={{ padding: "5rem 2rem", background: COLORS.white, minHeight: "80vh" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <h2 style={{
          color: COLORS.navy,
          fontSize: "2.5rem",
          marginBottom: "3rem",
          borderLeft: `4px solid ${COLORS.gold}`,
          paddingLeft: "1rem",
        }}>
          Frequently Asked Questions
        </h2>

        {faqs.map((section, sectionIdx) => (
          <div key={section.category} style={{ marginBottom: "3rem" }}>
            <h3 style={{ color: COLORS.navy, fontSize: "1.3rem", marginBottom: "1.5rem", fontWeight: "600" }}>
              {section.category}
            </h3>

            <div style={{ display: "grid", gap: "1rem" }}>
              {section.questions.map((faq, idx) => {
                const uniqueId = `${sectionIdx}-${idx}`;
                return (
                  <div key={uniqueId} style={{
                    background: COLORS.bg,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}>
                    <button
                      onClick={() => setOpenFaq(openFaq === uniqueId ? null : uniqueId)}
                      style={{
                        width: "100%",
                        padding: "1.5rem",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <p style={{ color: COLORS.navy, fontWeight: "600", fontSize: "1rem" }}>
                        {faq.q}
                      </p>
                      <span style={{ color: COLORS.gold, fontWeight: "700", fontSize: "1rem" }}>
                        {openFaq === uniqueId ? "Close" : "Open"}
                      </span>
                    </button>

                    {openFaq === uniqueId && (
                      <div style={{ padding: "1.5rem", background: COLORS.white, borderTop: `1px solid ${COLORS.border}` }}>
                        <p style={{ color: COLORS.textMuted, lineHeight: "1.6" }}>
                          {faq.a}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
