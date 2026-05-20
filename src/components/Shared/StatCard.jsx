import { COLORS } from "../../utils/constants";

export default function StatCard({ icon, title, value, color, trend }) {
  return (
    <div style={{
      background: COLORS.white,
      padding: "1.5rem",
      borderRadius: "8px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      borderTop: `4px solid ${color || COLORS.navy}`,
    }}>
      <div style={{fontSize: "1.8rem", marginBottom: "0.5rem"}}>{icon}</div>
      <p style={{color: COLORS.textMuted, fontSize: "0.85rem", marginBottom: "0.5rem"}}>
        {title}
      </p>
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-end"}}>
        <p style={{color: COLORS.navy, fontWeight: "700", fontSize: "1.8rem"}}>
          {value}
        </p>
        {trend && (
          <p style={{
            color: trend > 0 ? COLORS.green : "#D32F2F",
            fontSize: "0.85rem",
            fontWeight: "600",
          }}>
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </p>
        )}
      </div>
    </div>
  );
}
