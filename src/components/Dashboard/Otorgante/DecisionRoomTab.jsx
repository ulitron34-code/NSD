import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../hooks/useAuth";
import { COLORS } from "../../../utils/constants";
import { ordersAPI, otorganteAPI } from "../../../services/api";
import { demoServiceOrders } from "../../../data/demoServiceOrders";
import {
  buildOtorgantePipeline,
  buildOtorgantePipelineFromEntries,
} from "../../../data/otorgantePipeline";
import { translateCopy, uiText } from "../../../utils/runtimeCopy";

function buildDecision(opportunity, L, copy) {
  if (!opportunity) return null;

  const score = Number(opportunity.averageScore || 0);
  const docs = Number(opportunity.documentsCount || opportunity.documents?.length || 0);
  const highRisk = opportunity.risk === "Alto";
  const readyForCommittee = score >= 82 && !highRisk && docs >= 5;
  const conditional = score >= 65 && !readyForCommittee;

  if (readyForCommittee) {
    return {
      label: L("Avanzar a comite", "Advance to committee"),
      tone: COLORS.green,
      detail: L("El expediente tiene score fuerte, data room suficiente y riesgo controlado.", "The file has strong score, sufficient data room and controlled risk."),
      nextAction: L("Generar memo, solicitar contacto autorizado y preparar term sheet indicativo.", "Generate memo, request authorized contact and prepare indicative term sheet."),
    };
  }

  if (conditional) {
    return {
      label: L("Avanzar condicionado", "Advance conditionally"),
      tone: COLORS.amber,
      detail: L("El caso es revisable, pero necesita aclaraciones, evidencia adicional o mitigantes.", "The case is reviewable, but needs clarifications, additional evidence or mitigants."),
      nextAction: L("Enviar requerimientos, fijar fecha de subsanacion y reevaluar score.", "Send requests, set remediation date and reassess score."),
    };
  }

  return {
    label: L("Pausar y subsanar", "Pause and remediate"),
    tone: "#C62828",
    detail: copy("No conviene llevarlo a comite hasta cerrar brechas documentales, KYB, riesgo o uso de fondos."),
    nextAction: L("Mantener contacto controlado por NSD y pedir paquete documental minimo.", "Keep contact controlled by NSD and request minimum document package."),
  };
}

function buildGateRows(opportunity, L) {
  if (!opportunity) return [];

  const score = Number(opportunity.averageScore || 0);
  const docs = Number(opportunity.documentsCount || opportunity.documents?.length || 0);
  const hasShare = Boolean(opportunity.share || opportunity.invitationStatus);
  const hasInterest = Boolean(opportunity.interest);
  const contactApproved = opportunity.contactRequest?.status === "approved";

  return [
    [L("Acceso autorizado", "Authorized access"), hasShare, L("Data room compartido, invitacion aceptada o acceso institucional trazable.", "Shared data room, accepted invitation or traceable institutional access.")],
    [L("Evidencia suficiente", "Sufficient evidence"), docs >= 5, `${docs} ${L("documentos visibles para revision.", "documents visible for review.")}`],
    [L("Score minimo", "Minimum score"), score >= 65, `${score}/100 ${L("como lectura preliminar NSD.", "as NSD preliminary read.")}`],
    [L("Interes registrado", "Registered interest"), hasInterest, L("La entidad puede documentar apetito o decision interna.", "The institution can document appetite or internal decision.")],
    [L("Contacto controlado", "Controlled contact"), contactApproved, L("Solo se habilita al cerrar gates y autorizacion.", "Enabled only after gates and authorization.")],
  ];
}

export default function DecisionRoomTab() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);
  const copy = (value) => translateCopy(value, i18n.language);
  const [opportunities, setOpportunities] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        let mapped = [];
        if (user?.demo) {
          mapped = buildOtorgantePipeline(demoServiceOrders);
        } else {
          const { data } = await otorganteAPI.pipeline();
          mapped = buildOtorgantePipelineFromEntries(data || []);

          if (mapped.length === 0) {
            const sourceOrders = (await ordersAPI.list()).data || [];
            mapped = buildOtorgantePipeline(sourceOrders);
          }
        }

        if (!active) return;
        setOpportunities(mapped);
        setSelectedId((current) => current || mapped[0]?.id || "");
      } catch {
        if (!active) return;
        const mapped = buildOtorgantePipeline(demoServiceOrders);
        setOpportunities(mapped);
        setSelectedId(mapped[0]?.id || "");
        setError(L("No se pudo cargar el pipeline real; mostrando base demo.", "Could not load live pipeline; showing demo baseline."));
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [user?.demo, i18n.language]);

  const selected = useMemo(
    () => opportunities.find((item) => item.id === selectedId) || opportunities[0] || null,
    [opportunities, selectedId]
  );
  const decision = useMemo(() => buildDecision(selected, L, copy), [selected, i18n.language]);
  const gates = useMemo(() => buildGateRows(selected, L), [selected, i18n.language]);
  const committeePack = useMemo(() => {
    if (!selected) return [];
    return [
      [L("Tesis", "Thesis"), selected.use || L("Uso de fondos pendiente de confirmar.", "Use of funds pending confirmation.")],
      [L("Ticket", "Ticket"), selected.amountLabel],
      [L("Sector / pais", "Sector / country"), `${copy(selected.sector)} / ${selected.country}`],
      [L("Estructura", "Structure"), copy(selected.structure || "Por definir")],
      [L("Riesgo visible", "Visible risk"), copy(selected.risk)],
      [L("Preparacion", "Readiness"), copy(selected.readinessLevel || "Por validar")],
    ];
  }, [selected, i18n.language]);

  return (
    <div>
      <div style={{ marginBottom: "1.5rem", borderBottom: `1px solid ${COLORS.border}`, paddingBottom: "1.25rem" }}>
        <p style={{ color: COLORS.gold, fontSize: "0.74rem", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.45rem" }}>
          {L("Otorgantes / decision institucional", "Funders / institutional decision")}
        </p>
        <h1 style={{ color: COLORS.navy, fontFamily: "'Playfair Display', serif", fontSize: "2rem", marginBottom: "0.45rem" }}>
          {L("Sala de decision 360", "360 Decision Room")}
        </h1>
        <p style={{ color: COLORS.textMuted, maxWidth: "860px", lineHeight: 1.6, fontSize: "0.95rem" }}>
          {L("Vista ejecutiva para que una entidad financiera entienda que tiene enfrente, que falta, que riesgo existe y que accion institucional conviene tomar sin perder trazabilidad.", "Executive view for a financial institution to understand the case, gaps, risk and the recommended institutional action while keeping traceability.")}
        </p>
        {loading && <p style={{ color: COLORS.textMuted, fontSize: "0.82rem", marginTop: "0.6rem" }}>{L("Cargando oportunidades...", "Loading opportunities...")}</p>}
        {error && <p style={{ color: "#C62828", fontSize: "0.82rem", marginTop: "0.6rem" }}>{error}</p>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 0.8fr) minmax(0, 1.2fr)", gap: "1.25rem", alignItems: "start" }}>
        <aside style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
          <p style={{ color: COLORS.textMuted, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
            {L("Oportunidades", "Opportunities")}
          </p>
          <div style={{ display: "grid", gap: "0.55rem" }}>
            {opportunities.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                style={{
                  padding: "0.78rem",
                  borderRadius: "8px",
                  border: `1px solid ${selected?.id === item.id ? COLORS.gold : COLORS.border}`,
                  background: selected?.id === item.id ? "rgba(201,168,76,0.12)" : COLORS.bg,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <strong style={{ display: "block", color: COLORS.navy, fontSize: "0.84rem", marginBottom: "0.2rem" }}>{copy(item.name)}</strong>
                <span style={{ display: "block", color: COLORS.textMuted, fontSize: "0.74rem", lineHeight: 1.35 }}>{copy(item.sector)} / {item.amountLabel}</span>
                <span style={{ display: "block", color: item.risk === "Bajo" ? COLORS.green : item.risk === "Medio" ? COLORS.amber : "#C62828", fontWeight: 900, fontSize: "0.76rem", marginTop: "0.25rem" }}>
                  {item.averageScore}/100 - {copy(item.risk)}
                </span>
              </button>
            ))}
          </div>
        </aside>

        {selected && decision ? (
          <main style={{ display: "grid", gap: "1.25rem" }}>
            <section style={{ background: "linear-gradient(135deg, #0F1F2E 0%, #1B3A5C 100%)", borderRadius: "14px", padding: "1.4rem", color: "white", boxShadow: "0 12px 32px rgba(15,31,46,0.22)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", alignItems: "flex-start" }}>
                <div>
                  <p style={{ color: "rgba(255,255,255,0.62)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.35rem" }}>
                    {L("Expediente seleccionado", "Selected file")}
                  </p>
                  <h2 style={{ color: "white", fontSize: "1.35rem", marginBottom: "0.3rem" }}>{copy(selected.name)}</h2>
                  <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "0.88rem" }}>{selected.applicant}</p>
                </div>
                <div style={{ minWidth: "190px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", padding: "0.85rem", textAlign: "right" }}>
                  <p style={{ color: "rgba(255,255,255,0.62)", fontSize: "0.72rem", marginBottom: "0.25rem" }}>{L("Decision sugerida", "Suggested decision")}</p>
                  <p style={{ color: decision.tone, fontWeight: 900, fontSize: "1rem" }}>{decision.label}</p>
                </div>
              </div>
              <p style={{ color: "rgba(255,255,255,0.78)", lineHeight: 1.6, fontSize: "0.9rem", marginTop: "1rem" }}>{decision.detail}</p>
              <div style={{ marginTop: "1rem", background: "rgba(201,168,76,0.14)", border: "1px solid rgba(201,168,76,0.34)", borderRadius: "10px", padding: "0.9rem" }}>
                <p style={{ color: "#F3E8A6", fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "0.25rem" }}>{L("Siguiente accion", "Next action")}</p>
                <p style={{ color: "white", fontWeight: 800, fontSize: "0.9rem", lineHeight: 1.45 }}>{decision.nextAction}</p>
              </div>
            </section>

            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
              {[
                [L("Score integral", "Overall score"), `${selected.averageScore}/100`, selected.averageScore >= 82 ? COLORS.green : selected.averageScore >= 65 ? COLORS.amber : "#C62828"],
                [L("Score financiero", "Financial score"), `${selected.financialScore}/100`, COLORS.navy],
                [L("Score compliance", "Compliance score"), `${selected.complianceScore}/100`, COLORS.navy],
                [L("Documentos", "Documents"), selected.documentsCount || selected.documents?.length || 0, COLORS.gold],
              ].map(([label, value, color]) => (
                <div key={label} style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
                  <p style={{ color: COLORS.textMuted, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "0.3rem" }}>{label}</p>
                  <p style={{ color, fontSize: "1.25rem", fontWeight: 900 }}>{value}</p>
                </div>
              ))}
            </section>

            <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 0.9fr)", gap: "1.25rem" }}>
              <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
                <h3 style={{ color: COLORS.navy, fontSize: "1rem", marginBottom: "0.8rem" }}>{L("Checklist de gates", "Gate checklist")}</h3>
                <div style={{ display: "grid", gap: "0.6rem" }}>
                  {gates.map(([label, done, detail]) => (
                    <div key={label} style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: "0.65rem", alignItems: "start", padding: "0.7rem", borderRadius: "8px", background: done ? "rgba(46,125,50,0.07)" : COLORS.bg, border: `1px solid ${done ? "rgba(46,125,50,0.18)" : COLORS.border}` }}>
                      <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: done ? COLORS.green : COLORS.textMuted, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.68rem", fontWeight: 900 }}>
                        {done ? "OK" : "!"}
                      </span>
                      <span>
                        <strong style={{ display: "block", color: COLORS.navy, fontSize: "0.82rem" }}>{label}</strong>
                        <span style={{ color: COLORS.textMuted, fontSize: "0.76rem", lineHeight: 1.4 }}>{detail}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
                <h3 style={{ color: COLORS.navy, fontSize: "1rem", marginBottom: "0.8rem" }}>{L("Paquete para comite", "Committee package")}</h3>
                <div style={{ display: "grid", gap: "0.55rem" }}>
                  {committeePack.map(([label, value]) => (
                    <div key={label} style={{ paddingBottom: "0.55rem", borderBottom: `1px solid ${COLORS.border}` }}>
                      <p style={{ color: COLORS.textMuted, fontSize: "0.68rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "0.2rem" }}>{label}</p>
                      <p style={{ color: COLORS.navy, fontSize: "0.82rem", fontWeight: 800, lineHeight: 1.4 }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
              <h3 style={{ color: COLORS.navy, fontSize: "1rem", marginBottom: "0.8rem" }}>{L("Documentos y brechas visibles", "Visible documents and gaps")}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.6rem" }}>
                {(selected.documents || []).map((doc, index) => (
                  <div key={doc} style={{ padding: "0.75rem", borderRadius: "8px", background: index < 5 ? "rgba(46,125,50,0.06)" : COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                    <p style={{ color: COLORS.navy, fontSize: "0.78rem", fontWeight: 900, lineHeight: 1.3 }}>{copy(doc)}</p>
                    <p style={{ color: COLORS.textMuted, fontSize: "0.7rem", marginTop: "0.25rem" }}>{index < 5 ? L("Evidencia base", "Base evidence") : L("Complementario", "Supplemental")}</p>
                  </div>
                ))}
              </div>
            </section>
          </main>
        ) : (
          <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", color: COLORS.textMuted }}>
            {L("No hay oportunidades disponibles para decision.", "No opportunities available for decision.")}
          </div>
        )}
      </div>
    </div>
  );
}
