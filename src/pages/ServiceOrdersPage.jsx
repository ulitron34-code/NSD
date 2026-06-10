import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { COLORS } from "../utils/constants";
import ServiceOrderCard from "../components/Services/ServiceOrderCard";
import ServiceOrderDetailPanel from "../components/Services/ServiceOrderDetailPanel";
import { ordersAPI } from "../services/api";
import { demoServiceOrders, mapServiceOrder } from "../data/demoServiceOrders";
import { getOrderReadinessSignal } from "../utils/readinessSignal";
import { uiText, translateCopy } from "../utils/runtimeCopy";

export default function ServiceOrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);
  const copy = (val) => translateCopy(val, i18n.language);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [filter, setFilter] = useState("all");
  const [readinessFilter, setReadinessFilter] = useState("all");

  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      try {
        if (user?.demo) {
          setOrders(demoServiceOrders.map(mapServiceOrder));
          return;
        }

        const { data } = await ordersAPI.list();
        setOrders((data || []).map(mapServiceOrder));
      } catch (error) {
        console.error("Error loading orders:", error);
        if (user?.demo) {
          setOrders(demoServiceOrders.map(mapServiceOrder));
        }
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [user?.demo]);

  const filteredOrders = orders.filter((order) => {
    const statusMatches = filter === "all" || order.status === filter;
    const readinessMatches = readinessFilter === "all" || getOrderReadinessSignal(order).key === readinessFilter;
    return statusMatches && readinessMatches;
  });

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailPanel(true);
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      pending: COLORS.amber,
      in_progress: COLORS.navy,
      completed: COLORS.green,
    };
    return colors[status] || COLORS.textMuted;
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: L("Pendiente", "Pending"),
      in_progress: L("En Progreso", "In Progress"),
      completed: L("Completado", "Completed"),
    };
    return labels[status] || status;
  };

  const totalSpent = orders.reduce((sum, order) => sum + order.amount, 0);
  const completedOrders = orders.filter((order) => order.status === "completed").length;
  const activeOrders = orders.filter((order) => order.status !== "completed" && order.status !== "pending").length;
  const readinessCounts = orders.reduce((acc, order) => {
    const key = getOrderReadinessSignal(order).key;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return <div style={{ padding: "4rem", textAlign: "center" }}>{L("Cargando expedientes...", "Loading compliance files...")}</div>;
  }

  const statCards = [
    { label: L("Expedientes Totales", "Total Compliance Files"), value: orders.length, color: COLORS.navy },
    { label: L("Expedientes Activos", "Active Compliance Files"), value: activeOrders, color: COLORS.amber },
    { label: L("Completadas", "Completed"), value: completedOrders, color: COLORS.green },
    { label: L("Gasto Total", "Total Spend"), value: `$${totalSpent.toLocaleString()}`, color: COLORS.gold },
  ];

  const filterButtons = [
    { value: "all", label: L("Todas", "All") },
    { value: "in_progress", label: L("En Progreso", "In Progress") },
    { value: "completed", label: L("Completadas", "Completed") },
    { value: "pending", label: L("Pendientes", "Pending") },
  ];

  const readinessFilters = [
    { value: "all", label: L("Todos los semaforos", "All Signals"), count: orders.length },
    { value: "green", label: L("Verdes", "Green"), count: readinessCounts.green || 0 },
    { value: "amber", label: L("Subsanables", "Remediable"), count: readinessCounts.amber || 0 },
    { value: "red", label: L("Bloqueados", "Blocked"), count: readinessCounts.red || 0 },
    { value: "pending", label: L("En captura", "In Capture"), count: readinessCounts.pending || 0 },
  ];

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ color: COLORS.navy, fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }}>
          {L("Mis Expedientes", "My Compliance Files")}
        </h1>
        <p style={{ color: COLORS.textMuted }}>
          {L("Gestiona tus proyectos, documentos, revisiones y data rooms", "Manage your projects, documents, reviews and data rooms")}
        </p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "1.5rem",
        marginBottom: "2.5rem",
      }}>
        {statCards.map((stat) => (
          <div key={stat.label} style={{
            background: "white",
            padding: "1.5rem",
            borderRadius: "8px",
            border: `1px solid ${COLORS.border}`,
            borderTop: `4px solid ${stat.color}`,
          }}>
            <p style={{
              color: COLORS.textMuted,
              fontSize: "0.85rem",
              marginBottom: "0.5rem",
              textTransform: "uppercase",
              fontWeight: 600,
            }}>
              {stat.label}
            </p>
            <p style={{ color: COLORS.navy, fontSize: "1.8rem", fontWeight: 800 }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        {filterButtons.map((item) => (
          <button
            key={item.value}
            onClick={() => setFilter(item.value)}
            style={{
              padding: "0.6rem 1.2rem",
              background: filter === item.value ? COLORS.gold : "white",
              color: COLORS.navy,
              border: `1px solid ${filter === item.value ? COLORS.gold : COLORS.border}`,
              borderRadius: "6px",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        {readinessFilters.map((item) => {
          const active = readinessFilter === item.value;
          return (
            <button
              key={item.value}
              onClick={() => setReadinessFilter(item.value)}
              style={{
                padding: "0.55rem 0.85rem",
                background: active ? COLORS.navy : "white",
                color: active ? "white" : COLORS.navy,
                border: `1px solid ${active ? COLORS.navy : COLORS.border}`,
                borderRadius: "6px",
                fontWeight: 800,
                cursor: "pointer",
                fontSize: "0.82rem",
              }}
            >
              {item.label} ({item.count})
            </button>
          );
        })}
      </div>

      {filteredOrders.length === 0 ? (
        <div style={{
          background: "white",
          padding: "3rem 2rem",
          borderRadius: "8px",
          textAlign: "center",
          border: `1px solid ${COLORS.border}`,
        }}>
          <p style={{ color: COLORS.navy, fontSize: "1.35rem", fontWeight: 800, marginBottom: "0.5rem" }}>
            {L("Aun no tienes expedientes activos.", "You don't have active compliance files yet.")}
          </p>
          <p style={{ color: COLORS.textMuted, margin: "0 auto 1.5rem", maxWidth: "620px", lineHeight: 1.6 }}>
            {L("Para probar el data room primero crea un expediente desde Servicios.", "To test the data room, first create a compliance file from Services.")}
          </p>
          <button
            onClick={() => navigate("/services")}
            style={{
              padding: "0.85rem 1.4rem",
              background: COLORS.gold,
              color: COLORS.navy,
              border: "none",
              borderRadius: "6px",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {L("Crear expediente desde servicios", "Create compliance file from services")}
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1.5rem" }}>
          {filteredOrders.map((order) => (
            <ServiceOrderCard
              key={order.id}
              order={order}
              onViewDetails={handleViewDetails}
              statusColor={getStatusBadgeColor(order.status)}
              statusLabel={getStatusLabel(order.status)}
            />
          ))}
        </div>
      )}

      {showDetailPanel && selectedOrder && (
        <ServiceOrderDetailPanel
          order={selectedOrder}
          onClose={() => setShowDetailPanel(false)}
        />
      )}
    </div>
  );
}
