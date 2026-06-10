import React, { useState, useEffect, useMemo } from "react";
import { useNotification } from "../../hooks/useNotification";
import { useAuth } from "../../hooks/useAuth";
import { COLORS } from "../../utils/constants";
import {
  getExpedientesForUser,
  updateExpediente,
  getExpedienteSummary
} from "../../services/expedienteService";
import {
  getRequirementsByExpediente,
  getRequirementStats
} from "../../services/requirementServiceV2";
import {
  getConversationForUser
} from "../../services/messagingServiceV2";
import {
  getDocumentsByExpediente
} from "../../services/documentService";

// FASE 6: ExpedientesTab V2 - Búsqueda, filtros, estadísticas avanzadas

export default function ExpedientesTab() {
  const { addNotification } = useNotification();
  const { user } = useAuth();

  const [expedientes, setExpedientes] = useState([]);
  const [selectedExp, setSelectedExp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, activo, pausado, cerrado
  const [viewMode, setViewMode] = useState("grid"); // grid, list
  const [expStats, setExpStats] = useState({});
  const [selectedExpDetails, setSelectedExpDetails] = useState(null);

  // FASE 6: Cargar expedientes con stats
  useEffect(() => {
    if (!user) return;

    const loadExpedientes = async () => {
      try {
        setLoading(true);
        const exps = await getExpedientesForUser(user.id);
        setExpedientes(exps);

        // Cargar stats para cada uno
        const stats = {};
        for (const exp of exps) {
          try {
            const reqs = await getRequirementsByExpediente(exp.id);
            const msgs = await getConversationForUser(user.id, exp.id);
            const docs = await getDocumentsByExpediente(exp.id, user.id);
            stats[exp.id] = {
              requirements: reqs.length,
              messages: msgs.length,
              documents: docs.length
            };
          } catch (err) {
            console.error(`Error loading stats for ${exp.id}:`, err);
            stats[exp.id] = { requirements: 0, messages: 0, documents: 0 };
          }
        }
        setExpStats(stats);

        if (exps.length > 0 && !selectedExp) {
          setSelectedExp(exps[0]);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error:", err);
        setLoading(false);
      }
    };

    loadExpedientes();

    // Auto-refresh cada 15s
    const interval = setInterval(loadExpedientes, 15000);
    return () => clearInterval(interval);
  }, [user, selectedExp]);

  // FASE 6: Filtro y búsqueda
  const filteredExpedientes = useMemo(() => {
    return expedientes.filter(exp => {
      const matchesSearch =
        exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.solicitanteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.otorganteName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        filterStatus === "all" || exp.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [expedientes, searchQuery, filterStatus]);

  // FASE 6: Cargar detalles completos de expediente
  const handleSelectExpediente = async (exp) => {
    try {
      const reqs = await getRequirementsByExpediente(exp.id);
      const msgs = await getConversationForUser(user.id, exp.id);
      const docs = await getDocumentsByExpediente(exp.id, user.id);
      const reqStats = await getRequirementStats(exp.id);

      setSelectedExpDetails({
        ...exp,
        requirements: reqs,
        messages: msgs,
        documents: docs,
        reqStats: reqStats
      });
      setSelectedExp(exp);
    } catch (err) {
      console.error("Error loading details:", err);
      addNotification("Error al cargar detalles", "error");
    }
  };

  // FASE 6: Cambiar estado
  const handleUpdateStatus = async (expId, newStatus) => {
    try {
      await updateExpediente(expId, { status: newStatus });
      const updated = expedientes.map(e =>
        e.id === expId ? { ...e, status: newStatus } : e
      );
      setExpedientes(updated);
      if (selectedExp?.id === expId) {
        setSelectedExp({ ...selectedExp, status: newStatus });
      }
      addNotification(`Estado actualizado a: ${newStatus}`, "success");
    } catch (err) {
      console.error("Error:", err);
      addNotification("Error al actualizar estado", "error");
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      activo: { bg: "#E8F5E9", color: COLORS.green },
      pausado: { bg: "#FFF3CD", color: COLORS.amber },
      cerrado: { bg: "#FFEBEE", color: "#C62828" }
    };
    return colors[status] || colors.activo;
  };

  const getMiRol = (exp) => {
    return exp.otorganteId === user?.id ? "Otorgante" : "Solicitante";
  };

  return (
    <div>
      {/* HEADER CON BÚSQUEDA Y FILTROS */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <h1 style={{ color: COLORS.navy, fontSize: "2rem", margin: 0, marginBottom: "0.5rem" }}>
              📋 Mis Expedientes
            </h1>
            <p style={{ color: COLORS.textMuted, margin: 0, fontSize: "0.9rem" }}>
              {filteredExpedientes.length} de {expedientes.length} expediente(s)
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => setViewMode("grid")}
              style={{
                padding: "0.5rem 1rem",
                background: viewMode === "grid" ? COLORS.gold : COLORS.border,
                color: viewMode === "grid" ? COLORS.navy : COLORS.text,
                border: "none",
                borderRadius: "4px",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              🏠
            </button>
            <button
              onClick={() => setViewMode("list")}
              style={{
                padding: "0.5rem 1rem",
                background: viewMode === "list" ? COLORS.gold : COLORS.border,
                color: viewMode === "list" ? COLORS.navy : COLORS.text,
                border: "none",
                borderRadius: "4px",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              ☰
            </button>
          </div>
        </div>

        {/* BÚSQUEDA */}
        <input
          type="text"
          placeholder="🔍 Buscar por nombre, ID, solicitante, otorgante..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "0.75rem 1rem",
            border: `2px solid ${COLORS.border}`,
            borderRadius: "8px",
            fontSize: "0.95rem",
            marginBottom: "1rem"
          }}
        />

        {/* FILTROS */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {["all", "activo", "pausado", "cerrado"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              style={{
                padding: "0.5rem 1rem",
                background: filterStatus === status ? COLORS.gold : COLORS.bg,
                color: filterStatus === status ? COLORS.navy : COLORS.text,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "6px",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: "0.85rem",
                textTransform: "capitalize"
              }}
            >
              {status === "all" ? "Todos" : status}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <p style={{ color: COLORS.textMuted, textAlign: "center", padding: "2rem" }}>
          Cargando expedientes...
        </p>
      )}

      {!loading && filteredExpedientes.length === 0 && (
        <p style={{ color: COLORS.textMuted, textAlign: "center", padding: "2rem" }}>
          No hay expedientes que coincidan
        </p>
      )}

      {/* VISTA GRID */}
      {!loading && viewMode === "grid" && filteredExpedientes.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem"
        }}>
          {filteredExpedientes.map((exp) => {
            const stats = expStats[exp.id] || {};
            const statusColor = getStatusBadge(exp.status);
            return (
              <div
                key={exp.id}
                onClick={() => handleSelectExpediente(exp)}
                style={{
                  background: COLORS.white,
                  border: selectedExp?.id === exp.id ? `3px solid ${COLORS.gold}` : `1px solid ${COLORS.border}`,
                  borderRadius: "10px",
                  padding: "1.5rem",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: selectedExp?.id === exp.id ? "0 4px 16px rgba(201, 168, 76, 0.3)" : "0 2px 8px rgba(0,0,0,0.08)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ color: COLORS.navy, margin: "0 0 0.25rem 0", fontSize: "1.1rem", fontWeight: 800 }}>
                      {exp.title}
                    </h3>
                    <p style={{ color: COLORS.textMuted, fontSize: "0.8rem", margin: 0 }}>
                      {exp.id}
                    </p>
                  </div>
                  <span style={{
                    display: "inline-block",
                    padding: "0.35rem 0.7rem",
                    borderRadius: "999px",
                    background: statusColor.bg,
                    color: statusColor.color,
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    textTransform: "capitalize"
                  }}>
                    {exp.status}
                  </span>
                </div>

                <div style={{ background: COLORS.bg, padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem" }}>
                  <p style={{ fontSize: "0.8rem", color: COLORS.textMuted, margin: "0 0 0.35rem 0" }}>
                    <strong>Rol:</strong> {getMiRol(exp)}
                  </p>
                  <p style={{ fontSize: "0.8rem", color: COLORS.textMuted, margin: "0 0 0.35rem 0" }}>
                    <strong>Monto:</strong> ${(exp.amount || 0).toLocaleString()}
                  </p>
                  <p style={{ fontSize: "0.8rem", color: COLORS.textMuted, margin: 0 }}>
                    <strong>Sector:</strong> {exp.sector}
                  </p>
                </div>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "0.5rem"
                }}>
                  <div style={{ textAlign: "center", padding: "0.5rem", background: COLORS.bg, borderRadius: "4px" }}>
                    <p style={{ fontSize: "0.7rem", color: COLORS.textMuted, margin: "0 0 0.25rem 0" }}>Docs</p>
                    <p style={{ fontSize: "1.2rem", fontWeight: 800, color: COLORS.navy, margin: 0 }}>
                      {stats.documents || 0}
                    </p>
                  </div>
                  <div style={{ textAlign: "center", padding: "0.5rem", background: COLORS.bg, borderRadius: "4px" }}>
                    <p style={{ fontSize: "0.7rem", color: COLORS.textMuted, margin: "0 0 0.25rem 0" }}>Reqs</p>
                    <p style={{ fontSize: "1.2rem", fontWeight: 800, color: COLORS.navy, margin: 0 }}>
                      {stats.requirements || 0}
                    </p>
                  </div>
                  <div style={{ textAlign: "center", padding: "0.5rem", background: COLORS.bg, borderRadius: "4px" }}>
                    <p style={{ fontSize: "0.7rem", color: COLORS.textMuted, margin: "0 0 0.25rem 0" }}>Msgs</p>
                    <p style={{ fontSize: "1.2rem", fontWeight: 800, color: COLORS.navy, margin: 0 }}>
                      {stats.messages || 0}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETALLE EXPEDIENTE */}
      {selectedExpDetails && (
        <div style={{
          background: COLORS.white,
          border: `2px solid ${COLORS.gold}`,
          borderRadius: "10px",
          padding: "2rem",
          boxShadow: "0 4px 16px rgba(201, 168, 76, 0.2)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1.5rem" }}>
            <div>
              <h2 style={{ color: COLORS.navy, margin: 0, marginBottom: "0.5rem", fontSize: "1.5rem" }}>
                {selectedExpDetails.title}
              </h2>
              <p style={{ color: COLORS.textMuted, margin: 0, fontSize: "0.9rem" }}>
                ID: {selectedExpDetails.id}
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {["activo", "pausado", "cerrado"].map((status) => (
                <button
                  key={status}
                  onClick={() => handleUpdateStatus(selectedExpDetails.id, status)}
                  style={{
                    padding: "0.5rem 0.75rem",
                    background: selectedExpDetails.status === status ? COLORS.gold : COLORS.bg,
                    color: selectedExpDetails.status === status ? COLORS.navy : COLORS.text,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: "4px",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    textTransform: "capitalize"
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.5rem",
            marginBottom: "1.5rem"
          }}>
            {[
              ["Rol", getMiRol(selectedExpDetails)],
              ["Solicitante", selectedExpDetails.solicitanteName],
              ["Otorgante", selectedExpDetails.otorganteName],
              ["Sector", selectedExpDetails.sector],
              ["Monto", `$${(selectedExpDetails.amount || 0).toLocaleString()}`],
              ["Estado", selectedExpDetails.status]
            ].map(([label, value]) => (
              <div key={label} style={{ background: COLORS.bg, padding: "1rem", borderRadius: "8px" }}>
                <p style={{ color: COLORS.textMuted, fontSize: "0.8rem", margin: "0 0 0.5rem 0" }}>
                  {label}
                </p>
                <p style={{ color: COLORS.navy, fontWeight: 700, fontSize: "1rem", margin: 0 }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* STATS DE REQUERIMIENTOS */}
          {selectedExpDetails.reqStats && (
            <div style={{
              background: COLORS.bg,
              padding: "1rem",
              borderRadius: "8px",
              marginBottom: "1rem",
              borderLeft: `3px solid ${COLORS.gold}`
            }}>
              <p style={{ color: COLORS.navy, fontWeight: 700, marginBottom: "0.75rem" }}>
                📊 Estado de Requerimientos
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "0.75rem" }}>
                <div>
                  <p style={{ fontSize: "0.75rem", color: COLORS.textMuted, margin: 0 }}>Total</p>
                  <p style={{ fontSize: "1.5rem", fontWeight: 800, color: COLORS.navy, margin: 0 }}>
                    {selectedExpDetails.reqStats.total}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: "0.75rem", color: COLORS.textMuted, margin: 0 }}>Pendientes</p>
                  <p style={{ fontSize: "1.5rem", fontWeight: 800, color: COLORS.amber, margin: 0 }}>
                    {selectedExpDetails.reqStats.pending}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: "0.75rem", color: COLORS.textMuted, margin: 0 }}>Respondidos</p>
                  <p style={{ fontSize: "1.5rem", fontWeight: 800, color: COLORS.green, margin: 0 }}>
                    {selectedExpDetails.reqStats.provided}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: "0.75rem", color: COLORS.textMuted, margin: 0 }}>Aprobados</p>
                  <p style={{ fontSize: "1.5rem", fontWeight: 800, color: COLORS.green, margin: 0 }}>
                    {selectedExpDetails.reqStats.approved}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* INFORMACIÓN */}
          <div style={{
            background: "#E3F2FD",
            padding: "1rem",
            borderRadius: "8px",
            borderLeft: `3px solid ${COLORS.blue}`,
            color: COLORS.blue,
            fontSize: "0.9rem"
          }}>
            <p style={{ margin: 0, fontWeight: 700 }}>
              ℹ️ Expediente vinculando a {getMiRol(selectedExpDetails) === "Solicitante" ? "Otorgante" : "Solicitante"}
            </p>
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.85rem" }}>
              {selectedExpDetails.documents?.length || 0} documento(s) · {selectedExpDetails.requirements?.length || 0} requerimiento(s) · {selectedExpDetails.messages?.length || 0} mensaje(s)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
