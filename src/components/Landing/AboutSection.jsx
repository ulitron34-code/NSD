import React from "react";
import { COLORS } from "../../utils/constants";

export default function AboutSection() {
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
          About NSD Platform
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", marginBottom: "3rem" }}>
          <div>
            <h3 style={{ color: COLORS.navy, fontSize: "1.5rem", marginBottom: "1rem" }}>
              What We Solve
            </h3>
            <p style={{ color: COLORS.textMuted, lineHeight: "1.8", marginBottom: "1.5rem" }}>
              NSD solves a critical friction point in the financial market: applicants typically arrive with incomplete files, disorganized documents and changing requirements; while financial entities need to validate identity, legality, risk, anti-fraud, AML/CFT and financial capacity quickly.
            </p>
            <p style={{ color: COLORS.textMuted, lineHeight: "1.8" }}>
              For applicants, NSD helps prepare the file, align documents with required standards and reduce rework. For funding providers, it centralizes document review, evidence, data room, biometrics, alerts and audit trail to make decisions with greater traceability.
            </p>
          </div>

          <div>
            <h3 style={{ color: COLORS.navy, fontSize: "1.5rem", marginBottom: "1rem" }}>
              Two Connected Modules
            </h3>
            <div style={{ display: "grid", gap: "1rem" }}>
              {[
                ["Compliance SaaS", "Files, KYC/KYB, biometrics, validations, risk matrix, audit trail and reports."],
                ["NSD IF Professional Services", "Document, financial and executive preparation for credit, investment or funding."],
                ["AI-Powered Review", "Agents that detect missing items, expirations, inconsistencies and risks before presenting the case."],
                ["Funder Network", "Pipeline for financial entities to review opportunities with verifiable data rooms."],
              ].map(([title, text]) => (
                <div key={title} style={{ background: COLORS.bg, borderRadius: "10px", padding: "1.25rem", borderLeft: `4px solid ${COLORS.gold}` }}>
                  <h4 style={{ color: COLORS.navy, marginBottom: "0.45rem" }}>{title}</h4>
                  <p style={{ color: COLORS.textMuted, lineHeight: 1.65 }}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ borderRadius: "12px", overflow: "hidden", marginTop: "3rem", boxShadow: "0 20px 40px rgba(10,25,47,0.08)" }}>
          <img
            src="/img-team.jpg"
            alt="NSD team working"
            style={{ width: "100%", height: "auto", maxHeight: "400px", objectFit: "cover", objectPosition: "center", display: "block" }}
          />
        </div>
      </div>
    </section>
  );
}
