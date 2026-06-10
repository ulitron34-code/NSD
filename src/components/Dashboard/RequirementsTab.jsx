import React, { useState, useEffect } from "react";
import { useNotification } from "../../hooks/useNotification";
import { useAuth } from "../../hooks/useAuth";
import { COLORS } from "../../utils/constants";
import {
  createRequirement,
  getRequirementsForUser,
  getRequirementsByExpediente,
  respondToRequirement,
  approveRequirementResponse,
  rejectRequirementResponse,
  getRequirementStats
} from "../../services/requirementServiceV2";
import { getExpedientesForUser } from "../../services/expedienteService";

// FASE 5: RequirementsTab completamente conectado a requirementServiceV2

const statusConfig = {
  pending: { label: "Pendiente", color: "#FFA500", bg: "#FFF3CD" },
  provided: { label: "Respondido", color: "#2E7D32", bg: "#E8F5E9" },
  approved: { label: "Aprobado", color: "#1976D2", bg: "#E3F2FD" },
  rejected: { label: "Rechazado", color: "#C62828", bg: "#FFEBEE" },
  overdue: { label: "Vencido", color: "#D32F2F", bg: "#FFEBEE" },
};

const priorityConfig = {
  high: { label: "Alta", color: "#C62828" },
  normal: { label: "Normal", color: "#FFA500" },
  low: { label: "Baja", color: "#757575" },
};

export default function RequirementsTab() {
  const { addNotification } = useNotification();
  const { user } = useAuth();

  // FASE 5: Estados para expedientes y requerimientos
  const [expedientes, setExpedientes] = useState([]);
  const [selectedExpediente, setSelectedExpediente] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);

  // Formulario
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    documentType: "",
    priority: "normal",
    dueDate: "",
  });

  // FASE 5: Cargar expedientes del usuario
  useEffect(() => {
    if (!user) return;

    const loadExpedientes = async () => {
      try {
        const exps = await getExpedientesForUser(user.id);
        setExpedientes(exps);
        // Auto-seleccionar el primero
        if (exps.length > 0 && !selectedExpediente) {
          setSelectedExpediente(exps[0]);
        }
      } catch (err) {
        console.error("Error loading expedientes:", err);
      }
    };

    loadExpedientes();
  }, [user]);

  // FASE 5: Cargar requerimientos del expediente seleccionado
  useEffect(() => {
    if (!selectedExpediente || !user) {
      setLoading(false);
      return;
    }

    const loadRequirements = async () => {
      try {
        setLoading(true);

        let reqs = [];

        // Si el usuario es OTORGANTE, ver todos los reqs del expediente
        if (selectedExpediente.otorganteId === user.id) {
          reqs = await getRequirementsByExpediente(selectedExpediente.id);
        } else {
          // Si es SOLICITANTE, ver solo los dirigidos a él
          reqs = await getRequirementsForUser(user.id);
          reqs = reqs.filter(r => r.expedienteId === selectedExpediente.id);
        }

        setRequirements(reqs);

        // Calcular stats
        const s = await getRequirementStats(selectedExpediente.id);
        setStats(s);
        setLoading(false);
      } catch (err) {
        console.error("Error loading requirements:", err);
        setLoading(false);
      }
    };

    loadRequirements();

    // FASE 5: Auto-refresh cada 5 segundos
    const interval = setInterval(loadRequirements, 5000);
    return () => clearInterval(interval);
  }, [selectedExpediente, user]);

  // FASE 5: Crear requerimiento (OTORGANTE)
  const handleCreateRequirement = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      addNotification("Título y descripción son requeridos", "error");
      return;
    }

    if (!selectedExpediente) {
      addNotification("Selecciona un expediente", "error");
      return;
    }

    try {
      const newReq = await createRequirement({
        createdBy: user.id,
        createdByRole: "otorgante",
        targetUserId: selectedExpediente.solicitanteId,
        expedienteId: selectedExpediente.id,
        title: formData.title,
        description: formData.description,
        documentType: formData.documentType,
        priority: formData.priority,
        dueDate: formData.dueDate || null
      });

      // Recargar lista (notificación automática en createRequirement)
      const reqs = await getRequirementsByExpediente(selectedExpediente.id);
      setRequirements(reqs);
      const s = await getRequirementStats(selectedExpediente.id);
      setStats(s);

      setFormData({ title: "", description: "", documentType: "", priority: "normal", dueDate: "" });
      setShowCreateForm(false);
      addNotification("✅ Requerimiento creado. Notificación enviada al solicitante", "success");
    } catch (err) {
      console.error("Error:", err);
      addNotification("Error al crear requerimiento", "error");
    }
  };

  // FASE 5: Responder requerimiento (SOLICITANTE)
  const handleRespondToRequirement = async (requirementId, documentId) => {
    try {
      await respondToRequirement(requirementId, documentId);

      // Recargar
      const reqs = await getRequirementsForUser(user.id);
      const filtered = reqs.filter(r => r.expedienteId === selectedExpediente.id);
      setRequirements(filtered);
      const s = await getRequirementStats(selectedExpediente.id);
      setStats(s);

      addNotification("✅ Respuesta enviada. Otorgante notificado", "success");
    } catch (err) {
      console.error("Error:", err);
      addNotification("Error al responder", "error");
    }
  };

  // FASE 5: Aprobar (OTORGANTE)
  const handleApprove = async (reqId) => {
    try {
      await approveRequirementResponse(reqId, user.id);

      // Recargar
      const reqs = await getRequirementsByExpediente(selectedExpediente.id);
      setRequirements(reqs);
      const s = await getRequirementStats(selectedExpediente.id);
      setStats(s);
      setSelectedReq(null);

      addNotification("✅ Aprobado. Solicitante notificado", "success");
    } catch (err) {
      console.error("Error:", err);
      addNotification("Error al aprobar", "error");
    }
  };

  // FASE 5: Rechazar (OTORGANTE)
  const handleReject = async (reqId) => {
    const reason = prompt("¿Razón del rechazo?");
    if (!reason) return;

    try {
      await rejectRequirementResponse(reqId, reason, user.id);

      // Recargar
      const reqs = await getRequirementsByExpediente(selectedExpediente.id);
      setRequirements(reqs);
      const s = await getRequirementStats(selectedExpediente.id);
      setStats(s);
      setSelectedReq(null);

      addNotification("❌ Rechazado. Solicitante notificado con razón", "success");
    } catch (err) {
      console.error("Error:", err);
      addNotification("Error al rechazar", "error");
    }
  };

  const isOtorgante = selectedExpediente?.otorganteId === user?.id;
  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1.5rem", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ color: COLORS.navy, fontSize: "2rem", marginBottom: "0.5rem" }}>
            {isOtorgante ? "📋 Información Solicitada" : "📨 Mis Requerimientos"}
          </h1>
          <p style={{ color: COLORS.textMuted, maxWidth: "760px" }}>
            {isOtorgante
              ? "Crea y gestiona requerimientos para el solicitante"
              : "Responde a los requerimientos solicitados por el otorgante"}
          </p>
        </div>
        {isOtorgante && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{
              padding: "0.75rem 1.25rem",
              background: COLORS.gold,
              color: COLORS.navy,
              border: "none",
              borderRadius: "6px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {showCreateForm ? "Cerrar" : "➕ Crear requerimiento"}
          </button>
        )}
      </div>

      {/* SELECTOR DE EXPEDIENTE */}
      {expedientes.length > 0 && (
        <div style={{
          background: COLORS.white,
          padding: "1rem",
          borderRadius: "8px",
          marginBottom: "1.5rem",
          border: `1px solid ${COLORS.border}`
        }}>
          <label style={{ fontWeight: 700, color: COLORS.navy, marginRight: "1rem" }}>
            Expediente:
          </label>
          <select
            value={selectedExpediente?.id || ""}
            onChange={(e) => {
              const exp = expedientes.find(x => x.id === e.target.value);
              setSelectedExpediente(exp);
            }}
            style={{
              padding: "0.5rem 0.75rem",
              border: `1px solid ${COLORS.border}`,
              borderRadius: "4px",
              fontSize: "0.9rem"
            }}
          >
            {expedientes.map(exp => (
              <option key={exp.id} value={exp.id}>
                {exp.title} ({exp.id})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* STATUS CARDS */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { label: "Total", value: stats.total, color: COLORS.navy },
            { label: "Aprobados", value: stats.approved, color: COLORS.green },
            { label: "Pendientes", value: stats.pending, color: COLORS.amber },
            { label: "Respondidos", value: stats.provided, color: "#2E7D32" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: COLORS.white,
                padding: "1.25rem",
                borderRadius: "10px",
                borderTop: `4px solid ${item.color}`,
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              <p style={{ color: COLORS.textMuted, fontSize: "0.82rem", textTransform: "uppercase" }}>
                {item.label}
              </p>
              <p style={{ color: COLORS.navy, fontSize: "1.9rem", fontWeight: 800 }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* FORM (OTORGANTE) */}
      {showCreateForm && isOtorgante && (
        <div
          style={{
            background: COLORS.white,
            padding: "2rem",
            borderRadius: "10px",
            marginBottom: "2rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <form onSubmit={handleCreateRequirement} style={{ display: "grid", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, color: COLORS.navy }}>
                Título
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: RFC actualizado"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "6px",
                  fontSize: "1rem",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, color: COLORS.navy }}>
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="¿Qué necesitas?"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "6px",
                  minHeight: "80px",
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, color: COLORS.navy }}>
                  Tipo
                </label>
                <input
                  type="text"
                  value={formData.documentType}
                  onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                  placeholder="PDF, Word..."
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: "6px",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, color: COLORS.navy }}>
                  Prioridad
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: "6px",
                  }}
                >
                  <option value="low">Baja</option>
                  <option value="normal">Normal</option>
                  <option value="high">Alta</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700, color: COLORS.navy }}>
                  Vencimiento
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: "6px",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
              <button
                type="submit"
                style={{
                  padding: "0.75rem 1.5rem",
                  background: COLORS.green,
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Crear
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: COLORS.border,
                  color: COLORS.navy,
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LISTA DE REQUERIMIENTOS */}
      <div style={{
        background: COLORS.white,
        borderRadius: "10px",
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}>
        {loading && <p style={{ padding: "2rem", color: COLORS.textMuted }}>Cargando...</p>}

        {!loading && requirements.length === 0 && (
          <p style={{ padding: "2rem", color: COLORS.textMuted, textAlign: "center" }}>
            {isOtorgante ? "No hay requerimientos creados" : "No hay requerimientos dirigidos a ti"}
          </p>
        )}

        {!loading && requirements.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%" }}>
              <thead>
                <tr style={{ background: COLORS.bg, borderBottom: `1px solid ${COLORS.border}` }}>
                  <th style={{ padding: "1rem", textAlign: "left", fontWeight: 700, color: COLORS.navy }}>
                    Requerimiento
                  </th>
                  <th style={{ padding: "1rem", textAlign: "center", fontWeight: 700, color: COLORS.navy }}>
                    Prioridad
                  </th>
                  <th style={{ padding: "1rem", textAlign: "center", fontWeight: 700, color: COLORS.navy }}>
                    Estado
                  </th>
                  <th style={{ padding: "1rem", textAlign: "center", fontWeight: 700, color: COLORS.navy }}>
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody>
                {requirements.map((req) => {
                  const status = statusConfig[req.status] || statusConfig.pending;
                  const priority = priorityConfig[req.priority] || priorityConfig.normal;
                  const isOver = isOverdue(req.dueDate);

                  return (
                    <tr
                      key={req.id}
                      style={{
                        borderBottom: `1px solid ${COLORS.border}`,
                        cursor: "pointer",
                        background: selectedReq?.id === req.id ? COLORS.bg : "transparent",
                      }}
                    >
                      <td style={{ padding: "1rem" }}>
                        <p style={{ color: COLORS.navy, fontWeight: 700, margin: 0 }}>
                          {req.title}
                        </p>
                        <p style={{ color: COLORS.textMuted, fontSize: "0.85rem", margin: "0.25rem 0 0 0" }}>
                          {req.description}
                        </p>
                      </td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>
                        <span style={{ color: priority.color, fontWeight: 700, fontSize: "0.85rem" }}>
                          {priority.label}
                        </span>
                      </td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.35rem 0.75rem",
                            background: status.bg,
                            color: status.color,
                            borderRadius: "4px",
                            fontWeight: 700,
                            fontSize: "0.8rem",
                          }}
                        >
                          {status.label} {isOver && "⚠️"}
                        </span>
                      </td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>
                        {isOtorgante && req.status === "provided" && (
                          <>
                            <button
                              onClick={() => handleApprove(req.id)}
                              style={{
                                padding: "0.4rem 0.8rem",
                                background: COLORS.green,
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                fontWeight: 700,
                                cursor: "pointer",
                                marginRight: "0.5rem",
                              }}
                            >
                              ✅
                            </button>
                            <button
                              onClick={() => handleReject(req.id)}
                              style={{
                                padding: "0.4rem 0.8rem",
                                background: "#C62828",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              ❌
                            </button>
                          </>
                        )}
                        {!isOtorgante && req.status === "pending" && (
                          <button
                            style={{
                              padding: "0.4rem 0.8rem",
                              background: COLORS.gold,
                              color: COLORS.navy,
                              border: "none",
                              borderRadius: "4px",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            Responder
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}