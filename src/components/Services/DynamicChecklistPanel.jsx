import React, { useState, useEffect, useCallback } from "react";
import { checklistAPI } from "../../services/api";
import { COLORS } from "../../utils/constants";

const CRITICALITY_CONFIG = {
  CRITICAL: { label: "CRÍTICO", bg: "#FFEBEE", color: "#C62828", border: "#EF9A9A" },
  HIGH: { label: "ALTO", bg: "#FFF3E0", color: "#E65100", border: "#FFCC80" },
  MEDIUM: { label: "MEDIO", bg: "#FFFDE7", color: "#F57F17", border: "#FFF176" }
};

const READINESS_CONFIG = {
  listo: { label: "Listo para presentar", color: "#2E7D32", bg: "#E8F5E9", emoji: "🟢" },
  incompleto: { label: "Incompleto", color: "#F57F17", bg: "#FFFDE7", emoji: "🟡" },
  bloqueado: { label: "Bloqueado — faltan críticos", color: "#C62828", bg: "#FFEBEE", emoji: "🔴" }
};

const DEMO_DATA = {
  sectorName: "Servicios / Consultoría",
  country: "MX",
  completion: { uploaded: 2, pending: 3, missingCritical: 1, completionPct: 40, readiness: "bloqueado" },
  documentos: [
    { id: "d1", nombre: "RFC y Cédula del Negocio", descripcion: "Registro Federal de Contribuyentes", criticality: "CRITICAL", status: "uploaded" },
    { id: "d2", nombre: "Acta Constitutiva", descripcion: "Escritura de constitución", criticality: "CRITICAL", status: "pending" },
    { id: "d3", nombre: "EEFF Auditados (últimos 2 años)", descripcion: "Estados financieros auditados", criticality: "CRITICAL", status: "uploaded" },
    { id: "d4", nombre: "Opinión 32-D", descripcion: "Opinión de cumplimiento fiscal", criticality: "HIGH", status: "pending" },
    { id: "d5", nombre: "Certificados de Clientes Clave", descripcion: "Referencias de clientes principales", criticality: "MEDIUM", status: "pending" }
  ]
};

export default function DynamicChecklistPanel({ order, demoMode = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (demoMode) { setData(DEMO_DATA); setLoading(false); return; }
    if (!order?.id) return;
    setLoading(true);
    try {
      const res = await checklistAPI.getChecklist(order.id);
      setData(res.data);
    } catch {
      setData(DEMO_DATA);
    } finally {
      setLoading(false);
    }
  }, [order?.id, demoMode]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div style={{ padding: "1rem", color: COLORS.textMuted, fontSize: "0.85rem" }}>Cargando checklist...</div>;
  }

  if (!data) return null;

  const { sectorName, country, completion, documentos } = data;
  const readiness = READINESS_CONFIG[completion?.readiness] || READINESS_CONFIG.incompleto;

  const pending = documentos?.filter((d) => d.status === "pending") || [];
  const uploaded = documentos?.filter((d) => d.status === "uploaded") || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: COLORS.text }}>
            Checklist de Documentos Requeridos
          </h3>
          <div style={{ fontSize: "0.78rem", color: COLORS.textMuted, marginTop: "0.2rem" }}>
            {sectorName} · {country}{demoMode && " · DEMO"}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ background: readiness.bg, border: `1px solid ${readiness.color}`, borderRadius: "8px", padding: "0.4rem 0.9rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>{readiness.emoji}</span>
            <span style={{ fontWeight: 700, color: readiness.color, fontSize: "0.82rem" }}>{readiness.label}</span>
          </div>
        </div>
      </div>

      {/* Barra de progreso */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: COLORS.textMuted, marginBottom: "0.35rem" }}>
          <span>{completion.uploaded} de {documentos.length} documentos cargados</span>
          <span style={{ fontWeight: 700, color: completion.completionPct >= 80 ? "#2E7D32" : COLORS.text }}>{completion.completionPct}%</span>
        </div>
        <div style={{ height: "6px", background: "#E5DDD4", borderRadius: "3px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${completion.completionPct}%`, background: completion.completionPct >= 80 ? "#2E7D32" : completion.completionPct >= 50 ? "#F57F17" : "#C62828", borderRadius: "3px", transition: "width 0.4s ease" }} />
        </div>
        {completion.missingCritical > 0 && (
          <div style={{ fontSize: "0.75rem", color: "#C62828", marginTop: "0.3rem" }}>
            {completion.missingCritical} documento(s) crítico(s) pendiente(s) — el expediente está bloqueado hasta completarlos.
          </div>
        )}
      </div>

      {/* Pendientes */}
      {pending.length > 0 && (
        <section>
          <div style={{ fontSize: "0.78rem", fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
            Pendientes ({pending.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            {pending.map((doc) => {
              const cfg = CRITICALITY_CONFIG[doc.criticality] || CRITICALITY_CONFIG.MEDIUM;
              return (
                <div key={doc.id} style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: "7px", padding: "0.65rem 0.9rem", display: "flex", alignItems: "center", gap: "0.65rem" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, background: cfg.color, color: "#fff", borderRadius: "4px", padding: "0.15rem 0.4rem", whiteSpace: "nowrap" }}>{cfg.label}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem", color: COLORS.text }}>{doc.nombre}</div>
                    <div style={{ fontSize: "0.75rem", color: COLORS.textMuted }}>{doc.descripcion}</div>
                  </div>
                  <span style={{ fontSize: "1rem" }}>📋</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Cargados */}
      {uploaded.length > 0 && (
        <section>
          <div style={{ fontSize: "0.78rem", fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
            Cargados ({uploaded.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            {uploaded.map((doc) => (
              <div key={doc.id} style={{ background: "#F1F8E9", border: "1px solid #C5E1A5", borderRadius: "7px", padding: "0.55rem 0.9rem", display: "flex", alignItems: "center", gap: "0.65rem" }}>
                <span style={{ fontSize: "1rem" }}>✅</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: "0.85rem", color: "#33691E" }}>{doc.nombre}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
