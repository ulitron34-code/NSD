import { useNotification } from "../../hooks/useNotification";
import { COLORS } from "../../utils/constants";

export default function Toast() {
  const { notifications, removeNotification } = useNotification();

  const getBackgroundColor = (type) => {
    switch (type) {
      case "success":
        return COLORS.green;
      case "error":
        return "#D32F2F";
      case "warning":
        return COLORS.amber;
      default:
        return COLORS.navy;
    }
  };

  return (
    <div style={{
      position: "fixed",
      bottom: "20px",
      right: "20px",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    }}>
      {notifications.map((notif) => (
        <div
          key={notif.id}
          style={{
            background: getBackgroundColor(notif.type),
            color: COLORS.white,
            padding: "1rem 1.5rem",
            borderRadius: "6px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            animation: "slideIn 0.3s ease",
            cursor: "pointer",
          }}
          onClick={() => removeNotification(notif.id)}
        >
          {notif.message}
        </div>
      ))}
    </div>
  );
}
