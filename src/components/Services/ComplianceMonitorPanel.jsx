import React, { useState, useEffect, useCallback } from "react";
import { complianceAPI } from "../../services/api";
import { COLORS } from "../../utils/constants";

const FREQUENCY_LABELS = {
  monthly: "Mensual",
  quarterly: "Trimestral",
  biannual: "Semestral",
  annual: "Anual"
};

const SEVERITY_CONFIG = {
  critical: { label: "CRÍTICO", bg: "#FFEBEE", color: "#C62828", border: "#EF9A9A" },
  high: { label: "ALTO", bg: "#FFF3E0", color: "#E65100", border: "#FFCC80" },
  medium: { label: "MEDIO", bg: "#FFFDE7", color: "#F57F17", border: "#FFF176" },
  low: { label: "BAJO", bg: "#E8F5E9", color: "#2E7D32", border: "#A5D6A7" }
};

const STATUS_CONFIG = {
  cumple: { label: "CUMPLE", bg: "#E8F5E9", color: "#2E7D32" },
  incumple: { label: "INCUMPLE", bg: "#FFEBEE", color: "#C62828" },
  pendiente: { label: "PENDIENTE", bg: "#F3E5F5", color: "#6A1B9A" }
};

const SEMAFORO_CONFIG = {
  Verde: { emoji: "🟢", label: "Al día", color: "#2E7D32", bg: "#E8F5E9" },
  Amarillo: { emoji: "🟡", label: "Atención", color: "#F57F17", bg: "#FFFDE7" },
  Rojo: { emoji: "🔴", label: "En riesgo", color: "#C62828", bg: "#FFEBEE" }
};

const EMPTY_COVENANT_FORM = {
  name: "",
  description: "",
  requiredValue: "",
  currentValue: "",
  unit: "",
  direction: "min",
  nextVerificationAt: ""
};

const DEMO_DATA = {
  summary: { score: 87, semaforo: "Verde", status: "al_dia", criticalCount: 0, highCount: 0, incumpleCount: 0 },
  alerts: [],
  covenants: [
    { id: "demo-1", name: "DSCR mínimo", description: "Cobertura del servicio de deuda", requiredValue: 1.25, currentValue: 1.42, unit: "x", direction: "min", computedStatus: "cumple", nextVerificationAt: "2026-09-24" },
    { id: "demo-2", name: "Reserva de liquidez", description: "Reserva mínima de operación", requiredValue: 3, currentValue: 4.5, unit: "meses", direction: "min", computedStatus: "cumple", nextVerificationAt: null }
  ],
  reviewSchedule: { nextReviewDate: "2026-09-01", frequency: "quarterly", notes: "Revisión ordinaria Q3" }
};

export default function ComplianceMonitorPanel({ order, demoMode = false }) {
  const orderId = order?.id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Covenants UI state
  const [showCovForm, setShowCovForm] = useState(false);
  const [covForm, setCovForm] = useState(EMPTY_COVENANT_FORM);
  const [editingCovId, setEditingCovId] = useState(null);

  // Schedule UI state
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ nextReviewDate: "", frequency: "quarterly", notes: "" });

  const load = useCallback(async () => {
    if (demoMode) {
      setData(DEMO_DATA);
      setLoading(false);
      return;
    }
    if (!orderId) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await complianceAPI.getMonitor(orderId);
      setData(res.data);
    } catch {
      setData(DEMO_DATA);
    } finally {
      setLoading(false);
    }
  }, [orderId, demoMode]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (data?.reviewSchedule) {
      setScheduleForm({
        nextReviewDate: data.reviewSchedule.nextReviewDate || "",
        frequency: data.reviewSchedule.frequency || "quarterly",
        notes: data.reviewSchedule.notes || ""
      });
    }
  }, [data?.reviewSchedule]);

  async function handleSaveCovenants(nextList) {
    if (demoMode) { setData((d) => ({ ...d, covenants: nextList.map(evaluateLocal) })); return; }
    setSaving(true);
    setErrorMsg("");
    try {
      await complianceAPI.updateCovenants(orderId, nextList);
      await load();
    } catch (e) {
      setErrorMsg(e?.response?.data?.error || "Error al guardar covenants.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveSchedule() {
    if (demoMode) {
      setData((d) => ({ ...d, reviewSchedule: scheduleForm }));
      setShowScheduleForm(false);
      return;
    }
    setSaving(true);
    setErrorMsg("");
    try {
      await complianceAPI.updateSchedule(orderId, scheduleForm);
      await load();
      setShowScheduleForm(false);
    } catch (e) {
      setErrorMsg(e?.response?.data?.error || "Error al guardar calendario.");
    } finally {
      setSaving(false);
    }
  }

  function evaluateLocal(cov) {
    if (cov.currentValue == null || cov.requiredValue == null) return { ...cov, computedStatus: "pendiente" };
    const meets = cov.direction === "max"
      ? Number(cov.currentValue) <= Number(cov.requiredValue)
      : Number(cov.currentValue) >= Number(cov.requiredValue);
    return { ...cov, computedStatus: meets ? "cumple" : "incumple" };
  }

  function handleAddOrUpdateCovenant() {
    if (!covForm.name.trim()) return;
    const existing = data?.covenants || [];
    let next;
    if (editingCovId) {
      next = existing.map((c) => c.id === editingCovId ? { ...c, ...covForm, requiredValue: covForm.requiredValue !== "" ? Number(covForm.requiredValue) : null, currentValue: covForm.currentValue !== "" ? Number(covForm.currentValue) : null } : c);
    } else {
      const newCov = {
        id: `local-${Date.now()}`,
        ...covForm,
        requiredValue: covForm.requiredValue !== "" ? Number(covForm.requiredValue) : null,
        currentValue: covForm.currentValue !== "" ? Number(covForm.currentValue) : null
      };
      next = [...existing, newCov];
    }
    handleSaveCovenants(next);
    setCovForm(EMPTY_COVENANT_FORM);
    setShowCovForm(false);
    setEditingCovId(null);
  }

  function handleEditCovenant(cov) {
    setCovForm({
      name: cov.name || "",
      description: cov.description || "",
      requiredValue: cov.requiredValue != null ? String(cov.requiredValue) : "",
      currentValue: cov.currentValue != null ? String(cov.currentValue) : "",
      unit: cov.unit || "",
      direction: cov.direction || "min",
      nextVerificationAt: cov.nextVerificationAt || ""
    });
    setEditingCovId(cov.id);
    setShowCovForm(true);
  }

  function handleDeleteCovenant(id) {
    const next = (data?.covenants || []).filter((c) => c.id !== id);
    handleSaveCovenants(next);
  }

  if (loading) {
    return (
      <div style={{ padding: "1.5rem", textAlign: "center", color: COLORS.textMuted }}>
        Cargando monitor de cumplimiento...
      </div>
    );
  }

  const { summary, alerts, covenants, reviewSchedule } = data || {};
  const sem = SEMAFORO_CONFIG[summary?.semaforo] || SEMAFORO_CONFIG.Verde;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* Header con semáforo */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: COLORS.text }}>
          Monitor de Cumplimiento Post-Aprobación
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ background: sem.bg, border: `1px solid ${sem.color}`, borderRadius: "8px", padding: "0.4rem 0.9rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.1rem" }}>{sem.emoji}</span>
            <span style={{ fontWeight: 700, color: sem.color, fontSize: "0.85rem" }}>{sem.label}</span>
            <span style={{ color: COLORS.textMuted, fontSize: "0.8rem" }}>Score: {summary?.score ?? "—"}/100</span>
          </div>
          {demoMode && (
            <span style={{ fontSize: "0.72rem", background: "#EDE7F6", color: "#4527A0", borderRadius: "4px", padding: "0.2rem 0.5rem" }}>DEMO</span>
          )}
        </div>
      </div>

      {errorMsg && (
        <div style={{ background: "#FFEBEE", color: "#C62828", borderRadius: "6px", padding: "0.6rem 0.9rem", fontSize: "0.85rem" }}>
          {errorMsg}
        </div>
      )}

      {/* Alertas activas */}
      <section>
        <div style={{ fontSize: "0.8rem", fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
          Alertas activas ({alerts?.length ?? 0})
        </div>
        {!alerts?.length ? (
          <div style={{ background: "#F1F8E9", border: "1px solid #C5E1A5", borderRadius: "8px", padding: "0.75rem 1rem", color: "#33691E", fontSize: "0.85rem" }}>
            Sin alertas activas — todos los documentos están vigentes.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {alerts.map((alert, i) => {
              const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.low;
              return (
                <div key={i} style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: "8px", padding: "0.6rem 0.9rem", display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, background: cfg.color, color: "#fff", borderRadius: "4px", padding: "0.15rem 0.4rem", whiteSpace: "nowrap", marginTop: "0.1rem" }}>{cfg.label}</span>
                  <span style={{ fontSize: "0.85rem", color: COLORS.text }}>{alert.message}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Covenants financieros */}
      <section>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Covenants financieros ({covenants?.length ?? 0})
          </div>
          <button
            onClick={() => { setCovForm(EMPTY_COVENANT_FORM); setEditingCovId(null); setShowCovForm((s) => !s); }}
            style={{ fontSize: "0.78rem", background: showCovForm ? "#F2EFE9" : COLORS.primary, color: showCovForm ? COLORS.text : "#fff", border: "none", borderRadius: "6px", padding: "0.3rem 0.75rem", cursor: "pointer", fontWeight: 600 }}
          >
            {showCovForm ? "Cancelar" : "+ Agregar covenant"}
          </button>
        </div>

        {/* Formulario covenant */}
        {showCovForm && (
          <div style={{ background: "#F9F6F1", border: "1px solid #E5DDD4", borderRadius: "8px", padding: "1rem", marginBottom: "0.75rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: "0.78rem", color: COLORS.textMuted, display: "block", marginBottom: "0.25rem" }}>Nombre del covenant *</label>
                <input
                  value={covForm.name}
                  onChange={(e) => setCovForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ej. DSCR mínimo, LTV máximo, Reserva de liquidez"
                  style={{ width: "100%", padding: "0.5rem 0.65rem", border: "1px solid #D4C9BC", borderRadius: "6px", fontSize: "0.85rem", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: "0.78rem", color: COLORS.textMuted, display: "block", marginBottom: "0.25rem" }}>Descripción (opcional)</label>
                <input
                  value={covForm.description}
                  onChange={(e) => setCovForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Ej. Cobertura del servicio de deuda ≥ 1.25x"
                  style={{ width: "100%", padding: "0.5rem 0.65rem", border: "1px solid #D4C9BC", borderRadius: "6px", fontSize: "0.85rem", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.78rem", color: COLORS.textMuted, display: "block", marginBottom: "0.25rem" }}>Valor requerido</label>
                <input
                  type="number"
                  value={covForm.requiredValue}
                  onChange={(e) => setCovForm((f) => ({ ...f, requiredValue: e.target.value }))}
                  placeholder="1.25"
                  style={{ width: "100%", padding: "0.5rem 0.65rem", border: "1px solid #D4C9BC", borderRadius: "6px", fontSize: "0.85rem", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.78rem", color: COLORS.textMuted, display: "block", marginBottom: "0.25rem" }}>Valor actual</label>
                <input
                  type="number"
                  value={covForm.currentValue}
                  onChange={(e) => setCovForm((f) => ({ ...f, currentValue: e.target.value }))}
                  placeholder="1.42"
                  style={{ width: "100%", padding: "0.5rem 0.65rem", border: "1px solid #D4C9BC", borderRadius: "6px", fontSize: "0.85rem", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.78rem", color: COLORS.textMuted, display: "block", marginBottom: "0.25rem" }}>Unidad</label>
                <input
                  value={covForm.unit}
                  onChange={(e) => setCovForm((f) => ({ ...f, unit: e.target.value }))}
                  placeholder="x, %, meses, MXN"
                  style={{ width: "100%", padding: "0.5rem 0.65rem", border: "1px solid #D4C9BC", borderRadius: "6px", fontSize: "0.85rem", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.78rem", color: COLORS.textMuted, display: "block", marginBottom: "0.25rem" }}>Dirección</label>
                <select
                  value={covForm.direction}
                  onChange={(e) => setCovForm((f) => ({ ...f, direction: e.target.value }))}
                  style={{ width: "100%", padding: "0.5rem 0.65rem", border: "1px solid #D4C9BC", borderRadius: "6px", fontSize: "0.85rem", background: "#fff", boxSizing: "border-box" }}
                >
                  <option value="min">Mínimo (debe ser ≥ requerido)</option>
                  <option value="max">Máximo (debe ser ≤ requerido)</option>
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: "0.78rem", color: COLORS.textMuted, display: "block", marginBottom: "0.25rem" }}>Próxima verificación</label>
                <input
                  type="date"
                  value={covForm.nextVerificationAt}
                  onChange={(e) => setCovForm((f) => ({ ...f, nextVerificationAt: e.target.value }))}
                  style={{ width: "100%", padding: "0.5rem 0.65rem", border: "1px solid #D4C9BC", borderRadius: "6px", fontSize: "0.85rem", boxSizing: "border-box" }}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
              <button
                onClick={handleAddOrUpdateCovenant}
                disabled={!covForm.name.trim() || saving}
                style={{ padding: "0.45rem 1rem", background: COLORS.primary, color: "#fff", border: "none", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", opacity: (!covForm.name.trim() || saving) ? 0.5 : 1 }}
              >
                {saving ? "Guardando..." : editingCovId ? "Actualizar" : "Agregar"}
              </button>
              <button onClick={() => { setShowCovForm(false); setEditingCovId(null); }} style={{ padding: "0.45rem 0.75rem", background: "#F2EFE9", color: COLORS.text, border: "none", borderRadius: "6px", fontSize: "0.85rem", cursor: "pointer" }}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Lista de covenants */}
        {!covenants?.length ? (
          <div style={{ color: COLORS.textMuted, fontSize: "0.85rem", padding: "0.5rem 0" }}>
            Sin covenants configurados. Agregue los compromisos financieros de su expediente.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {covenants.map((cov) => {
              const st = STATUS_CONFIG[cov.computedStatus] || STATUS_CONFIG.pendiente;
              return (
                <div key={cov.id} style={{ background: "#FAFAF8", border: "1px solid #E5DDD4", borderRadius: "8px", padding: "0.7rem 0.9rem", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, background: st.bg, color: st.color, borderRadius: "4px", padding: "0.15rem 0.45rem", whiteSpace: "nowrap" }}>{st.label}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.88rem", color: COLORS.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cov.name}</div>
                    {cov.description && <div style={{ fontSize: "0.78rem", color: COLORS.textMuted }}>{cov.description}</div>}
                  </div>
                  <div style={{ textAlign: "right", fontSize: "0.82rem", color: COLORS.textMuted, whiteSpace: "nowrap" }}>
                    {cov.currentValue != null ? (
                      <span style={{ fontWeight: 600, color: COLORS.text }}>{cov.currentValue}{cov.unit ? ` ${cov.unit}` : ""}</span>
                    ) : "—"}{" "}
                    <span style={{ fontSize: "0.75rem" }}>({cov.direction === "max" ? "≤" : "≥"} {cov.requiredValue != null ? `${cov.requiredValue}${cov.unit ? ` ${cov.unit}` : ""}` : "—"})</span>
                  </div>
                  <div style={{ display: "flex", gap: "0.3rem" }}>
                    <button onClick={() => handleEditCovenant(cov)} style={{ background: "none", border: "1px solid #D4C9BC", borderRadius: "5px", padding: "0.2rem 0.5rem", cursor: "pointer", fontSize: "0.75rem", color: COLORS.text }}>Editar</button>
                    <button onClick={() => handleDeleteCovenant(cov.id)} style={{ background: "none", border: "1px solid #EF9A9A", borderRadius: "5px", padding: "0.2rem 0.5rem", cursor: "pointer", fontSize: "0.75rem", color: "#C62828" }}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Calendario de revisión */}
      <section>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Calendario de revisión periódica
          </div>
          <button
            onClick={() => setShowScheduleForm((s) => !s)}
            style={{ fontSize: "0.78rem", background: showScheduleForm ? "#F2EFE9" : "#F9F6F1", color: COLORS.text, border: "1px solid #D4C9BC", borderRadius: "6px", padding: "0.3rem 0.75rem", cursor: "pointer", fontWeight: 500 }}
          >
            {showScheduleForm ? "Cancelar" : reviewSchedule ? "Editar" : "+ Configurar"}
          </button>
        </div>

        {showScheduleForm ? (
          <div style={{ background: "#F9F6F1", border: "1px solid #E5DDD4", borderRadius: "8px", padding: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
              <div>
                <label style={{ fontSize: "0.78rem", color: COLORS.textMuted, display: "block", marginBottom: "0.25rem" }}>Próxima revisión</label>
                <input
                  type="date"
                  value={scheduleForm.nextReviewDate}
                  onChange={(e) => setScheduleForm((f) => ({ ...f, nextReviewDate: e.target.value }))}
                  style={{ width: "100%", padding: "0.5rem 0.65rem", border: "1px solid #D4C9BC", borderRadius: "6px", fontSize: "0.85rem", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.78rem", color: COLORS.textMuted, display: "block", marginBottom: "0.25rem" }}>Frecuencia</label>
                <select
                  value={scheduleForm.frequency}
                  onChange={(e) => setScheduleForm((f) => ({ ...f, frequency: e.target.value }))}
                  style={{ width: "100%", padding: "0.5rem 0.65rem", border: "1px solid #D4C9BC", borderRadius: "6px", fontSize: "0.85rem", background: "#fff", boxSizing: "border-box" }}
                >
                  {Object.entries(FREQUENCY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: "0.78rem", color: COLORS.textMuted, display: "block", marginBottom: "0.25rem" }}>Notas</label>
                <input
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Ej. Revisión ordinaria Q3, auditoría externa"
                  style={{ width: "100%", padding: "0.5rem 0.65rem", border: "1px solid #D4C9BC", borderRadius: "6px", fontSize: "0.85rem", boxSizing: "border-box" }}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
              <button
                onClick={handleSaveSchedule}
                disabled={saving}
                style={{ padding: "0.45rem 1rem", background: COLORS.primary, color: "#fff", border: "none", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", opacity: saving ? 0.5 : 1 }}
              >
                {saving ? "Guardando..." : "Guardar calendario"}
              </button>
              <button onClick={() => setShowScheduleForm(false)} style={{ padding: "0.45rem 0.75rem", background: "#F2EFE9", color: COLORS.text, border: "none", borderRadius: "6px", fontSize: "0.85rem", cursor: "pointer" }}>
                Cancelar
              </button>
            </div>
          </div>
        ) : reviewSchedule?.nextReviewDate ? (
          <div style={{ background: "#F9F6F1", border: "1px solid #E5DDD4", borderRadius: "8px", padding: "0.75rem 1rem", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "0.75rem", color: COLORS.textMuted }}>Próxima revisión</div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: COLORS.text }}>{reviewSchedule.nextReviewDate}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: COLORS.textMuted }}>Frecuencia</div>
              <div style={{ fontWeight: 600, fontSize: "0.88rem", color: COLORS.text }}>{FREQUENCY_LABELS[reviewSchedule.frequency] || reviewSchedule.frequency}</div>
            </div>
            {reviewSchedule.notes && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.75rem", color: COLORS.textMuted }}>Notas</div>
                <div style={{ fontSize: "0.85rem", color: COLORS.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{reviewSchedule.notes}</div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: COLORS.textMuted, fontSize: "0.85rem", padding: "0.5rem 0" }}>
            Sin calendario configurado. Programe la próxima revisión periódica.
          </div>
        )}
      </section>
    </div>
  );
}
