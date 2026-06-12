import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../utils/constants";
import { uiText } from "../../utils/runtimeCopy";

const agentRows = [
  {
    key: "documents",
    es: "Documentos / OCR",
    en: "Documents / OCR",
    statusEs: "Listo para conectar",
    statusEn: "Ready to connect",
    endpoint: "/api/ai-agents/documents/:orderId/triage",
    inputEs: "PDF, imagenes, hashes, fechas, usuario, tipo documental",
    inputEn: "PDFs, images, hashes, dates, user, document type",
    outputEs: "tipo, vigencia, inconsistencias, faltantes, riesgo documental",
    outputEn: "type, validity, inconsistencies, missing items, document risk",
    cost: "Medio",
  },
  {
    key: "forensic",
    es: "Forense / antifraude",
    en: "Forensic / anti-fraud",
    statusEs: "Contrato UI creado",
    statusEn: "UI contract created",
    endpoint: "/api/ai-agents/forensic/:orderId/analyze",
    inputEs: "expediente, data room, score, hallazgos, cadena de custodia",
    inputEn: "file, data room, score, findings, custody chain",
    outputEs: "red flags, mitigantes, evidencia faltante, recomendacion operativa",
    outputEn: "red flags, mitigants, missing evidence, operating recommendation",
    cost: "Medio-Alto",
  },
  {
    key: "kyb",
    es: "KYB / listas",
    en: "KYB / watchlists",
    statusEs: "Fase controlada",
    statusEn: "Controlled phase",
    endpoint: "/api/ai-agents/kyb/:orderId/validate",
    inputEs: "empresa, UBO, firmantes, pais, tax ID, poderes",
    inputEn: "company, UBO, signers, country, tax ID, powers",
    outputEs: "PEP, sanciones, estructura, alertas por jurisdiccion",
    outputEn: "PEP, sanctions, structure, jurisdiction alerts",
    cost: "Alto",
  },
  {
    key: "committee",
    es: "Memo comite",
    en: "Committee memo",
    statusEs: "Operativo en demo",
    statusEn: "Operational in demo",
    endpoint: "/api/ai-agents/risk/:orderId/memo",
    inputEs: "score, documentos, hallazgos, requerimientos, interes otorgante",
    inputEn: "score, documents, findings, requests, funder interest",
    outputEs: "memo ejecutivo, preguntas, condicionantes y siguiente accion",
    outputEn: "executive memo, questions, conditions and next action",
    cost: "Bajo-Medio",
  },
];

const phaseRows = [
  ["Fase 8", "Implementacion IA", "AI implementation", "Parcialmente implementada en UI"],
  ["Fase 12", "Seguridad y continuidad", "Security and continuity", "Base visible y pendiente backend"],
  ["Fase 16", "Corrida APIs IA", "AI API run", "Preparada para integracion gradual"],
  ["Fase 17", "Costos biometricos/APIs", "Biometrics/API costs", "Mitigacion por activacion selectiva"],
];

function costColor(cost) {
  if (cost.includes("Alto")) return "#C62828";
  if (cost.includes("Medio")) return COLORS.amber;
  return COLORS.green;
}

export default function AIAgentOpsTab() {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);

  const summary = useMemo(() => {
    const ready = agentRows.filter((row) => row.statusEs.includes("Listo") || row.statusEs.includes("creado") || row.statusEs.includes("Operativo")).length;
    return {
      ready,
      total: agentRows.length,
      highCost: agentRows.filter((row) => row.cost.includes("Alto")).length,
      endpoints: agentRows.length,
    };
  }, []);

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <section style={{
        background: "linear-gradient(135deg, #0F1F2E 0%, #1B3A5C 65%, #214F45 130%)",
        borderRadius: "16px",
        padding: "1.6rem",
        color: COLORS.white,
        boxShadow: COLORS.shadowMd,
      }}>
        <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.74rem", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          {L("NSD Admin / orquestacion IA", "NSD Admin / AI orchestration")}
        </p>
        <h1 style={{ margin: "0.35rem 0", color: COLORS.white, fontSize: "1.7rem" }}>
          {L("Consola de agentes IA", "AI Agent Console")}
        </h1>
        <p style={{ margin: 0, maxWidth: "940px", color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>
          {L(
            "Mapa ejecutivo para explicar como NSD IF conectara agentes especializados por API sin disparar costos antes de tiempo: primero evidencia local, despues OCR/hashing, luego KYB externo y biometricos por riesgo.",
            "Executive map explaining how NSD IF will connect specialized agents through APIs without triggering costs too early: local evidence first, then OCR/hashing, then external KYB and risk-based biometrics."
          )}
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
        {[
          [L("Agentes mapeados", "Mapped agents"), `${summary.total}`, COLORS.navy],
          [L("Listos para API", "API-ready"), `${summary.ready}/${summary.total}`, COLORS.green],
          [L("Endpoints previstos", "Planned endpoints"), `${summary.endpoints}`, COLORS.gold],
          [L("Costo alto controlado", "Controlled high cost"), `${summary.highCost}`, COLORS.amber],
        ].map(([label, value, color]) => (
          <article key={label} style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
            <p style={{ color: COLORS.textMuted, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "0.25rem" }}>{label}</p>
            <p style={{ color, fontSize: "1.55rem", fontWeight: 900 }}>{value}</p>
          </article>
        ))}
      </section>

      <section style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
        <p style={{ color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.85rem" }}>
          {L("Mapa de agentes y contratos API", "Agent map and API contracts")}
        </p>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {agentRows.map((agent) => (
            <article key={agent.key} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 210px), 1fr))", gap: "0.85rem", padding: "0.95rem", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: "8px" }}>
              <div>
                <strong style={{ display: "block", color: COLORS.navy, fontSize: "0.9rem", marginBottom: "0.25rem" }}>{L(agent.es, agent.en)}</strong>
                <span style={{ color: COLORS.green, fontSize: "0.72rem", fontWeight: 900 }}>{L(agent.statusEs, agent.statusEn)}</span>
              </div>
              <div>
                <code style={{ display: "block", color: COLORS.navy, fontSize: "0.75rem", marginBottom: "0.45rem", overflowWrap: "anywhere" }}>{agent.endpoint}</code>
                <p style={{ color: COLORS.textMuted, fontSize: "0.76rem", lineHeight: 1.45 }}>
                  <strong>{L("Entrada", "Input")}:</strong> {L(agent.inputEs, agent.inputEn)}
                </p>
                <p style={{ color: COLORS.textMuted, fontSize: "0.76rem", lineHeight: 1.45 }}>
                  <strong>{L("Salida", "Output")}:</strong> {L(agent.outputEs, agent.outputEn)}
                </p>
              </div>
              <div style={{ alignSelf: "center", justifySelf: "start" }}>
                <span style={{ display: "inline-block", padding: "0.4rem 0.65rem", borderRadius: "999px", background: "rgba(255,255,255,0.78)", color: costColor(agent.cost), fontSize: "0.76rem", fontWeight: 900 }}>
                  {L("Costo", "Cost")}: {agent.cost}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "1rem" }}>
        <article style={{ background: "#102235", color: COLORS.white, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
          <p style={{ color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.85rem" }}>
            {L("Estrategia de costos", "Cost strategy")}
          </p>
          {[
            [L("No correr APIs caras al inicio", "Do not run expensive APIs at the start"), L("Usar demo/local scoring hasta que el expediente justifique costo.", "Use demo/local scoring until the file justifies the cost.")],
            [L("Activar por riesgo y monto", "Activate by risk and amount"), L("OCR, KYB externo o biometria solo por umbral.", "OCR, external KYB or biometrics only by threshold.")],
            [L("Guardar resultado reutilizable", "Store reusable output"), L("Cada corrida debe quedar versionada y auditable.", "Each run must be versioned and auditable.")],
          ].map(([title, detail]) => (
            <div key={title} style={{ borderLeft: `3px solid ${COLORS.gold}`, paddingLeft: "0.75rem", marginBottom: "0.75rem" }}>
              <strong style={{ display: "block", color: COLORS.white, fontSize: "0.84rem" }}>{title}</strong>
              <span style={{ color: "rgba(255,255,255,0.72)", fontSize: "0.76rem", lineHeight: 1.45 }}>{detail}</span>
            </div>
          ))}
        </article>

        <article style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1rem", boxShadow: COLORS.shadowSm }}>
          <p style={{ color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.85rem" }}>
            {L("Alineacion con fases", "Phase alignment")}
          </p>
          <div style={{ display: "grid", gap: "0.65rem" }}>
            {phaseRows.map(([phase, es, en, status]) => (
              <div key={phase} style={{ display: "grid", gridTemplateColumns: "68px 1fr", gap: "0.65rem", alignItems: "start", padding: "0.7rem", background: COLORS.bg, borderRadius: "8px" }}>
                <strong style={{ color: COLORS.navy, fontSize: "0.78rem" }}>{phase}</strong>
                <span>
                  <strong style={{ display: "block", color: COLORS.navy, fontSize: "0.82rem" }}>{L(es, en)}</strong>
                  <span style={{ color: COLORS.textMuted, fontSize: "0.74rem", lineHeight: 1.4 }}>{status}</span>
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
