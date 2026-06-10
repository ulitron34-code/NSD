import React from "react";
import { useNavigate } from "react-router-dom";

export default function Hero() {
  const navigate = useNavigate();

  const modules = [
    {
      title: "Compliance SaaS",
      text: "KYC/KYB, digital file, document validation, biometrics, risk, anti-fraud and audit to review cases with full traceability.",
      cta: "Enter Demo",
      action: () => navigate("/login"),
    },
    {
      title: "NSD IF Professional Services",
      text: "Business plan, financial analysis, pitch deck, data room and preparation of applications for credit, capital or institutional funding.",
      cta: "View Services",
      action: () => navigate("/services"),
    },
  ];

  return (
    <section style={{
      background: "#FAFAF9",
      position: "relative",
      padding: "4.5rem 2rem 5rem",
      minHeight: "78vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "url('/hero-lobby.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center top",
        opacity: 0.08,
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(to bottom, rgba(250,250,249,0.82), rgba(250,250,249,1))",
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: "1180px", margin: "0 auto", position: "relative", zIndex: 10 }}>
        <div style={{
          width: "100%",
          maxWidth: "980px",
          margin: "0 auto 2.75rem",
          borderRadius: "14px",
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(10,25,47,0.16)",
          border: "1px solid rgba(10,25,47,0.08)",
        }}>
          <img
            src="/hero-lobby.jpg"
            alt="NSD Platform"
            style={{
              width: "100%",
              height: "clamp(220px, 34vw, 430px)",
              objectFit: "cover",
              objectPosition: "top center",
              display: "block",
            }}
          />
        </div>

        <div style={{ maxWidth: "860px", marginBottom: "3rem" }}>
          <p style={{
            color: "var(--gold)",
            fontWeight: 800,
            fontSize: "0.78rem",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            marginBottom: "1rem",
          }}>
            NSD Platform
          </p>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(2.35rem, 5vw, 4.35rem)",
            lineHeight: 1.08,
            color: "var(--navy)",
            fontWeight: 600,
            marginBottom: "1.5rem",
          }}>
            Compliance, credit assessment, and intelligent file review
          </h1>
          <p style={{
            fontSize: "clamp(1rem, 1.5vw, 1.15rem)",
            maxWidth: "760px",
            color: "var(--text-muted)",
            lineHeight: 1.85,
            fontWeight: 300,
          }}>
            NSD integrates SaaS technology, AI agents, and professional services so applicants arrive better prepared before financial entities, and so funding providers review files with greater documentary, anti-fraud, legal, and operational certainty.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
          {modules.map((module) => (
            <div key={module.title} style={{
              background: "rgba(255,255,255,0.88)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "1.75rem",
              boxShadow: "0 18px 40px rgba(10,25,47,0.08)",
            }}>
              <h2 style={{ color: "var(--navy)", fontSize: "1.35rem", marginBottom: "0.75rem" }}>
                {module.title}
              </h2>
              <p style={{ color: "var(--text-muted)", lineHeight: 1.7, marginBottom: "1.5rem" }}>
                {module.text}
              </p>
              <button
                onClick={module.action}
                style={{
                  padding: "0.75rem 1.5rem",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  background: module.title.includes("Compliance") ? "var(--navy)" : "var(--gold)",
                  color: module.title.includes("Compliance") ? "white" : "var(--navy)",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                {module.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
