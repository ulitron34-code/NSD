import React, { useState, useEffect } from "react";
import { useNotification } from "../../hooks/useNotification";
import { useIndexedDB } from "../../hooks/useIndexedDB";
import { useAuth } from "../../hooks/useAuth";
import {
  getExpedientesForUser,
  createDemoExpediente,
  updateExpediente,
  getExpediente
} from "../../services/expedienteService";
import { getDocumentsByExpediente } from "../../services/documentService";
import { getRequirementsByExpediente } from "../../services/requirementServiceV2";
import { getConversationForUser } from "../../services/messagingServiceV2";
import { generateExpedientePDF } from "../../services/pdfExportService";
import { searchExpedientes } from "../../services/searchService";
import { COLORS } from "../../utils/constants";

export default function ExpedientesTab() {
  const { addNotification } = useNotification();
  const { db } = useIndexedDB('nsd-app', 1);
  const { user } = useAuth();

  const [expedientes, setExpedientes] = useState([]);
  const [filteredExpedientes, setFilteredExpedientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExp, setSelectedExp] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [exportingId, setExportingId] = useState(null);

  // Cargar expedientes
  useEffect(() => {
    if (!user) return;

    const loadExpedientes = async () => {
      try {
        let exps = await getExpedientesForUser(user.id);

        // Si no hay expedientes, crear uno demo
        if (exps.length === 0) {
          const demoExp = await createDemoExpediente();
          exps = [demoExp];
          addNotification('Expediente demo creado', 'info');
        }

        setExpedientes(exps);
        setLoading(false);
      } catch (err) {
        console.error('Error loading expedientes:', err);
        setLoading(false);
      }
    };

    loadExpedientes();
  }, [user, db]);

  // Filtrar expedientes por búsqueda
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredExpedientes(expedientes);
    } else {
      const filtered = searchExpedientes(expedientes, searchQuery);
      setFilteredExpedientes(filtered);
    }
  }, [expedientes, searchQuery]);

  const handleExportPDF = async (expId) => {
    try {
      setExportingId(expId);
      const exp = await getExpediente(expId);
      const docs = await getDocumentsByExpediente(expId);
      const reqs = await getRequirementsByExpediente(expId);
      const msgs = await getConversationForUser(user.id, expId) || [];

      await generateExpedientePDF(exp, reqs, docs, msgs);
      addNotification(`📥 Expediente ${exp.id} descargado`, 'success');
    } catch (err) {
      console.error('Error exportando PDF:', err);
      addNotification('Error al exportar PDF', 'error');
    } finally {
      setExportingId(null);
    }
  };

  const handleUpdateStatus = async (expId, newStatus) => {
    try {
      const updated = await updateExpediente(expId, { status: newStatus });
      setExpedientes(expedientes.map(e => e.id === expId ? updated : e));
      setSelectedExp(updated);
      addNotification(`Expediente actualizado a: ${newStatus}`, 'success');
    } catch (err) {
      console.error('Error updating expediente:', err);
      addNotification('Error al actualizar expediente', 'error');
    }
  };

  const getMiRol = (expediente) => {
    if (expediente.solicitanteId === user?.id) return 'Solicitante';
    if (expediente.otorganteId === user?.id) return 'Otorgante';
    return 'Desconocido';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'activo': return COLORS.green;
      case 'pausado': return COLORS.amber;
      case 'cerrado': return '#C62828';
      default: return COLORS.navy;
    }
  };

  if (loading) return <p>Cargando expedientes...</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1.5rem", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ color: COLORS.navy, fontSize: "2rem", marginBottom: "0.5rem" }}>
            📋 Mis Expedientes
          </h1>
          <p style={{ color: COLORS.textMuted, maxWidth: "760px" }}>
            Órdenes vinculadas entre Solicitante y Otorgante. Tienes acceso a {expedientes.length} expediente(s).
          </p>
        </div>
      </div>

      {/* BUSCADOR */}
      <div style={{ marginBottom: "1.5rem" }}>
        <input
          type="text"
          placeholder="🔍 Busca por nombre, ID, sector..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "500px",
            padding: "0.75rem 1rem",
            border: `2px solid ${COLORS.border}`,
            borderRadius: "8px",
            fontSize: "0.95rem",
            fontWeight: 500
          }}
        />
        {searchQuery && (
          <p style={{ color: COLORS.textMuted, fontSize: "0.85rem", margin: "0.5rem 0 0 0" }}>
            📊 {filteredExpedientes.length} resultado(s)
          </p>
        )}
      </div>

      {/* LISTA DE EXPEDIENTES */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "1.5rem",
        marginBottom: "2rem"
      }}>
        {filteredExpedientes.length === 0 && (
          <p style={{ color: COLORS.textMuted, gridColumn: "1 / -1", textAlign: "center", padding: "2rem" }}>
            No hay expedientes que coincidan con la búsqueda
          </p>
        )}
        {filteredExpedientes.map((exp) => (
          <div
            key={exp.id}
            onClick={() => setSelectedExp(exp)}
            style={{
              background: COLORS.white,
              border: selectedExp?.id === exp.id ? `2px solid ${COLORS.gold}` : `1px solid ${COLORS.border}`,
              borderRadius: "10px",
              padding: "1.5rem",
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: selectedExp?.id === exp.id ? "0 4px 16px rgba(201, 168, 76, 0.3)" : "0 2px 8px rgba(0,0,0,0.08)"
            }}
            onMouseEnter={(e) => {
              if (selectedExp?.id !== exp.id) {
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)";
              }
            }}
            onMouseLeave={(e) => {
              if (selectedExp?.id !== exp.id) {
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
              }
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ color: COLORS.navy, margin: 0, marginBottom: "0.5rem", fontSize: "1.1rem" }}>
                  {exp.title}
                </h3>
                <p style={{ color: COLORS.textMuted, fontSize: "0.85rem", margin: 0 }}>
                  {exp.id}
                </p>
              </div>
              <span style={{
                display: "inline-block",
                padding: "0.35rem 0.7rem",
                borderRadius: "999px",
                background: `${getStatusColor(exp.status)}33`,
                color: getStatusColor(exp.status),
                fontSize: "0.8rem",
                fontWeight: 700,
                textTransform: "capitalize"
              }}>
                {exp.status}
              </span>
            </div>

            <div style={{ display: "grid", gap: "0.5rem", marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.9rem" }}>
                <strong style={{ color: COLORS.navy }}>Mi rol:</strong> {getMiRol(exp)}
              </div>
              <div style={{ fontSize: "0.9rem" }}>
                <strong style={{ color: COLORS.navy }}>Monto:</strong> ${(exp.amount || 0).toLocaleString()}
              </div>
              <div style={{ fontSize: "0.9rem" }}>
                <strong style={{ color: COLORS.navy }}>Sector:</strong> {exp.sector}
              </div>
            </div>

            <div style={{
              background: COLORS.bg,
              padding: "0.75rem",
              borderRadius: "6px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "0.75rem",
              marginBottom: "1rem"
            }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ color: COLORS.textMuted, fontSize: "0.7rem", margin: "0 0 0.25rem 0" }}>Docs</p>
                <p style={{ color: COLORS.navy, fontWeight: 800, fontSize: "1.1rem", margin: 0 }}>
                  {exp.documents?.length || 0}
                </p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ color: COLORS.textMuted, fontSize: "0.7rem", margin: "0 0 0.25rem 0" }}>Reqs</p>
                <p style={{ color: COLORS.navy, fontWeight: 800, fontSize: "1.1rem", margin: 0 }}>
                  {exp.requirements?.length || 0}
                </p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ color: COLORS.textMuted, fontSize: "0.7rem", margin: "0 0 0.25rem 0" }}>Msgs</p>
                <p style={{ color: COLORS.navy, fontWeight: 800, fontSize: "1.1rem", margin: 0 }}>
                  {exp.messages?.length || 0}
                </p>
              </div>
            </div>

            <p style={{ color: COLORS.textMuted, fontSize: "0.75rem", margin: 0 }}>
              Creado: {new Date(exp.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>

      {/* DETALLE EXPEDIENTE */}
      {selectedExp && (
        <div style={{
          background: COLORS.white,
          border: `2px solid ${COLORS.gold}`,
          borderRadius: "10px",
          padding: "2rem",
          boxShadow: "0 4px 16px rgba(201, 168, 76, 0.2)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1.5rem" }}>
            <div>
              <h2 style={{ color: COLORS.navy, margin: 0, marginBottom: "0.5rem" }}>
                {selectedExp.title}
              </h2>
              <p style={{ color: COLORS.textMuted, margin: 0, fontSize: "0.9rem" }}>
                ID: {selectedExp.id}
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              {['activo', 'pausado', 'cerrado'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleUpdateStatus(selectedExp.id, status)}
                  style={{
                    padding: "0.5rem 1rem",
                    background: selectedExp.status === status ? COLORS.gold : COLORS.bg,
                    color: selectedExp.status === status ? COLORS.navy : COLORS.text,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: "6px",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "0.85rem",
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
              ["Rol en este expediente", getMiRol(selectedExp)],
              ["Solicitante", selectedExp.solicitanteName],
              ["Otorgante", selectedExp.otorganteName],
              ["Sector", selectedExp.sector],
              ["Monto solicitado", `$${(selectedExp.amount || 0).toLocaleString()}`],
              ["Estado", selectedExp.status]
            ].map(([label, value]) => (
              <div key={label} style={{ background: COLORS.bg, padding: "1rem", borderRadius: "8px" }}>
                <p style={{ color: COLORS.textMuted, fontSize: "0.85rem", margin: "0 0 0.5rem 0" }}>
                  {label}
                </p>
                <p style={{ color: COLORS.navy, fontWeight: 700, fontSize: "1rem", margin: 0 }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {selectedExp.description && (
            <div style={{
              background: COLORS.bg,
              padding: "1rem",
              borderRadius: "8px",
              marginBottom: "1.5rem",
              borderLeft: `3px solid ${COLORS.gold}`
            }}>
              <p style={{ color: COLORS.textMuted, fontSize: "0.85rem", margin: "0 0 0.5rem 0" }}>
                Descripción
              </p>
              <p style={{ color: COLORS.text, margin: 0, lineHeight: 1.6 }}>
                {selectedExp.description}
              </p>
            </div>
          )}

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "1rem",
            marginTop: "1.5rem"
          }}>
            {[
              ["📄 Documentos", selectedExp.documents?.length || 0, "Archivos cargados"],
              ["📋 Requerimientos", selectedExp.requirements?.length || 0, "Solicitudes pendientes"],
              ["💬 Mensajes", selectedExp.messages?.length || 0, "Comunicaciones"]
            ].map(([icon, count, label]) => (
              <div key={label} style={{
                background: COLORS.bg,
                padding: "1rem",
                borderRadius: "8px",
                textAlign: "center",
                borderTop: `3px solid ${COLORS.gold}`
              }}>
                <p style={{ color: COLORS.navy, fontSize: "1.8rem", margin: "0 0 0.25rem 0" }}>
                  {icon}
                </p>
                <p style={{ color: COLORS.navy, fontWeight: 800, fontSize: "1.5rem", margin: "0 0 0.25rem 0" }}>
                  {count}
                </p>
                <p style={{ color: COLORS.textMuted, fontSize: "0.85rem", margin: 0 }}>
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* BOTÓN DE DESCARGAR PDF */}
          <button
            onClick={() => handleExportPDF(selectedExp.id)}
            disabled={exportingId === selectedExp.id}
            style={{
              width: "100%",
              marginTop: "1.5rem",
              padding: "0.75rem 1rem",
              background: exportingId === selectedExp.id ? COLORS.textMuted : COLORS.gold,
              color: COLORS.navy,
              border: "none",
              borderRadius: "8px",
              fontWeight: 700,
              cursor: exportingId === selectedExp.id ? "not-allowed" : "pointer",
              fontSize: "0.95rem",
              opacity: exportingId === selectedExp.id ? 0.7 : 1,
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              if (exportingId !== selectedExp.id) {
                e.currentTarget.style.background = "#B8860B";
              }
            }}
            onMouseLeave={(e) => {
              if (exportingId !== selectedExp.id) {
                e.currentTarget.style.background = COLORS.gold;
              }
            }}
          >
            {exportingId === selectedExp.id ? "📥 Generando..." : "📥 Descargar expediente como PDF"}
          </button>

          <div style={{
            marginTop: "1.5rem",
            padding: "1rem",
            background: "#E3F2FD",
            borderRadius: "8px",
            borderLeft: `3px solid ${COLORS.blue}`,
            color: COLORS.blue,
            fontSize: "0.9rem"
          }}>
            <p style={{ margin: 0, fontWeight: 700 }}>
              ℹ️ Este es el expediente que vincula tu actividad con {getMiRol(selectedExp) === "Solicitante" ? "el Otorgante" : "el Solicitante"}
            </p>
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.85rem" }}>
              Documentos, requerimientos y mensajes se vinculan automáticamente a este expediente
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
