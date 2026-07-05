import { error } from '../../utils/logger';
import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useMyOrders } from "../../hooks/useMyOrders";
import { COLORS } from "../../utils/constants";
import { getExpedientesForUser, getExpediente } from "../../services/expedienteService";
import { getDocumentsByExpediente } from "../../services/documentService";
import { getRequirementsByExpediente } from "../../services/requirementServiceV2";
import { ordersAPI, documentsAPI, informationRequestsAPI } from "../../services/api";

// FASE 6+: Milestones Timeline - Visualización progresiva del expediente
// Antes 100% IndexedDB falso (nunca llegaba al backend) y código huérfano
// (no estaba conectado a ningún menú) — ahora lee ordersAPI/documentsAPI/
// informationRequestsAPI reales cuando el usuario no está en modo demo.

function mapRealOrderToExpediente(order) {
  const metadata = order.metadata || {};
  return {
    id: order.id,
    title: order.project_name || metadata.projectName || order.case_number || 'Expediente',
    amount: Number(order.requested_amount || order.amount || 0),
    status: order.stage === 'cerrado' ? 'cerrado' : 'activo',
    createdAt: order.created_at
  };
}

export default function MilestonesTimeline() {
  const { user } = useAuth();
  const { orders: realOrders, isDemo } = useMyOrders();
  const [expediente, setExpediente] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [selectedExpedienteId, setSelectedExpedienteId] = useState(null);
  const [expedientes, setExpedientes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar expedientes al montar
  useEffect(() => {
    if (!user) return;

    if (isDemo) {
      const loadExpedientes = async () => {
        try {
          const exps = await getExpedientesForUser(user.id);
          setExpedientes(exps);
          if (exps.length > 0) setSelectedExpedienteId(exps[0].id);
        } catch (err) {
          error("SVC", "Error cargando expedientes:", err);
        }
      };
      loadExpedientes();
      return;
    }

    const mapped = realOrders.map(mapRealOrderToExpediente);
    setExpedientes(mapped);
    if (mapped.length > 0) setSelectedExpedienteId(mapped[0].id);
  }, [user, isDemo, realOrders]);

  // Cargar expediente detallado y calcular hitos
  useEffect(() => {
    if (!user || !selectedExpedienteId) return;

    const loadMilestonesDemo = async () => {
      const exp = await getExpediente(selectedExpedienteId);
      const docs = await getDocumentsByExpediente(selectedExpedienteId);
      const reqs = await getRequirementsByExpediente(selectedExpedienteId);
      return { exp, docs, reqs };
    };

    const loadMilestonesReal = async () => {
      const [{ data: order }, docsResp, reqsResp] = await Promise.all([
        ordersAPI.getById(selectedExpedienteId),
        documentsAPI.list(selectedExpedienteId).catch(() => ({ data: [] })),
        informationRequestsAPI.list(selectedExpedienteId).catch(() => ({ data: [] }))
      ]);

      const exp = mapRealOrderToExpediente(order);
      const docs = (docsResp?.data || []).map((d) => ({ fileName: d.filename, uploadedAt: d.uploaded_at }));
      const reqs = (reqsResp?.data || []).map((r) => ({
        title: r.title,
        createdAt: r.created_at,
        status: r.status === 'open' ? 'pending' : r.status === 'resolved' ? 'approved' : r.status === 'waived' ? 'rejected' : 'provided'
      }));
      return { exp, docs, reqs };
    };

    const loadMilestones = async () => {
      try {
        setLoading(true);
        const { exp, docs, reqs } = isDemo ? await loadMilestonesDemo() : await loadMilestonesReal();

        setExpediente(exp);

        // Construir timeline de hitos
        const timeline = [];

        // 1. Creación del expediente
        timeline.push({
          id: "milestone-created",
          timestamp: new Date(exp.createdAt),
          type: "expediente_created",
          title: "Expediente creado",
          description: exp.title,
          icon: "📑",
          color: COLORS.blue,
          completed: true,
          percentComplete: 0
        });

        // 2. Primer documento subido
        if (docs.length > 0) {
          const firstDoc = docs.reduce((a, b) =>
            new Date(a.uploadedAt) < new Date(b.uploadedAt) ? a : b
          );
          timeline.push({
            id: "milestone-first-doc",
            timestamp: new Date(firstDoc.uploadedAt),
            type: "document_upload",
            title: "Primer documento",
            description: `${firstDoc.fileName} subido`,
            icon: "📄",
            color: COLORS.blue,
            completed: true,
            percentComplete: 20
          });
        }

        // 3. Todos los documentos subidos
        if (docs.length > 1) {
          const lastDoc = docs.reduce((a, b) =>
            new Date(a.uploadedAt) > new Date(b.uploadedAt) ? a : b
          );
          timeline.push({
            id: "milestone-all-docs",
            timestamp: new Date(lastDoc.uploadedAt),
            type: "documents_complete",
            title: `Todos los documentos (${docs.length})`,
            description: "Subida de documentación completa",
            icon: "📚",
            color: COLORS.green,
            completed: true,
            percentComplete: 40
          });
        }

        // 4. Primer requerimiento creado
        if (reqs.length > 0) {
          const firstReq = reqs.reduce((a, b) =>
            new Date(a.createdAt) < new Date(b.createdAt) ? a : b
          );
          timeline.push({
            id: "milestone-first-req",
            timestamp: new Date(firstReq.createdAt),
            type: "requirement_created",
            title: "Primer requerimiento",
            description: firstReq.title,
            icon: "📋",
            color: COLORS.amber,
            completed: true,
            percentComplete: 50
          });
        }

        // 5. Respuestas pendientes
        const pendingReqs = reqs.filter(r => r.status === "pending");
        if (pendingReqs.length === 0 && reqs.length > 0) {
          timeline.push({
            id: "milestone-all-responded",
            timestamp: new Date(),
            type: "requirement_responded",
            title: "Todos respondidos",
            description: "Se respondieron todos los requerimientos",
            icon: "📤",
            color: COLORS.blue,
            completed: true,
            percentComplete: 60
          });
        } else if (pendingReqs.length > 0) {
          timeline.push({
            id: "milestone-pending",
            timestamp: new Date(pendingReqs[0].createdAt),
            type: "requirement_pending",
            title: `${pendingReqs.length} requerimiento(s) pendiente(s)`,
            description: "En espera de respuesta",
            icon: "🕐",
            color: COLORS.amber,
            completed: false,
            percentComplete: 55
          });
        }

        // 6. Requerimientos aprobados
        const approvedReqs = reqs.filter(r => r.status === "approved");
        if (approvedReqs.length > 0) {
          timeline.push({
            id: "milestone-approved-reqs",
            timestamp: new Date(),
            type: "requirement_approved",
            title: `Requerimientos aprobados (${approvedReqs.length})`,
            description: "Aprobación completada",
            icon: "✅",
            color: COLORS.green,
            completed: true,
            percentComplete: 80
          });
        }

        // 7. Estado final
        if (exp.status === "cerrado") {
          timeline.push({
            id: "milestone-closed",
            timestamp: new Date(),
            type: "expediente_closed",
            title: "Expediente cerrado",
            description: "Proceso completado",
            icon: "🏁",
            color: COLORS.green,
            completed: true,
            percentComplete: 100
          });
        } else {
          timeline.push({
            id: "milestone-final",
            timestamp: new Date(),
            type: "expediente_active",
            title: exp.status === "activo" ? "En progreso" : "Pausado",
            description: `Estado actual: ${exp.status}`,
            icon: exp.status === "activo" ? "⚡" : "⏸️",
            color: exp.status === "activo" ? COLORS.amber : "#999",
            completed: false,
            percentComplete: 70
          });
        }

        // Ordenar por timestamp
        timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        setMilestones(timeline);
        setLoading(false);
      } catch (err) {
        error("SVC", "Error cargando hitos:", err);
        setLoading(false);
      }
    };

    loadMilestones();
  }, [user, selectedExpedienteId, isDemo]);

  const totalProgress = milestones.length > 0
    ? Math.round(
        milestones.reduce((sum, m) => sum + m.percentComplete, 0) / milestones.length
      )
    : 0;

  return (
    <div>
      {/* HEADER */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ color: COLORS.navy, fontSize: "2rem", margin: "0 0 0.5rem 0" }}>
          🎯 Línea de Tiempo del Expediente
        </h1>
        <p style={{ color: COLORS.textMuted, margin: "0 0 1.5rem 0" }}>
          Visualiza el progreso del flujo completo
        </p>

        {/* SELECTOR DE EXPEDIENTE */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ color: COLORS.navy, fontWeight: 700, display: "block", marginBottom: "0.5rem" }}>
            Selecciona expediente:
          </label>
          <select
            value={selectedExpedienteId || ""}
            onChange={(e) => setSelectedExpedienteId(e.target.value)}
            style={{
              width: "100%",
              maxWidth: "400px",
              padding: "0.75rem",
              border: `2px solid ${COLORS.border}`,
              borderRadius: "6px",
              fontSize: "1rem",
              fontWeight: 500
            }}
          >
            <option value="">-- Selecciona --</option>
            {expedientes.map(exp => (
              <option key={exp.id} value={exp.id}>
                {exp.title} (${exp.amount?.toLocaleString() || 0})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <p style={{ color: COLORS.textMuted, textAlign: "center", padding: "2rem" }}>
          Cargando hitos...
        </p>
      )}

      {!loading && expediente && (
        <>
          {/* BARRA DE PROGRESO */}
          <div style={{
            background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
            padding: "1.5rem",
            borderRadius: "10px",
            border: `1px solid ${COLORS.border}`,
            marginBottom: "2rem"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <p style={{ color: COLORS.navy, fontWeight: 700, margin: 0 }}>
                Progreso general
              </p>
              <p style={{ color: COLORS.navy, fontWeight: 700, margin: 0 }}>
                {totalProgress}%
              </p>
            </div>
            <div style={{
              width: "100%",
              height: "8px",
              background: COLORS.bg,
              borderRadius: "4px",
              overflow: "hidden"
            }}>
              <div style={{
                width: `${totalProgress}%`,
                height: "100%",
                background: `linear-gradient(90deg, ${COLORS.blue}, ${COLORS.green})`,
                transition: "width 0.3s ease"
              }} />
            </div>
          </div>

          {/* TIMELINE */}
          <div style={{ position: "relative" }}>
            {/* Línea vertical */}
            <div style={{
              position: "absolute",
              left: "24px",
              top: "50px",
              bottom: "0",
              width: "2px",
              background: COLORS.border
            }} />

            {/* Hitos */}
            <div style={{ position: "relative" }}>
              {milestones.map((milestone, index) => {
                const daysSince = Math.floor((new Date() - new Date(milestone.timestamp)) / (1000 * 60 * 60 * 24));
                let timeDisplay = "";

                if (daysSince === 0) timeDisplay = "Hoy";
                else if (daysSince === 1) timeDisplay = "Ayer";
                else if (daysSince < 7) timeDisplay = `Hace ${daysSince}d`;
                else timeDisplay = new Date(milestone.timestamp).toLocaleDateString("es-MX");

                return (
                  <div key={milestone.id} style={{
                    marginBottom: "2rem",
                    paddingLeft: "80px",
                    position: "relative"
                  }}>
                    {/* Círculo del hito */}
                    <div style={{
                      position: "absolute",
                      left: "10px",
                      top: "0",
                      width: "30px",
                      height: "30px",
                      borderRadius: "50%",
                      background: milestone.completed ? milestone.color : COLORS.bg,
                      border: `3px solid ${milestone.completed ? milestone.color : COLORS.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.2rem",
                      zIndex: 1
                    }}>
                      {milestone.icon}
                    </div>

                    {/* Contenido del hito */}
                    <div style={{
                      background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
                      border: `2px solid ${milestone.color}`,
                      borderRadius: "8px",
                      padding: "1rem",
                      opacity: milestone.completed ? 1 : 0.7
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.5rem" }}>
                        <p style={{
                          color: milestone.color,
                          fontWeight: 700,
                          margin: 0,
                          fontSize: "1.05rem"
                        }}>
                          {milestone.title}
                          {!milestone.completed && <span style={{ color: COLORS.amber, fontSize: "0.8rem" }}> ⏳</span>}
                        </p>
                        <span style={{
                          fontSize: "0.75rem",
                          color: COLORS.textMuted,
                          background: COLORS.bg,
                          padding: "0.25rem 0.75rem",
                          borderRadius: "4px"
                        }}>
                          {timeDisplay}
                        </span>
                      </div>

                      <p style={{
                        color: COLORS.text,
                        margin: "0 0 0.75rem 0",
                        fontSize: "0.95rem"
                      }}>
                        {milestone.description}
                      </p>

                      {/* Mini progress bar */}
                      <div style={{
                        height: "4px",
                        background: COLORS.bg,
                        borderRadius: "2px",
                        overflow: "hidden"
                      }}>
                        <div style={{
                          width: `${milestone.percentComplete}%`,
                          height: "100%",
                          background: milestone.color,
                          transition: "width 0.3s ease"
                        }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ESTADÍSTICAS FINALES */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "1rem",
            marginTop: "2rem"
          }}>
            <div style={{
              background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
              padding: "1rem",
              borderRadius: "8px",
              border: `1px solid ${COLORS.border}`,
              textAlign: "center"
            }}>
              <p style={{ color: COLORS.textMuted, fontSize: "0.75rem", margin: "0 0 0.5rem 0", textTransform: "uppercase" }}>
                Total hitos
              </p>
              <p style={{ color: COLORS.navy, fontSize: "1.8rem", fontWeight: 800, margin: 0 }}>
                {milestones.length}
              </p>
            </div>

            <div style={{
              background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
              padding: "1rem",
              borderRadius: "8px",
              border: `1px solid ${COLORS.border}`,
              textAlign: "center"
            }}>
              <p style={{ color: COLORS.textMuted, fontSize: "0.75rem", margin: "0 0 0.5rem 0", textTransform: "uppercase" }}>
                Completados
              </p>
              <p style={{ color: COLORS.green, fontSize: "1.8rem", fontWeight: 800, margin: 0 }}>
                {milestones.filter(m => m.completed).length}
              </p>
            </div>

            <div style={{
              background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
              padding: "1rem",
              borderRadius: "8px",
              border: `1px solid ${COLORS.border}`,
              textAlign: "center"
            }}>
              <p style={{ color: COLORS.textMuted, fontSize: "0.75rem", margin: "0 0 0.5rem 0", textTransform: "uppercase" }}>
                Pendientes
              </p>
              <p style={{ color: COLORS.amber, fontSize: "1.8rem", fontWeight: 800, margin: 0 }}>
                {milestones.filter(m => !m.completed).length}
              </p>
            </div>

            <div style={{
              background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
              padding: "1rem",
              borderRadius: "8px",
              border: `1px solid ${COLORS.border}`,
              textAlign: "center"
            }}>
              <p style={{ color: COLORS.textMuted, fontSize: "0.75rem", margin: "0 0 0.5rem 0", textTransform: "uppercase" }}>
                Duración
              </p>
              <p style={{ color: COLORS.navy, fontSize: "1.8rem", fontWeight: 800, margin: 0 }}>
                {Math.ceil((new Date() - new Date(expediente.createdAt)) / (1000 * 60 * 60 * 24))}d
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
