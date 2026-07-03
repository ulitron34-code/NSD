import { error, debug, info, warn } from '../../utils/logger';
import React from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../utils/constants";
import { uiText, translateCopy } from "../../utils/runtimeCopy";

const pilotTimeline = [
  ["Semana 1", "Setup", "Configurar perfiles, cargar matriz documental, seleccionar 10 expedientes y definir responsables."],
  ["Semana 2", "Carga y revision", "Solicitantes suben evidencia; NEXUS ejecuta checklist, IA, score y plan de subsanacion."],
  ["Semana 3", "Otorgante", "La entidad revisa data rooms, pide informacion y registra interes o descarte razonado."],
  ["Semana 4", "Cierre", "Medir tiempos, faltantes, conversion, friccion, satisfaccion y posibles ingresos."],
];

const successMetrics = [
  ["Tiempo de primera revision", "Meta: -40%", "Reducir dias entre expediente recibido y primera lectura util."],
  ["Faltantes detectados", "Meta: 90%+", "Detectar requisitos criticos antes de enviar al otorgante."],
  ["Interes institucional", "Meta: 20%", "Medir cuantos expedientes generan interes o solicitud adicional."],
  ["Ingresos piloto", "Meta: 1-3 tickets", "Validar fee por expediente o servicios NEXUS pagados."],
  ["Retencion de entidad", "Meta: 1 renovacion", "Lograr que el otorgante quiera procesar otro lote."],
];

const pilotRoles = [
  ["Solicitante", "Carga proyecto, documentos, uso de fondos y responde requerimientos."],
  ["NEXUS", "Estructura expediente, revisa con IA, genera score, memo y plan de subsanacion."],
  ["Otorgante", "Revisa data room, solicita informacion, registra interes y retroalimenta criterios."],
  ["Admin", "Controla trazabilidad, metricas, actividad, conversion y aprendizajes del piloto."],
];

const deliverables = [
  ["Reporte de piloto", "Metricas, tiempos, hallazgos, fricciones y decisiones."],
  ["Matriz refinada", "Requisitos ajustados por sector, monto, entidad y producto financiero."],
  ["Casos de uso", "Historias concretas de solicitante y otorgante para pitch."],
  ["Pricing learning", "Validacion de SaaS, fee por expediente y servicios profesionales."],
];

export default function PilotPlaybookTab() {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);
  const copy = (val) => translateCopy(val, i18n.language);

  return (
    <div>
      <section style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "14px", padding: "1.6rem", marginBottom: "1.5rem", boxShadow: COLORS.shadowSm }}>
        <p style={{ color: COLORS.gold, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 900, fontSize: "0.75rem", marginBottom: "0.5rem" }}>
          {L("Pilot playbook", "Pilot Playbook")}
        </p>
        <h1 style={{ color: COLORS.navy, fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem, 4vw, 2.8rem)", lineHeight: 1.1, marginBottom: "0.75rem" }}>
          {L("Un piloto de 30 dias para convertir la demo en evidencia.", "A 30-day pilot to turn the demo into evidence.")}
        </h1>
        <p style={{ color: COLORS.textMuted, maxWidth: "900px", lineHeight: 1.7 }}>
          {L("Esta vista define como validar NEXUS con una entidad financiera o aliado: participantes, calendario, metricas, entregables y criterios de exito.", "This view defines how to validate NEXUS with a financial institution or partner: participants, timeline, metrics, deliverables and success criteria.")}
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          ["Duracion", "30 dias", "Suficiente para procesar un lote controlado."],
          ["Lote inicial", "10 expedientes", "Casos reales o semi-reales con permiso de uso."],
          ["Entidad objetivo", "SOFOM / fintech / fondo", "Quien sufra friccion documental en primera revision."],
          ["Resultado", "Reporte + renovacion", "Aprendizajes, metrica y siguiente lote."],
        ].map(([label, value, detail]) => (
          <article key={label} style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.15rem", boxShadow: COLORS.shadowSm }}>
            <p style={{ color: COLORS.textMuted, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 900, marginBottom: "0.35rem" }}>{copy(label)}</p>
            <p style={{ color: COLORS.navy, fontSize: "1.65rem", fontWeight: 900, marginBottom: "0.35rem" }}>{copy(value)}</p>
            <p style={{ color: COLORS.textMuted, fontSize: "0.78rem", lineHeight: 1.45 }}>{copy(detail)}</p>
          </article>
        ))}
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 0.9fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.25rem", boxShadow: COLORS.shadowSm }}>
          <h2 style={{ color: COLORS.navy, fontSize: "1.18rem", marginBottom: "1rem" }}>{L("Calendario de piloto", "Pilot Timeline")}</h2>
          <div style={{ display: "grid", gap: "0.65rem" }}>
            {pilotTimeline.map(([week, title, detail]) => (
              <div key={week} style={{ display: "grid", gridTemplateColumns: "92px 1fr", gap: "0.75rem", padding: "0.85rem", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: "8px" }}>
                <strong style={{ color: COLORS.gold, fontSize: "0.82rem" }}>{copy(week)}</strong>
                <span>
                  <strong style={{ color: COLORS.navy, display: "block", fontSize: "0.88rem" }}>{copy(title)}</strong>
                  <span style={{ color: COLORS.textMuted, fontSize: "0.78rem", lineHeight: 1.45 }}>{copy(detail)}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.25rem", boxShadow: COLORS.shadowSm }}>
          <h2 style={{ color: COLORS.navy, fontSize: "1.18rem", marginBottom: "1rem" }}>{L("Roles del piloto", "Pilot Roles")}</h2>
          {pilotRoles.map(([role, detail]) => (
            <div key={role} style={{ borderBottom: `1px solid ${COLORS.border}`, padding: "0.75rem 0" }}>
              <strong style={{ color: COLORS.navy, fontSize: "0.86rem" }}>{copy(role)}</strong>
              <p style={{ color: COLORS.textMuted, fontSize: "0.78rem", lineHeight: 1.45, marginTop: "0.25rem" }}>{copy(detail)}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(300px, 0.85fr)", gap: "1rem" }}>
        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.25rem", boxShadow: COLORS.shadowSm }}>
          <h2 style={{ color: COLORS.navy, fontSize: "1.18rem", marginBottom: "1rem" }}>{L("Metricas de exito", "Success Metrics")}</h2>
          <div style={{ display: "grid", gap: "0.65rem" }}>
            {successMetrics.map(([metric, target, detail]) => (
              <div key={metric} style={{ padding: "0.85rem", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.7rem", marginBottom: "0.25rem" }}>
                  <strong style={{ color: COLORS.navy, fontSize: "0.84rem" }}>{copy(metric)}</strong>
                  <span style={{ color: COLORS.green, fontWeight: 900, fontSize: "0.78rem" }}>{copy(target)}</span>
                </div>
                <p style={{ color: COLORS.textMuted, fontSize: "0.76rem", lineHeight: 1.45 }}>{copy(detail)}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.25rem", boxShadow: COLORS.shadowSm }}>
          <h2 style={{ color: COLORS.navy, fontSize: "1.18rem", marginBottom: "1rem" }}>{L("Entregables", "Deliverables")}</h2>
          {deliverables.map(([title, detail]) => (
            <div key={title} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.85rem", marginBottom: "0.65rem" }}>
              <strong style={{ color: COLORS.navy, fontSize: "0.84rem" }}>{copy(title)}</strong>
              <p style={{ color: COLORS.textMuted, fontSize: "0.76rem", lineHeight: 1.45, marginTop: "0.25rem" }}>{copy(detail)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
