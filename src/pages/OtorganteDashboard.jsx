import React, { useState, useEffect } from "react";
import { COLORS } from "../utils/constants";
import { ordersAPI } from "../services/api";
import ExecutiveReportPanel from "../components/Services/ExecutiveReportPanel";
import VerifyIdentityTab from "../components/Services/VerifyIdentityTab";
import { demoServiceOrders } from "../data/demoServiceOrders";
import { useAuth } from "../hooks/useAuth";

export default function OtorganteDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState("pipeline"); // "pipeline" o "verify-identity"

  useEffect(() => {
    loadOrders();
  }, [user?.demo]);

  const loadOrders = async () => {
    try {
      if (user?.demo) {
        setOrders(demoServiceOrders);
        return;
      }

      // Por ahora jalamos todas las ordenes. En un futuro filtraremos por las asignadas al Otorgante.
      const { data } = await ordersAPI.list();
      setOrders(data || []);
    } catch (err) {
      setError("No se pudieron cargar los expedientes del pipeline.");
      if (user?.demo) {
        setOrders(demoServiceOrders);
        setError("");
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return COLORS.amber;
      case "completed": return COLORS.green;
      default: return COLORS.textMuted;
    }
  };

  return (
    <div>
      {/* Tab Navigation */}
      <div style={{
        background: "white",
        borderBottom: `2px solid ${COLORS.border}`,
        display: "flex",
        gap: "0rem"
      }}>
        <button
          onClick={() => {
            setActiveTab("pipeline");
            setSelectedOrder(null);
          }}
          style={{
            padding: "1.25rem 1.5rem",
            background: activeTab === "pipeline" ? "white" : "transparent",
            border: "none",
            borderBottom: activeTab === "pipeline" ? `3px solid ${COLORS.navy}` : "none",
            color: activeTab === "pipeline" ? COLORS.navy : COLORS.textMuted,
            fontWeight: activeTab === "pipeline" ? 700 : 500,
            fontSize: "1rem",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            if (activeTab !== "pipeline") {
              e.target.style.color = COLORS.navy;
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "pipeline") {
              e.target.style.color = COLORS.textMuted;
            }
          }}
        >
          📊 Pipeline de Crédito
        </button>

        <button
          onClick={() => setActiveTab("verify-identity")}
          style={{
            padding: "1.25rem 1.5rem",
            background: activeTab === "verify-identity" ? "white" : "transparent",
            border: "none",
            borderBottom: activeTab === "verify-identity" ? `3px solid ${COLORS.navy}` : "none",
            color: activeTab === "verify-identity" ? COLORS.navy : COLORS.textMuted,
            fontWeight: activeTab === "verify-identity" ? 700 : 500,
            fontSize: "1rem",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            if (activeTab !== "verify-identity") {
              e.target.style.color = COLORS.navy;
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "verify-identity") {
              e.target.style.color = COLORS.textMuted;
            }
          }}
        >
          🔍 Verificar Identidad
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "pipeline" ? (
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "2rem",
          display: "grid",
          gridTemplateColumns: selectedOrder ? "1fr 1fr" : "1fr",
          gap: "2rem",
          alignItems: "start"
        }}>
          {/* Columna Izquierda: Pipeline */}
          <div>
            <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h1 style={{ color: COLORS.navy, fontSize: "2rem", marginBottom: "0.5rem" }}>
                  Pipeline de Crédito (Otorgante)
                </h1>
                <p style={{ color: COLORS.textMuted, fontSize: "1.1rem" }}>
                  Expedientes recibidos y listos para análisis y comité.
                </p>
              </div>
              <button style={{
                background: COLORS.gold,
                color: COLORS.navy,
                padding: "0.8rem 1.5rem",
                border: "none",
                borderRadius: "8px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
              }}>
                + Alta Manual de Proyecto
              </button>
            </div>

            {error && (
              <div style={{ background: "#fef2f2", color: "#991b1b", padding: "1rem", borderRadius: "8px", marginBottom: "2rem" }}>
                {error}
              </div>
            )}

            {loading ? (
              <p>Cargando pipeline...</p>
            ) : orders.length === 0 ? (
              <div style={{ background: "white", padding: "3rem", textAlign: "center", borderRadius: "12px", border: `1px solid ${COLORS.border}` }}>
                <h3 style={{ color: COLORS.navy, marginBottom: "0.5rem" }}>No hay expedientes activos</h3>
                <p style={{ color: COLORS.textMuted }}>Tu pipeline está vacío por el momento.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "1rem" }}>
                {orders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    style={{
                      background: "white",
                      padding: "1.5rem",
                      borderRadius: "12px",
                      border: `2px solid ${selectedOrder?.id === order.id ? COLORS.navy : COLORS.border}`,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow: selectedOrder?.id === order.id ? "0 4px 12px rgba(0,0,0,0.1)" : "none"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
                      <div>
                        <h3 style={{ color: COLORS.navy, fontSize: "1.1rem", margin: "0 0 0.25rem 0" }}>
                          Expediente #{order.id.slice(0,8)}
                        </h3>
                        <p style={{ color: COLORS.textMuted, fontSize: "0.9rem", margin: 0 }}>
                          Monto Solicitado: ${(order.amount / 100).toLocaleString('en-US')} USD
                        </p>
                      </div>
                      <span style={{
                        background: `${getStatusColor(order.status)}15`,
                        color: getStatusColor(order.status),
                        padding: "0.4rem 0.8rem",
                        borderRadius: "20px",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        textTransform: "uppercase"
                      }}>
                        {order.status}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <p style={{ color: COLORS.text, fontSize: "0.9rem", margin: 0 }}>
                        <strong>Tipo:</strong> {order.service_type.replace('_', ' ')}
                      </p>
                      <p style={{ color: COLORS.textMuted, fontSize: "0.8rem", margin: 0 }}>
                        Ingresado: {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Columna Derecha: Detalles y Reporte Ejecutivo */}
          {selectedOrder && (
            <div style={{ position: "sticky", top: "2rem" }}>
              <ExecutiveReportPanel order={selectedOrder} />
            </div>
          )}
        </div>
      ) : (
        /* Tab: Verify Identity */
        <VerifyIdentityTab />
      )}
    </div>
  );
}
