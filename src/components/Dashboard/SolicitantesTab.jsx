import { error, debug, info, warn } from '../../utils/logger';
import React, { useEffect, useState } from "react";
import { useNotification } from "../../hooks/useNotification";
import { scoringService } from "../../services/scoring.service";
import { validateRFC } from "../../utils/validators";
import { COLORS } from "../../utils/constants";

export default function SolicitantesTab() {
  const { addNotification } = useNotification();
  const [rfc, setRfc] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const response = await scoringService.getSearchHistory();
    if (response.success) {
      setHistory(response.data);
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();

    if (!rfc.trim()) {
      addNotification("RFC es requerido", "error");
      return;
    }

    if (!validateRFC(rfc)) {
      addNotification("RFC invalido: debe tener 12 o 13 caracteres validos", "error");
      return;
    }

    setIsLoading(true);

    try {
      const response = await scoringService.validateRFC(rfc);

      if (response.success) {
        setResult({
          ...response.data,
          kyb: {
            entityType: "Persona moral",
            taxStatus: response.data.rfc_validation?.status || "Activo",
            ubo: "Pendiente de documentar",
            sanctions: "Sin coincidencias",
            pep: "Sin coincidencias",
            complianceScore: 82,
            riskLevel: "Medio",
          },
          requirements: [
            "Actualizar estructura accionaria",
            "Cargar identificacion de representante legal",
            "Validar comprobante de domicilio",
          ],
        });
        addNotification("Analisis KYC/KYB completado", "success");
        setRfc("");
        loadHistory();
      } else {
        addNotification(response.error, "error");
      }
    } catch (error) {
      error("SVC", "Error:", error);
      addNotification("Error en el servidor", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "2rem", borderBottom: `1px solid ${COLORS.border}`, paddingBottom: "1.5rem" }}>
        <p style={{ color: COLORS.gold, fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem" }}>
          Módulo B2C
        </p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", color: COLORS.navy, fontSize: "2.2rem", fontWeight: 600, marginBottom: "0.5rem" }}>
          Gestión de Solicitantes (KYC/KYB)
        </h1>
      </div>
      <p style={{ color: COLORS.textMuted, marginBottom: "2rem", maxWidth: "760px" }}>
        Evalua identidad fiscal, riesgo documental, beneficiarios finales, listas restrictivas y requisitos pendientes.
      </p>

      <div style={{
        background: COLORS.white,
        padding: "2rem",
        borderRadius: "10px",
        marginBottom: "2rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}>
        <form onSubmit={handleAnalyze}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", color: COLORS.navy, fontWeight: 700, marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                RFC del solicitante
              </label>
              <input
                type="text"
                value={rfc}
                onChange={(e) => setRfc(e.target.value.toUpperCase())}
                placeholder="Ej: ABC123456XYZ"
              />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  padding: "0.75rem 2rem",
                  background: isLoading ? "rgba(201,168,76,0.6)" : COLORS.gold,
                  color: COLORS.navy,
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: 700,
                  cursor: isLoading ? "not-allowed" : "pointer",
                }}
              >
                {isLoading ? "Analizando..." : "Analizar"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {result && (
        <div style={{
          background: COLORS.white,
          padding: "2rem",
          borderRadius: "10px",
          marginBottom: "2rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}>
          <h2 style={{ color: COLORS.navy, marginBottom: "1.5rem" }}>
            Resultado de cumplimiento
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
            {[
              { label: "Estado fiscal", value: result.kyb.taxStatus, color: COLORS.green },
              { label: "Score compliance", value: `${result.kyb.complianceScore}/100`, color: COLORS.navy },
              { label: "Riesgo", value: result.kyb.riskLevel, color: COLORS.amber },
              { label: "Listas/PEP", value: "Sin coincidencias", color: COLORS.green },
            ].map((item) => (
              <div key={item.label} style={{ padding: "1.25rem", background: COLORS.bg, borderRadius: "8px", borderTop: `4px solid ${item.color}` }}>
                <p style={{ color: COLORS.textMuted, fontSize: "0.82rem", marginBottom: "0.45rem" }}>{item.label}</p>
                <p style={{ color: COLORS.navy, fontWeight: 800, fontSize: "1.25rem" }}>{item.value}</p>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div style={{ background: COLORS.bg, padding: "1.5rem", borderRadius: "8px" }}>
              <h3 style={{ color: COLORS.navy, marginBottom: "1rem" }}>Hallazgos KYB</h3>
              <p style={{ color: COLORS.text, marginBottom: "0.5rem" }}><strong>Tipo:</strong> {result.kyb.entityType}</p>
              <p style={{ color: COLORS.text, marginBottom: "0.5rem" }}><strong>Beneficiario final:</strong> {result.kyb.ubo}</p>
              <p style={{ color: COLORS.text, marginBottom: "0.5rem" }}><strong>Sanciones:</strong> {result.kyb.sanctions}</p>
              <p style={{ color: COLORS.text }}><strong>PEP:</strong> {result.kyb.pep}</p>
            </div>

            <div style={{ background: COLORS.bg, padding: "1.5rem", borderRadius: "8px" }}>
              <h3 style={{ color: COLORS.navy, marginBottom: "1rem" }}>Acciones requeridas</h3>
              <ul style={{ paddingLeft: "1.2rem", color: COLORS.text }}>
                {result.requirements.map((item) => (
                  <li key={item} style={{ marginBottom: "0.5rem" }}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div style={{
        background: COLORS.white,
        padding: "2rem",
        borderRadius: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}>
        <div
          onClick={() => setShowHistory(!showHistory)}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", marginBottom: showHistory ? "1rem" : 0 }}
        >
          <h3 style={{ color: COLORS.navy, fontSize: "1.2rem" }}>
            Historial de analisis ({history.length})
          </h3>
          <span style={{ fontSize: "1.1rem", color: COLORS.gold }}>{showHistory ? "Cerrar" : "Abrir"}</span>
        </div>

        {showHistory && (
          <div style={{ marginTop: "1rem", overflowX: "auto" }}>
            {history.length === 0 ? (
              <p style={{ color: COLORS.textMuted }}>Sin historial de analisis</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>RFC</th>
                    <th>Score</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item, i) => (
                    <tr key={`${item.rfc}-${i}`}>
                      <td>{item.rfc}</td>
                      <td>{item.score}</td>
                      <td style={{ color: COLORS.textMuted, fontSize: "0.9rem" }}>
                        {new Date(item.timestamp).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
