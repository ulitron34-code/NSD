import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../utils/constants";
import { uiText } from "../../utils/runtimeCopy";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

const SEVERITY_CONFIG = {
  CRITICAL: { label: "CRITICO",  bg: "#FFEBEE", color: "#C62828", border: "#EF9A9A" },
  HIGH:     { label: "ALTO",     bg: "#FFF3E0", color: "#E65100", border: "#FFCC80" },
  MEDIUM:   { label: "MEDIO",    bg: "#FFF8E1", color: "#F57F17", border: "#FFE082" },
  LOW:      { label: "BAJO",     bg: "#E8F5E9", color: "#1B5E20", border: "#A5D6A7" },
};

const RISK_CONFIG = {
  CRITICAL: { label: "CRITICO",  bg: "#C62828", color: "#fff" },
  HIGH:     { label: "ALTO",     bg: "#E65100", color: "#fff" },
  MEDIUM:   { label: "MEDIO",    bg: "#F57F17", color: "#fff" },
  LOW:      { label: "LIMPIO",   bg: "#2E7D32", color: "#fff" },
};

const TX_TYPES = [
  { value: "", label: "— Seleccionar —" },
  { value: "wire", label: "Transferencia bancaria" },
  { value: "wire_third_party", label: "Transferencia a tercero" },
  { value: "cash", label: "Efectivo / Cash" },
  { value: "crypto", label: "Criptomoneda" },
  { value: "check", label: "Cheque" },
  { value: "ach", label: "ACH / Domiciliacion" },
  { value: "correspondent_banking", label: "Banca corresponsal" },
  { value: "hawala", label: "Sistema informal (Hawala)" },
  { value: "card", label: "Tarjeta" },
];

const CURRENCIES = ["USD", "MXN", "COP", "ARS", "CLP", "PEN", "EUR", "CAD", "AED"];

function Badge({ severity }) {
  const cfg = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.LOW;
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: "4px", fontSize: "0.7rem",
      fontWeight: 900, letterSpacing: "0.06em",
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`
    }}>
      {cfg.label}
    </span>
  );
}

function RiskBadge({ riskLevel }) {
  const cfg = RISK_CONFIG[riskLevel] || RISK_CONFIG.LOW;
  return (
    <span style={{
      display: "inline-block", padding: "4px 14px", borderRadius: "6px", fontSize: "0.85rem",
      fontWeight: 900, letterSpacing: "0.06em", background: cfg.bg, color: cfg.color
    }}>
      {cfg.label}
    </span>
  );
}

const RULES_DISPLAY = [
  { id: "AMOUNT_THRESHOLD",   label: "Umbral de monto",           range: "MEDIO – CRITICO" },
  { id: "SANCTIONED_COUNTRY", label: "Pais sancionado",           range: "CRITICO" },
  { id: "HIGH_RISK_COUNTRY",  label: "Jurisdiccion FATF alto riesgo", range: "ALTO" },
  { id: "HIGH_RISK_TX_TYPE",  label: "Tipo de operacion de riesgo", range: "ALTO" },
  { id: "ROUND_AMOUNT",       label: "Monto exactamente redondo", range: "MEDIO" },
  { id: "STRUCTURING_RISK",   label: "Posible estructuracion",    range: "ALTO" },
  { id: "SANCTIONS_HIT",      label: "Coincidencia en sanciones", range: "CRITICO" },
];

const DEMO_ALERTS = [
  { id: 1, name: "Operaciones Fantasma S.A.", amount: 490000, currency: "USD", riskLevel: "HIGH",
    alerts: [{ rule: "STRUCTURING_RISK", severity: "HIGH", detail: "Monto a menos del 5% del umbral critico" }],
    evaluated_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 2, name: "Global Finance LLC", amount: 600000, currency: "USD", riskLevel: "CRITICAL",
    alerts: [{ rule: "AMOUNT_THRESHOLD", severity: "CRITICAL", detail: "Monto supera umbral critico" },
              { rule: "ROUND_AMOUNT", severity: "MEDIUM", detail: "Monto exactamente redondo" }],
    evaluated_at: new Date(Date.now() - 7200000).toISOString() },
];

export default function TransactionOversightTab() {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);

  const [form, setForm] = useState({ name: "", amount: "", currency: "USD", countryCode: "", txType: "", notes: "" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState(DEMO_ALERTS);
  const [view, setView] = useState("screen"); // "screen" | "rules" | "history"

  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleScreen = async (e) => {
    e.preventDefault();
    if (!form.amount) { setError("Ingresa el monto de la operacion."); return; }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const token = localStorage.getItem("nsd_token") || sessionStorage.getItem("nsd_token") || "";
      const res = await fetch(`${API_BASE}/api/transactions/screen`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }
      const data = await res.json();
      setResult(data);
      if (data.alerts?.length > 0) {
        setHistory((h) => [{ id: Date.now(), name: form.name || "(sin nombre)", ...data }, ...h.slice(0, 19)]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "0.5rem 0", maxWidth: 960, margin: "0 auto" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0F1F2E 0%, #1B3A5C 100%)",
        borderRadius: "14px", padding: "1.5rem 2rem", marginBottom: "1.5rem", color: "white"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <p style={{ fontSize: "0.72rem", opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.3rem" }}>
              {L("Modulo F4 — NEXUS Global Compliance", "Module F4 — NEXUS Global Compliance")}
            </p>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0 }}>
              {L("Supervision de Transacciones", "Transaction Oversight")}
            </h2>
            <p style={{ opacity: 0.65, fontSize: "0.85rem", marginTop: "0.3rem" }}>
              {L("Motor de reglas + screening contra 6 listas de sanciones", "Rules engine + screening against 6 sanctions lists")}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {history.filter((h) => h.riskLevel === "CRITICAL").length > 0 && (
              <div style={{ background: "rgba(198,40,40,0.25)", border: "1px solid #EF9A9A", borderRadius: "8px", padding: "0.6rem 1rem", textAlign: "center" }}>
                <p style={{ fontSize: "1.4rem", fontWeight: 900, color: "#EF9A9A" }}>
                  {history.filter((h) => h.riskLevel === "CRITICAL").length}
                </p>
                <p style={{ fontSize: "0.7rem", opacity: 0.7 }}>{L("CRITICOS", "CRITICAL")}</p>
              </div>
            )}
            <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "8px", padding: "0.6rem 1rem", textAlign: "center" }}>
              <p style={{ fontSize: "1.4rem", fontWeight: 900 }}>{history.length}</p>
              <p style={{ fontSize: "0.7rem", opacity: 0.7 }}>{L("ALERTAS", "ALERTS")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
        {[
          { id: "screen",  label: L("Evaluar Operacion", "Evaluate Transaction") },
          { id: "history", label: L("Historial de Alertas", "Alert History") },
          { id: "rules",   label: L("Configuracion de Reglas", "Rules Configuration") },
        ].map((t) => (
          <button key={t.id} type="button" onClick={() => setView(t.id)} style={{
            padding: "0.5rem 1rem", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.82rem",
            background: view === t.id ? COLORS.navy : COLORS.bg,
            color: view === t.id ? "#fff" : COLORS.textMuted,
            boxShadow: view === t.id ? COLORS.shadowSm : "none",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── VISTA: Evaluar ───────────────────────────────────── */}
      {view === "screen" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          {/* Formulario */}
          <div style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.5rem", boxShadow: COLORS.shadowSm }}>
            <h3 style={{ color: COLORS.navy, fontWeight: 800, marginBottom: "1.2rem", fontSize: "0.95rem" }}>
              {L("Datos de la Operacion", "Transaction Details")}
            </h3>
            <form onSubmit={handleScreen} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
                  {L("Nombre / Razon social", "Name / Entity")}
                </span>
                <input
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder={L("Persona fisica o moral a verificar", "Individual or legal entity to screen")}
                  style={{ padding: "0.6rem 0.75rem", borderRadius: "6px", border: `1px solid ${COLORS.border}`, fontSize: "0.88rem", color: COLORS.text }}
                />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.75rem" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
                    {L("Monto *", "Amount *")}
                  </span>
                  <input
                    type="number" min="0" value={form.amount}
                    onChange={(e) => handleChange("amount", e.target.value)}
                    placeholder="0"
                    required
                    style={{ padding: "0.6rem 0.75rem", borderRadius: "6px", border: `1px solid ${COLORS.border}`, fontSize: "0.88rem" }}
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
                    {L("Moneda", "Currency")}
                  </span>
                  <select
                    value={form.currency}
                    onChange={(e) => handleChange("currency", e.target.value)}
                    style={{ padding: "0.6rem 0.75rem", borderRadius: "6px", border: `1px solid ${COLORS.border}`, fontSize: "0.88rem" }}
                  >
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
                    {L("Pais (codigo ISO)", "Country (ISO code)")}
                  </span>
                  <input
                    value={form.countryCode} maxLength={2}
                    onChange={(e) => handleChange("countryCode", e.target.value.toUpperCase())}
                    placeholder="MX, US, CO..."
                    style={{ padding: "0.6rem 0.75rem", borderRadius: "6px", border: `1px solid ${COLORS.border}`, fontSize: "0.88rem" }}
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
                    {L("Tipo de operacion", "Transaction type")}
                  </span>
                  <select
                    value={form.txType}
                    onChange={(e) => handleChange("txType", e.target.value)}
                    style={{ padding: "0.6rem 0.75rem", borderRadius: "6px", border: `1px solid ${COLORS.border}`, fontSize: "0.88rem" }}
                  >
                    {TX_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </label>
              </div>

              <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>
                  {L("Notas adicionales", "Additional notes")}
                </span>
                <textarea
                  value={form.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={2}
                  placeholder={L("Contexto o informacion relevante...", "Context or relevant information...")}
                  style={{ padding: "0.6rem 0.75rem", borderRadius: "6px", border: `1px solid ${COLORS.border}`, fontSize: "0.88rem", resize: "vertical" }}
                />
              </label>

              {error && (
                <div style={{ padding: "0.7rem 1rem", background: "#FFEBEE", border: "1px solid #EF9A9A", borderRadius: "6px", color: "#C62828", fontSize: "0.82rem" }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                padding: "0.75rem", borderRadius: "8px", border: "none", cursor: loading ? "not-allowed" : "pointer",
                background: loading ? COLORS.border : COLORS.navy, color: "#fff", fontWeight: 800, fontSize: "0.9rem"
              }}>
                {loading ? L("Evaluando...", "Evaluating...") : L("Evaluar Operacion", "Evaluate Transaction")}
              </button>
            </form>
          </div>

          {/* Resultado */}
          <div>
            {!result && !loading && (
              <div style={{
                background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: "10px",
                padding: "2.5rem 1.5rem", textAlign: "center", color: COLORS.textMuted
              }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🔍</div>
                <p style={{ fontWeight: 700, marginBottom: "0.5rem" }}>{L("Ingresa los datos de la operacion", "Enter transaction details")}</p>
                <p style={{ fontSize: "0.82rem" }}>{L("El resultado aparecera aqui", "The result will appear here")}</p>
              </div>
            )}
            {result && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Veredicto */}
                <div style={{
                  background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "10px",
                  padding: "1.25rem 1.5rem", boxShadow: COLORS.shadowSm
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <h3 style={{ color: COLORS.navy, fontWeight: 800, fontSize: "0.9rem", margin: 0 }}>
                      {L("Nivel de Riesgo", "Risk Level")}
                    </h3>
                    <RiskBadge riskLevel={result.riskLevel} />
                  </div>
                  <p style={{ color: COLORS.text, fontSize: "0.85rem", lineHeight: 1.5, background: COLORS.bg, padding: "0.75rem", borderRadius: "6px" }}>
                    {result.recommendation}
                  </p>
                </div>

                {/* Alertas */}
                {result.alerts?.length > 0 && (
                  <div style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.25rem 1.5rem", boxShadow: COLORS.shadowSm }}>
                    <h3 style={{ color: COLORS.navy, fontWeight: 800, fontSize: "0.9rem", marginBottom: "0.75rem" }}>
                      {L("Alertas generadas", "Generated alerts")} ({result.alerts.length})
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {result.alerts.map((alert, i) => (
                        <div key={i} style={{
                          padding: "0.65rem 0.9rem", borderRadius: "6px",
                          background: SEVERITY_CONFIG[alert.severity]?.bg || "#f5f5f5",
                          border: `1px solid ${SEVERITY_CONFIG[alert.severity]?.border || "#ddd"}`,
                          display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem"
                        }}>
                          <p style={{ fontSize: "0.8rem", color: COLORS.text, lineHeight: 1.4, flex: 1 }}>{alert.detail}</p>
                          <Badge severity={alert.severity} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Screening sanciones */}
                {result.sanctionsResult && (
                  <div style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.25rem 1.5rem", boxShadow: COLORS.shadowSm }}>
                    <h3 style={{ color: COLORS.navy, fontWeight: 800, fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                      {L("Screening de Sanciones", "Sanctions Screening")}
                    </h3>
                    <span style={{
                      display: "inline-block", padding: "3px 10px", borderRadius: "4px", fontSize: "0.78rem", fontWeight: 800,
                      background: result.sanctionsResult.verdict === "hit" ? "#FFEBEE" : "#E8F5E9",
                      color: result.sanctionsResult.verdict === "hit" ? "#C62828" : "#1B5E20"
                    }}>
                      {result.sanctionsResult.verdict === "hit"
                        ? L("COINCIDENCIA ENCONTRADA", "HIT FOUND")
                        : L("SIN COINCIDENCIAS", "CLEAR")}
                    </span>
                    {result.sanctionsResult.hits?.length > 0 && (
                      <p style={{ fontSize: "0.78rem", color: COLORS.textMuted, marginTop: "0.5rem" }}>
                        {result.sanctionsResult.hits.map((h) => h.label).join(" / ")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── VISTA: Historial ─────────────────────────────────── */}
      {view === "history" && (
        <div style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.25rem 1.5rem", boxShadow: COLORS.shadowSm }}>
          <h3 style={{ color: COLORS.navy, fontWeight: 800, marginBottom: "1rem", fontSize: "0.95rem" }}>
            {L("Historial de alertas de esta sesion", "Session alert history")}
          </h3>
          {history.length === 0 ? (
            <p style={{ color: COLORS.textMuted, fontSize: "0.85rem" }}>{L("Sin alertas en esta sesion.", "No alerts in this session.")}</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {history.map((h) => (
                <div key={h.id} style={{
                  padding: "0.85rem 1rem", borderRadius: "8px", background: COLORS.bg,
                  border: `1px solid ${COLORS.border}`, display: "grid",
                  gridTemplateColumns: "auto 1fr auto auto", gap: "1rem", alignItems: "center"
                }}>
                  <RiskBadge riskLevel={h.riskLevel} />
                  <div>
                    <strong style={{ color: COLORS.navy, fontSize: "0.88rem" }}>{h.name || "(sin nombre)"}</strong>
                    <p style={{ color: COLORS.textMuted, fontSize: "0.75rem", marginTop: "0.15rem" }}>
                      {h.input?.amount?.toLocaleString() || h.amount?.toLocaleString()} {h.input?.currency || h.currency}
                      {h.input?.countryCode || h.countryCode ? ` · ${h.input?.countryCode || h.countryCode}` : ""}
                    </p>
                  </div>
                  <span style={{ color: COLORS.textMuted, fontSize: "0.75rem" }}>
                    {new Date(h.evaluated_at).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span style={{ color: COLORS.textMuted, fontSize: "0.78rem", fontWeight: 700 }}>
                    {h.alerts?.length ?? 0} {L("alertas", "alerts")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── VISTA: Reglas ────────────────────────────────────── */}
      {view === "rules" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
          <div style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.25rem 1.5rem", boxShadow: COLORS.shadowSm }}>
            <h3 style={{ color: COLORS.navy, fontWeight: 800, marginBottom: "1rem", fontSize: "0.95rem" }}>
              {L("Reglas activas", "Active rules")}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {RULES_DISPLAY.map((r) => (
                <div key={r.id} style={{ padding: "0.65rem 0.9rem", background: COLORS.bg, borderRadius: "6px", border: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontSize: "0.82rem", fontWeight: 700, color: COLORS.navy }}>{r.label}</p>
                    <p style={{ fontSize: "0.72rem", color: COLORS.textMuted, fontFamily: "monospace" }}>{r.id}</p>
                  </div>
                  <span style={{ fontSize: "0.72rem", color: COLORS.textMuted, fontWeight: 700 }}>{r.range}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.25rem 1.5rem", boxShadow: COLORS.shadowSm }}>
            <h3 style={{ color: COLORS.navy, fontWeight: 800, marginBottom: "1rem", fontSize: "0.95rem" }}>
              {L("Umbrales de monto por moneda", "Amount thresholds by currency")}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {[
                ["USD", 500000, 100000, 50000],
                ["MXN", 10000000, 2000000, 1000000],
                ["COP", 2000000000, 400000000, 200000000],
                ["ARS", 500000000, 100000000, 50000000],
                ["CLP", 500000000, 100000000, 50000000],
                ["PEN", 2000000, 400000, 200000],
              ].map(([cur, crit, high, med]) => (
                <div key={cur} style={{ padding: "0.55rem 0.9rem", background: COLORS.bg, borderRadius: "6px", border: `1px solid ${COLORS.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                    <strong style={{ fontSize: "0.82rem", color: COLORS.navy }}>{cur}</strong>
                    <span style={{ fontSize: "0.7rem", color: "#C62828", fontWeight: 700 }}>CRITICO: {crit.toLocaleString()}</span>
                  </div>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <span style={{ fontSize: "0.72rem", color: "#E65100" }}>ALTO: {high.toLocaleString()}</span>
                    <span style={{ fontSize: "0.72rem", color: "#F57F17" }}>MEDIO: {med.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
