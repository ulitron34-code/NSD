import React, { useState } from "react";
import { COLORS } from "../../utils/constants";

export default function OtorgantesTab() {
  const [lenders] = useState([
    {
      id: 1,
      name: "SOFOM ABC",
      type: "SOFOM",
      minScore: 70,
      minLoan: 500000,
      maxLoan: 5000000,
      interestRate: 18,
      phone: "+52 55 XXXX XXXX",
      email: "info@sofom-abc.com"
    },
    {
      id: 2,
      name: "Family Office XYZ",
      type: "Family Office",
      minScore: 75,
      minLoan: 1000000,
      maxLoan: 10000000,
      interestRate: 12,
      phone: "+52 55 XXXX XXXX",
      email: "info@fo-xyz.com"
    },
    {
      id: 3,
      name: "Banco de Desarrollo",
      type: "Banca Pública",
      minScore: 65,
      minLoan: 250000,
      maxLoan: 2500000,
      interestRate: 8,
      phone: "+52 55 XXXX XXXX",
      email: "info@banco-dev.com"
    },
  ]);

  return (
    <div>
      <h1 style={{color: COLORS.navy, fontSize: "2rem", marginBottom: "2rem"}}>
        Otorgantes y Lenders
      </h1>

      <div style={{display: "grid", gap: "1.5rem"}}>
        {lenders.map((lender) => (
          <div key={lender.id} style={{
            background: COLORS.white,
            padding: "2rem",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}>
            <div style={{display: "grid", gridTemplateColumns: "1fr auto", gap: "2rem", marginBottom: "1.5rem"}}>
              <div>
                <h2 style={{color: COLORS.navy, marginBottom: "0.5rem"}}>{lender.name}</h2>
                <p style={{color: COLORS.gold, fontWeight: "600", fontSize: "0.9rem"}}>
                  {lender.type}
                </p>
              </div>
              <button style={{
                padding: "0.75rem 1.5rem",
                background: COLORS.gold,
                color: COLORS.navy,
                border: "none",
                borderRadius: "6px",
                fontWeight: "600",
                cursor: "pointer",
                height: "fit-content",
              }}>
                Contactar
              </button>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1.5rem",
              marginBottom: "1.5rem",
            }}>
              {/* Min Score */}
              <div style={{background: COLORS.bg, padding: "1rem", borderRadius: "6px"}}>
                <p style={{color: COLORS.textMuted, fontSize: "0.85rem", marginBottom: "0.5rem"}}>
                  Score Mínimo
                </p>
                <p style={{color: COLORS.navy, fontWeight: "600", fontSize: "1.3rem"}}>
                  {lender.minScore}
                </p>
              </div>

              {/* Loan Range */}
              <div style={{background: COLORS.bg, padding: "1rem", borderRadius: "6px"}}>
                <p style={{color: COLORS.textMuted, fontSize: "0.85rem", marginBottom: "0.5rem"}}>
                  Rango de Crédito
                </p>
                <p style={{color: COLORS.navy, fontWeight: "600", fontSize: "1rem"}}>
                  ${(lender.minLoan / 1000000).toFixed(1)}M - ${(lender.maxLoan / 1000000).toFixed(1)}M
                </p>
              </div>

              {/* Interest Rate */}
              <div style={{background: COLORS.bg, padding: "1rem", borderRadius: "6px"}}>
                <p style={{color: COLORS.textMuted, fontSize: "0.85rem", marginBottom: "0.5rem"}}>
                  Tasa de Interés
                </p>
                <p style={{color: COLORS.navy, fontWeight: "600", fontSize: "1.3rem"}}>
                  {lender.interestRate}%
                </p>
              </div>
            </div>

            {/* Contact Info */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
              padding: "1rem",
              background: COLORS.bg,
              borderRadius: "6px",
              borderLeft: `4px solid ${COLORS.gold}`,
            }}>
              <div>
                <p style={{color: COLORS.textMuted, fontSize: "0.8rem"}}>Teléfono</p>
                <p style={{color: COLORS.navy, fontWeight: "600"}}>{lender.phone}</p>
              </div>
              <div>
                <p style={{color: COLORS.textMuted, fontSize: "0.8rem"}}>Email</p>
                <p style={{color: COLORS.navy, fontWeight: "600"}}>{lender.email}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
