import { error as logError } from '../../utils/logger';
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNotification } from "../../hooks/useNotification";
import { useMyOrders } from "../../hooks/useMyOrders";
import { useReadinessChecklist } from "../../hooks/useReadinessChecklist";
import { screeningAPI, auditAPI } from "../../services/api";
import { COLORS } from "../../utils/constants";
import { uiText } from "../../utils/runtimeCopy";
import { pickLang } from "../../data/requisitosMinimos";

const VERDICT_STYLE = {
  clear: { color: COLORS.green, bg: "#E8F5E9", label: { es: "Sin coincidencias", en: "Clear" } },
  review: { color: COLORS.amber, bg: "#FEF3C7", label: { es: "Requiere revision", en: "Needs review" } },
  block: { color: "#C62828", bg: "#FFEBEE", label: { es: "Bloqueante", en: "Blocking" } },
  hit: { color: "#C62828", bg: "#FFEBEE", label: { es: "Coincidencia encontrada", en: "Hit found" } },
  skipped: { color: COLORS.textMuted, bg: "#F2EFE9", label: { es: "Sin verificar", en: "Not checked" } },
};

const ITEM_ESTADO_STYLE = {
  listo: { color: COLORS.green, bg: "#E8F5E9", label: { es: "Listo", en: "Ready" } },
  en_revision: { color: COLORS.amber, bg: "#FEF3C7", label: { es: "En revision", en: "Under review" } },
  pendiente: { color: COLORS.textMuted, bg: "#F2EFE9", label: { es: "Pendiente", en: "Pending" } },
};

function VerdictBadge({ verdict, L }) {
  const style = VERDICT_STYLE[verdict] || VERDICT_STYLE.skipped;
  return (
    <span style={{
      display: "inline-flex", padding: "0.35rem 0.85rem", borderRadius: "999px",
      background: style.bg, color: style.color, fontSize: "0.82rem", fontWeight: 800,
    }}>
      {L(style.label.es, style.label.en)}
    </span>
  );
}

function SourceRow({ label, result, L }) {
  if (!result) return null;
  const status = result.status === "hit" ? "hit" : result.status === "clear" ? "clear" : "skipped";
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.55rem 0", borderBottom: `1px solid ${COLORS.border}` }}>
      <span style={{ color: COLORS.navy, fontWeight: 700, fontSize: "0.88rem" }}>{label}</span>
      <VerdictBadge verdict={status} L={L} />
    </div>
  );
}

export default function CumplimientoTab({ onGoToPreparacion }) {
  const { addNotification } = useNotification();
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);

  const { orders, orderId, isDemo } = useMyOrders();
  const order = orders[0] || null;
  const checklist = useReadinessChecklist(orderId, isDemo);

  const [name, setName] = useState("");
  const [rfc, setRfc] = useState("");
  const [screeningLoading, setScreeningLoading] = useState(false);
  const [checkFullResult, setCheckFullResult] = useState(null);
  const [sat69bResult, setSat69bResult] = useState(null);
  const [screeningError, setScreeningError] = useState(null);

  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    if (order?.metadata?.companyName) setName(order.metadata.companyName);
    if (order?.metadata?.rfc) setRfc(order.metadata.rfc);
  }, [order]);

  useEffect(() => {
    if (isDemo || !orderId) return;
    setLogsLoading(true);
    auditAPI.list(orderId)
      .then(({ data }) => setLogs(data || []))
      .catch((err) => logError("SVC", "Error cargando historial de auditoria", err))
      .finally(() => setLogsLoading(false));
  }, [orderId, isDemo]);

  const runScreening = async () => {
    if (!name.trim() && !rfc.trim()) {
      addNotification(L("Captura al menos un nombre o RFC para verificar", "Enter at least a name or tax ID to screen"), "error");
      return;
    }
    setScreeningLoading(true);
    setScreeningError(null);
    const [fullRes, sat69bRes] = await Promise.allSettled([
      name.trim() ? screeningAPI.checkFull(name.trim(), "MX") : Promise.resolve(null),
      (rfc.trim() || name.trim()) ? screeningAPI.sat69b(rfc.trim(), name.trim()) : Promise.resolve(null),
    ]);

    if (fullRes.status === "fulfilled" && fullRes.value) {
      setCheckFullResult(fullRes.value.data);
    } else if (fullRes.status === "rejected") {
      logError("SVC", "Error en screening regulatorio", fullRes.reason);
    }

    if (sat69bRes.status === "fulfilled" && sat69bRes.value) {
      setSat69bResult(sat69bRes.value.data);
    } else if (sat69bRes.status === "rejected") {
      logError("SVC", "Error en screening SAT 69-B", sat69bRes.reason);
    }

    if (fullRes.status === "rejected" && sat69bRes.status === "rejected") {
      setScreeningError(L("No se pudo completar el screening regulatorio. Intenta de nuevo.", "Could not complete the regulatory screening. Try again."));
    }
    setScreeningLoading(false);
  };

  const sanctionSources = checkFullResult?.sanctions
    ? Object.entries(checkFullResult.sanctions).map(([key, value]) => ({ key, label: value.label || key.toUpperCase(), result: value }))
    : [];
  const regulatorySources = checkFullResult?.regulatory
    ? Object.entries(checkFullResult.regulatory).map(([key, value]) => ({ key, label: value.label || key.toUpperCase(), result: value }))
    : [];
  const [showAllSources, setShowAllSources] = useState(false);

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ color: COLORS.navy, fontSize: "2rem", marginBottom: "0.5rem" }}>
          {L("Cumplimiento", "Compliance")}
        </h1>
        <p style={{ color: COLORS.textMuted, maxWidth: "760px" }}>
          {L(
            "Screening regulatorio real contra OFAC, ONU, UK, UE, Canada, FBI y 18 fuentes reguladoras adicionales, mas el listado publico 69-B del SAT.",
            "Real regulatory screening against OFAC, UN, UK, EU, Canada, FBI and 18 additional regulators, plus the SAT's public 69-B blacklist."
          )}
        </p>
      </div>

      {/* SCREENING REGULATORIO */}
      <div style={{
        background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
        padding: "2rem", borderRadius: "10px", marginBottom: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}>
        <h2 style={{ color: COLORS.navy, marginBottom: "1rem" }}>
          {L("Screening regulatorio", "Regulatory Screening")}
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "0.75rem", alignItems: "end", marginBottom: "1.25rem" }}>
          <div>
            <label style={{ display: "block", color: COLORS.textMuted, fontSize: "0.78rem", marginBottom: "0.3rem" }}>
              {L("Nombre / Razon social", "Name / Company")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: "100%", padding: "0.65rem", borderRadius: "6px", border: `1px solid ${COLORS.border}` }}
            />
          </div>
          <div>
            <label style={{ display: "block", color: COLORS.textMuted, fontSize: "0.78rem", marginBottom: "0.3rem" }}>
              RFC
            </label>
            <input
              type="text"
              value={rfc}
              onChange={(e) => setRfc(e.target.value)}
              style={{ width: "100%", padding: "0.65rem", borderRadius: "6px", border: `1px solid ${COLORS.border}` }}
            />
          </div>
          <button
            onClick={runScreening}
            disabled={screeningLoading}
            style={{
              padding: "0.75rem 1.25rem", background: COLORS.gold, color: COLORS.navy,
              border: "none", borderRadius: "6px", fontWeight: 800, cursor: screeningLoading ? "default" : "pointer",
              opacity: screeningLoading ? 0.7 : 1,
            }}
          >
            {screeningLoading ? L("Verificando...", "Checking...") : L("Verificar", "Check")}
          </button>
        </div>

        {screeningError && (
          <p style={{ color: "#C62828", fontSize: "0.86rem", marginBottom: "1rem" }}>{screeningError}</p>
        )}

        {checkFullResult && (
          <div style={{ marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <p style={{ color: COLORS.navy, fontWeight: 800, margin: 0 }}>
                {L("Veredicto de sanciones/regulatorio", "Sanctions/regulatory verdict")}
              </p>
              <VerdictBadge verdict={checkFullResult.verdict} L={L} />
            </div>
            <div style={{ display: "grid", gap: "0.1rem" }}>
              {sanctionSources.map((s) => <SourceRow key={s.key} label={s.label} result={s.result} L={L} />)}
              {showAllSources && regulatorySources.map((s) => <SourceRow key={s.key} label={s.label} result={s.result} L={L} />)}
            </div>
            {regulatorySources.length > 0 && (
              <button
                onClick={() => setShowAllSources(!showAllSources)}
                style={{ marginTop: "0.75rem", background: "none", border: "none", color: COLORS.gold, fontWeight: 700, cursor: "pointer", fontSize: "0.85rem", padding: 0 }}
              >
                {showAllSources
                  ? L("Ocultar fuentes regulatorias adicionales", "Hide additional regulatory sources")
                  : L(`Ver ${regulatorySources.length} fuentes regulatorias adicionales (CNBV, CNMV, FCA UK, SEC, Interpol, FATF...)`, `Show ${regulatorySources.length} additional regulatory sources (CNBV, CNMV, FCA UK, SEC, Interpol, FATF...)`)}
              </button>
            )}
          </div>
        )}

        {sat69bResult && (
          <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <p style={{ color: COLORS.navy, fontWeight: 800, margin: 0 }}>
                {L("Listado 69-B del SAT (EFOS)", "SAT 69-B Blacklist (EFOS)")}
              </p>
              <VerdictBadge verdict={sat69bResult.status} L={L} />
            </div>
            <p style={{ color: COLORS.textMuted, fontSize: "0.85rem", margin: 0 }}>{sat69bResult.detail}</p>
          </div>
        )}
      </div>

      {/* DOCUMENTOS DEL CHECKLIST (solo lectura) */}
      <div style={{
        background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
        padding: "2rem", borderRadius: "10px", marginBottom: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ color: COLORS.navy, margin: 0 }}>
            {L("Documentos del checklist", "Checklist Documents")}
          </h2>
          {onGoToPreparacion && (
            <button
              onClick={onGoToPreparacion}
              style={{ padding: "0.55rem 1rem", background: "transparent", border: `1px solid ${COLORS.gold}`, color: COLORS.gold, borderRadius: "6px", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem" }}
            >
              {L("Ir a Preparacion para subir", "Go to Preparation to upload")}
            </button>
          )}
        </div>
        <div style={{ display: "grid", gap: "0.4rem" }}>
          {checklist.items.map((item) => {
            const estadoKey = item.estado === "listo" ? "listo" : item.enRevision ? "en_revision" : "pendiente";
            const style = ITEM_ESTADO_STYLE[estadoKey];
            return (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: `1px solid ${COLORS.border}` }}>
                <span style={{ color: COLORS.navy, fontSize: "0.88rem", fontWeight: item.critico ? 800 : 500 }}>
                  {pickLang(item.label, i18n.language)} {item.critico && <span style={{ color: "#C62828" }}>*</span>}
                </span>
                <span style={{ display: "inline-flex", padding: "0.3rem 0.7rem", borderRadius: "999px", background: style.bg, color: style.color, fontSize: "0.78rem", fontWeight: 700 }}>
                  {L(style.label.es, style.label.en)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* BURO / CIRCULO / SAT TIEMPO REAL — PENDIENTE DE CONTRATO */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          {
            title: L("Buro de Credito / Circulo de Credito", "Credit Bureau Scoring"),
            detail: L(
              "Requiere contrato comercial y credenciales (BURO_API_KEY) que aun no existen. El backend ya tiene la integracion lista para activarse en cuanto se firme el contrato.",
              "Requires a commercial contract and credentials (BURO_API_KEY) that do not exist yet. The backend integration is ready to activate as soon as the contract is signed."
            ),
          },
          {
            title: L("Validacion de RFC en tiempo real (SAT)", "Real-time RFC Validation (SAT)"),
            detail: L(
              "Requiere contrato comercial y credenciales (SAT_API_KEY) que aun no existen. Mientras tanto se valida solo el formato del RFC.",
              "Requires a commercial contract and credentials (SAT_API_KEY) that do not exist yet. In the meantime only the RFC format is validated."
            ),
          },
        ].map((card) => (
          <div key={card.title} style={{
            background: "#FFF8E1", border: `1px solid ${COLORS.gold}`, borderRadius: "10px", padding: "1.25rem",
          }}>
            <p style={{ color: COLORS.navy, fontWeight: 800, marginBottom: "0.5rem" }}>{card.title}</p>
            <p style={{ color: COLORS.textMuted, fontSize: "0.85rem", lineHeight: 1.5, margin: 0 }}>{card.detail}</p>
            <span style={{ display: "inline-block", marginTop: "0.75rem", padding: "0.3rem 0.7rem", borderRadius: "999px", background: "#FEF3C7", color: COLORS.amber, fontSize: "0.78rem", fontWeight: 800 }}>
              {L("Pendiente de contrato comercial", "Pending commercial contract")}
            </span>
          </div>
        ))}
      </div>

      {/* HISTORIAL DE AUDITORIA REAL */}
      <div style={{
        background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
        padding: "2rem", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}>
        <h2 style={{ color: COLORS.navy, marginBottom: "1.25rem" }}>{L("Historial de auditoria", "Audit History")}</h2>
        {isDemo || !orderId ? (
          <p style={{ color: COLORS.textMuted }}>{L("Disponible cuando tengas un expediente real activo.", "Available once you have a real active case.")}</p>
        ) : logsLoading ? (
          <p style={{ color: COLORS.textMuted }}>{L("Cargando...", "Loading...")}</p>
        ) : logs.length === 0 ? (
          <p style={{ color: COLORS.textMuted }}>{L("No hay eventos registrados aun", "No events recorded yet")}</p>
        ) : (
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {logs.map((log, i) => (
              <div key={log.id || i} style={{ borderLeft: `3px solid ${COLORS.gold}`, paddingLeft: "1rem", marginBottom: "1rem", paddingBottom: "1rem", borderBottom: i < logs.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
                <p style={{ color: COLORS.navy, fontWeight: 700, margin: 0, fontSize: "0.9rem" }}>
                  {log.created_at ? new Date(log.created_at).toLocaleString() : ""}
                </p>
                <p style={{ color: COLORS.textMuted, margin: "0.25rem 0", fontSize: "0.85rem" }}>
                  {log.action} {log.entity_type ? `- ${log.entity_type}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
