import React, { useState, useEffect, useCallback } from "react";
import { nagmarAPI } from "../../services/api";
import { COLORS } from "../../utils/constants";

// ── helpers ──────────────────────────────────────────────────────────────────

const VERDICT_META = {
  block:   { label: "BLOQUEAR",   bg: "#FFEBEE", color: "#C62828", border: "#EF9A9A" },
  review:  { label: "REVISAR",    bg: "#FFF8E1", color: "#B45309", border: "#FFE082" },
  clear:   { label: "LIMPIO",     bg: "#E8F5E9", color: "#2E7D32", border: "#A5D6A7" },
  skipped: { label: "OMITIDO",    bg: "#F5F5F5", color: "#757575", border: "#E0E0E0" },
};

const STATUS_META = {
  pending:   { label: "Pendiente",  color: "#B45309" },
  resolved:  { label: "Resuelto",   color: "#2E7D32" },
  escalated: { label: "Escalado",   color: "#C62828" },
};

const ACTION_LABELS = {
  false_positive: "Falso positivo",
  confirm_hit:    "Confirmar hit",
  escalate:       "Escalar",
  note:           "Nota",
  resolve:        "Resolver",
};

const DICTAMEN_OPTIONS = [
  { value: "APROBADO",    label: "APROBADO",    color: "#2E7D32" },
  { value: "RECHAZADO",   label: "RECHAZADO",   color: "#C62828" },
  { value: "EN_REVISION", label: "EN REVISION", color: "#B45309" },
  { value: "ESCALADO",    label: "ESCALADO",    color: "#6A1B9A" },
];

function fmt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });
}

function VerdictBadge({ verdict }) {
  const m = VERDICT_META[verdict] || VERDICT_META.skipped;
  return (
    <span style={{
      display: "inline-block",
      padding: "0.3rem 0.75rem",
      borderRadius: "6px",
      background: m.bg,
      color: m.color,
      border: `1px solid ${m.border}`,
      fontWeight: 900,
      fontSize: "0.78rem",
      letterSpacing: "0.08em",
    }}>
      {m.label}
    </span>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
      border: `1px solid ${COLORS.border}`,
      borderRadius: "10px",
      padding: "1.25rem",
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <p style={{
      color: COLORS.textMuted,
      fontSize: "0.7rem",
      fontWeight: 900,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      marginBottom: "0.75rem",
    }}>
      {children}
    </p>
  );
}

// ── Resultado de una fuente regulatoria ──────────────────────────────────────

function SourceRow({ label, result }) {
  const [open, setOpen] = useState(false);
  if (!result) return null;
  const isHit  = result.status === "hit";
  const isSkip = result.status === "skipped";
  const dot = isHit ? "#C62828" : isSkip ? "#9E9E9E" : "#2E7D32";
  return (
    <div style={{ borderBottom: `1px solid ${COLORS.border}`, paddingBottom: "0.5rem", marginBottom: "0.5rem" }}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "0.25rem 0",
          gap: "0.5rem",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: dot, flexShrink: 0 }} />
          <span style={{ color: COLORS.navy, fontWeight: 700, fontSize: "0.82rem", textAlign: "left" }}>{label}</span>
        </span>
        <span style={{ color: COLORS.textMuted, fontSize: "0.75rem", flexShrink: 0 }}>
          {isHit ? `${result.matches?.length || 0} hit(s)` : isSkip ? "omitido" : "limpio"}
          {" "}{open ? "▲" : "▼"}
        </span>
      </button>
      {open && (
        <div style={{ paddingLeft: "1.25rem", paddingTop: "0.35rem" }}>
          <p style={{ color: COLORS.textMuted, fontSize: "0.78rem", lineHeight: 1.5, marginBottom: "0.35rem" }}>
            {result.detail || "Sin detalle."}
          </p>
          {result.listEntries && (
            <p style={{ color: COLORS.textMuted, fontSize: "0.72rem" }}>
              Entradas en lista: <strong>{result.listEntries.toLocaleString()}</strong>
              {result.listLoadedAt ? ` · actualizado ${fmt(result.listLoadedAt)}` : ""}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Panel de resultado de un screening ───────────────────────────────────────

function ScreeningResult({ result, caseId, onActionAdded, onCaseUpdated }) {
  const [actionType, setActionType] = useState("note");
  const [reason, setReason] = useState("");
  const [dictamen, setDictamen] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const regulatory = result?.result?.regulatory || {};
  const sanctions  = result?.result?.sanctions || {};
  const entities   = result?.result?.entities || [];
  const juris      = result?.result?.jurisdiction;
  const verdict    = result?.result?.verdict || "skipped";

  async function handleAddAction(e) {
    e.preventDefault();
    if (!reason.trim()) return setMsg({ type: "error", text: "Escribe el motivo de la acción." });
    setSaving(true);
    setMsg(null);
    try {
      await nagmarAPI.addAction(caseId, { action: actionType, reason });
      setReason("");
      setMsg({ type: "ok", text: "Acción registrada." });
      if (onActionAdded) onActionAdded();
    } catch {
      setMsg({ type: "error", text: "Error al guardar la acción." });
    } finally {
      setSaving(false);
    }
  }

  async function handleDictamen(e) {
    e.preventDefault();
    if (!dictamen) return setMsg({ type: "error", text: "Selecciona un dictamen." });
    setSaving(true);
    setMsg(null);
    try {
      const newStatus = dictamen === "ESCALADO" ? "escalated" : "resolved";
      await nagmarAPI.updateCase(caseId, { dictamen, status: newStatus });
      setMsg({ type: "ok", text: `Dictamen ${dictamen} guardado.` });
      if (onCaseUpdated) onCaseUpdated();
    } catch {
      setMsg({ type: "error", text: "Error al guardar el dictamen." });
    } finally {
      setSaving(false);
    }
  }

  const caseData = result?.case;

  return (
    <div style={{ display: "grid", gap: "1rem" }}>

      {/* Header del resultado */}
      <Card style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", alignItems: "start" }}>
        <div>
          <SectionTitle>Resultado del screening</SectionTitle>
          <h2 style={{ color: COLORS.navy, fontSize: "1.2rem", fontWeight: 900, marginBottom: "0.35rem" }}>
            {result?.result?.name || "—"}
          </h2>
          {result?.result?.country && (
            <p style={{ color: COLORS.textMuted, fontSize: "0.82rem", marginBottom: "0.5rem" }}>
              País: <strong>{result.result.country}</strong>
              {juris && (
                <span style={{
                  marginLeft: "0.5rem",
                  padding: "0.1rem 0.5rem",
                  borderRadius: "4px",
                  fontSize: "0.72rem",
                  background: juris.fatf?.riskLevel === "CRITICAL" ? "#FFEBEE" : juris.fatf?.riskLevel === "HIGH" ? "#FFF8E1" : "#E8F5E9",
                  color: juris.fatf?.riskLevel === "CRITICAL" ? "#C62828" : juris.fatf?.riskLevel === "HIGH" ? "#B45309" : "#2E7D32",
                  fontWeight: 800,
                }}>
                  FATF: {juris.fatf?.status?.replace(/_/g, " ") || "sin datos"}
                </span>
              )}
            </p>
          )}
          <p style={{ color: COLORS.textMuted, fontSize: "0.72rem" }}>
            Verificado: {fmt(result?.result?.screened_at)} · Caso ID: {caseData?.id?.slice(0, 8)}…
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <VerdictBadge verdict={verdict} />
          {caseData && (
            <p style={{ marginTop: "0.4rem", color: STATUS_META[caseData.status]?.color || COLORS.textMuted, fontSize: "0.75rem", fontWeight: 700 }}>
              {STATUS_META[caseData.status]?.label || caseData.status}
            </p>
          )}
        </div>
      </Card>

      {/* Entidades detectadas */}
      {entities.length > 0 && (
        <Card>
          <SectionTitle>Entidades detectadas ({entities.length})</SectionTitle>
          <div style={{ display: "grid", gap: "0.6rem" }}>
            {entities.map((e, i) => (
              <div key={i} style={{
                padding: "0.75rem",
                background: COLORS.bg,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "8px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div>
                    <strong style={{ color: COLORS.navy, fontSize: "0.88rem" }}>{e.name}</strong>
                    {e.aliases?.length > 0 && (
                      <span style={{ color: COLORS.textMuted, fontSize: "0.72rem", marginLeft: "0.5rem" }}>
                        aka {e.aliases.join(", ")}
                      </span>
                    )}
                    <p style={{ color: COLORS.textMuted, fontSize: "0.78rem", marginTop: "0.2rem", lineHeight: 1.4 }}>
                      {e.program && <span style={{ fontWeight: 700 }}>{e.program}</span>}
                      {e.authority && ` · ${e.authority}`}
                      {e.jurisdiction && ` · ${e.jurisdiction}`}
                    </p>
                    {e.reason && (
                      <p style={{ color: COLORS.textMuted, fontSize: "0.75rem", marginTop: "0.15rem" }}>{e.reason}</p>
                    )}
                  </div>
                  <span style={{
                    flexShrink: 0,
                    padding: "0.2rem 0.5rem",
                    borderRadius: "4px",
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    background: e.confidence === "high" ? "#FFEBEE" : e.confidence === "medium" ? "#FFF8E1" : "#F5F5F5",
                    color: e.confidence === "high" ? "#C62828" : e.confidence === "medium" ? "#B45309" : "#757575",
                  }}>
                    {e.score ? `${e.score}%` : ""} {e.confidence}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Fuentes regulatorias */}
      <Card>
        <SectionTitle>Fuentes regulatorias verificadas</SectionTitle>
        {Object.entries(regulatory).map(([key, r]) => (
          <SourceRow key={key} label={r?.label || key} result={r} />
        ))}
      </Card>

      {/* Nota del resultado */}
      {result?.result?.note && (
        <p style={{
          padding: "0.75rem 1rem",
          background: "#FFF8E1",
          border: "1px solid #FFE082",
          borderRadius: "8px",
          color: "#7D5A00",
          fontSize: "0.75rem",
          lineHeight: 1.55,
        }}>
          ⚠ {result.result.note}
        </p>
      )}

      {/* Acciones del analista */}
      <Card>
        <SectionTitle>Registrar acción del analista</SectionTitle>
        <form onSubmit={handleAddAction} style={{ display: "grid", gap: "0.75rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.75rem", alignItems: "center" }}>
            <label style={{ color: COLORS.navy, fontSize: "0.82rem", fontWeight: 700, whiteSpace: "nowrap" }}>
              Acción:
            </label>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              style={{ padding: "0.5rem", borderRadius: "6px", border: `1px solid ${COLORS.border}`, fontSize: "0.82rem", color: COLORS.navy }}
            >
              <option value="note">Nota interna</option>
              <option value="false_positive">Falso positivo</option>
              <option value="confirm_hit">Confirmar hit</option>
              <option value="escalate">Escalar a analista senior</option>
              <option value="resolve">Marcar como resuelto</option>
            </select>
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motivo o comentario del analista (requerido)…"
            rows={3}
            style={{
              padding: "0.65rem",
              borderRadius: "6px",
              border: `1px solid ${COLORS.border}`,
              fontSize: "0.82rem",
              color: COLORS.text,
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "0.65rem 1.2rem",
              borderRadius: "6px",
              border: "none",
              background: COLORS.navy,
              color: "white",
              fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              fontSize: "0.85rem",
              opacity: saving ? 0.65 : 1,
            }}
          >
            {saving ? "Guardando…" : "Registrar acción"}
          </button>
        </form>
      </Card>

      {/* Dictamen */}
      <Card>
        <SectionTitle>Dictamen final</SectionTitle>
        <form onSubmit={handleDictamen} style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {DICTAMEN_OPTIONS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setDictamen(d.value)}
                style={{
                  padding: "0.5rem 0.9rem",
                  borderRadius: "6px",
                  border: `2px solid ${dictamen === d.value ? d.color : COLORS.border}`,
                  background: dictamen === d.value ? d.color + "18" : "white",
                  color: dictamen === d.value ? d.color : COLORS.textMuted,
                  fontWeight: dictamen === d.value ? 900 : 600,
                  cursor: "pointer",
                  fontSize: "0.78rem",
                  transition: "all 0.15s",
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={saving || !dictamen}
            style={{
              padding: "0.6rem 1.1rem",
              borderRadius: "6px",
              border: "none",
              background: dictamen ? COLORS.gold : "#e0e0e0",
              color: dictamen ? COLORS.navy : "#9e9e9e",
              fontWeight: 900,
              cursor: saving || !dictamen ? "not-allowed" : "pointer",
              fontSize: "0.82rem",
            }}
          >
            {saving ? "Guardando…" : "Guardar dictamen"}
          </button>
        </form>
        {caseData?.dictamen && (
          <p style={{ marginTop: "0.75rem", fontSize: "0.82rem", color: COLORS.navy }}>
            Dictamen vigente: <strong>{caseData.dictamen}</strong>
            {caseData.resolved_at && ` · ${fmt(caseData.resolved_at)}`}
          </p>
        )}
      </Card>

      {msg && (
        <p style={{
          padding: "0.6rem 1rem",
          borderRadius: "6px",
          background: msg.type === "ok" ? "#E8F5E9" : "#FFEBEE",
          color: msg.type === "ok" ? "#2E7D32" : "#C62828",
          fontSize: "0.82rem",
          fontWeight: 700,
        }}>
          {msg.text}
        </p>
      )}
    </div>
  );
}

// ── Historial de casos ────────────────────────────────────────────────────────

function CaseHistoryTable({ cases, onSelect, selectedId, loading }) {
  if (loading) return <p style={{ color: COLORS.textMuted, fontSize: "0.85rem" }}>Cargando historial…</p>;
  if (!cases.length) return <p style={{ color: COLORS.textMuted, fontSize: "0.85rem" }}>Sin casos previos.</p>;
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${COLORS.border}` }}>
            {["Nombre", "País", "Veredicto", "Estado", "Dictamen", "Fecha"].map((h) => (
              <th key={h} style={{ textAlign: "left", padding: "0.4rem 0.6rem", color: COLORS.textMuted, fontWeight: 900, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cases.map((c) => {
            const vm = VERDICT_META[c.verdict] || VERDICT_META.skipped;
            const sm = STATUS_META[c.status];
            const isSelected = c.id === selectedId;
            return (
              <tr
                key={c.id}
                onClick={() => onSelect(c.id)}
                style={{
                  cursor: "pointer",
                  borderBottom: `1px solid ${COLORS.border}`,
                  background: isSelected ? `${COLORS.navy}0D` : "transparent",
                  transition: "background 0.1s",
                }}
              >
                <td style={{ padding: "0.55rem 0.6rem", color: COLORS.navy, fontWeight: 700 }}>{c.name}</td>
                <td style={{ padding: "0.55rem 0.6rem", color: COLORS.textMuted }}>{c.country || "—"}</td>
                <td style={{ padding: "0.55rem 0.6rem" }}>
                  <span style={{ color: vm.color, fontWeight: 800, fontSize: "0.75rem" }}>{vm.label}</span>
                </td>
                <td style={{ padding: "0.55rem 0.6rem" }}>
                  <span style={{ color: sm?.color || COLORS.textMuted, fontWeight: 700, fontSize: "0.75rem" }}>{sm?.label || c.status}</span>
                </td>
                <td style={{ padding: "0.55rem 0.6rem", color: COLORS.textMuted }}>{c.dictamen || "—"}</td>
                <td style={{ padding: "0.55rem 0.6rem", color: COLORS.textMuted, whiteSpace: "nowrap" }}>{fmt(c.created_at)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function NagmarCaseManagerTab() {
  const [name, setName]       = useState("");
  const [country, setCountry] = useState("");
  const [screening, setScreening] = useState(false);
  const [screenError, setScreenError] = useState(null);
  const [activeResult, setActiveResult] = useState(null);

  const [cases, setCases]         = useState([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseLoading, setCaseLoading]   = useState(false);

  const [filterVerdict, setFilterVerdict] = useState("");
  const [filterStatus, setFilterStatus]   = useState("");

  const loadCases = useCallback(async () => {
    setCasesLoading(true);
    try {
      const params = {};
      if (filterVerdict) params.verdict = filterVerdict;
      if (filterStatus)  params.status  = filterStatus;
      const { data } = await nagmarAPI.getCases(params);
      setCases(data.cases || []);
    } catch {
      setCases([]);
    } finally {
      setCasesLoading(false);
    }
  }, [filterVerdict, filterStatus]);

  useEffect(() => { loadCases(); }, [loadCases]);

  async function selectCase(id) {
    setSelectedCaseId(id);
    setActiveResult(null);
    setCaseLoading(true);
    try {
      const { data } = await nagmarAPI.getCase(id);
      setSelectedCase(data);
    } catch {
      setSelectedCase(null);
    } finally {
      setCaseLoading(false);
    }
  }

  async function handleScreen(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setScreening(true);
    setScreenError(null);
    setActiveResult(null);
    setSelectedCaseId(null);
    setSelectedCase(null);
    try {
      const { data } = await nagmarAPI.screen(trimmed, country.trim() || undefined);
      setActiveResult(data);
      setSelectedCaseId(data.case?.id || null);
      setCases((prev) => [data.case, ...prev.filter((c) => c.id !== data.case?.id)]);
    } catch (err) {
      setScreenError(err?.response?.data?.error || "Error al realizar el screening. Inténtalo de nuevo.");
    } finally {
      setScreening(false);
    }
  }

  function buildSelectedResultFromCase(c) {
    if (!c) return null;
    return { case: c, result: c.full_result };
  }

  const displayResult = activeResult || buildSelectedResultFromCase(selectedCase);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "1.5rem", alignItems: "start", minHeight: "60vh" }}>

      {/* ── Panel izquierdo: búsqueda + historial ── */}
      <div style={{ display: "grid", gap: "1rem" }}>

        {/* Cabecera */}
        <div style={{
          background: "linear-gradient(135deg, #0F1F2E 0%, #1B3A5C 100%)",
          borderRadius: "10px",
          padding: "1.25rem",
          color: "white",
        }}>
          <p style={{ fontSize: "0.68rem", opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem" }}>
            NAGMAR Gateway
          </p>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 900, color: "white", marginBottom: "0.25rem" }}>
            Case Manager
          </h2>
          <p style={{ fontSize: "0.78rem", opacity: 0.65, lineHeight: 1.45 }}>
            Screening AML/KYC contra 15 fuentes regulatorias internacionales. Resultado persiste como caso auditable.
          </p>
        </div>

        {/* Formulario de búsqueda */}
        <Card>
          <SectionTitle>Nueva consulta</SectionTitle>
          <form onSubmit={handleScreen} style={{ display: "grid", gap: "0.65rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.78rem", color: COLORS.navy, fontWeight: 700, marginBottom: "0.3rem" }}>
                Nombre o razón social *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Acme Capital S.A."
                required
                style={{
                  width: "100%",
                  padding: "0.6rem 0.8rem",
                  borderRadius: "6px",
                  border: `1px solid ${COLORS.border}`,
                  fontSize: "0.85rem",
                  color: COLORS.text,
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.78rem", color: COLORS.navy, fontWeight: 700, marginBottom: "0.3rem" }}>
                País de la contraparte (opcional)
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Ej. Mexico, Iran, Brasil…"
                style={{
                  width: "100%",
                  padding: "0.6rem 0.8rem",
                  borderRadius: "6px",
                  border: `1px solid ${COLORS.border}`,
                  fontSize: "0.85rem",
                  color: COLORS.text,
                  boxSizing: "border-box",
                }}
              />
            </div>
            <button
              type="submit"
              disabled={screening || !name.trim()}
              style={{
                padding: "0.7rem",
                borderRadius: "6px",
                border: "none",
                background: screening || !name.trim() ? "#B0BEC5" : COLORS.gold,
                color: COLORS.navy,
                fontWeight: 900,
                cursor: screening || !name.trim() ? "not-allowed" : "pointer",
                fontSize: "0.88rem",
                letterSpacing: "0.03em",
              }}
            >
              {screening ? "Verificando…" : "Verificar ahora"}
            </button>
            {screenError && (
              <p style={{ color: "#C62828", fontSize: "0.78rem", background: "#FFEBEE", padding: "0.5rem 0.75rem", borderRadius: "6px" }}>
                {screenError}
              </p>
            )}
          </form>
        </Card>

        {/* Filtros + historial */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", gap: "0.5rem", flexWrap: "wrap" }}>
            <SectionTitle style={{ marginBottom: 0 }}>Historial de casos</SectionTitle>
            <button
              type="button"
              onClick={loadCases}
              style={{ fontSize: "0.72rem", color: COLORS.navy, background: "none", border: `1px solid ${COLORS.border}`, borderRadius: "4px", padding: "0.2rem 0.5rem", cursor: "pointer" }}
            >
              ↺ Recargar
            </button>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
            <select
              value={filterVerdict}
              onChange={(e) => setFilterVerdict(e.target.value)}
              style={{ fontSize: "0.75rem", padding: "0.3rem 0.5rem", borderRadius: "5px", border: `1px solid ${COLORS.border}`, color: COLORS.navy }}
            >
              <option value="">Todos los veredictos</option>
              <option value="block">Bloquear</option>
              <option value="review">Revisar</option>
              <option value="clear">Limpio</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ fontSize: "0.75rem", padding: "0.3rem 0.5rem", borderRadius: "5px", border: `1px solid ${COLORS.border}`, color: COLORS.navy }}
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="resolved">Resuelto</option>
              <option value="escalated">Escalado</option>
            </select>
          </div>
          <CaseHistoryTable
            cases={cases}
            onSelect={selectCase}
            selectedId={selectedCaseId}
            loading={casesLoading}
          />
        </Card>
      </div>

      {/* ── Panel derecho: resultado activo ── */}
      <div>
        {screening && (
          <Card style={{ textAlign: "center", padding: "2.5rem" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🔍</div>
            <p style={{ color: COLORS.navy, fontWeight: 700, fontSize: "1rem", marginBottom: "0.35rem" }}>
              Verificando contra 15 fuentes…
            </p>
            <p style={{ color: COLORS.textMuted, fontSize: "0.82rem" }}>
              OFAC · ONU · FBI · INTERPOL · FATF · SEC · DFSA · VARA · CNBV · BCB · SFC · CMF · más
            </p>
          </Card>
        )}

        {!screening && caseLoading && (
          <Card style={{ textAlign: "center", padding: "2rem" }}>
            <p style={{ color: COLORS.textMuted }}>Cargando caso…</p>
          </Card>
        )}

        {!screening && !caseLoading && displayResult && (
          <ScreeningResult
            result={displayResult}
            caseId={displayResult.case?.id || selectedCaseId}
            onActionAdded={() => {
              loadCases();
              if (selectedCaseId) selectCase(selectedCaseId);
            }}
            onCaseUpdated={() => {
              loadCases();
              if (selectedCaseId) selectCase(selectedCaseId);
            }}
          />
        )}

        {!screening && !caseLoading && !displayResult && (
          <Card style={{ textAlign: "center", padding: "3rem 2rem" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem", opacity: 0.3 }}>🛡</div>
            <p style={{ color: COLORS.textMuted, fontSize: "0.92rem", lineHeight: 1.6 }}>
              Ingresa un nombre o razón social para realizar un screening, o selecciona un caso del historial.
            </p>
          </Card>
        )}

        {/* Historial de acciones del caso seleccionado */}
        {selectedCase?.actions?.length > 0 && (
          <Card style={{ marginTop: "1rem" }}>
            <SectionTitle>Historial de acciones del caso</SectionTitle>
            <div style={{ display: "grid", gap: "0.5rem" }}>
              {selectedCase.actions.map((a) => (
                <div key={a.id} style={{
                  padding: "0.6rem 0.75rem",
                  background: COLORS.bg,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "6px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span style={{ color: COLORS.navy, fontWeight: 700, fontSize: "0.8rem" }}>
                      {ACTION_LABELS[a.action] || a.action}
                      {a.source && <span style={{ color: COLORS.textMuted, fontWeight: 400 }}> · {a.source}</span>}
                    </span>
                    <span style={{ color: COLORS.textMuted, fontSize: "0.72rem" }}>{fmt(a.created_at)}</span>
                  </div>
                  {a.reason && (
                    <p style={{ color: COLORS.text, fontSize: "0.78rem", marginTop: "0.25rem", lineHeight: 1.45 }}>{a.reason}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
