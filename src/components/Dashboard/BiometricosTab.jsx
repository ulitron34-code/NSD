import React from "react";
import { COLORS } from "../../utils/constants";
import { useNotification } from "../../hooks/useNotification";

export default function BiometricosTab() {
  const { addNotification } = useNotification();

  const checks = [
    ["Rostro", "Prueba de vida, comparacion contra ID oficial y deteccion de manipulacion."],
    ["Huella digital", "Validacion opcional para operaciones sensibles o expedientes de mayor riesgo."],
    ["Dispositivo", "Senales de riesgo por dispositivo, ubicacion, IP y comportamiento de sesion."],
    ["Consentimiento", "Registro auditable de aceptacion, finalidad, vigencia y revocacion."],
  ];

  const rolloutGates = [
    ["Piloto", "25 expedientes/mes", "Solo liveness + face match cuando el expediente lo justifique."],
    ["Operacion inicial", "100 expedientes/mes", "Proveedor IDV/KYC con evidencia, soporte y costos por expediente controlados."],
    ["Escalamiento", "500 expedientes/mes", "SLA, auditoria, retencion definida y gobierno formal de datos biometricos."],
  ];

  return (
    <div>
      <div style={{ marginBottom: "2rem", borderBottom: `1px solid ${COLORS.border}`, paddingBottom: "1.5rem" }}>
        <p style={{ color: COLORS.gold, fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 800, marginBottom: "0.5rem" }}>
          Identidad digital / Proximamente
        </p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.navy, fontSize: "2.2rem", fontWeight: 600, marginBottom: "0.5rem" }}>
          Biometricos y antifraude
        </h1>
        <p style={{ color: COLORS.textMuted, maxWidth: "860px", fontWeight: 300, fontSize: "0.95rem", lineHeight: 1.75 }}>
          Modulo preparado para verificacion facial, huella digital, prueba de vida y senales antifraude. Su funcion sera elevar la certeza de identidad del solicitante y dejar evidencia auditable para entidades financieras.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.15fr) minmax(300px, 0.85fr)", gap: "1.5rem", alignItems: "start" }}>
        <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.5rem", boxShadow: COLORS.shadowSm }}>
          <h2 style={{ color: COLORS.navy, fontSize: "1.25rem", marginBottom: "1rem" }}>Flujo propuesto</h2>
          <div style={{ display: "grid", gap: "0.9rem" }}>
            {checks.map(([title, desc], index) => (
              <div key={title} style={{ display: "grid", gridTemplateColumns: "42px 1fr", gap: "0.9rem", alignItems: "start" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(201,168,76,0.16)", color: COLORS.gold, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>
                  {index + 1}
                </div>
                <div>
                  <p style={{ color: COLORS.navy, fontWeight: 800, marginBottom: "0.25rem" }}>{title}</p>
                  <p style={{ color: COLORS.textMuted, fontSize: "0.9rem", lineHeight: 1.6 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside style={{ background: "linear-gradient(135deg, #0F1F2E, #2A527A)", color: COLORS.white, borderRadius: "10px", padding: "1.5rem", boxShadow: "0 16px 36px rgba(15,31,46,0.22)" }}>
          <p style={{ color: COLORS.gold, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 800, marginBottom: "0.75rem" }}>
            Estado del modulo
          </p>
          <h3 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>Listo para conectar proveedor</h3>
          <p style={{ color: "rgba(255,255,255,0.76)", lineHeight: 1.7, fontSize: "0.9rem", marginBottom: "1.25rem" }}>
            Recomendacion: integrar un proveedor especializado de biometria con prueba de vida, consentimiento, cifrado y bitacora. La plataforma debe guardar resultados y evidencias, no datos biometricos crudos salvo que legalmente proceda.
          </p>
          <button onClick={() => addNotification("Demo de biometricos registrada en roadmap.", "success")} style={{ width: "100%", padding: "0.85rem", borderRadius: "6px", border: "none", background: COLORS.gold, color: COLORS.navy, fontWeight: 900, cursor: "pointer" }}>
            Activar demo de biometricos
          </button>
        </aside>
      </div>

      <div style={{ marginTop: "1.5rem", background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.5rem", boxShadow: COLORS.shadowSm }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <div>
            <p style={{ color: COLORS.gold, fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 800 }}>
              Control de costos / Fase 17
            </p>
            <h2 style={{ color: COLORS.navy, fontSize: "1.25rem" }}>Activacion progresiva por riesgo y volumen</h2>
          </div>
          <span style={{ color: COLORS.textMuted, fontSize: "0.82rem", maxWidth: "360px", lineHeight: 1.5 }}>
            Recomendacion: no guardar datos biometricos crudos salvo validacion legal; guardar resultado, proveedor, fecha, consentimiento y evidencia minima.
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.85rem" }}>
          {rolloutGates.map(([stage, volume, policy]) => (
            <div key={stage} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "1rem" }}>
              <p style={{ color: COLORS.navy, fontWeight: 900, marginBottom: "0.25rem" }}>{stage}</p>
              <p style={{ color: COLORS.gold, fontWeight: 800, fontSize: "0.86rem", marginBottom: "0.5rem" }}>{volume}</p>
              <p style={{ color: COLORS.textMuted, lineHeight: 1.55, fontSize: "0.88rem" }}>{policy}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
