import React from "react";
import { useNavigate } from "react-router-dom";

export default function CTASection() {
  const navigate = useNavigate();
  const paths = [
    ["Applicant", "Prepare project, file and data room before seeking financing.", "/for-applicants"],
    ["Funder", "Review opportunities, risks, memo and term sheet readiness.", "/for-funders"],
    ["NSD Services", "Request analysis, file, pitch deck or financial preparation.", "/services"],
  ];

  return (
    <section style={{
      padding: "6rem 2rem",
      background: "url('/img-boardroom.jpg') center/cover no-repeat",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(135deg, rgba(15,31,46,0.92) 0%, rgba(27,58,92,0.85) 100%)",
      }} />
      <div style={{ maxWidth: "820px", margin: "0 auto", textAlign: "center", position: "relative" }}>
        <p style={{
          color: "#C9A84C",
          fontWeight: 700,
          fontSize: "0.78rem",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          marginBottom: "1rem",
        }}>
          NEXT STEP
        </p>
        <h2 style={{
          color: "white",
          fontSize: "clamp(2rem, 4vw, 3rem)",
          fontWeight: 800,
          lineHeight: 1.2,
          marginBottom: "1.25rem",
        }}>
          Turn your files into evidence ready for review
        </h2>
        <p style={{
          color: "rgba(255,255,255,0.72)",
          fontSize: "1.1rem",
          lineHeight: 1.7,
          margin: "0 auto 2.5rem",
          maxWidth: "620px",
        }}>
          Prepare applications, validate documents with AI, organize KYC/KYB, enable data rooms and maintain traceability for
          applicants, funders and compliance teams.
        </p>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/contact")}
            style={{
              padding: "1rem 2.5rem",
              fontWeight: 700,
              fontSize: "1rem",
              background: "linear-gradient(135deg, #C9A84C, #E4C878)",
              color: "#1B3A5C",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              boxShadow: "0 8px 24px rgba(201,168,76,0.4)",
            }}
          >
            Schedule Demo
          </button>
          <button
            onClick={() => navigate("/signup")}
            style={{
              padding: "1rem 2.5rem",
              fontWeight: 600,
              fontSize: "1rem",
              background: "rgba(255,255,255,0.08)",
              color: "white",
              border: "1.5px solid rgba(255,255,255,0.25)",
              borderRadius: "8px",
              cursor: "pointer",
              backdropFilter: "blur(8px)",
            }}
          >
            Create Demo Account
          </button>
        </div>

        <div style={{
          display: "flex",
          gap: "2rem",
          justifyContent: "center",
          marginTop: "3.5rem",
          flexWrap: "wrap",
        }}>
          {["Secure Data", "AI Review", "Biometrics", "Data Room", "Audit Trail"].map((item) => (
            <p key={item} style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.85rem", fontWeight: 600 }}>
              {item}
            </p>
          ))}
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "0.9rem",
          marginTop: "2rem",
          textAlign: "left",
        }}>
          {paths.map(([title, detail, path]) => (
            <button
              key={title}
              onClick={() => navigate(path)}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.16)",
                borderRadius: "8px",
                padding: "1rem",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{ display: "block", color: "white", fontWeight: 900, marginBottom: "0.35rem" }}>{title}</span>
              <span style={{ display: "block", color: "rgba(255,255,255,0.68)", fontSize: "0.82rem", lineHeight: 1.45 }}>{detail}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
