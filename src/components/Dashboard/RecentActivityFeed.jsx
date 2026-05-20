import React from "react";
import { COLORS } from "../../utils/constants";

export default function RecentActivityFeed() {
  const activities = [
    {
      id: 1,
      type: "analysis",
      title: "RFC Analizado",
      description: "RFC: ABC123456XYZ - Score: 78",
      timestamp: "Hace 2 horas",
      icon: "👥",
      status: "success",
    },
    {
      id: 2,
      type: "project",
      title: "Proyecto Creado",
      description: "Proyecto: Desarrollo Inmobiliario XYZ",
      timestamp: "Hace 5 horas",
      icon: "📁",
      status: "pending",
    },
    {
      id: 3,
      type: "document",
      title: "Documento Subido",
      description: "KYC: RFC/RUC - Estado: Verificado",
      timestamp: "Hace 1 día",
      icon: "📄",
      status: "success",
    },
    {
      id: 4,
      type: "contact",
      title: "Lender Contactado",
      description: "SOFOM ABC - Tasa: 18%",
      timestamp: "Hace 2 días",
      icon: "🏦",
      status: "pending",
    },
  ];

  const getStatusColor = (status) => {
    return status === "success" ? COLORS.green : COLORS.amber;
  };

  return (
    <div style={{
      background: COLORS.white,
      padding: "2rem",
      borderRadius: "8px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    }}>
      <h2 style={{color: COLORS.navy, fontSize: "1.3rem", marginBottom: "1.5rem"}}>
        Actividad Reciente
      </h2>

      <div style={{display: "grid", gap: "1rem"}}>
        {activities.map((activity) => (
          <div key={activity.id} style={{
            display: "grid",
            gridTemplateColumns: "50px 1fr auto",
            gap: "1rem",
            padding: "1rem",
            background: COLORS.bg,
            borderRadius: "6px",
            borderLeft: `4px solid ${getStatusColor(activity.status)}`,
            alignItems: "center",
          }}>
            <div style={{
              fontSize: "1.8rem",
              textAlign: "center",
            }}>
              {activity.icon}
            </div>

            <div>
              <p style={{color: COLORS.navy, fontWeight: "600", marginBottom: "0.25rem"}}>
                {activity.title}
              </p>
              <p style={{color: COLORS.textMuted, fontSize: "0.9rem"}}>
                {activity.description}
              </p>
            </div>

            <p style={{color: COLORS.textMuted, fontSize: "0.8rem", whiteSpace: "nowrap"}}>
              {activity.timestamp}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
