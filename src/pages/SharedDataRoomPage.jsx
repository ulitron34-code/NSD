import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { sharesAPI } from "../services/api";
import { COLORS } from "../utils/constants";
import { formatDocumentStatus, formatDocumentType, formatReadinessGrade } from "../utils/institutional";
import { BRAND } from "../config/brand";

function copyByLanguage(isEnglish, es, en) {
  return isEnglish ? en : es;
}

function getServiceLabels(t) {
  return {
    "combo-complete": t("Paquete Completo", "Complete Package"),
    "financial-analysis": t("Análisis Financiero", "Financial Analysis"),
    "business-plan": t("Business Plan Profesional", "Professional Business Plan"),
    "pitch-deck": t("Presentación Ejecutiva", "Executive Presentation"),
  };
}

function getDataRoomFolders(t) {
  return {
    identidad_kyc: t("01 Identidad y KYC", "01 Identity and KYC"),
    corporativo_legal: t("02 Corporativo legal", "02 Corporate legal"),
    financiero: t("03 Información financiera", "03 Financial information"),
    fiscal: t("04 Fiscal y cumplimiento", "04 Tax and compliance"),
    proyecto: t("05 Proyecto y uso de fondos", "05 Project and use of funds"),
    garantias: t("06 Garantías", "06 Guarantees and collateral"),
    otro: t("99 Otros documentos", "99 Other documents"),
  };
}

function groupDocuments(documents = [], folders) {
  return documents.reduce((groups, document) => {
    const type = document.document_type || "otro";
    const folder = folders[type] || folders.otro;
    groups[folder] = groups[folder] || [];
    groups[folder].push(document);
    return groups;
  }, {});
}

function getGradeColor(grade) {
  return {
    A: COLORS.green,
    B: COLORS.navy,
    C: COLORS.amber,
    D: "#C62828",
    E: "#8A1C1C",
  }[String(grade || "").toUpperCase()] || COLORS.textMuted;
}

export default function SharedDataRoomPage() {
  const { token } = useParams();
  const { i18n } = useTranslation();
  const isEnglish = i18n.language?.startsWith("en");
  const t = (es, en) => copyByLanguage(isEnglish, es, en);
  const dateLocale = isEnglish ? "en-US" : "es-MX";
  const serviceLabels = getServiceLabels(t);
  const dataRoomFolders = getDataRoomFolders(t);
  const [dataRoom, setDataRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReview, setSelectedReview] = useState(null);

  useEffect(() => {
    async function loadSharedDataRoom() {
      try {
        const { data } = await sharesAPI.getSharedDataRoom(token);
        setDataRoom(data);
        setSelectedReview(data.reviews?.[0] || null);
      } catch (err) {
        setError(err.response?.data?.error || t("No se pudo abrir el data room", "The data room could not be opened"));
      } finally {
        setLoading(false);
      }
    }

    loadSharedDataRoom();
  }, [token]);

  if (loading) {
    return <div style={{ padding: "5rem 2rem", textAlign: "center" }}>{t("Cargando data room...", "Loading data room...")}</div>;
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: COLORS.bg, padding: "5rem 2rem", textAlign: "center" }}>
        <h1 style={{ color: COLORS.navy, marginBottom: "0.75rem" }}>{t("Acceso no disponible", "Access unavailable")}</h1>
        <p style={{ color: COLORS.textMuted }}>{error}</p>
      </div>
    );
  }

  const { share, order, documents, reviews, scoring, publishability } = dataRoom;
  const amountValue = Number(order.requested_amount || order.amount || 0).toLocaleString(dateLocale);
  const groupedDocuments = groupDocuments(documents, dataRoomFolders);

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg }}>
      <section style={{
        background: `linear-gradient(135deg, ${COLORS.navy} 0%, ${COLORS.navyLight} 100%)`,
        color: "white",
        padding: "4rem 2rem",
      }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <p style={{ color: COLORS.goldLight, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", fontSize: "0.78rem", marginBottom: "0.75rem" }}>
            {BRAND.name} {t("Data Room Compartido", "Shared Data Room")}
          </p>
          <h1 style={{ fontSize: "2.4rem", marginBottom: "0.75rem" }}>
            {t("Expediente para revisión de otorgante", "File prepared for funder review")}
          </h1>
          <p style={{ opacity: 0.86, lineHeight: 1.7, maxWidth: "760px" }}>
            {t("Acceso controlado para revisar documentos, estado del expediente y revisiones IA preliminares.", "Controlled access to review documents, file status and preliminary AI reviews.")}
          </p>
        </div>
      </section>

      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}>
          {[
            [t("Expediente", "File"), order.case_number || `NUX-${String(order.id).slice(0, 8).toUpperCase()}`],
            [t("Proyecto", "Project"), order.project_name || order.metadata?.projectName || serviceLabels[order.service_type] || order.service_type],
            [t("Preparación", "Readiness"), formatReadinessGrade(order.readiness_grade || order.metadata?.readinessGrade || "pendiente")],
            [t("Monto", "Amount"), `$${amountValue} USD`],
            [t("Otorgante", "Funder"), share.recipient_name],
          ].map(([label, value]) => (
            <div key={label} style={{
              background: "white",
              border: `1px solid ${COLORS.border}`,
              borderRadius: "8px",
              padding: "1.2rem",
            }}>
              <p style={{ color: COLORS.textMuted, fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 800, marginBottom: "0.35rem" }}>
                {label}
              </p>
              <p style={{ color: COLORS.navy, fontWeight: 900 }}>{value}</p>
            </div>
          ))}
        </div>

        {scoring && (
          <section style={{
            background: "white",
            border: `1px solid ${COLORS.border}`,
            borderRadius: "8px",
            padding: "1.5rem",
            marginBottom: "2rem",
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "92px 1fr", gap: "1rem", alignItems: "center" }}>
              <div style={{
                width: "78px",
                height: "78px",
                borderRadius: "50%",
                border: `5px solid ${getGradeColor(scoring.readinessGrade?.grade)}`,
                color: getGradeColor(scoring.readinessGrade?.grade),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "1.4rem",
                background: COLORS.bg,
              }}>
                {scoring.readinessGrade?.grade || "N/A"}
              </div>
              <div>
                <p style={{ color: COLORS.textMuted, fontSize: "0.76rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "0.25rem" }}>
                  {t("Resumen institucional", "Institutional summary")} {BRAND.name}
                </p>
                <h2 style={{ color: COLORS.navy, fontSize: "1.25rem", marginBottom: "0.35rem" }}>
                  {scoring.readinessGrade?.label || t("Preparación pendiente", "Readiness pending")}
                </h2>
                <p style={{ color: COLORS.textMuted, lineHeight: 1.55, marginBottom: "0.75rem" }}>
                  {scoring.readinessGrade?.explanation || scoring.recommendation?.reason}
                </p>
                <div style={{ display: "flex", gap: "0.55rem", flexWrap: "wrap" }}>
                  <span style={{ padding: "0.28rem 0.55rem", borderRadius: "999px", background: "rgba(27,58,92,0.08)", color: COLORS.navy, fontSize: "0.76rem", fontWeight: 900 }}>
                    Score {scoring.finalScore || 0}/100
                  </span>
                  <span style={{ padding: "0.28rem 0.55rem", borderRadius: "999px", background: publishability?.canPublish ? "rgba(46,125,50,0.08)" : "rgba(198,40,40,0.08)", color: publishability?.canPublish ? COLORS.green : "#C62828", fontSize: "0.76rem", fontWeight: 900 }}>
                    {publishability?.canPublish ? t("Presentable", "Presentable") : t("Con bloqueos", "Blocked")}
                  </span>
                  <span style={{ padding: "0.28rem 0.55rem", borderRadius: "999px", background: "rgba(201,168,76,0.14)", color: COLORS.gold, fontSize: "0.76rem", fontWeight: 900 }}>
                    {scoring.summary?.missingMandatory || 0} {t("faltantes obligatorios", "mandatory gaps")}
                  </span>
                  <span style={{ padding: "0.28rem 0.55rem", borderRadius: "999px", background: "rgba(0,0,0,0.04)", color: COLORS.textMuted, fontSize: "0.76rem", fontWeight: 900 }}>
                    {scoring.summary?.reviewRisks || 0} {t("observaciones", "observations")}
                  </span>
                </div>
              </div>
            </div>

            {!!publishability?.blockers?.length && (
              <div style={{ marginTop: "1rem", display: "grid", gap: "0.35rem" }}>
                {publishability.blockers.slice(0, 4).map((item) => (
                  <p key={item} style={{ color: "#C62828", fontSize: "0.84rem", fontWeight: 800, lineHeight: 1.4 }}>
                    {t("Bloqueo", "Blocker")}: {item}
                  </p>
                ))}
              </div>
            )}
          </section>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(320px, 0.9fr)", gap: "1.5rem" }}>
          <section style={{ background: "white", border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "1.5rem" }}>
            <h2 style={{ color: COLORS.navy, marginBottom: "1rem" }}>{t("Documentos disponibles", "Available documents")}</h2>
            {documents.length === 0 ? (
              <p style={{ color: COLORS.textMuted }}>{t("No hay documentos en este data room.", "There are no documents in this data room.")}</p>
            ) : (
              <div style={{ display: "grid", gap: "1rem" }}>
                {Object.entries(groupedDocuments).map(([folder, folderDocuments]) => (
                  <div key={folder} style={{ border: `1px solid ${COLORS.border}`, borderRadius: "8px", overflow: "hidden" }}>
                    <div style={{ background: COLORS.bg, padding: "0.8rem 1rem", borderBottom: `1px solid ${COLORS.border}` }}>
                      <p style={{ color: COLORS.navy, fontWeight: 900 }}>{folder}</p>
                      <p style={{ color: COLORS.textMuted, fontSize: "0.78rem" }}>{folderDocuments.length} {t("documento(s)", "document(s)")}</p>
                    </div>
                    <div style={{ display: "grid", gap: "0.75rem", padding: "0.9rem" }}>
                      {folderDocuments.map((document) => (
                        <div key={document.id} style={{
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: "8px",
                          padding: "1rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "1rem",
                        }}>
                          <div>
                            <p style={{ color: COLORS.navy, fontWeight: 900, marginBottom: "0.2rem" }}>{document.filename}</p>
                            <p style={{ color: COLORS.textMuted, fontSize: "0.8rem", marginBottom: "0.45rem" }}>
                              {new Date(document.uploaded_at).toLocaleString(dateLocale)}
                            </p>
                            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                              <span style={{ padding: "0.2rem 0.45rem", borderRadius: "999px", background: "rgba(27,58,92,0.08)", color: COLORS.navy, fontSize: "0.72rem", fontWeight: 800 }}>
                                {formatDocumentType(document.document_type)}
                              </span>
                              <span style={{ padding: "0.2rem 0.45rem", borderRadius: "999px", background: "rgba(201,168,76,0.14)", color: COLORS.gold, fontSize: "0.72rem", fontWeight: 800 }}>
                                {formatDocumentStatus(document.review_status)}
                              </span>
                              {document.is_blocking && (
                                <span style={{ padding: "0.2rem 0.45rem", borderRadius: "999px", background: "rgba(198,40,40,0.08)", color: "#C62828", fontSize: "0.72rem", fontWeight: 800 }}>
                                  {t("Bloqueante", "Blocking")}
                                </span>
                              )}
                              <span style={{ padding: "0.2rem 0.45rem", borderRadius: "999px", background: "rgba(0,0,0,0.04)", color: COLORS.textMuted, fontSize: "0.72rem", fontWeight: 800 }}>
                                V{document.version_number || 1}
                              </span>
                            </div>
                          </div>
                          <a
                            href={document.url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              padding: "0.65rem 0.9rem",
                              borderRadius: "6px",
                              background: COLORS.navy,
                              color: "white",
                              textDecoration: "none",
                              fontWeight: 800,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {t("Ver", "View")}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section style={{ background: "white", border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "1.5rem" }}>
            <h2 style={{ color: COLORS.navy, marginBottom: "1rem" }}>{t("Revisiones IA", "AI reviews")}</h2>
            {reviews.length === 0 ? (
              <p style={{ color: COLORS.textMuted }}>{t("Aún no hay revisiones IA guardadas.", "There are no saved AI reviews yet.")}</p>
            ) : (
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {reviews.map((review) => (
                  <button
                    key={review.id}
                    onClick={() => setSelectedReview(review)}
                    style={{
                      textAlign: "left",
                      padding: "0.9rem",
                      borderRadius: "8px",
                      border: `1px solid ${selectedReview?.id === review.id ? COLORS.gold : COLORS.border}`,
                      background: selectedReview?.id === review.id ? COLORS.goldPale : "white",
                      cursor: "pointer",
                    }}
                  >
                    <p style={{ color: COLORS.navy, fontWeight: 900 }}>{review.documents?.filename || t("Documento", "Document")}</p>
                    <p style={{ color: COLORS.gold, fontWeight: 900, marginTop: "0.25rem" }}>Score {review.score}</p>
                  </button>
                ))}
              </div>
            )}

            {selectedReview && (
              <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: `1px solid ${COLORS.border}` }}>
                <p style={{ color: COLORS.textMuted, fontSize: "0.82rem", lineHeight: 1.55, marginBottom: "0.75rem" }}>
                  {selectedReview.summary}
                </p>
                {(selectedReview.findings || []).map((finding, index) => (
                  <p key={index} style={{ color: COLORS.textMuted, fontSize: "0.82rem", lineHeight: 1.45, marginBottom: "0.25rem" }}>
                    - {finding}
                  </p>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
