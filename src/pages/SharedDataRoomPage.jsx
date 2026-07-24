import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { sharesAPI } from "../services/api";
import { COLORS } from "../utils/constants";
import { formatDocumentStatus, formatDocumentType, formatReadinessGrade } from "../utils/institutional";
import { BRAND } from "../config/brand";

const serviceLabels = {
  "combo-complete": "Paquete Completo",
  "financial-analysis": "Analisis Financiero",
  "business-plan": "Business Plan Profesional",
  "pitch-deck": "Presentacion Ejecutiva",
};

const dataRoomFolders = {
  identidad_kyc: "01 Identidad y KYC",
  corporativo_legal: "02 Corporativo legal",
  financiero: "03 Información financiera",
  fiscal: "04 Fiscal y cumplimiento",
  proyecto: "05 Proyecto y uso de fondos",
  garantias: "06 Garantías",
  otro: "99 Otros documentos",
};

function groupDocuments(documents = []) {
  return documents.reduce((groups, document) => {
    const type = document.document_type || "otro";
    const folder = dataRoomFolders[type] || dataRoomFolders.otro;
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
        setError(err.response?.data?.error || "No se pudo abrir el data room");
      } finally {
        setLoading(false);
      }
    }

    loadSharedDataRoom();
  }, [token]);

  if (loading) {
    return <div style={{ padding: "5rem 2rem", textAlign: "center" }}>Cargando data room...</div>;
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: COLORS.bg, padding: "5rem 2rem", textAlign: "center" }}>
        <h1 style={{ color: COLORS.navy, marginBottom: "0.75rem" }}>Acceso no disponible</h1>
        <p style={{ color: COLORS.textMuted }}>{error}</p>
      </div>
    );
  }

  const { share, order, documents, reviews, scoring, publishability } = dataRoom;
  const groupedDocuments = groupDocuments(documents);

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg }}>
      <section style={{
        background: `linear-gradient(135deg, ${COLORS.navy} 0%, ${COLORS.navyLight} 100%)`,
        color: "white",
        padding: "4rem 2rem",
      }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <p style={{ color: COLORS.goldLight, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", fontSize: "0.78rem", marginBottom: "0.75rem" }}>
            {BRAND.name} Data Room Compartido
          </p>
          <h1 style={{ fontSize: "2.4rem", marginBottom: "0.75rem" }}>
            Expediente para revision de otorgante
          </h1>
          <p style={{ opacity: 0.86, lineHeight: 1.7, maxWidth: "760px" }}>
            Acceso controlado para revisar documentos, estado del expediente y revisiones IA preliminares.
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
            ["Expediente", order.case_number || `NSD-${String(order.id).slice(0, 8).toUpperCase()}`],
            ["Proyecto", order.project_name || order.metadata?.projectName || serviceLabels[order.service_type] || order.service_type],
            ["Preparación", formatReadinessGrade(order.readiness_grade || order.metadata?.readinessGrade || "pendiente")],
            ["Monto", `$${Number(order.requested_amount || order.amount).toLocaleString()} USD`],
            ["Otorgante", share.recipient_name],
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
                {scoring.readinessGrade?.grade || "N/D"}
              </div>
              <div>
                <p style={{ color: COLORS.textMuted, fontSize: "0.76rem", fontWeight: 900, textTransform: "uppercase", marginBottom: "0.25rem" }}>
                  Resumen institucional {BRAND.name}
                </p>
                <h2 style={{ color: COLORS.navy, fontSize: "1.25rem", marginBottom: "0.35rem" }}>
                  {scoring.readinessGrade?.label || "Preparacion pendiente"}
                </h2>
                <p style={{ color: COLORS.textMuted, lineHeight: 1.55, marginBottom: "0.75rem" }}>
                  {scoring.readinessGrade?.explanation || scoring.recommendation?.reason}
                </p>
                <div style={{ display: "flex", gap: "0.55rem", flexWrap: "wrap" }}>
                  <span style={{ padding: "0.28rem 0.55rem", borderRadius: "999px", background: "rgba(27,58,92,0.08)", color: COLORS.navy, fontSize: "0.76rem", fontWeight: 900 }}>
                    Score {scoring.finalScore || 0}/100
                  </span>
                  <span style={{ padding: "0.28rem 0.55rem", borderRadius: "999px", background: publishability?.canPublish ? "rgba(46,125,50,0.08)" : "rgba(198,40,40,0.08)", color: publishability?.canPublish ? COLORS.green : "#C62828", fontSize: "0.76rem", fontWeight: 900 }}>
                    {publishability?.canPublish ? "Presentable" : "Con bloqueos"}
                  </span>
                  <span style={{ padding: "0.28rem 0.55rem", borderRadius: "999px", background: "rgba(201,168,76,0.14)", color: COLORS.gold, fontSize: "0.76rem", fontWeight: 900 }}>
                    {scoring.summary?.missingMandatory || 0} faltantes obligatorios
                  </span>
                  <span style={{ padding: "0.28rem 0.55rem", borderRadius: "999px", background: "rgba(0,0,0,0.04)", color: COLORS.textMuted, fontSize: "0.76rem", fontWeight: 900 }}>
                    {scoring.summary?.reviewRisks || 0} observaciones
                  </span>
                </div>
              </div>
            </div>

            {!!publishability?.blockers?.length && (
              <div style={{ marginTop: "1rem", display: "grid", gap: "0.35rem" }}>
                {publishability.blockers.slice(0, 4).map((item) => (
                  <p key={item} style={{ color: "#C62828", fontSize: "0.84rem", fontWeight: 800, lineHeight: 1.4 }}>
                    Bloqueo: {item}
                  </p>
                ))}
              </div>
            )}
          </section>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(320px, 0.9fr)", gap: "1.5rem" }}>
          <section style={{ background: "white", border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "1.5rem" }}>
            <h2 style={{ color: COLORS.navy, marginBottom: "1rem" }}>Documentos disponibles</h2>
            {documents.length === 0 ? (
              <p style={{ color: COLORS.textMuted }}>No hay documentos en este data room.</p>
            ) : (
              <div style={{ display: "grid", gap: "1rem" }}>
                {Object.entries(groupedDocuments).map(([folder, folderDocuments]) => (
                  <div key={folder} style={{ border: `1px solid ${COLORS.border}`, borderRadius: "8px", overflow: "hidden" }}>
                    <div style={{ background: COLORS.bg, padding: "0.8rem 1rem", borderBottom: `1px solid ${COLORS.border}` }}>
                      <p style={{ color: COLORS.navy, fontWeight: 900 }}>{folder}</p>
                      <p style={{ color: COLORS.textMuted, fontSize: "0.78rem" }}>{folderDocuments.length} documento(s)</p>
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
                              {new Date(document.uploaded_at).toLocaleString("es-MX")}
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
                                  Bloqueante
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
                            Ver
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
            <h2 style={{ color: COLORS.navy, marginBottom: "1rem" }}>Revisiones IA</h2>
            {reviews.length === 0 ? (
              <p style={{ color: COLORS.textMuted }}>Aun no hay revisiones IA guardadas.</p>
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
                    <p style={{ color: COLORS.navy, fontWeight: 900 }}>{review.documents?.filename || "Documento"}</p>
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
