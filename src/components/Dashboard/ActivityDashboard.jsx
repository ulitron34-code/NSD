import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { COLORS } from "../../utils/constants";
import { getActivityLogs, getActivitySummary } from "../../services/auditService";

// FASE 6: Activity Dashboard - Panel de auditoría en tiempo real

const getActivityIcon = (type) => {
  const icons = {
    document_upload: "📄",
    requirement_created: "📋",
    requirement_approved: "✅",
    requirement_rejected: "❌",
    message_sent: "💬",
    expediente_created: "📑",
    default: "⚡"
  };
  return icons[type] || icons.default;
};

const getActivityColor = (type) => {
  const colors = {
    document_upload: COLORS.blue,
    requirement_created: COLORS.amber,
    requirement_approved: COLORS.green,
    requirement_rejected: "#C62828",
    message_sent: "#9C27B0",
    expediente_created: COLORS.navy,
  };
  return colors[type] || COLORS.text;
};

const getActivityLabel = (type) => {
  const labels = {
    document_upload: "Documento subido",
    requirement_created: "Requerimiento creado",
    requirement_approved: "Requerimiento aprobado",
    requirement_rejected: "Requerimiento rechazado",
    message_sent: "Mensaje enviado",
    expediente_created: "Expediente creado"
  };
  return labels[type] || "Actividad";
};

export default function ActivityDashboard() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");

  // Cargar logs y resumen
  useEffect(() => {
    if (!user) return;

    const loadActivity = async () => {
      try {
        setLoading(true);
        const activityLogs = await getActivityLogs(user.id, 200);
        const activitySummary = await getActivitySummary(user.id);

        setLogs(activityLogs);
        setSummary(activitySummary);
        setLoading(false);
      } catch (err) {
        console.error("Error loading activity:", err);
        setLoading(false);
      }
    };

    loadActivity();

    // Auto-refresh cada 10 segundos
    const interval = setInterval(loadActivity, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // Filtrar logs
  const filteredLogs = filterType === "all"
    ? logs
    : logs.filter(log => log.type === filterType);

  // Obtener tipos únicos
  const activityTypes = Array.from(new Set(logs.map(l => l.type)));

  return (
    <div>
      {/* HEADER */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ color: COLORS.navy, fontSize: "2rem", margin: "0 0 0.5rem 0" }}>
          📊 Centro de Actividad
        </h1>
        <p style={{ color: COLORS.textMuted, margin: "0 0 1.5rem 0" }}>
          Auditoría en tiempo real de todas tus acciones
        </p>

        {/* RESUMEN */}
        {summary && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "1rem",
            marginBottom: "1.5rem"
          }}>
            <div style={{
              background: COLORS.white,
              padding: "1rem",
              borderRadius: "8px",
              border: `1px solid ${COLORS.border}`,
              textAlign: "center"
            }}>
              <p style={{ color: COLORS.textMuted, fontSize: "0.75rem", margin: "0 0 0.5rem 0", textTransform: "uppercase" }}>
                Total
              </p>
              <p style={{ color: COLORS.navy, fontSize: "1.8rem", fontWeight: 800, margin: 0 }}>
                {summary.totalActivities}
              </p>
              <p style={{ color: COLORS.textMuted, fontSize: "0.75rem", margin: "0.5rem 0 0 0" }}>
                actividades
              </p>
            </div>

            <div style={{
              background: COLORS.white,
              padding: "1rem",
              borderRadius: "8px",
              border: `1px solid ${COLORS.border}`,
              textAlign: "center"
            }}>
              <p style={{ color: COLORS.textMuted, fontSize: "0.75rem", margin: "0 0 0.5rem 0", textTransform: "uppercase" }}>
                Hoy
              </p>
              <p style={{ color: COLORS.gold, fontSize: "1.8rem", fontWeight: 800, margin: 0 }}>
                {summary.today}
              </p>
              <p style={{ color: COLORS.textMuted, fontSize: "0.75rem", margin: "0.5rem 0 0 0" }}>
                actividades
              </p>
            </div>

            <div style={{
              background: COLORS.white,
              padding: "1rem",
              borderRadius: "8px",
              border: `1px solid ${COLORS.border}`,
              textAlign: "center"
            }}>
              <p style={{ color: COLORS.textMuted, fontSize: "0.75rem", margin: "0 0 0.5rem 0", textTransform: "uppercase" }}>
                Esta semana
              </p>
              <p style={{ color: COLORS.green, fontSize: "1.8rem", fontWeight: 800, margin: 0 }}>
                {summary.thisWeek}
              </p>
              <p style={{ color: COLORS.textMuted, fontSize: "0.75rem", margin: "0.5rem 0 0 0" }}>
                actividades
              </p>
            </div>
          </div>
        )}

        {/* FILTROS */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            onClick={() => setFilterType("all")}
            style={{
              padding: "0.5rem 1rem",
              background: filterType === "all" ? COLORS.gold : COLORS.bg,
              color: filterType === "all" ? COLORS.navy : COLORS.text,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "6px",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "0.85rem"
            }}
          >
            Todos ({logs.length})
          </button>

          {activityTypes.map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              style={{
                padding: "0.5rem 1rem",
                background: filterType === type ? getActivityColor(type) : COLORS.bg,
                color: filterType === type ? "white" : COLORS.text,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "6px",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: "0.85rem"
              }}
            >
              {getActivityIcon(type)} {getActivityLabel(type)} ({logs.filter(l => l.type === type).length})
            </button>
          ))}
        </div>
      </div>

      {/* LISTA DE ACTIVIDADES */}
      <div style={{
        background: COLORS.white,
        borderRadius: "10px",
        border: `1px solid ${COLORS.border}`,
        overflow: "hidden"
      }}>
        {loading && (
          <p style={{ padding: "2rem", color: COLORS.textMuted, textAlign: "center" }}>
            Cargando actividades...
          </p>
        )}

        {!loading && filteredLogs.length === 0 && (
          <p style={{ padding: "2rem", color: COLORS.textMuted, textAlign: "center" }}>
            No hay actividades
          </p>
        )}

        {!loading && filteredLogs.length > 0 && (
          <div>
            {filteredLogs.map((log, index) => {
              const timestamp = new Date(log.timestamp);
              const now = new Date();
              let timeDisplay = "";

              const diffMs = now - timestamp;
              const diffMins = Math.floor(diffMs / 60000);
              const diffHours = Math.floor(diffMs / 3600000);
              const diffDays = Math.floor(diffMs / 86400000);

              if (diffMins < 1) timeDisplay = "Ahora";
              else if (diffMins < 60) timeDisplay = `hace ${diffMins}m`;
              else if (diffHours < 24) timeDisplay = `hace ${diffHours}h`;
              else if (diffDays < 7) timeDisplay = `hace ${diffDays}d`;
              else timeDisplay = timestamp.toLocaleDateString();

              return (
                <div
                  key={log.id}
                  style={{
                    padding: "1.5rem",
                    borderBottom: `1px solid ${COLORS.border}`,
                    display: "flex",
                    gap: "1rem",
                    alignItems: "start",
                    transition: "background 0.2s",
                    background: index % 2 === 0 ? "transparent" : COLORS.bg
                  }}
                >
                  {/* ICONO */}
                  <div style={{
                    fontSize: "1.5rem",
                    minWidth: "40px",
                    textAlign: "center"
                  }}>
                    {getActivityIcon(log.type)}
                  </div>

                  {/* CONTENIDO */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      color: getActivityColor(log.type),
                      fontWeight: 700,
                      margin: "0 0 0.25rem 0",
                      fontSize: "0.95rem"
                    }}>
                      {log.title}
                    </p>
                    <p style={{
                      color: COLORS.textMuted,
                      fontSize: "0.85rem",
                      margin: "0 0 0.5rem 0",
                      wordBreak: "break-word"
                    }}>
                      {log.description}
                    </p>
                    <div style={{
                      display: "flex",
                      gap: "1rem",
                      fontSize: "0.75rem",
                      color: COLORS.textMuted"
                    }}>
                      <span>📍 {log.expedienteId || "General"}</span>
                      <span>🕐 {timeDisplay}</span>
                      <span style={{ textTransform: "capitalize" }}>
                        {log.action}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
