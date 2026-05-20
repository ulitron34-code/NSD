import { COLORS } from "../../utils/constants";

export default function LoadingSpinner({ size = "medium" }) {
  const sizes = {
    small: "30px",
    medium: "60px",
    large: "100px",
  };

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: sizes[size],
    }}>
      <div style={{
        width: sizes[size],
        height: sizes[size],
        border: `4px solid ${COLORS.border}`,
        borderTop: `4px solid ${COLORS.gold}`,
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
      }}>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
