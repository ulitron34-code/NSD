import { error, debug, info, warn } from '../../../utils/logger';
import React, { useState } from "react";
import { COLORS } from "../../../utils/constants";
import { softCardStyle } from "../../../utils/visualStyle";
import { useNotification } from "../../../hooks/useNotification";
import { useTranslation } from "react-i18next";
import { translateCopy, uiText } from "../../../utils/runtimeCopy";
import { BRAND } from "../../../config/brand";
import { useRequisitosMinimos } from "../../../hooks/useRequisitosMinimos";
import { DEMO_EXPEDIENTE_ID, pickLang } from "../../../data/requisitosMinimos";

export default function MiPerfilTab() {
  const { addNotification } = useNotification();
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);
  const copy = (value) => translateCopy(value, i18n.language);
  const requisitos = useRequisitosMinimos(DEMO_EXPEDIENTE_ID);
  const [selectedDoc, setSelectedDoc] = useState("Acta Constitutiva");
  const [aiReview, setAiReview] = useState(null);

  const documents = [
    { name: "Acta Constitutiva", status: "Subido", icon: "DOC" },
    { name: "Identidad Rep. Legal", status: "Aprobado", icon: "ID" },
    { name: "Constancia Situacion Fiscal", status: "Subido", icon: "SAT" },
    { name: "Comprobante de Domicilio", status: "Pendiente", icon: "DOM" },
  ];

  const readinessPlan = [
    ["Identidad y KYB", "92%", "Completar vigencia de domicilio y beneficiario controlador."],
    ["Financiero", "84%", "Agregar escenario conservador y conciliacion de deuda."],
    ["Fiscal", "88%", "Validar constancia fiscal y opinion de cumplimiento."],
    ["Data room", "76%", "Ordenar documentos por carpeta y version."],
  ];

  const remediationSteps = [
    "Subir comprobante de domicilio vigente.",
    "Agregar uso de fondos detallado por partida.",
    "Confirmar beneficiarios/control y autorizaciones.",
    "Ejecutar revision IA final antes de compartir con otorgantes.",
  ];

  const readinessGrade = {
    grade: "B+",
    label: "Compartible con condiciones",
    detail: `El expediente puede avanzar a prevalidacion ${BRAND.name}, pero conviene cerrar documentos bloqueantes antes de abrirlo a otorgantes.`
  };

  const sharePackage = [
    ["Resumen ejecutivo", "Listo", "Tesis, uso de fondos y monto objetivo."],
    ["Data room", "Subsanable", "Falta domicilio vigente y version final de soporte fiscal."],
    ["Revision IA", aiReview ? "Ejecutada" : "Pendiente", aiReview ? "Hallazgos disponibles para subsanacion." : "Ejecutar antes de compartir."],
    ["Consentimiento", "Pendiente", "Autorizar finalidad, otorgantes y vigencia de acceso."],
  ];

  const handleUpload = () => {
    addNotification(L("Documento subido a revisión con éxito.", "Document uploaded for review successfully."), "success");
  };

  const runAiReview = (scope = selectedDoc) => {
    setAiReview({
      scope,
      score: scope === "Expediente completo" ? 88 : scope === "Comprobante de Domicilio" ? 62 : 84,
      findings: [
        "Requisitos base detectados para bancos, SOFOMES, fondos y fintechs.",
        "Validacion preliminar de vigencia, consistencia fiscal, beneficiario/control y antifraude documental.",
        scope === "Comprobante de Domicilio" ? "Documento pendiente: completar antes de enviar a otorgantes." : "Documento utilizable para revision inicial; falta cotejo con fuente oficial.",
      ],
    });
    addNotification(`${L("Revisión IA completada para", "AI review completed for")} ${copy(scope)}`, "success");
  };

  return (
    <div>
      <div style={{ marginBottom: "2rem", borderBottom: `1px solid ${COLORS.border}`, paddingBottom: "1.5rem" }}>
        <p style={{ color: COLORS.gold, fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem" }}>
          {L("Solicitantes / Preparación financiera", "Applicants / Financial Readiness")}
        </p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.navy, fontSize: "2.2rem", fontWeight: 600, marginBottom: "0.5rem" }}>
          {L("Mi Perfil Financiero", "My Financial Profile")}
        </h1>
        <p style={{ color: COLORS.textMuted, maxWidth: "820px", fontWeight: 300, fontSize: "0.95rem" }}>
          {L("Gestiona tu expediente antes de solicitar fondeo. La plataforma revisa documentos y requisitos para que llegues mejor preparado ante bancos, SOFOMES, fondos o fintechs.", "Manage your file before requesting funding. The platform reviews documents and requirements so you arrive better prepared before banks, SOFOMs, funds or fintechs.")}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ ...softCardStyle, padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.1rem", color: COLORS.navy, marginBottom: "1rem" }}>{BRAND.name} Readiness Score</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: COLORS.greenBg, color: COLORS.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: 700 }}>
              85
            </div>
            <div>
              <p style={{ color: COLORS.text, fontWeight: 600, marginBottom: "0.25rem" }}>{L("Perfil competitivo", "Competitive Profile")}</p>
              <p style={{ color: COLORS.textMuted, fontSize: "0.85rem" }}>{L("Apto para revisión inicial de instituciones financieras con faltantes menores.", "Suitable for initial financial institution review with minor gaps.")}</p>
            </div>
          </div>
        </div>

        <div style={{ ...softCardStyle, padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.1rem", color: COLORS.navy, marginBottom: "1rem" }}>KYC / AML / Antifraude</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
            <span style={{ background: COLORS.greenBg, color: COLORS.green, padding: "0.2rem 0.6rem", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 600 }}>{L("Aprobado", "Approved")}</span>
            <span style={{ color: COLORS.textMuted, fontSize: "0.9rem" }}>{L("Biometría facial completada", "Face biometric verification completed")}</span>
          </div>
          <p style={{ color: COLORS.textMuted, fontSize: "0.85rem" }}>{L("Listas restrictivas y señales de fraude:", "Watchlists and fraud signals:")} <strong style={{ color: COLORS.green }}>{L("sin incidencias críticas", "no critical findings")}</strong></p>
        </div>
      </div>

      <div style={{ background: "linear-gradient(135deg, rgba(15,31,46,0.04), rgba(201,168,76,0.12))", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.25rem", marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <p style={{ color: COLORS.gold, fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 800, marginBottom: "0.35rem" }}>
              {L("Agentes IA para solicitantes", "AI Agents for Applicants")}
            </p>
            <h2 style={{ color: COLORS.navy, fontSize: "1.15rem", marginBottom: "0.35rem" }}>
              {L("Preparación inteligente antes de enviar a una entidad financiera", "Intelligent Readiness Before Submitting to a Financial Institution")}
            </h2>
            <p style={{ color: COLORS.textMuted, fontSize: "0.9rem", maxWidth: "760px", lineHeight: 1.65 }}>
              {L("Revisa faltantes, vigencias, consistencia antifraude, KYC/KYB y requisitos por tipo de otorgante para reducir ciclos de ida y vuelta.", "Review gaps, expirations, anti-fraud consistency, KYC/KYB and requirements by funder type to reduce back-and-forth cycles.")}
            </p>
          </div>
          <button onClick={() => runAiReview("Expediente completo")} style={{ background: COLORS.navy, color: COLORS.white, border: "none", borderRadius: "6px", padding: "0.8rem 1rem", fontWeight: 800, cursor: "pointer" }}>
            {L("Revisar expediente con IA", "Review File with AI")}
          </button>
        </div>
        {aiReview && (
          <div style={{ ...softCardStyle, marginTop: "1rem", padding: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginBottom: "0.65rem" }}>
              <strong style={{ color: COLORS.navy }}>{L("Resultado preliminar:", "Preliminary Result:")} {copy(aiReview.scope)}</strong>
              <span style={{ color: aiReview.score >= 80 ? COLORS.green : COLORS.amber, fontWeight: 900 }}>{aiReview.score}/100</span>
            </div>
            {aiReview.findings.map((finding) => (
              <p key={finding} style={{ color: COLORS.textMuted, fontSize: "0.86rem", lineHeight: 1.55, marginBottom: "0.25rem" }}>- {copy(finding)}</p>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 0.6fr) minmax(0, 1.4fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ background: COLORS.navy, color: COLORS.white, borderRadius: "10px", padding: "1.25rem", boxShadow: COLORS.shadowSm }}>
          <p style={{ color: COLORS.gold, fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 900, marginBottom: "0.35rem" }}>
            {L("Semáforo A-E", "A-E Readiness Grade")}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.8rem" }}>
            <span style={{ width: "72px", height: "72px", borderRadius: "50%", background: COLORS.gold, color: COLORS.navy, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", fontWeight: 900 }}>
              {readinessGrade.grade}
            </span>
            <div>
              <h2 style={{ color: COLORS.white, fontSize: "1.1rem", marginBottom: "0.25rem" }}>{copy(readinessGrade.label)}</h2>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.82rem", lineHeight: 1.45 }}>{copy(readinessGrade.detail)}</p>
            </div>
          </div>
          <button
            disabled={!requisitos.listoParaEnviar}
            onClick={() => addNotification(L(`Paquete enviado a prevalidación ${BRAND.name}`, `Package sent to ${BRAND.name} pre-validation`), "success")}
            style={{
              width: "100%", padding: "0.75rem", border: "none", borderRadius: "6px", fontWeight: 900,
              background: requisitos.listoParaEnviar ? COLORS.gold : "rgba(255,255,255,0.15)",
              color: requisitos.listoParaEnviar ? COLORS.navy : "rgba(255,255,255,0.5)",
              cursor: requisitos.listoParaEnviar ? "pointer" : "not-allowed",
            }}
          >
            {L(`Enviar a prevalidación ${BRAND.name}`, `Send to ${BRAND.name} Pre-Validation`)}
          </button>
          {!requisitos.listoParaEnviar && (
            <p style={{ color: "#F5B7B7", fontSize: "0.76rem", lineHeight: 1.45, marginTop: "0.6rem", marginBottom: 0 }}>
              {L("Faltan requisitos críticos en Preparación:", "Missing critical requirements in Readiness:")}{" "}
              {requisitos.criticosPendientes.map((item) => pickLang(item.label, i18n.language)).join(", ")}
            </p>
          )}
        </div>

        <div style={{ ...softCardStyle, padding: "1.25rem" }}>
          <p style={{ color: COLORS.textMuted, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>
            {L("Paquete para compartir con otorgantes", "Package to Share with Funding Providers")}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "0.75rem" }}>
            {sharePackage.map(([label, status, detail]) => (
              <div key={label} style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "0.85rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.3rem" }}>
                  <strong style={{ color: COLORS.navy, fontSize: "0.82rem" }}>{copy(label)}</strong>
                  <span style={{ color: status === "Listo" || status === "Ejecutada" ? COLORS.green : COLORS.amber, fontWeight: 900, fontSize: "0.7rem" }}>{copy(status)}</span>
                </div>
                <p style={{ color: COLORS.textMuted, fontSize: "0.76rem", lineHeight: 1.4 }}>{copy(detail)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", color: COLORS.navy, fontWeight: 500, marginBottom: "1rem" }}>
        {L("Expediente Documental", "Document File")}
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 0.8fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ ...softCardStyle, padding: "1.25rem" }}>
          <p style={{ color: COLORS.textMuted, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>
            {L("Brechas antes de compartir", "Gaps Before Sharing")}
          </p>
          <div style={{ display: "grid", gap: "0.7rem" }}>
            {readinessPlan.map(([label, score, detail]) => (
              <div key={label} style={{ display: "grid", gridTemplateColumns: "110px 54px 1fr", gap: "0.75rem", alignItems: "center", padding: "0.65rem", borderRadius: "7px", background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                <strong style={{ color: COLORS.navy, fontSize: "0.82rem" }}>{copy(label)}</strong>
                <span style={{ color: Number(score.replace("%", "")) >= 85 ? COLORS.green : COLORS.amber, fontWeight: 900 }}>{score}</span>
                <span style={{ color: COLORS.textMuted, fontSize: "0.78rem", lineHeight: 1.4 }}>{copy(detail)}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...softCardStyle, padding: "1.25rem" }}>
          <p style={{ color: COLORS.textMuted, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>
            {L("Plan de subsanación", "Remediation Plan")}
          </p>
          <div style={{ display: "grid", gap: "0.6rem" }}>
            {remediationSteps.map((step, index) => (
              <div key={step} style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: "0.6rem", alignItems: "start" }}>
                <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: COLORS.gold, color: COLORS.navy, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 900 }}>{index + 1}</span>
                <p style={{ color: COLORS.textMuted, fontSize: "0.82rem", lineHeight: 1.45 }}>{copy(step)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ ...softCardStyle, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: COLORS.bgSubtle, borderBottom: `1px solid ${COLORS.border}` }}>
            <tr>
              <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.75rem", color: COLORS.textMuted, textTransform: "uppercase" }}>{L("Documento", "Document")}</th>
              <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.75rem", color: COLORS.textMuted, textTransform: "uppercase" }}>{L("Estatus", "Status")}</th>
              <th style={{ padding: "1rem", textAlign: "right", fontSize: "0.75rem", color: COLORS.textMuted, textTransform: "uppercase" }}>{L("Acción", "Action")}</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.name} onClick={() => setSelectedDoc(doc.name)} style={{ borderBottom: `1px solid ${COLORS.border}`, background: selectedDoc === doc.name ? "rgba(201,168,76,0.08)" : "transparent", cursor: "pointer" }}>
                <td style={{ padding: "1.25rem 1rem", color: COLORS.navy, fontWeight: 500 }}>
                  <span style={{ marginRight: "0.5rem", color: COLORS.gold, fontSize: "0.75rem", fontWeight: 800 }}>{doc.icon}</span> {copy(doc.name)}
                </td>
                <td style={{ padding: "1.25rem 1rem" }}>
                  <span style={{
                    padding: "0.3rem 0.6rem",
                    borderRadius: "4px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    background: doc.status === "Aprobado" ? COLORS.greenBg : doc.status === "Subido" ? "rgba(201,168,76,0.15)" : COLORS.bgSubtle,
                    color: doc.status === "Aprobado" ? COLORS.green : doc.status === "Subido" ? COLORS.gold : COLORS.textMuted,
                  }}>
                    {copy(doc.status)}
                  </span>
                </td>
                <td style={{ padding: "1.25rem 1rem", textAlign: "right" }}>
                  {doc.status === "Pendiente" ? (
                    <button onClick={(event) => { event.stopPropagation(); handleUpload(); }} style={{ background: COLORS.navy, color: "white", border: "none", padding: "0.4rem 0.8rem", borderRadius: "4px", fontSize: "0.8rem", cursor: "pointer" }}>{L("Subir", "Upload")}</button>
                  ) : (
                    <button onClick={(event) => { event.stopPropagation(); setSelectedDoc(doc.name); runAiReview(doc.name); }} style={{ background: "transparent", color: COLORS.navy, border: `1px solid ${COLORS.border}`, padding: "0.4rem 0.8rem", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}>{L("Revisar IA", "AI Review")}</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
