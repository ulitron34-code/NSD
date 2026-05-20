import React, { useState, useEffect } from "react";
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

  // Cargar historial al montar
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

    // Validar RFC
    if (!rfc.trim()) {
      addNotification("RFC es requerido", "error");
      return;
    }

    if (!validateRFC(rfc)) {
      addNotification("RFC inválido (formato debe ser 13 caracteres)", "error");
      return;
    }

    setIsLoading(true);

    try {
      const response = await scoringService.validateRFC(rfc);

      if (response.success) {
        setResult(response.data);
        addNotification("Análisis completado", "success");
        setRfc("");
        loadHistory();
      } else {
        addNotification(response.error, "error");
      }
    } catch (error) {
      console.error("Error:", error);
      addNotification("Error en el servidor", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    const gradeColors = {
      "AAA": COLORS.green,
      "AA": COLORS.green,
      "A": "#2E7D32",
      "BBB": COLORS.amber,
      "BB": COLORS.amber,
      "B": "#D32F2F",
    };
    return gradeColors[grade] || COLORS.navy;
  };

  return (
    <div>
      <h1 style={{color: COLORS.navy, fontSize: "2rem", marginBottom: "2rem"}}>
        Análisis de Solicitantes
      </h1>

      {/* RFC Input Form */}
      <div style={{
        background: COLORS.white,
        padding: "2rem",
        borderRadius: "8px",
        marginBottom: "2rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}>
        <form onSubmit={handleAnalyze}>
          <div style={{display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem"}}>
            <div>
              <label style={{
                display: "block",
                color: COLORS.navy,
                fontWeight: "600",
                marginBottom: "0.5rem",
                fontSize: "0.9rem",
              }}>
                RFC
              </label>
              <input
                type="text"
                value={rfc}
                onChange={(e) => setRfc(e.target.value.toUpperCase())}
                placeholder="Ej: ABC123456XYZ"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "6px",
                  fontSize: "1rem",
                }}
              />
            </div>
            <div style={{display: "flex", alignItems: "flex-end"}}>
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  padding: "0.75rem 2rem",
                  background: isLoading ? "rgba(201,168,76,0.6)" : COLORS.gold,
                  color: COLORS.navy,
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "600",
                  cursor: isLoading ? "not-allowed" : "pointer",
                }}
              >
                {isLoading ? "Analizando..." : "Analizar"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Result Card */}
      {result && (
        <div style={{
          background: COLORS.white,
          padding: "2rem",
          borderRadius: "8px",
          marginBottom: "2rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}>
          <h2 style={{color: COLORS.navy, marginBottom: "1.5rem"}}>
            Resultado del Análisis
          </h2>

          <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2rem"}}>
            {/* RFC Status */}
            <div style={{padding: "1.5rem", background: COLORS.bg, borderRadius: "6px"}}>
              <p style={{color: COLORS.textMuted, fontSize: "0.85rem", marginBottom: "0.5rem"}}>
                Estado RFC
              </p>
              <p style={{
                color: COLORS.navy,
                fontWeight: "600",
                fontSize: "1.3rem",
              }}>
                {result.rfc_validation?.status || "N/A"}
              </p>
            </div>

            {/* Credit Score */}
            <div style={{padding: "1.5rem", background: COLORS.bg, borderRadius: "6px"}}>
              <p style={{color: COLORS.textMuted, fontSize: "0.85rem", marginBottom: "0.5rem"}}>
                Score Crediticio
              </p>
              <p style={{
                color: COLORS.navy,
                fontWeight: "600",
                fontSize: "1.3rem",
              }}>
                {result.credit_score?.score || "N/A"} / 850
              </p>
            </div>

            {/* Grade */}
            <div style={{padding: "1.5rem", background: COLORS.bg, borderRadius: "6px"}}>
              <p style={{color: COLORS.textMuted, fontSize: "0.85rem", marginBottom: "0.5rem"}}>
                Calificación
              </p>
              <p style={{
                color: getGradeColor(result.credit_score?.grade),
                fontWeight: "700",
                fontSize: "1.8rem",
              }}>
                {result.credit_score?.grade || "N/A"}
              </p>
            </div>

            {/* NSD Score */}
            <div style={{padding: "1.5rem", background: COLORS.bg, borderRadius: "6px"}}>
              <p style={{color: COLORS.textMuted, fontSize: "0.85rem", marginBottom: "0.5rem"}}>
                Score NSD (0-100)
              </p>
              <p style={{
                color: COLORS.navy,
                fontWeight: "600",
                fontSize: "1.3rem",
              }}>
                {result.nsd_score || "N/A"}
              </p>
            </div>
          </div>

          {/* Flags */}
          {result.flags && result.flags.length > 0 && (
            <div style={{marginTop: "2rem", padding: "1.5rem", background: "#FFF3E0", borderRadius: "6px", borderLeft: `4px solid ${COLORS.amber}`}}>
              <p style={{color: COLORS.amber, fontWeight: "600", marginBottom: "1rem"}}>
                ⚠️ {result.flags.length} Banderas de Riesgo Detectadas
              </p>
              <ul style={{listStyle: "none"}}>
                {result.flags.map((flag, i) => (
                  <li key={i} style={{color: COLORS.text, marginBottom: "0.5rem"}}>
                    • {flag}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendation */}
          <div style={{marginTop: "2rem"}}>
            <p style={{color: COLORS.textMuted, fontSize: "0.9rem", marginBottom: "0.5rem"}}>
              Recomendación
            </p>
            <p style={{
              color: result.recommendation === "APROBADO" ? COLORS.green : COLORS.amber,
              fontWeight: "600",
              fontSize: "1.1rem",
            }}>
              {result.recommendation}
            </p>
          </div>
        </div>
      )}

      {/* History */}
      <div style={{
        background: COLORS.white,
        padding: "2rem",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}>
        <div 
          onClick={() => setShowHistory(!showHistory)}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            marginBottom: showHistory ? "1rem" : 0,
          }}
        >
          <h3 style={{color: COLORS.navy, fontSize: "1.2rem"}}>
            Historial de Búsquedas ({history.length})
          </h3>
          <span style={{fontSize: "1.5rem"}}>{showHistory ? "▲" : "▼"}</span>
        </div>

        {showHistory && (
          <div style={{marginTop: "1rem"}}>
            {history.length === 0 ? (
              <p style={{color: COLORS.textMuted}}>Sin historial de búsquedas</p>
            ) : (
              <table style={{width: "100%", borderCollapse: "collapse"}}>
                <thead>
                  <tr style={{borderBottom: `1px solid ${COLORS.border}`}}>
                    <th style={{padding: "0.75rem", textAlign: "left", color: COLORS.navy, fontWeight: "600"}}>RFC</th>
                    <th style={{padding: "0.75rem", textAlign: "left", color: COLORS.navy, fontWeight: "600"}}>Score</th>
                    <th style={{padding: "0.75rem", textAlign: "left", color: COLORS.navy, fontWeight: "600"}}>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item, i) => (
                    <tr key={i} style={{borderBottom: `1px solid ${COLORS.border}`}}>
                      <td style={{padding: "0.75rem"}}>{item.rfc}</td>
                      <td style={{padding: "0.75rem"}}>{item.score}</td>
                      <td style={{padding: "0.75rem", color: COLORS.textMuted, fontSize: "0.9rem"}}>
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
