import React from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../utils/constants";
import { translateCopy, uiText } from "../../utils/runtimeCopy";

const CheckIcon = ({ size, color, strokeWidth, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

export default function ServiceCard({ service, onRequestService }) {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);
  const copy = (value) => translateCopy(value, i18n.language);

  return (
    <div
      style={{
        background: service.recommended ? COLORS.white : COLORS.bg,
        border: service.recommended ? `2px solid ${COLORS.gold}` : `1px solid ${COLORS.border}`,
        borderRadius: "12px",
        padding: "2rem",
        boxShadow: service.recommended
          ? `0 8px 24px rgba(201,168,76,0.2)`
          : "0 2px 8px rgba(0,0,0,0.08)",
        transition: "all 0.3s",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = service.recommended
          ? `0 12px 32px rgba(201,168,76,0.3)`
          : "0 8px 24px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = service.recommended
          ? `0 8px 24px rgba(201,168,76,0.2)`
          : "0 2px 8px rgba(0,0,0,0.08)";
      }}
    >
      {/* Recommended Badge */}
      {service.recommended && (
        <div style={{
          position: "absolute",
          top: "-12px",
          left: "50%",
          transform: "translateX(-50%)",
          background: COLORS.gold,
          color: COLORS.navy,
          padding: "0.4rem 1rem",
          borderRadius: "999px",
          fontWeight: 700,
          fontSize: "0.75rem",
          letterSpacing: "0.05em",
        }}>
          {L("RECOMENDADO", "RECOMMENDED")}
        </div>
      )}

      {/* Icon */}
      <div style={{
        fontSize: "3rem",
        marginBottom: "1rem",
      }}>
        {service.icon}
      </div>

      {/* Title */}
      <h3
        style={{
          color: COLORS.navy,
          fontSize: "1.3rem",
          fontWeight: 700,
          marginBottom: "0.5rem",
        }}
      >
        {copy(service.title)}
      </h3>

      {/* Description */}
      <p
        style={{
          color: COLORS.textMuted,
          fontSize: "0.9rem",
          marginBottom: "1.5rem",
          lineHeight: 1.6,
          flex: 1,
        }}
      >
        {copy(service.description)}
      </p>

      {/* Features */}
      <ul
        style={{
          listStyle: "none",
          marginBottom: "1.5rem",
          fontSize: "0.85rem",
        }}
      >
        {service.features.map((feature, i) => (
          <li
            key={i}
            style={{
              color: COLORS.text,
              marginBottom: "0.8rem",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.8rem",
            }}
          >
            <CheckIcon size={18} color={COLORS.gold} strokeWidth={3} style={{ flexShrink: 0, marginTop: "2px" }} />
            <span style={{ opacity: 0.9 }}>{copy(feature)}</span>
          </li>
        ))}
      </ul>

      {/* Divider */}
      <div
        style={{
          height: "1px",
          background: COLORS.border,
          margin: "1rem 0",
        }}
      />

      {/* Price & Delivery */}
      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{
          color: COLORS.textMuted,
          fontSize: "0.8rem",
          marginBottom: "0.3rem",
        }}>
          {L("PRECIO", "PRICE")}
        </p>
        <p style={{
          color: COLORS.navy,
          fontSize: "2rem",
          fontWeight: 800,
          marginBottom: "0.5rem",
          letterSpacing: "-0.5px"
        }}>
          ${service.price.toLocaleString()} <span style={{ fontSize: "1rem", fontWeight: 600, color: COLORS.textMuted }}>USD</span>
        </p>
        <p style={{
          color: COLORS.textMuted,
          fontSize: "0.85rem",
        }}>
          {L("Entrega", "Delivery")}: {copy(service.deliveryTime)}
        </p>
      </div>

      {/* CTA Button */}
      <button
        onClick={() => onRequestService(service)}
        style={{
          width: "100%",
          padding: "0.9rem 1.5rem",
          background: service.recommended ? COLORS.gold : COLORS.navy,
          color: service.recommended ? COLORS.navy : "white",
          border: "none",
          borderRadius: "6px",
          fontWeight: 700,
          fontSize: "0.95rem",
          cursor: "pointer",
          transition: "all 0.3s",
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = "translateY(-1px)";
          e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = "translateY(0)";
          e.target.style.boxShadow = "none";
        }}
      >
        {L("Solicitar Servicio", "Request Service")}
      </button>
    </div>
  );
}
