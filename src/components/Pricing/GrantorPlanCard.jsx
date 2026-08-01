import React from "react";
import { COLORS } from "../../utils/constants";
import { formatOfferPrice, getEntitlement } from "../../services/commercialCatalogService";

const INTERVAL_LABEL = { month: "/mes", year: "/año" };

export default function GrantorPlanCard({ offer, popular, onSelect }) {
  const price = formatOfferPrice(offer);
  const seats = getEntitlement(offer, "internal_users");
  const cases = getEntitlement(offer, "active_cases");
  const ua = getEntitlement(offer, "analysis_units");
  const isCustomPricing = offer.price?.isCustomPricing;
  const cta = isCustomPricing ? "Solicitar propuesta" : "Contratar";

  return (
    <div style={{
      background: COLORS.white,
      padding: "2.5rem",
      borderRadius: "12px",
      border: popular ? `2px solid ${COLORS.gold}` : `1px solid ${COLORS.border}`,
      position: "relative",
      boxShadow: popular ? "0 8px 24px rgba(0,0,0,0.12)" : "0 2px 8px rgba(0,0,0,0.08)",
      display: "flex",
      flexDirection: "column",
    }}>
      {popular && (
        <div style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", background: COLORS.gold, color: COLORS.navy, padding: "0.5rem 1rem", borderRadius: "20px", fontWeight: 700, fontSize: "0.8rem" }}>
          MÁS ADOPTADO
        </div>
      )}
      <h3 style={{ color: COLORS.navy, fontSize: "1.5rem", marginBottom: "0.5rem", fontWeight: 700 }}>{offer.name.es}</h3>
      <p style={{ color: COLORS.textMuted, fontSize: "0.9rem", marginBottom: "1.5rem" }}>{offer.description?.es}</p>

      {price && (
        <div style={{ marginBottom: "1.5rem" }}>
          <span style={{ color: COLORS.navy, fontWeight: 700, fontSize: "2.25rem" }}>{price.amount}</span>
          <span style={{ color: COLORS.textMuted, fontSize: "1rem" }}>{INTERVAL_LABEL[price.interval] || ""}</span>
        </div>
      )}

      <button
        onClick={() => onSelect(offer)}
        style={{
          width: "100%",
          padding: "0.9rem",
          background: popular ? COLORS.gold : "transparent",
          color: popular ? COLORS.navy : COLORS.gold,
          border: popular ? "none" : `2px solid ${COLORS.gold}`,
          borderRadius: "6px",
          fontWeight: 700,
          cursor: "pointer",
          marginBottom: "1.5rem",
        }}
      >
        {cta}
      </button>

      <ul style={{ listStyle: "none", margin: 0, padding: 0, flex: 1 }}>
        {seats && <li style={{ color: COLORS.text, padding: "0.5rem 0", borderBottom: `1px solid ${COLORS.border}`, fontSize: "0.9rem" }}>✓ {seats.limitValue} usuarios internos</li>}
        {cases && <li style={{ color: COLORS.text, padding: "0.5rem 0", borderBottom: `1px solid ${COLORS.border}`, fontSize: "0.9rem" }}>✓ {cases.limitValue} expedientes activos</li>}
        {ua && <li style={{ color: COLORS.text, padding: "0.5rem 0", borderBottom: `1px solid ${COLORS.border}`, fontSize: "0.9rem" }}>✓ {ua.limitValue} UA mensuales</li>}
      </ul>
      <p style={{ color: COLORS.textMuted, fontSize: "0.78rem", marginTop: "1rem" }}>
        Impuestos, vigencia y consumos externos (buró, biométricos) se muestran antes de contratar.
      </p>
    </div>
  );
}
