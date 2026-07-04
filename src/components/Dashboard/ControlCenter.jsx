import { error, debug, info, warn } from '../../utils/logger';
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { COLORS } from "../../utils/constants";
import { getExpedientesForUser } from "../../services/expedienteService";
import { getDocumentsByUser } from "../../services/documentService";
import { getRequirementsForUser, getRequirementsByExpediente } from "../../services/requirementServiceV2";
import { getUnreadMessages } from "../../services/messagingServiceV2";
import { getActivityLogs } from "../../services/auditService";
import { uiText, translateCopy } from "../../utils/runtimeCopy";

// FASE 6: Control Center - Panel de control global en tiempo real

export default function ControlCenter() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);
  const copy = (val) => translateCopy(val, i18n.language);

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  // Cargar stats globales
  useEffect(() => {
    if (!user) return;

    const loadStats = async () => {
      try {
        const expedientes = await getExpedientesForUser(user.id);
        const documents = await getDocumentsByUser(user.id);
        const requirements = await getRequirementsForUser(user.id);
        const unread = await getUnreadMessages(user.id);
        const logs = await getActivityLogs(user.id, 500);

        // Contar requerimientos por estado
        let reqStats = {
          pending: 0,
          provided: 0,
          approved: 0,
          rejected: 0
        };

        requirements.forEach(req => {
          if (req.status === 'pending') reqStats.pending++;
          else if (req.status === 'provided') reqStats.provided++;
          else if (req.status === 'approved') reqStats.approved++;
          else if (req.status === 'rejected') reqStats.rejected++;
        });

        // Contar documentos por estado
        let docStats = {
          pending: 0,
          approved: 0,
          rejected: 0
        };

        documents.forEach(doc => {
          if (doc.status === 'pending') docStats.pending++;
          else if (doc.status === 'approved') docStats.approved++;
          else if (doc.status === 'rejected') docStats.rejected++;
        });

        // Actividad hoy
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const activitiestoday = logs.filter(log => new Date(log.timestamp) >= today).length;

        // Expedientes por estado
        const expByStatus = {
          activo: expedientes.filter(e => e.status === 'activo').length,
          pausado: expedientes.filter(e => e.status === 'pausado').length,
          cerrado: expedientes.filter(e => e.status === 'cerrado').length
        };

        setStats({
          expedientes: expedientes.length,
          documents: documents.length,
          requirements: requirements.length,
          unreadMessages: unread.length,
          activities: logs.length,
          activitiestoday,
          reqStats,
          docStats,
          expByStatus,
          lastActivity: logs[0]
        });

        setLoading(false);
      } catch (err) {
        error("SVC", "Error loading stats:", err);
        setLoading(false);
      }
    };

    loadStats();

    // Auto-refresh
    const interval = setInterval(loadStats, refreshInterval);
    return () => clearInterval(interval);
  }, [user, refreshInterval]);

  const getHealth = () => {
    if (!stats) return "neutral";
    // Verde si todo está aprobado, amarillo si hay pendientes, rojo si hay rechazos
    if (stats.reqStats.rejected > 0 || stats.docStats.rejected > 0) return "critical";
    if (stats.reqStats.pending > 0 || stats.docStats.pending > 0) return "warning";
    return "healthy";
  };

  const healthColors = {
    critical: "#C62828",
    warning: COLORS.amber,
    healthy: COLORS.green
  };

  return (
    <div>
      {/* HEADER */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h1 style={{ color: COLORS.navy, fontSize: "2rem", margin: "0 0 0.5rem 0" }}>
              🎛️ {L("Centro de Control", "Control Center")}
            </h1>
            <p style={{ color: COLORS.textMuted, margin: 0 }}>
              {L("Panel global de tu actividad en tiempo real", "Global panel of your activity in real time")}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ color: COLORS.textMuted, fontSize: "0.85rem", margin: "0 0 0.5rem 0" }}>
              {L("Auto-actualiza cada", "Auto-updates every")}
            </p>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
              style={{
                padding: "0.5rem 0.75rem",
                border: `1px solid ${COLORS.border}`,
                borderRadius: "4px",
                fontSize: "0.85rem"
              }}
            >
              <option value={1000}>1s</option>
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <p style={{ color: COLORS.textMuted, textAlign: "center", padding: "2rem" }}>
          {L("Cargando datos...", "Loading data...")}
        </p>
      )}

      {!loading && stats && (
        <>
          {/* ESTADO DE SALUD */}
          <div style={{
            background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
            border: `3px solid ${healthColors[getHealth()]}`,
            borderRadius: "10px",
            padding: "2rem",
            marginBottom: "2rem",
            textAlign: "center"
          }}>
            <p style={{ color: COLORS.textMuted, fontSize: "0.85rem", margin: "0 0 0.5rem 0", textTransform: "uppercase" }}>
              {L("Estado del sistema", "System status")}
            </p>
            <p style={{ color: healthColors[getHealth()], fontSize: "2.5rem", fontWeight: 800, margin: 0 }}>
              {getHealth() === "healthy" && `✅ ${L("Saludable", "Healthy")}`}
              {getHealth() === "warning" && `⚠️ ${L("Revisar", "Review")}`}
              {getHealth() === "critical" && `🚨 ${L("Crítico", "Critical")}`}
            </p>
          </div>

          {/* GRID PRINCIPAL */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1.5rem",
            marginBottom: "2rem"
          }}>
            {/* EXPEDIENTES */}
            <div style={{
              background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
              padding: "1.5rem",
              borderRadius: "10px",
              border: `1px solid ${COLORS.border}`,
              textAlign: "center"
            }}>
              <p style={{ color: COLORS.textMuted, fontSize: "0.75rem", margin: "0 0 0.5rem 0", textTransform: "uppercase" }}>
                {L("Expedientes", "Compliance Files")}
              </p>
              <p style={{ color: COLORS.navy, fontSize: "2.5rem", fontWeight: 800, margin: "0 0 1rem 0" }}>
                {stats.expedientes}
              </p>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                <span style={{ fontSize: "0.75rem", color: COLORS.green }}>
                  ✅ {stats.expByStatus.activo}
                </span>
                <span style={{ fontSize: "0.75rem", color: COLORS.amber }}>
                  ⏸️ {stats.expByStatus.pausado}
                </span>
                <span style={{ fontSize: "0.75rem", color: "#999" }}>
                  🔚 {stats.expByStatus.cerrado}
                </span>
              </div>
            </div>

            {/* DOCUMENTOS */}
            <div style={{
              background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
              padding: "1.5rem",
              borderRadius: "10px",
              border: `1px solid ${COLORS.border}`,
              textAlign: "center"
            }}>
              <p style={{ color: COLORS.textMuted, fontSize: "0.75rem", margin: "0 0 0.5rem 0", textTransform: "uppercase" }}>
                {L("Documentos", "Documents")}
              </p>
              <p style={{ color: COLORS.navy, fontSize: "2.5rem", fontWeight: 800, margin: "0 0 1rem 0" }}>
                {stats.documents}
              </p>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                <span style={{ fontSize: "0.75rem", color: COLORS.amber }}>
                  🕐 {stats.docStats.pending}
                </span>
                <span style={{ fontSize: "0.75rem", color: COLORS.green }}>
                  ✅ {stats.docStats.approved}
                </span>
                <span style={{ fontSize: "0.75rem", color: "#C62828" }}>
                  ❌ {stats.docStats.rejected}
                </span>
              </div>
            </div>

            {/* REQUERIMIENTOS */}
            <div style={{
              background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
              padding: "1.5rem",
              borderRadius: "10px",
              border: `1px solid ${COLORS.border}`,
              textAlign: "center"
            }}>
              <p style={{ color: COLORS.textMuted, fontSize: "0.75rem", margin: "0 0 0.5rem 0", textTransform: "uppercase" }}>
                {L("Requerimientos", "Requests")}
              </p>
              <p style={{ color: COLORS.navy, fontSize: "2.5rem", fontWeight: 800, margin: "0 0 1rem 0" }}>
                {stats.requirements}
              </p>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.75rem", color: COLORS.amber }}>
                  🕐 {stats.reqStats.pending}
                </span>
                <span style={{ fontSize: "0.75rem", color: COLORS.blue }}>
                  📤 {stats.reqStats.provided}
                </span>
                <span style={{ fontSize: "0.75rem", color: COLORS.green }}>
                  ✅ {stats.reqStats.approved}
                </span>
                <span style={{ fontSize: "0.75rem", color: "#C62828" }}>
                  ❌ {stats.reqStats.rejected}
                </span>
              </div>
            </div>

            {/* MENSAJES */}
            <div style={{
              background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
              padding: "1.5rem",
              borderRadius: "10px",
              border: `1px solid ${COLORS.border}`,
              textAlign: "center"
            }}>
              <p style={{ color: COLORS.textMuted, fontSize: "0.75rem", margin: "0 0 0.5rem 0", textTransform: "uppercase" }}>
                {L("Mensajes sin leer", "Unread Messages")}
              </p>
              <p style={{ color: stats.unreadMessages > 0 ? COLORS.amber : COLORS.green, fontSize: "2.5rem", fontWeight: 800, margin: 0 }}>
                {stats.unreadMessages}
              </p>
            </div>

            {/* ACTIVIDAD */}
            <div style={{
              background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
              padding: "1.5rem",
              borderRadius: "10px",
              border: `1px solid ${COLORS.border}`,
              textAlign: "center"
            }}>
              <p style={{ color: COLORS.textMuted, fontSize: "0.75rem", margin: "0 0 0.5rem 0", textTransform: "uppercase" }}>
                {L("Actividades hoy", "Activities Today")}
              </p>
              <p style={{ color: COLORS.navy, fontSize: "2.5rem", fontWeight: 800, margin: 0 }}>
                {stats.activitiestoday}
              </p>
            </div>

            {/* TOTAL ACTIVIDADES */}
            <div style={{
              background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
              padding: "1.5rem",
              borderRadius: "10px",
              border: `1px solid ${COLORS.border}`,
              textAlign: "center"
            }}>
              <p style={{ color: COLORS.textMuted, fontSize: "0.75rem", margin: "0 0 0.5rem 0", textTransform: "uppercase" }}>
                {L("Total actividades", "Total Activities")}
              </p>
              <p style={{ color: COLORS.navy, fontSize: "2.5rem", fontWeight: 800, margin: 0 }}>
                {stats.activities}
              </p>
            </div>
          </div>

          {/* ÚLTIMA ACTIVIDAD */}
          {stats.lastActivity && (
            <div style={{
              background: COLORS.bg,
              padding: "1.5rem",
              borderRadius: "10px",
              borderLeft: `3px solid ${COLORS.gold}`
            }}>
              <p style={{ color: COLORS.navy, fontWeight: 700, marginBottom: "0.5rem" }}>
                📍 {L("Última actividad", "Latest Activity")}
              </p>
              <p style={{ color: COLORS.text, margin: "0 0 0.35rem 0" }}>
                {copy(stats.lastActivity.title)}
              </p>
              <p style={{ color: COLORS.textMuted, fontSize: "0.85rem", margin: 0 }}>
                {new Date(stats.lastActivity.timestamp).toLocaleString(i18n.language?.startsWith("en") ? "en-US" : "es-MX")}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
