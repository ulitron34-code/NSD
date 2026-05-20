import React, { useState } from "react";
import { useNotification } from "../../hooks/useNotification";
import { COLORS } from "../../utils/constants";

export default function CumplimientoTab() {
  const { addNotification } = useNotification();
  const [documents, setDocuments] = useState([
    {id: 1, name: "RFC/RUC", status: "pending", uploaded: false},
    {id: 2, name: "Identificación Oficial", status: "pending", uploaded: false},
    {id: 3, name: "Comprobante de Domicilio", status: "pending", uploaded: false},
    {id: 4, name: "Estados Financieros", status: "pending", uploaded: false},
    {id: 5, name: "Acta Constitutiva", status: "pending", uploaded: false},
  ]);

  const getStatusColor = (status) => {
    const colors = {
      "pending": COLORS.amber,
      "verified": COLORS.green,
      "rejected": "#D32F2F",
    };
    return colors[status] || COLORS.navy;
  };

  const getStatusLabel = (status) => {
    const labels = {
      "pending": "Pendiente",
      "verified": "Verificado",
      "rejected": "Rechazado",
    };
    return labels[status] || status;
  };

  const handleFileUpload = (docId) => {
    // Simular upload
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === docId ? {...doc, uploaded: true, status: "pending"} : doc
      )
    );
    addNotification("Documento cargado correctamente", "success");
  };

  const completionPercentage = Math.round(
    (documents.filter((d) => d.status === "verified").length / documents.length) * 100
  );

  return (
    <div>
      <h1 style={{color: COLORS.navy, fontSize: "2rem", marginBottom: "2rem"}}>
        Cumplimiento y KYC
      </h1>

      {/* Progress Bar */}
      <div style={{
        background: COLORS.white,
        padding: "2rem",
        borderRadius: "8px",
        marginBottom: "2rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}>
        <div style={{marginBottom: "1rem"}}>
          <div style={{display: "flex", justifyContent: "space-between", marginBottom: "0.5rem"}}>
            <p style={{color: COLORS.navy, fontWeight: "600"}}>Progreso KYC</p>
            <p style={{color: COLORS.gold, fontWeight: "600"}}>{completionPercentage}%</p>
          </div>
          <div style={{
            width: "100%",
            height: "8px",
            background: COLORS.bg,
            borderRadius: "4px",
            overflow: "hidden",
          }}>
            <div style={{
              width: `${completionPercentage}%`,
              height: "100%",
              background: COLORS.gold,
              transition: "width 0.3s",
            }} />
          </div>
        </div>
        <p style={{color: COLORS.textMuted, fontSize: "0.9rem"}}>
          {documents.filter((d) => d.status === "verified").length} de {documents.length} documentos verificados
        </p>
      </div>

      {/* Documents Checklist */}
      <div style={{
        background: COLORS.white,
        padding: "2rem",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}>
        <h2 style={{color: COLORS.navy, marginBottom: "1.5rem"}}>
          Documentos Requeridos
        </h2>

        <div style={{display: "grid", gap: "1rem"}}>
          {documents.map((doc) => (
            <div key={doc.id} style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr auto",
              alignItems: "center",
              gap: "1rem",
              padding: "1rem",
              background: COLORS.bg,
              borderRadius: "6px",
              border: `1px solid ${COLORS.border}`,
            }}>
              {/* Status Indicator */}
              <div style={{
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                background: getStatusColor(doc.status),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: COLORS.white,
                fontWeight: "600",
                fontSize: "0.8rem",
              }}>
                {doc.status === "pending" ? "⏳" : doc.status === "verified" ? "✓" : "✗"}
              </div>

              {/* Document Info */}
              <div>
                <p style={{color: COLORS.navy, fontWeight: "600", marginBottom: "0.25rem"}}>
                  {doc.name}
                </p>
                <p style={{color: COLORS.textMuted, fontSize: "0.85rem"}}>
                  {doc.uploaded ? "Documento cargado" : "No cargado"}
                </p>
              </div>

              {/* Status Label & Upload */}
              <div style={{display: "flex", alignItems: "center", gap: "1rem"}}>
                <span style={{
                  color: getStatusColor(doc.status),
                  fontWeight: "600",
                  fontSize: "0.9rem",
                  minWidth: "100px",
                  textAlign: "right",
                }}>
                  {getStatusLabel(doc.status)}
                </span>
                {doc.status !== "verified" && (
                  <button
                    onClick={() => handleFileUpload(doc.id)}
                    style={{
                      padding: "0.5rem 1rem",
                      background: COLORS.gold,
                      color: COLORS.navy,
                      border: "none",
                      borderRadius: "4px",
                      fontWeight: "600",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                    }}
                  >
                    {doc.uploaded ? "Re-upload" : "Upload"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
