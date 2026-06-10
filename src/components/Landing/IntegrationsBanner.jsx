import React from "react";
import { useTranslation } from "react-i18next";

export default function IntegrationsBanner() {
  const { t } = useTranslation();

  const integrations = [
    "CREDIT BUREAU",
    "CREDIT CIRCLE", 
    "TAX AUTHORITY",
    "OFAC",
    "PEP LISTS",
    "REGISTRY",
    "FIU",
    "BANKING COMMISSION",
  ];

  return (
    <div style={{
      background: "var(--navy)",
      borderTop: "1px solid rgba(255,255,255,0.08)",
      padding: "1.5rem 2rem",
    }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <p style={{
          textAlign: "center",
          color: "rgba(255,255,255,0.35)",
          fontSize: "0.7rem",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          marginBottom: "1.25rem",
          fontWeight: 600,
        }}>
          {t("integrations.banner", "Connected with major regulatory verification sources")}
        </p>
        <div style={{
          display: "flex",
          gap: "3rem",
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "wrap",
        }}>
          {integrations.map((name, index) => (
            <span key={index} style={{
              fontSize: "0.85rem",
              fontWeight: 700,
              fontFamily: "'Playfair Display', serif",
              color: "rgba(255,255,255,0.25)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}>
              {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
