import { error, debug, info, warn } from '../../utils/logger';
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNotification } from "../../hooks/useNotification";
import { useIndexedDB } from "../../hooks/useIndexedDB";
import { saveDocument, getDocumentsByOrder, updateDocument, deleteDocument, saveLog, getLogsByEntity } from "../../services/storageService";
import { getCurrentOrder } from "../../services/localStorageService";
import { calculateScore } from "../../services/scoringService";
import { generateExpedienteReport, downloadReport, printReport } from "../../services/reportService";
import { COLORS } from "../../utils/constants";
import { demoDocuments } from "../../data/demoDocuments";
import { uiText, translateCopy } from "../../utils/runtimeCopy";

export default function CumplimientoTab() {
  const { addNotification } = useNotification();
  const { db, error: dbError } = useIndexedDB('nsd-app', 1);
  const orderId = getCurrentOrder();
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);
  const copy = (val) => translateCopy(val, i18n.language);

  const statusConfig = {
    uploaded: { label: L("Cargado", "Uploaded"), color: COLORS.amber, bg: "#FEF3C7" },
    review: { label: L("En revision", "Under Review"), color: COLORS.amber, bg: "#FEF3C7" },
    approved: { label: L("Aprobado", "Approved"), color: COLORS.green, bg: "#E8F5E9" },
    observed: { label: L("Observado", "Observed"), color: "#C62828", bg: "#FFEBEE" },
    missing: { label: L("No cargado", "Not Uploaded"), color: COLORS.textMuted, bg: "#F2EFE9" },
  };

  const getStatusLabel = (status) => {
    return statusConfig[status]?.label || status;
  };

  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [score, setScore] = useState(null);
  const [showReportMenu, setShowReportMenu] = useState(false);

  // CARGAR DOCUMENTOS AL INICIAR
  useEffect(() => {
    if (!db) return;

    const loadDocs = async () => {
      try {
        const docs = await getDocumentsByOrder(db, orderId);
        if (docs.length === 0) {
          const demo = demoDocuments.map(d => ({
            ...d,
            orderId,
            filesize: d.filesize || 250000,
            filetype: d.filetype || 'application/pdf'
          }));
          for (const doc of demo) {
            try {
              const blob = new Blob(['fake content'], { type: doc.filetype });
              await saveDocument(db, blob, orderId, 'demo-user');
            } catch (err) {
            }
          }
          setDocuments(demo);
        } else {
          setDocuments(docs);
        }
        setLoading(false);
      } catch (err) {
        error("SVC", 'Error loading docs:', err);
        setDocuments(demoDocuments);
        setLoading(false);
      }
    };

    loadDocs();
  }, [db, orderId]);

  // CARGAR LOGS
  useEffect(() => {
    if (!db) return;

    const loadLogs = async () => {
      try {
        const auditLogs = await getLogsByEntity(db, orderId);
        setLogs(auditLogs);
      } catch (err) {
        error("SVC", 'Error loading logs:', err);
      }
    };

    loadLogs();
  }, [db, orderId]);

  // CALCULAR SCORE EN TIEMPO REAL
  useEffect(() => {
    if (documents.length > 0) {
      const newScore = calculateScore(documents);
      setScore(newScore);
    }
  }, [documents]);

  // SUBIR DOCUMENTO
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel'];
    if (!allowed.includes(file.type)) {
      addNotification(L('Solo PDF, Word, Excel permitidos', 'Only PDF, Word, Excel permitted'), 'error');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      addNotification(L('Archivo muy grande (máx 50MB)', 'File too large (max 50MB)'), 'error');
      return;
    }

    try {
      const newDoc = await saveDocument(db, file, orderId, 'current-user-id');
      await saveLog(db, 'document_uploaded', 'document', newDoc.id, 'current-user-id', {
        filename: file.name,
        size: file.size
      });

      setDocuments([...documents, newDoc]);
      setLogs(await getLogsByEntity(db, orderId));
      addNotification(L(`"${file.name}" subido exitosamente`, `"${file.name}" uploaded successfully`), 'success');
    } catch (err) {
      error("SVC", 'Upload error:', err);
      addNotification(L('Error al subir archivo', 'Error uploading file'), 'error');
    }
  };

  // CAMBIAR ESTADO DOCUMENTO
  const updateDocStatus = async (docId, newStatus) => {
    try {
      const oldDoc = documents.find(d => d.id === docId);
      const updated = await updateDocument(db, docId, { status: newStatus });

      await saveLog(db, 'status_changed', 'document', docId, 'current-user-id', {
        from: oldDoc.status,
        to: newStatus
      });

      setDocuments(documents.map(d => d.id === docId ? updated : d));
      setSelectedDoc(updated);
      setLogs(await getLogsByEntity(db, orderId));
      addNotification(`${L('Estado actualizado:', 'Status updated:')} ${statusConfig[newStatus].label}`, 'success');
    } catch (err) {
      error("SVC", 'Update error:', err);
      addNotification(L('Error al actualizar', 'Error updating'), 'error');
    }
  };

  // ELIMINAR DOCUMENTO
  const handleDelete = async (docId) => {
    if (!window.confirm(L('¿Eliminar documento?', 'Delete document?'))) return;

    try {
      await deleteDocument(db, docId);
      await saveLog(db, 'document_deleted', 'document', docId, 'current-user-id', {});

      setDocuments(documents.filter(d => d.id !== docId));
      setSelectedDoc(null);
      setLogs(await getLogsByEntity(db, orderId));
      addNotification(L('Documento eliminado', 'Document deleted'), 'success');
    } catch (err) {
      error("SVC", 'Delete error:', err);
      addNotification(L('Error al eliminar', 'Error deleting'), 'error');
    }
  };

  const updateSelectedStatus = async (newStatus) => {
    if (!selectedDoc) return;
    await updateDocStatus(selectedDoc.id, newStatus);
  };

  const handleDownloadReport = () => {
    const report = generateExpedienteReport(
      { name: orderId, status: 'Cumplimiento' },
      score,
      documents,
      []
    );
    downloadReport(report);
    addNotification(L('Reporte descargado exitosamente', 'Report downloaded successfully'), 'success');
    setShowReportMenu(false);
  };

  const handlePrintReport = () => {
    const report = generateExpedienteReport(
      { name: orderId, status: 'Cumplimiento' },
      score,
      documents,
      []
    );
    printReport(report);
    setShowReportMenu(false);
  };

  const approvedCount = documents.filter((doc) => doc.status === "approved").length;
  const completionPercentage = documents.length > 0 ? Math.round((approvedCount / documents.length) * 100) : 0;
  const criticalCount = documents.filter((doc) => doc.risk === "Alto" || doc.risk === "Critico").length;

  return (
    <div>
      {loading && <p>{L("Cargando documentos...", "Loading documents...")}</p>}
      {dbError && <p style={{ color: 'red' }}>Error: {dbError.message}</p>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1.5rem", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ color: COLORS.navy, fontSize: "2rem", marginBottom: "0.5rem" }}>
            {L("Expediente de cumplimiento", "Compliance File")}
          </h1>
          <p style={{ color: COLORS.textMuted, maxWidth: "760px" }}>
            {L("Documentos guardados localmente en tiempo real. Orden: ", "Documents saved locally in real-time. Order: ")} {orderId}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowReportMenu(!showReportMenu)}
              style={{
                padding: "0.75rem 1.25rem",
                background: COLORS.green,
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              📊 {L("Reporte", "Report")}
            </button>
            {showReportMenu && (
              <div style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: "0.5rem",
                background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
                border: `1px solid ${COLORS.border}`,
                borderRadius: "6px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                zIndex: 10,
                overflow: "hidden",
                minWidth: "180px"
              }}>
                <button
                  onClick={handleDownloadReport}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    background: "transparent",
                    border: "none",
                    textAlign: "left",
                    color: COLORS.navy,
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    borderBottom: `1px solid ${COLORS.border}`
                  }}
                >
                  ⬇️ {L("Descargar HTML", "Download HTML")}
                </button>
                <button
                  onClick={handlePrintReport}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    background: "transparent",
                    border: "none",
                    textAlign: "left",
                    color: COLORS.navy,
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    fontWeight: 700
                  }}
                >
                  🖨️ {L("Imprimir", "Print")}
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowLogs(!showLogs)}
            style={{
              padding: "0.75rem 1.25rem",
              background: COLORS.gold,
              color: COLORS.navy,
              border: "none",
              borderRadius: "6px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {showLogs ? L("Ocultar", "Hide") : L("Ver", "View")} {L("Historial", "History")} ({logs.length})
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: L("Puntuación total", "Total Score"), value: score ? `${score.totalScore}/100` : "—", color: score ? score.statusColor : COLORS.textMuted, highlight: true },
          { label: L("Estado", "Status"), value: score ? copy(score.status) : "—", color: score ? score.statusColor : COLORS.textMuted },
          { label: L("Documentos aprobados", "Approved Documents"), value: `${approvedCount}/${documents.length}`, color: COLORS.navy },
          { label: L("Riesgos altos", "High Risks"), value: criticalCount, color: "#C62828" },
        ].map((item) => (
          <div key={item.label} style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", padding: "1.25rem", borderRadius: "10px", borderTop: `4px solid ${item.color}`, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", ...(item.highlight && { borderWidth: "3px" }) }}>
            <p style={{ color: COLORS.textMuted, fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</p>
            <p style={{ color: item.color, fontSize: "1.9rem", fontWeight: 800, marginTop: "0.4rem" }}>{item.value}</p>
          </div>
        ))}
      </div>

      <div style={{
        background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
        padding: "2rem",
        borderRadius: "10px",
        marginBottom: "2rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <p style={{ color: COLORS.navy, fontWeight: 700 }}>{L("Progreso del expediente", "Compliance file progress")}</p>
          <p style={{ color: COLORS.gold, fontWeight: 800 }}>{completionPercentage}%</p>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${completionPercentage}%` }} />
        </div>
      </div>

      {/* DESGLOSE DE PUNTUACIÓN */}
      {score && (
        <div style={{
          background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
          padding: "2rem",
          borderRadius: "10px",
          marginBottom: "2rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          borderLeft: `5px solid ${score.statusColor}`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h3 style={{ color: COLORS.navy, margin: 0 }}>{L("Análisis de puntuación", "Score analysis")}</h3>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              background: score.statusColor,
              color: "white",
              borderRadius: "6px",
              fontWeight: 800,
              fontSize: "1.1rem"
            }}>
              {copy(score.status)}
            </div>
          </div>

          <div style={{ display: "grid", gap: "1rem" }}>
            {score.breakdown.map((item) => (
              <div key={item.category} style={{
                background: COLORS.bg,
                padding: "1rem",
                borderRadius: "8px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span style={{ color: COLORS.navy, fontWeight: 700 }}>{copy(item.category)}</span>
                  <span style={{ color: COLORS.gold, fontWeight: 800 }}>{item.earned}/{item.weight}</span>
                </div>
                <p style={{ color: COLORS.textMuted, fontSize: "0.9rem", margin: "0.25rem 0" }}>{copy(item.detail)}</p>
                <div style={{
                  background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
                  height: "6px",
                  borderRadius: "3px",
                  overflow: "hidden",
                  marginTop: "0.5rem"
                }}>
                  <div style={{
                     background: item.status === 'complete' ? COLORS.green : item.status === 'partial' ? COLORS.amber : '#C62828',
                     height: "100%",
                     width: `${(item.earned / item.weight) * 100}%`,
                     transition: "width 0.3s ease"
                  }} />
                </div>
              </div>
            ))}
          </div>

          {score.nextActions.length > 0 && (
            <div style={{
              background: "#FFF3CD",
              padding: "1rem",
              borderRadius: "8px",
              marginTop: "1.5rem",
              borderLeft: `4px solid ${COLORS.amber}`
            }}>
              <p style={{ color: COLORS.navy, fontWeight: 700, marginTop: 0, marginBottom: "0.75rem" }}>📋 {L("Próximos pasos:", "Next steps:")}</p>
              <ul style={{ color: COLORS.text, margin: 0, paddingLeft: "1.5rem", lineHeight: 1.8 }}>
                {score.nextActions.map((action, i) => (
                  <li key={i}>{copy(action)}</li>
                ))}
              </ul>
            </div>
          )}

          {score.canPublish && (
            <div style={{
              background: "#D4EDDA",
              padding: "1rem",
              borderRadius: "8px",
              marginTop: "1.5rem",
              borderLeft: `4px solid ${COLORS.green}`,
              color: "#155724",
              fontWeight: 700
            }}>
              ✅ {L("Expediente listo para presentar a instituciones financieras", "Compliance file ready to present to financial institutions")}
            </div>
          )}
        </div>
      )}

      {/* UPLOAD ZONE */}
      <div style={{
        background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
        padding: "2rem",
        borderRadius: "10px",
        marginBottom: "2rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}>
        <label style={{
          display: "block",
          padding: "2rem",
          border: "2px dashed #CCC",
          borderRadius: "8px",
          textAlign: "center",
          cursor: "pointer",
          backgroundColor: "#F9F9F9",
          transition: "all 0.3s ease"
        }}>
          <span style={{ color: COLORS.navy, fontWeight: 700, fontSize: "1.1rem" }}>
            📄 {L("Arrastra documento aquí o click para seleccionar", "Drag document here or click to select")}
          </span>
          <input type="file" onChange={handleUpload} style={{ display: "none" }} accept=".pdf,.docx,.xlsx,.doc,.xls" />
        </label>
      </div>

      <div className="dashboard-detail-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.45fr) minmax(320px, 0.9fr)", gap: "1.5rem", alignItems: "start" }}>
        <div style={{
          background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
          padding: "2rem",
          borderRadius: "10px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}>
          <h2 style={{ color: COLORS.navy, marginBottom: "1.5rem" }}>
            {L("Requisitos documentales", "Documentary Requirements")}
          </h2>

          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>{L("Documento", "Document")}</th>
                  <th>{L("Responsable", "Owner")}</th>
                  <th>{L("Estado", "Status")}</th>
                  <th>{L("Vencimiento", "Expiration")}</th>
                  <th>{L("Riesgo", "Risk")}</th>
                  <th>{L("Accion", "Action")}</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => {
                  const status = statusConfig[doc.status];
                  return (
                    <tr
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc)}
                      style={{
                        cursor: "pointer",
                        outline: selectedDoc?.id === doc.id ? `2px solid ${COLORS.gold}` : "none",
                        outlineOffset: "-2px",
                      }}
                    >
                      <td style={{ fontWeight: 700, color: COLORS.navy }}>{copy(doc.filename || doc.name)}</td>
                      <td>{doc.owner}</td>
                      <td>
                        <span style={{
                          display: "inline-flex",
                          padding: "0.35rem 0.7rem",
                          borderRadius: "999px",
                          background: status.bg,
                          color: status.color,
                          fontSize: "0.8rem",
                          fontWeight: 700,
                        }}>
                          {getStatusLabel(doc.status)}
                        </span>
                      </td>
                      <td>{doc.expires}</td>
                      <td style={{ color: doc.risk === "Critico" || doc.risk === "Alto" ? "#C62828" : COLORS.text, fontWeight: 700 }}>
                        {L(doc.risk, doc.risk)}
                      </td>
                      <td style={{ display: "flex", gap: "0.5rem" }}>
                        <select
                          onChange={(e) => updateDocStatus(doc.id, e.target.value)}
                          value={doc.status}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            padding: "0.5rem",
                            borderRadius: "4px",
                            border: `1px solid ${COLORS.border}`,
                            color: COLORS.navy,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          <option value="uploaded">{L("Cargado", "Uploaded")}</option>
                          <option value="review">{L("Revisión", "Review")}</option>
                          <option value="approved">{L("Aprobado", "Approved")}</option>
                          <option value="observed">{L("Observado", "Observed")}</option>
                        </select>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(doc.id);
                          }}
                          style={{
                            padding: "0.5rem 0.75rem",
                            background: "#C62828",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontWeight: 700,
                          }}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {selectedDoc && (
          <aside style={{
            background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
            borderRadius: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            border: `1px solid ${COLORS.border}`,
            overflow: "hidden",
            position: "sticky",
            top: "96px",
          }}>
            <div style={{
              padding: "1.5rem",
              background: COLORS.bg,
              borderBottom: `1px solid ${COLORS.border}`,
            }}>
              <p style={{ color: COLORS.textMuted, fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.4rem" }}>
                {L("Detalle del documento", "Document Detail")}
              </p>
              <h3 style={{ color: COLORS.navy, fontSize: "1.2rem", lineHeight: 1.35 }}>
                {copy(selectedDoc.filename || selectedDoc.name)}
              </h3>
            </div>

            <div style={{ padding: "1.5rem", display: "grid", gap: "1rem" }}>
              {[
                [L("Responsable", "Owner"), selectedDoc.owner],
                [L("Revisor", "Reviewer"), selectedDoc.reviewer],
                [L("Version", "Version"), selectedDoc.version],
                [L("Vencimiento", "Expiration"), selectedDoc.expires],
                [L("Riesgo", "Risk"), L(selectedDoc.risk, selectedDoc.risk)],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                  <span style={{ color: COLORS.textMuted, fontSize: "0.86rem" }}>{label}</span>
                  <strong style={{ color: COLORS.navy, textAlign: "right" }}>{value}</strong>
                </div>
              ))}

              <div>
                <p style={{ color: COLORS.textMuted, fontSize: "0.86rem", marginBottom: "0.45rem" }}>{L("Estado actual", "Current Status")}</p>
                <span style={{
                  display: "inline-flex",
                  padding: "0.35rem 0.7rem",
                  borderRadius: "999px",
                  background: statusConfig[selectedDoc.status].bg,
                  color: statusConfig[selectedDoc.status].color,
                  fontSize: "0.8rem",
                  fontWeight: 800,
                }}>
                  {getStatusLabel(selectedDoc.status)}
                </span>
              </div>

              <div style={{ background: COLORS.bg, padding: "1rem", borderRadius: "8px" }}>
                <p style={{ color: COLORS.navy, fontWeight: 800, marginBottom: "0.4rem" }}>{L("Observaciones", "Observations")}</p>
                <p style={{ color: COLORS.textMuted, fontSize: "0.9rem", lineHeight: 1.6 }}>{copy(selectedDoc.notes)}</p>
              </div>

              <div style={{ background: COLORS.bg, padding: "1rem", borderRadius: "8px" }}>
                <p style={{ color: COLORS.navy, fontWeight: 800, marginBottom: "0.65rem" }}>{L("Historial", "History")}</p>
                {[
                  L("Documento cargado por cliente", "Document uploaded by client"),
                  L("Revision asignada", "Review assigned"),
                  selectedDoc.status === "approved" ? L("Aprobado con evidencia", "Approved with evidence") : L("Pendiente de cierre", "Pending closure"),
                ].map((event, idx) => (
                  <p key={idx} style={{ color: COLORS.textMuted, fontSize: "0.86rem", marginBottom: "0.4rem" }}>
                    - {event}
                  </p>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <button
                  onClick={() => updateSelectedStatus("approved")}
                  style={{
                    padding: "0.7rem",
                    background: COLORS.green,
                    color: COLORS.white,
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: 800,
                  }}
                >
                  {L("Aprobar", "Approve")}
                </button>
                <button
                  onClick={() => updateSelectedStatus("observed")}
                  style={{
                    padding: "0.7rem",
                    background: COLORS.amber,
                    color: COLORS.white,
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: 800,
                  }}
                >
                  {L("Observar", "Observe")}
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* HISTORIAL DE AUDITORÍA */}
      {showLogs && logs.length > 0 && (
        <div style={{
          background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
          padding: "2rem",
          borderRadius: "10px",
          marginTop: "2rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}>
          <h2 style={{ color: COLORS.navy, marginBottom: "1.5rem" }}>{L("Historial de auditoría", "Audit History")}</h2>
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {logs.map((log, i) => (
              <div
                key={i}
                style={{
                  borderLeft: `3px solid ${COLORS.gold}`,
                  paddingLeft: "1rem",
                  marginBottom: "1rem",
                  paddingBottom: "1rem",
                  borderBottom: i < logs.length - 1 ? `1px solid ${COLORS.border}` : "none",
                }}
              >
                <p style={{ color: COLORS.navy, fontWeight: 700, margin: 0, fontSize: "0.9rem" }}>
                  {new Date(log.timestamp).toLocaleString()}
                </p>
                <p style={{ color: COLORS.textMuted, margin: "0.25rem 0", fontSize: "0.85rem" }}>
                  {copy(log.action)} - {log.userId}
                </p>
                <p style={{ color: COLORS.text, margin: 0, fontSize: "0.85rem" }}>
                  {JSON.stringify(log.changes)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showLogs && logs.length === 0 && (
        <div style={{
          background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
          padding: "2rem",
          borderRadius: "10px",
          marginTop: "2rem",
          textAlign: "center",
          color: COLORS.textMuted,
        }}>
          <p>{L("No hay eventos registrados aún", "No events recorded yet")}</p>
        </div>
      )}
    </div>
  );
}
