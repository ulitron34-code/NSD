import { COLORS } from "../../utils/constants";

export default function InfoCard({ title, description, icon, color, action }) {
  return (
    <div style={{
      background: COLORS.white,
      padding: "1.5rem",
      borderRadius: "8px",
      border: `1px solid ${COLORS.border}`,
      borderLeft: `4px solid ${color || COLORS.gold}`,
    }}>
      {icon && <div style={{fontSize: "2rem", marginBottom: "1rem"}}>{icon}</div>}
      <h3 style={{color: COLORS.navy, fontWeight: "600", marginBottom: "0.5rem"}}>
        {title}
      </h3>
      <p style={{color: COLORS.textMuted, fontSize: "0.9rem", marginBottom: "1rem"}}>
        {description}
      </p>
      {action && (
        <button style={{
          padding: "0.5rem 1rem",
          background: color || COLORS.gold,
          color: COLORS.navy,
          border: "none",
          borderRadius: "4px",
          fontWeight: "600",
          cursor: "pointer",
          fontSize: "0.85rem",
        }}>
          {action}
        </button>
      )}
    </div>
  );
}
