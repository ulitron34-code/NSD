import { error, debug, info, warn } from '../../utils/logger';
import React, { useState } from "react";
import { useNotification } from "../../hooks/useNotification";
import { COLORS } from "../../utils/constants";
import { demoCases } from "../../data/demoCases";

const riskColor = {
  Bajo: COLORS.green,
  Medio: COLORS.amber,
  Alto: "#C62828",
  Critico: "#8B0000",
};

export default function ProyectosTab() {
  const { addNotification } = useNotification();
  const [cases, setCases] = useState(demoCases);
  const [showForm, setShowForm] = useState(false);
  const [selectedCase, setSelectedCase] = useState(demoCases[0]);
  const [formData, setFormData] = useState({
    subject: "",
    type: "KYB empresarial",
    risk: "Medio",
    assignee: "Ana Compliance",
  });

  const createCase = (e) => {
    e.preventDefault();
    if (!formData.subject.trim()) {
      addNotification("Agrega el nombre del solicitante o entidad", "error");
      return;
    }

    const newCase = {
      id: `CASE-${String(cases.length + 1).padStart(3, "0")}`,
      subject: formData.subject,
      type: formData.type,
      status: "Nuevo",
      risk: formData.risk,
      assignee: formData.assignee,
      sla: "24 h",
      lastActivity: "Caso creado en modo demo",
      comments: ["Caso creado desde formulario demo."],
      timeline: ["Caso creado"],
    };

    setCases((prev) => [newCase, ...prev]);
    setSelectedCase(newCase);
    setFormData({ subject: "", type: "KYB empresarial", risk: "Medio", assignee: "Ana Compliance" });
    setShowForm(false);
    addNotification("Caso de cumplimiento creado", "success");
  };

  const advanceCase = (caseId) => {
    setCases((prev) =>
      prev.map((item) =>
        item.id === caseId
          ? { ...item, status: "En revision", lastActivity: "Revision asignada", timeline: [...(item.timeline || []), "Revision asignada"] }
          : item
      )
    );
    setSelectedCase((prev) => prev?.id === caseId ? { ...prev, status: "En revision", lastActivity: "Revision asignada", timeline: [...(prev.timeline || []), "Revision asignada"] } : prev);
    addNotification("Caso actualizado", "success");
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1.5rem", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ color: COLORS.navy, fontSize: "2rem", marginBottom: "0.5rem" }}>
            Casos de cumplimiento
          </h1>
          <p style={{ color: COLORS.textMuted, maxWidth: "760px" }}>
            Gestiona casos KYC/KYB con riesgo, responsable, SLA y ultima actividad.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: "0.75rem 1.5rem",
            background: COLORS.gold,
            color: COLORS.navy,
            border: "none",
            borderRadius: "6px",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          {showForm ? "Cerrar" : "Nuevo caso"}
        </button>
      </div>

      {showForm && (
        <div style={{
          background: COLORS.white,
          padding: "2rem",
          borderRadius: "10px",
          marginBottom: "2rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}>
          <form onSubmit={createCase}>
            <div className="case-form-grid" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr auto", gap: "1rem", alignItems: "end" }}>
              <div>
                <label style={{ color: COLORS.navy, fontWeight: 700, fontSize: "0.9rem" }}>Solicitante o entidad</label>
                <input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Ej: Empresa Demo SA de CV"
                />
              </div>
              <div>
                <label style={{ color: COLORS.navy, fontWeight: 700, fontSize: "0.9rem" }}>Tipo</label>
                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                  <option>KYB empresarial</option>
                  <option>KYC representante legal</option>
                  <option>Beneficiario final</option>
                  <option>Revision documental</option>
                </select>
              </div>
              <div>
                <label style={{ color: COLORS.navy, fontWeight: 700, fontSize: "0.9rem" }}>Riesgo</label>
                <select value={formData.risk} onChange={(e) => setFormData({ ...formData, risk: e.target.value })}>
                  <option>Bajo</option>
                  <option>Medio</option>
                  <option>Alto</option>
                  <option>Critico</option>
                </select>
              </div>
              <div>
                <label style={{ color: COLORS.navy, fontWeight: 700, fontSize: "0.9rem" }}>Asignado a</label>
                <select value={formData.assignee} onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}>
                  <option>Ana Compliance</option>
                  <option>Luis Riesgos</option>
                  <option>Mariana Legal</option>
                </select>
              </div>
              <button
                type="submit"
                style={{
                  padding: "0.75rem 1.25rem",
                  background: COLORS.gold,
                  color: COLORS.navy,
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: 800,
                }}
              >
                Crear
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="dashboard-detail-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.35fr) minmax(300px, 0.85fr)", gap: "1.5rem", alignItems: "start" }}>
        <div style={{
          background: COLORS.white,
          padding: "2rem",
          borderRadius: "10px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Solicitante</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Riesgo</th>
                <th>Asignado</th>
                <th>SLA</th>
                <th>Accion</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((item) => (
                <tr key={item.id} onClick={() => setSelectedCase(item)} style={{ cursor: "pointer", outline: selectedCase?.id === item.id ? `2px solid ${COLORS.gold}` : "none", outlineOffset: "-2px" }}>
                  <td style={{ fontWeight: 800, color: COLORS.navy }}>{item.id}</td>
                  <td>
                    <strong style={{ color: COLORS.navy }}>{item.subject}</strong>
                    <p style={{ color: COLORS.textMuted, fontSize: "0.82rem" }}>{item.lastActivity}</p>
                  </td>
                  <td>{item.type}</td>
                  <td>{item.status}</td>
                  <td style={{ color: riskColor[item.risk], fontWeight: 800 }}>{item.risk}</td>
                  <td>{item.assignee}</td>
                  <td style={{ color: item.sla === "6 h" ? "#C62828" : COLORS.text }}>{item.sla}</td>
                  <td>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        advanceCase(item.id);
                      }}
                      style={{
                        padding: "0.45rem 0.8rem",
                        background: item.status === "Aprobado" ? "transparent" : COLORS.gold,
                        color: item.status === "Aprobado" ? COLORS.textMuted : COLORS.navy,
                        border: item.status === "Aprobado" ? `1px solid ${COLORS.border}` : "none",
                        borderRadius: "6px",
                        fontWeight: 800,
                      }}
                    >
                      {item.status === "Aprobado" ? "Ver" : "Avanzar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
        {selectedCase && (
          <aside style={{
            background: COLORS.white,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            overflow: "hidden",
            position: "sticky",
            top: "96px",
          }}>
            <div style={{ padding: "1.5rem", background: COLORS.bg, borderBottom: `1px solid ${COLORS.border}` }}>
              <p style={{ color: COLORS.textMuted, fontSize: "0.78rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.35rem" }}>
                Detalle del caso
              </p>
              <h2 style={{ color: COLORS.navy, fontSize: "1.2rem" }}>{selectedCase.subject}</h2>
            </div>
            <div style={{ padding: "1.5rem", display: "grid", gap: "1rem" }}>
              {[
                ["ID", selectedCase.id],
                ["Tipo", selectedCase.type],
                ["Estado", selectedCase.status],
                ["Riesgo", selectedCase.risk],
                ["Responsable", selectedCase.assignee],
                ["SLA", selectedCase.sla],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                  <span style={{ color: COLORS.textMuted, fontSize: "0.86rem" }}>{label}</span>
                  <strong style={{ color: label === "Riesgo" ? riskColor[value] : COLORS.navy, textAlign: "right" }}>{value}</strong>
                </div>
              ))}
              <div style={{ background: COLORS.bg, padding: "1rem", borderRadius: "8px" }}>
                <p style={{ color: COLORS.navy, fontWeight: 800, marginBottom: "0.5rem" }}>Comentarios</p>
                {(selectedCase.comments || []).map((comment) => (
                  <p key={comment} style={{ color: COLORS.textMuted, fontSize: "0.9rem", marginBottom: "0.4rem" }}>{comment}</p>
                ))}
              </div>
              <div style={{ background: COLORS.bg, padding: "1rem", borderRadius: "8px" }}>
                <p style={{ color: COLORS.navy, fontWeight: 800, marginBottom: "0.5rem" }}>Timeline</p>
                {(selectedCase.timeline || []).map((event) => (
                  <p key={event} style={{ color: COLORS.textMuted, fontSize: "0.86rem", marginBottom: "0.35rem" }}>- {event}</p>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
