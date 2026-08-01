import React from "react";
import { COLORS } from "../../utils/constants";

const OPTIONS = [
  { value: "applicant", label: "Soy solicitante" },
  { value: "grantor", label: "Soy otorgante" },
];

export default function AudienceSelector({ audience, onChange }) {
  return (
    <div style={{ display: "inline-flex", gap: "0.5rem", padding: "0.35rem", background: COLORS.white, borderRadius: "999px", border: `1px solid ${COLORS.border}`, marginBottom: "2rem" }}>
      {OPTIONS.map((option) => {
        const active = audience === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            style={{
              padding: "0.6rem 1.4rem",
              borderRadius: "999px",
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "0.9rem",
              background: active ? COLORS.gold : "transparent",
              color: active ? COLORS.navy : COLORS.textMuted,
              transition: "background 0.2s, color 0.2s",
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
