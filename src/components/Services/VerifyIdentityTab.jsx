import React, { useState } from "react";
import { COLORS } from "../../utils/constants";

const VerifyIdentityTab = () => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);

  // Cargar estadísticas del corpus al montar
  React.useEffect(() => {
    fetchCorpusStats();
  }, []);

  const fetchCorpusStats = async () => {
    try {
      const response = await fetch("/api/identity/readiness");
      const data = await response.json();
      if (data.success) {
        setStats(data);
      }
    } catch (err) {
      console.warn("No se pudieron cargar estadísticas del corpus");
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!query.trim()) {
      setError("Ingresa un nombre, RFC o identificador");
      return;
    }

    if (query.trim().length < 2) {
      setError("La búsqueda debe tener al menos 2 caracteres");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/identity/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() })
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || "Error en la verificación");
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
      console.error("Verification error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case "high":
        return { bg: "#fef2f2", text: "#991b1b", border: "#fca5a5" };
      case "medium":
        return { bg: "#fffbeb", text: "#92400e", border: "#fcd34d" };
      case "low":
        return { bg: "#f0fdf4", text: "#166534", border: "#86efac" };
      default:
        return { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" };
    }
  };

  const getSimilarityColor = (similarity) => {
    if (similarity >= 0.9) return "#991b1b"; // Rojo alto riesgo
    if (similarity >= 0.75) return "#ea580c"; // Naranja riesgo medio
    return "#059669"; // Verde bajo riesgo
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
      {/* Encabezado */}
      <div style={{ marginBottom: "2.5rem" }}>
        <h1 style={{ color: COLORS.navy, fontSize: "2rem", margin: "0 0 0.5rem 0" }}>
          Verificar Identidad
        </h1>
        <p style={{ color: COLORS.textMuted, fontSize: "1rem", margin: 0 }}>
          Busca contra listas de sanciones (SAT, OFAC, UE, Canadá) y bases de datos públicas
        </p>
      </div>

      {/* Grid: Búsqueda + Estadísticas */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
        {/* Columna Izquierda: Búsqueda */}
        <div>
          <form onSubmit={handleVerify} style={{
            background: "white",
            padding: "2rem",
            borderRadius: "12px",
            border: `1px solid ${COLORS.border}`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}>
            <label style={{
              display: "block",
              marginBottom: "0.5rem",
              fontWeight: 600,
              color: COLORS.navy,
              fontSize: "0.95rem"
            }}>
              Buscar por nombre, RFC o identificador
            </label>

            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ej: Miguel López García, RFC LOGM900101ABC..."
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "0.75rem 1rem",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontFamily: "inherit",
                  transition: "border-color 0.2s",
                  borderColor: error ? "#dc2626" : COLORS.border
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = COLORS.navy;
                  e.target.style.outline = "none";
                  e.target.style.boxShadow = `0 0 0 3px ${COLORS.navy}15`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = error ? "#dc2626" : COLORS.border;
                  e.target.style.boxShadow = "none";
                }}
              />

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: loading ? COLORS.textMuted : COLORS.navy,
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "1rem",
                  transition: "all 0.2s",
                  opacity: loading ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.target.style.background = COLORS.gold;
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.target.style.background = COLORS.navy;
                }}
              >
                {loading ? "Verificando..." : "Verificar"}
              </button>
            </div>

            {error && (
              <div style={{
                background: "#fef2f2",
                color: "#991b1b",
                padding: "0.75rem 1rem",
                borderRadius: "6px",
                fontSize: "0.9rem",
                border: "1px solid #fca5a5"
              }}>
                ⚠️ {error}
              </div>
            )}
          </form>
        </div>

        {/* Columna Derecha: Estadísticas del Corpus */}
        <div style={{
          background: "white",
          padding: "1.5rem",
          borderRadius: "12px",
          border: `1px solid ${COLORS.border}`,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
        }}>
          <h3 style={{ color: COLORS.navy, margin: "0 0 1rem 0", fontSize: "1rem" }}>
            📊 Estado del Corpus
          </h3>

          {stats ? (
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <div style={{ padding: "0.5rem 0", borderBottom: `1px solid ${COLORS.border}` }}>
                <p style={{ margin: 0, color: COLORS.textMuted, fontSize: "0.85rem" }}>
                  Documentos
                </p>
                <p style={{ margin: "0.25rem 0 0 0", color: COLORS.navy, fontWeight: 700, fontSize: "1.25rem" }}>
                  {stats.corpusDocuments || 0}
                </p>
              </div>

              <div style={{ padding: "0.5rem 0", borderBottom: `1px solid ${COLORS.border}` }}>
                <p style={{ margin: 0, color: COLORS.textMuted, fontSize: "0.85rem" }}>
                  Chunks Indexados
                </p>
                <p style={{ margin: "0.25rem 0 0 0", color: COLORS.navy, fontWeight: 700, fontSize: "1.25rem" }}>
                  {stats.corpusChunks || 0}
                </p>
              </div>

              <div style={{ padding: "0.5rem 0" }}>
                <p style={{ margin: 0, color: COLORS.textMuted, fontSize: "0.85rem" }}>
                  Estado
                </p>
                <p style={{
                  margin: "0.25rem 0 0 0",
                  fontWeight: 700,
                  fontSize: "1rem",
                  color: stats.ready ? "#059669" : "#dc2626"
                }}>
                  {stats.ready ? "✅ Listo" : "⏳ Inicializando"}
                </p>
              </div>
            </div>
          ) : (
            <p style={{ color: COLORS.textMuted, fontSize: "0.9rem", margin: 0 }}>
              Cargando estadísticas...
            </p>
          )}
        </div>
      </div>

      {/* Resultados */}
      {result && (
        <div>
          <div style={{
            background: getRiskColor(result.riskLevel).bg,
            border: `2px solid ${getRiskColor(result.riskLevel).border}`,
            borderRadius: "12px",
            padding: "1.5rem",
            marginBottom: "1.5rem"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h2 style={{
                  color: getRiskColor(result.riskLevel).text,
                  margin: 0,
                  fontSize: "1.5rem"
                }}>
                  Nivel de Riesgo: {result.riskLevel.toUpperCase()}
                </h2>
                <p style={{ margin: "0.25rem 0 0 0", color: getRiskColor(result.riskLevel).text }}>
                  {result.matchCount} coincidencia{result.matchCount !== 1 ? "s" : ""} encontrada{result.matchCount !== 1 ? "s" : ""}
                </p>
              </div>
              <div style={{
                fontSize: "2rem",
                fontWeight: "bold",
                color: getRiskColor(result.riskLevel).text
              }}>
                {result.riskLevel === "high" ? "🚨" : result.riskLevel === "medium" ? "⚠️" : "✅"}
              </div>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
              fontSize: "0.9rem",
              color: getRiskColor(result.riskLevel).text
            }}>
              <div>
                <strong>Fuentes Internas:</strong> {result.sources.internal}
              </div>
              <div>
                <strong>APIs Públicas:</strong> {result.sources.opensanctions}
              </div>
              <div>
                <strong>Consulta:</strong> "{result.query}"
              </div>
              <div>
                <strong>Fecha:</strong> {new Date(result.timestamp).toLocaleString("es-MX")}
              </div>
            </div>
          </div>

          {/* Matches */}
          {result.matches.length > 0 ? (
            <div>
              <h3 style={{ color: COLORS.navy, marginBottom: "1rem" }}>
                Coincidencias Encontradas
              </h3>
              <div style={{ display: "grid", gap: "1rem" }}>
                {result.matches.map((match, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "white",
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: "8px",
                      padding: "1.25rem",
                      borderLeftWidth: "4px",
                      borderLeftColor: getSimilarityColor(match.similarity)
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.75rem" }}>
                      <div>
                        <h4 style={{ color: COLORS.navy, margin: "0 0 0.25rem 0" }}>
                          {match.name || match.title}
                        </h4>
                        <p style={{ color: COLORS.textMuted, fontSize: "0.85rem", margin: "0" }}>
                          Fuente: {match.source}
                        </p>
                      </div>
                      <div style={{
                        background: getSimilarityColor(match.similarity) + "20",
                        color: getSimilarityColor(match.similarity),
                        padding: "0.5rem 1rem",
                        borderRadius: "6px",
                        fontWeight: 700,
                        fontSize: "0.9rem"
                      }}>
                        {(match.similarity * 100).toFixed(0)}% similitud
                      </div>
                    </div>

                    {match.content && (
                      <p style={{
                        color: COLORS.text,
                        fontSize: "0.9rem",
                        margin: "0.75rem 0 0 0",
                        lineHeight: 1.5,
                        maxHeight: "100px",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}>
                        {match.content.substring(0, 150)}...
                      </p>
                    )}

                    {match.sourceUrl && (
                      <a
                        href={match.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-block",
                          marginTop: "0.75rem",
                          color: COLORS.navy,
                          textDecoration: "none",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          borderBottom: `1px solid ${COLORS.navy}`
                        }}
                      >
                        Ver fuente →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{
              background: "white",
              padding: "2rem",
              textAlign: "center",
              borderRadius: "8px",
              border: `1px solid ${COLORS.border}`
            }}>
              <p style={{ color: COLORS.textMuted, margin: 0 }}>
                No se encontraron coincidencias en la búsqueda.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Info de Ayuda */}
      {!result && (
        <div style={{
          background: "#f0fdf4",
          border: "1px solid #86efac",
          borderRadius: "8px",
          padding: "1.5rem",
          marginTop: "2rem"
        }}>
          <h3 style={{ color: "#166534", margin: "0 0 1rem 0" }}>
            💡 Cómo usar esta herramienta
          </h3>
          <ul style={{ color: "#166534", margin: 0, paddingLeft: "1.5rem", lineHeight: 2 }}>
            <li>Ingresa un nombre completo, RFC o identificador</li>
            <li>El sistema busca en listas locales (SAT, OFAC, UE, Canadá)</li>
            <li>Complementa con datos públicos de OpenSanctions</li>
            <li>Recibe un nivel de riesgo y coincidencias detalladas</li>
            <li>Los datos se actualizan automáticamente cada 4 días</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default VerifyIdentityTab;
