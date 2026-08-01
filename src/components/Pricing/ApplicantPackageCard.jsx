import React from "react";
import { COLORS } from "../../utils/constants";
import { formatOfferPrice, getEntitlement } from "../../services/commercialCatalogService";

export default function ApplicantPackageCard({ offer, popular, onSelect }) {
  const price = formatOfferPrice(offer);
  const ua = getEntitlement(offer, "analysis_units");
  const validity = getEntitlement(offer, "package_validity_days");
  const isSow = offer.billingModel === "sow";
  const cta = isSow ? "Solicitar propuesta" : "Preparar mi expediente";

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
          {validity && <span style={{ color: COLORS.textMuted, fontSize: "1rem" }}> / {validity.limitValue} días</span>}
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
        {ua && <li style={{ color: COLORS.text, padding: "0.5rem 0", borderBottom: `1px solid ${COLORS.border}`, fontSize: "0.9rem" }}>✓ {ua.limitValue} Unidades de Análisis</li>}
        {validity && <li style={{ color: COLORS.text, padding: "0.5rem 0", borderBottom: `1px solid ${COLORS.border}`, fontSize: "0.9rem" }}>✓ Vigencia de {validity.limitValue} días</li>}
        <li style={{ color: COLORS.text, padding: "0.5rem 0", borderBottom: `1px solid ${COLORS.border}`, fontSize: "0.9rem" }}>✓ Un objetivo / una entidad</li>
      </ul>
      <p style={{ color: COLORS.textMuted, fontSize: "0.78rem", marginTop: "1rem" }}>
        ¿Recibiste una invitación de un otorgante? Tu acceso patrocinado no tiene costo.
      </p>
    </div>
  );
}
