import { error, debug, info, warn } from '../../utils/logger';
import React, { useState, useEffect } from "react";
import { useIndexedDB } from "../../hooks/useIndexedDB";
import { getDocumentsByOrder, getLogsByEntity } from "../../services/storageService";
import { getRequirementsByOrder } from "../../services/requirementService";
import { getConversation } from "../../services/messagingService";
import { calculateScore } from "../../services/scoringService";
import { getCurrentOrder } from "../../services/localStorageService";
import { COLORS } from "../../utils/constants";

export default function MetricsDashboard() {
  const { db } = useIndexedDB('nsd-app', 1);
  const orderId = getCurrentOrder();

  const [metrics, setMetrics] = useState({
    documents: 0,
    score: 0,
    requirements: 0,
    messages: 0,
    days: 0,
    activities: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !orderId) return;

    const loadMetrics = async () => {
      try {
        // Documentos
        const docs = await getDocumentsByOrder(db, orderId);
        const docsApproved = docs.filter(d => d.status === 'approved').length;

        // Score
        const score = calculateScore(docs);

        // Requerimientos
        const reqs = await getRequirementsByOrder(db, orderId);
        const openReqs = reqs.filter(r => r.status === 'pending').length;

        // Mensajes
        const msgs = await getConversation(db, orderId);
        const unreadMsgs = msgs.filter(m => !m.read).length;

        // Logs/Actividades
        const logs = await getLogsByEntity(db, orderId);

        // Días desde inicio
        const firstLog = logs[logs.length - 1];
        const daysElapsed = firstLog ? Math.floor((Date.now() - new Date(firstLog.timestamp).getTime()) / (1000 * 60 * 60 * 24)) : 0;

        setMetrics({
          documents: `${docsApproved}/${docs.length}`,
          score: score.totalScore,
          requirements: openReqs,
          messages: unreadMsgs,
          days: Math.max(daysElapsed, 0),
          activities: logs.length
        });

        setLoading(false);
      } catch (err) {
        error("SVC", 'Error loading metrics:', err);
        setLoading(false);
      }
    };

    loadMetrics();

    // Recargar cada 30 segundos
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, [db, orderId]);

  if (loading) return <div style={{ textAlign: 'center', color: COLORS.textMuted }}>Cargando métricas...</div>;

  const kpiCards = [
    {
      label: "Documentos Aprobados",
      value: metrics.documents,
      icon: "📄",
      color: COLORS.green,
      bgColor: "rgba(46, 125, 50, 0.1)"
    },
    {
      label: "Puntuación",
      value: `${metrics.score}/100`,
      icon: "🎯",
      color: metrics.score >= 70 ? COLORS.green : metrics.score >= 50 ? COLORS.amber : "#C62828",
      bgColor: "rgba(201, 168, 76, 0.1)"
    },
    {
      label: "Requerimientos Abiertos",
      value: metrics.requirements,
      icon: "📋",
      color: metrics.requirements > 0 ? COLORS.amber : COLORS.green,
      bgColor: "rgba(255, 152, 0, 0.1)"
    },
    {
      label: "Mensajes Sin Leer",
      value: metrics.messages,
      icon: "💬",
      color: metrics.messages > 0 ? "#C62828" : COLORS.green,
      bgColor: "rgba(198, 40, 40, 0.1)"
    },
    {
      label: "Días en Proceso",
      value: metrics.days,
      icon: "📅",
      color: COLORS.gold,
      bgColor: "rgba(201, 168, 76, 0.1)"
    },
    {
      label: "Actividades Registradas",
      value: metrics.activities,
      icon: "📊",
      color: COLORS.navy,
      bgColor: "rgba(15, 31, 46, 0.1)"
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ color: COLORS.navy, fontSize: "1.5rem", marginBottom: "1.5rem" }}>
          📈 Métricas en Tiempo Real
        </h2>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem"
        }}>
          {kpiCards.map((kpi) => (
            <div
              key={kpi.label}
              style={{
                background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
                border: `1px solid ${COLORS.border}`,
                borderRadius: "10px",
                padding: "1.5rem",
                textAlign: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{
                fontSize: "2.5rem",
                marginBottom: "0.75rem"
              }}>
                {kpi.icon}
              </div>

              <div style={{
                fontSize: "1.8rem",
                fontWeight: 800,
                color: kpi.color,
                marginBottom: "0.5rem"
              }}>
                {kpi.value}
              </div>

              <div style={{
                fontSize: "0.85rem",
                color: COLORS.textMuted,
                fontWeight: 600
              }}>
                {kpi.label}
              </div>

              <div style={{
                marginTop: "1rem",
                height: "4px",
                background: kpi.bgColor,
                borderRadius: "2px",
                overflow: "hidden"
              }}>
                <div style={{
                  height: "100%",
                  background: kpi.color,
                  width: calculateProgressWidth(kpi.label, kpi.value),
                  transition: "width 0.3s ease"
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* INDICADOR DE SALUD */}
      <div style={{
        background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
        border: `1px solid ${COLORS.border}`,
        borderRadius: "10px",
        padding: "2rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
      }}>
        <h3 style={{ color: COLORS.navy, marginTop: 0 }}>🏥 Salud del Expediente</h3>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1.5rem",
          marginTop: "1rem"
        }}>
          {[
            {
              name: "Documentación",
              status: parseInt(metrics.documents) >= 5 ? "excelente" : parseInt(metrics.documents) >= 3 ? "buena" : "mejora",
              description: "Archivos cargados y aprobados"
            },
            {
              name: "Responsividad",
              status: metrics.requirements === 0 ? "excelente" : metrics.requirements <= 2 ? "buena" : "mejora",
              description: "Respuesta a requerimientos"
            },
            {
              name: "Comunicación",
              status: metrics.messages === 0 ? "excelente" : metrics.messages <= 2 ? "buena" : "mejora",
              description: "Mensajes pendientes"
            }
          ].map((item) => {
            const colors = {
              excelente: { bg: "rgba(46, 125, 50, 0.1)", color: COLORS.green, label: "✓ Excelente" },
              buena: { bg: "rgba(255, 152, 0, 0.1)", color: COLORS.amber, label: "~ Buena" },
              mejora: { bg: "rgba(198, 40, 40, 0.1)", color: "#C62828", label: "⚠ Mejora" }
            };
            const color = colors[item.status];

            return (
              <div
                key={item.name}
                style={{
                  background: color.bg,
                  border: `1px solid ${color.color}`,
                  borderRadius: "8px",
                  padding: "1rem"
                }}
              >
                <p style={{ color: COLORS.navy, fontWeight: 700, margin: "0 0 0.5rem 0" }}>
                  {item.name}
                </p>
                <p style={{ color: color.color, fontWeight: 700, margin: "0.5rem 0", fontSize: "1rem" }}>
                  {color.label}
                </p>
                <p style={{ color: COLORS.textMuted, fontSize: "0.85rem", margin: 0 }}>
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Helper para calcular ancho de barra
function calculateProgressWidth(label, value) {
  if (label === "Puntuación") {
    const score = parseInt(value);
    return `${Math.min(score, 100)}%`;
  } else if (label === "Documentos Aprobados") {
    const parts = value.split('/');
    return `${(parseInt(parts[0]) / parseInt(parts[1])) * 100}%`;
  } else if (label === "Días en Proceso") {
    return `${Math.min(parseInt(value) * 5, 100)}%`;
  }
  return "50%";
}
