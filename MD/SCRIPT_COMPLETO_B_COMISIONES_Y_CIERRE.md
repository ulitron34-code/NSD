# 🚀 SCRIPT COMPLETO B: COMISIONES + CIERRE DE CRÉDITOS

**TODO el código para copiar-pegar directamente. Sin pensar, sin dudas.**

---

## 📦 RESUMEN

- ✅ Panel de Servicios en Dashboard
- ✅ Sistema de Cierre de Créditos
- ✅ Dashboard de Comisiones (para otorgantes)
- ✅ Tracking de órdenes
- ✅ Timeline de estado

---

# 1️⃣ CREAR: `src/pages/ServiceOrdersPage.jsx`

**Crea un archivo NUEVO y pega TODO esto:**

```javascript
import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { COLORS } from "../utils/constants";
import ServiceOrderCard from "../components/Services/ServiceOrderCard";
import ServiceOrderDetailPanel from "../components/Services/ServiceOrderDetailPanel";

// Mock data - después conectar a API real
const MOCK_ORDERS = [
  {
    id: "order-1",
    serviceId: "business-plan",
    serviceName: "Business Plan Profesional",
    projectName: "Desarrollo Inmobiliario Tech Park",
    status: "in_progress",
    progress: 65,
    amount: 2500,
    specialist: {
      id: "spec-1",
      name: "Carlos Mendoza",
      email: "carlos@nsd.com",
      avatar: "CM",
    },
    createdAt: "2026-05-15",
    expectedDelivery: "2026-05-25",
    timeline: [
      { date: "2026-05-15", event: "Orden creada", status: "completed" },
      { date: "2026-05-16", event: "Especialista asignado", status: "completed" },
      { date: "2026-05-20", event: "Análisis de mercado completado", status: "completed" },
      { date: "2026-05-22", event: "Revisión interna", status: "in_progress" },
      { date: "2026-05-25", event: "Entrega final", status: "pending" },
    ],
  },
  {
    id: "order-2",
    serviceId: "financial-analysis",
    serviceName: "Análisis Financiero Avanzado",
    projectName: "Planta Solar Las Dunas",
    status: "completed",
    progress: 100,
    amount: 1500,
    specialist: {
      id: "spec-2",
      name: "Ana García",
      email: "ana@nsd.com",
      avatar: "AG",
    },
    createdAt: "2026-05-10",
    completedAt: "2026-05-18",
    timeline: [
      { date: "2026-05-10", event: "Orden creada", status: "completed" },
      { date: "2026-05-11", event: "Especialista asignado", status: "completed" },
      { date: "2026-05-15", event: "DCF modelado", status: "completed" },
      { date: "2026-05-18", event: "Análisis entregado", status: "completed" },
    ],
  },
];

export default function ServiceOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [filter, setFilter] = useState("all"); // all, pending, in_progress, completed

  useEffect(() => {
    // Aquí irá la llamada real a la API
    // const response = await serviceService.getUserOrders();
    // setOrders(response.data);
  }, []);

  const filteredOrders = filter === "all"
    ? orders
    : orders.filter((o) => o.status === filter);

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
      pending: "Pendiente",
      in_progress: "En Progreso",
      completed: "Completado",
    };
    return labels[status] || status;
  };

  const totalSpent = orders.reduce((sum, order) => sum + order.amount, 0);
  const completedOrders = orders.filter((o) => o.status === "completed").length;
  const activeOrders = orders.filter((o) => o.status !== "completed").length;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{
          color: COLORS.navy,
          fontSize: "2rem",
          fontWeight: 800,
          marginBottom: "0.5rem",
        }}>
          Mis Órdenes de Servicio
        </h1>
        <p style={{ color: COLORS.textMuted }}>
          Gestiona tus solicitudes de servicios profesionales
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "1.5rem",
        marginBottom: "2.5rem",
      }}>
        {[
          { label: "Órdenes Totales", value: orders.length, color: COLORS.navy },
          { label: "Órdenes Activas", value: activeOrders, color: COLORS.amber },
          { label: "Completadas", value: completedOrders, color: COLORS.green },
          { label: "Gasto Total", value: `$${totalSpent.toLocaleString()}`, color: COLORS.gold },
        ].map((stat, i) => (
          <div key={i} style={{
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
            <p style={{
              color: COLORS.navy,
              fontSize: "1.8rem",
              fontWeight: 800,
            }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        display: "flex",
        gap: "1rem",
        marginBottom: "2rem",
        flexWrap: "wrap",
      }}>
        {[
          { value: "all", label: "Todas" },
          { value: "in_progress", label: "En Progreso" },
          { value: "completed", label: "Completadas" },
          { value: "pending", label: "Pendientes" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            style={{
              padding: "0.6rem 1.2rem",
              background: filter === f.value ? COLORS.gold : "white",
              color: filter === f.value ? COLORS.navy : COLORS.navy,
              border: `1px solid ${filter === f.value ? COLORS.gold : COLORS.border}`,
              borderRadius: "6px",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "0.9rem",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => {
              if (filter !== f.value) {
                e.target.style.borderColor = COLORS.gold;
              }
            }}
            onMouseLeave={(e) => {
              if (filter !== f.value) {
                e.target.style.borderColor = COLORS.border;
              }
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div style={{
          background: "white",
          padding: "3rem 2rem",
          borderRadius: "8px",
          textAlign: "center",
          border: `1px solid ${COLORS.border}`,
        }}>
          <p style={{ color: COLORS.textMuted, fontSize: "1.1rem" }}>
            No hay órdenes en este estado.
          </p>
          <p style={{ color: COLORS.textMuted, marginTop: "0.5rem" }}>
            <a href="/services" style={{ color: COLORS.gold, textDecoration: "none" }}>
              Ver servicios disponibles
            </a>
          </p>
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

      {/* Detail Panel */}
      {showDetailPanel && selectedOrder && (
        <ServiceOrderDetailPanel
          order={selectedOrder}
          onClose={() => setShowDetailPanel(false)}
        />
      )}
    </div>
  );
}
```

---

# 2️⃣ CREAR: `src/components/Services/ServiceOrderCard.jsx`

**Crea un archivo NUEVO y pega TODO esto:**

```javascript
import React from "react";
import { COLORS } from "../../utils/constants";

export default function ServiceOrderCard({ order, onViewDetails, statusColor, statusLabel }) {
  const getProgressColor = (progress) => {
    if (progress < 33) return COLORS.amber;
    if (progress < 66) return COLORS.navy;
    return COLORS.green;
  };

  return (
    <div style={{
      background: "white",
      padding: "1.5rem",
      borderRadius: "8px",
      border: `1px solid ${COLORS.border}`,
      display: "grid",
      gridTemplateColumns: "1fr auto",
      alignItems: "center",
      gap: "2rem",
      transition: "all 0.3s",
      cursor: "pointer",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
      e.currentTarget.style.transform = "translateY(-2px)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = "none";
      e.currentTarget.style.transform = "translateY(0)";
    }}>
      {/* Left side */}
      <div>
        {/* Service & Project */}
        <div style={{ marginBottom: "1rem" }}>
          <p style={{
            color: COLORS.gold,
            fontSize: "0.8rem",
            fontWeight: 600,
            marginBottom: "0.25rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}>
            {order.serviceName}
          </p>
          <h3 style={{
            color: COLORS.navy,
            fontSize: "1.2rem",
            fontWeight: 700,
            marginBottom: "0.5rem",
          }}>
            {order.projectName}
          </h3>
          <p style={{ color: COLORS.textMuted, fontSize: "0.9rem" }}>
            Iniciado: {new Date(order.createdAt).toLocaleDateString('es-MX')}
          </p>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: "1rem" }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "0.5rem",
          }}>
            <p style={{
              color: COLORS.textMuted,
              fontSize: "0.85rem",
              fontWeight: 600,
            }}>
              Progreso
            </p>
            <p style={{
              color: getProgressColor(order.progress),
              fontSize: "0.85rem",
              fontWeight: 700,
            }}>
              {order.progress}%
            </p>
          </div>
          <div style={{
            height: "6px",
            background: COLORS.bg,
            borderRadius: "999px",
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${order.progress}%`,
              background: getProgressColor(order.progress),
              transition: "width 0.6s ease",
            }} />
          </div>
        </div>

        {/* Specialist info */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}>
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: COLORS.gold,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: "0.85rem",
            color: COLORS.navy,
          }}>
            {order.specialist.avatar}
          </div>
          <div>
            <p style={{
              color: COLORS.navy,
              fontWeight: 600,
              fontSize: "0.9rem",
            }}>
              {order.specialist.name}
            </p>
            <p style={{
              color: COLORS.textMuted,
              fontSize: "0.8rem",
            }}>
              Especialista
            </p>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "1.5rem",
      }}>
        {/* Status & Price */}
        <div style={{ textAlign: "right" }}>
          <div style={{
            display: "inline-block",
            padding: "0.4rem 0.9rem",
            background: statusColor,
            color: "white",
            borderRadius: "20px",
            fontWeight: 600,
            fontSize: "0.8rem",
            marginBottom: "0.75rem",
          }}>
            {statusLabel}
          </div>
          <p style={{
            color: COLORS.navy,
            fontSize: "1.4rem",
            fontWeight: 800,
          }}>
            ${order.amount.toLocaleString()}
          </p>
          <p style={{
            color: COLORS.textMuted,
            fontSize: "0.85rem",
          }}>
            Entrega: {new Date(order.expectedDelivery || order.completedAt).toLocaleDateString('es-MX')}
          </p>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => onViewDetails(order)}
          style={{
            padding: "0.7rem 1.5rem",
            background: COLORS.navy,
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-1px)";
            e.target.style.boxShadow = "0 4px 12px rgba(27,58,92,0.3)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "none";
          }}
        >
          Ver Detalles
        </button>
      </div>
    </div>
  );
}
```

---

# 3️⃣ CREAR: `src/components/Services/ServiceOrderDetailPanel.jsx`

**Crea un archivo NUEVO y pega TODO esto:**

```javascript
import React, { useState } from "react";
import { COLORS } from "../../utils/constants";

export default function ServiceOrderDetailPanel({ order, onClose }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      author: "Carlos Mendoza",
      role: "Especialista",
      message: "Hola, he revisado tu proyecto. Necesito algunos documentos adicionales.",
      timestamp: "2026-05-20 10:30",
    },
  ]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        author: "Tú",
        role: "Cliente",
        message: message,
        timestamp: new Date().toLocaleString(),
      },
    ]);
    setMessage("");
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      right: 0,
      height: "100%",
      width: "100%",
      maxWidth: "450px",
      background: "white",
      boxShadow: "-2px 0 12px rgba(0,0,0,0.15)",
      overflowY: "auto",
      zIndex: 999,
      animation: "slideInRight 0.3s ease",
    }}>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>

      {/* Header */}
      <div style={{
        padding: "1.5rem",
        borderBottom: `1px solid ${COLORS.border}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: COLORS.bg,
      }}>
        <div>
          <h2 style={{
            color: COLORS.navy,
            fontSize: "1.2rem",
            fontWeight: 700,
            marginBottom: "0.25rem",
          }}>
            {order.projectName}
          </h2>
          <p style={{
            color: COLORS.textMuted,
            fontSize: "0.85rem",
          }}>
            {order.serviceName}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            fontSize: "1.5rem",
            cursor: "pointer",
            color: COLORS.textMuted,
          }}
        >
          ✕
        </button>
      </div>

      {/* Timeline */}
      <div style={{ padding: "2rem 1.5rem", borderBottom: `1px solid ${COLORS.border}` }}>
        <h3 style={{
          color: COLORS.navy,
          fontSize: "0.95rem",
          fontWeight: 700,
          marginBottom: "1.5rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}>
          Timeline
        </h3>

        <div style={{ position: "relative", paddingLeft: "2rem" }}>
          {order.timeline.map((item, i) => (
            <div key={i} style={{ marginBottom: "1.5rem", position: "relative" }}>
              {/* Dot */}
              <div style={{
                position: "absolute",
                left: "-2rem",
                top: "0",
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                background: item.status === "completed" ? COLORS.green : item.status === "in_progress" ? COLORS.amber : COLORS.border,
                border: `2px solid white`,
              }} />

              {/* Line */}
              {i < order.timeline.length - 1 && (
                <div style={{
                  position: "absolute",
                  left: "-1.92rem",
                  top: "16px",
                  width: "2px",
                  height: "30px",
                  background: COLORS.border,
                }} />
              )}

              {/* Content */}
              <div>
                <p style={{
                  color: item.status === "completed" ? COLORS.green : item.status === "in_progress" ? COLORS.amber : COLORS.textMuted,
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  marginBottom: "0.25rem",
                }}>
                  {item.event}
                </p>
                <p style={{
                  color: COLORS.textMuted,
                  fontSize: "0.8rem",
                }}>
                  {item.date}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div style={{
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        height: "calc(100% - 400px)",
      }}>
        <h3 style={{
          color: COLORS.navy,
          fontSize: "0.95rem",
          fontWeight: 700,
          marginBottom: "1rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}>
          Chat con Especialista
        </h3>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          marginBottom: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{
              background: msg.role === "Cliente" ? COLORS.navy : COLORS.bg,
              color: msg.role === "Cliente" ? "white" : COLORS.text,
              padding: "0.9rem 1rem",
              borderRadius: "8px",
              fontSize: "0.9rem",
              lineHeight: 1.5,
            }}>
              <p style={{
                fontWeight: 600,
                marginBottom: "0.25rem",
                fontSize: "0.85rem",
                opacity: 0.8,
              }}>
                {msg.author}
              </p>
              <p style={{ marginBottom: "0.5rem" }}>{msg.message}</p>
              <p style={{
                fontSize: "0.75rem",
                opacity: 0.6,
              }}>
                {msg.timestamp}
              </p>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <form onSubmit={handleSubmitMessage} style={{
          display: "flex",
          gap: "0.5rem",
        }}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe tu mensaje..."
            style={{
              flex: 1,
              padding: "0.7rem 1rem",
              border: `1px solid ${COLORS.border}`,
              borderRadius: "6px",
              fontSize: "0.9rem",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "0.7rem 1.2rem",
              background: COLORS.gold,
              color: COLORS.navy,
              border: "none",
              borderRadius: "6px",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            Enviar
          </button>
        </form>
      </div>

      {/* Footer */}
      <div style={{
        padding: "1.5rem",
        borderTop: `1px solid ${COLORS.border}`,
        background: COLORS.bg,
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
        }}>
          <div>
            <p style={{
              color: COLORS.textMuted,
              fontSize: "0.75rem",
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: "0.25rem",
            }}>
              Monto
            </p>
            <p style={{
              color: COLORS.navy,
              fontWeight: 700,
              fontSize: "1.2rem",
            }}>
              ${order.amount.toLocaleString()}
            </p>
          </div>
          <div>
            <p style={{
              color: COLORS.textMuted,
              fontSize: "0.75rem",
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: "0.25rem",
            }}>
              Entrega Estimada
            </p>
            <p style={{
              color: COLORS.navy,
              fontWeight: 700,
              fontSize: "1rem",
            }}>
              {new Date(order.expectedDelivery).toLocaleDateString('es-MX')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

# 4️⃣ CREAR: `src/pages/CommissionsPage.jsx`

**Crea un archivo NUEVO y pega TODO esto:**

```javascript
import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { COLORS } from "../utils/constants";

// Mock data - después conectar a API real
const MOCK_COMMISSIONS = [
  {
    id: "closure-1",
    projectName: "Desarrollo Inmobiliario Tech Park",
    solicitanteName: "Juan Carlos López",
    creditAmount: 500000,
    commissionRate: 0.02,
    commission: 10000,
    closureDate: "2026-05-15",
    status: "completed",
    solicitantEmail: "juan@example.com",
  },
  {
    id: "closure-2",
    projectName: "Planta Solar Las Dunas",
    solicitanteName: "María García Rodríguez",
    creditAmount: 750000,
    commissionRate: 0.02,
    commission: 15000,
    closureDate: "2026-05-10",
    status: "completed",
    solicitantEmail: "maria@example.com",
  },
  {
    id: "closure-3",
    projectName: "Fondo de Inversión Tech Startup",
    solicitanteName: "Roberto Martínez",
    creditAmount: 250000,
    commissionRate: 0.02,
    commission: 5000,
    closureDate: "2026-05-20",
    status: "pending",
    solicitantEmail: "roberto@example.com",
  },
];

export default function CommissionsPage() {
  const { user } = useAuth();
  const [closures, setClosures] = useState(MOCK_COMMISSIONS);
  const [filter, setFilter] = useState("all"); // all, completed, pending

  const filteredClosures = filter === "all"
    ? closures
    : closures.filter((c) => c.status === filter);

  const totalCommissions = closures
    .filter((c) => c.status === "completed")
    .reduce((sum, c) => sum + c.commission, 0);

  const pendingCommissions = closures
    .filter((c) => c.status === "pending")
    .reduce((sum, c) => sum + c.commission, 0);

  const totalCredit = closures.reduce((sum, c) => sum + c.creditAmount, 0);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{
          color: COLORS.navy,
          fontSize: "2rem",
          fontWeight: 800,
          marginBottom: "0.5rem",
        }}>
          Dashboard de Comisiones
        </h1>
        <p style={{ color: COLORS.textMuted }}>
          Gestiona tus comisiones por cierre de créditos
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "1.5rem",
        marginBottom: "2.5rem",
      }}>
        {[
          { label: "Comisiones Completadas", value: `$${totalCommissions.toLocaleString()}`, color: COLORS.green },
          { label: "Comisiones Pendientes", value: `$${pendingCommissions.toLocaleString()}`, color: COLORS.amber },
          { label: "Crédito Total Colocado", value: `$${totalCredit.toLocaleString()}`, color: COLORS.gold },
          { label: "Cierres Totales", value: closures.length, color: COLORS.navy },
        ].map((stat, i) => (
          <div key={i} style={{
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
            <p style={{
              color: COLORS.navy,
              fontSize: "1.8rem",
              fontWeight: 800,
            }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        display: "flex",
        gap: "1rem",
        marginBottom: "2rem",
      }}>
        {[
          { value: "all", label: "Todas" },
          { value: "completed", label: "Pagadas" },
          { value: "pending", label: "Pendientes" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            style={{
              padding: "0.6rem 1.2rem",
              background: filter === f.value ? COLORS.gold : "white",
              color: filter === f.value ? COLORS.navy : COLORS.navy,
              border: `1px solid ${filter === f.value ? COLORS.gold : COLORS.border}`,
              borderRadius: "6px",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{
        background: "white",
        borderRadius: "8px",
        border: `1px solid ${COLORS.border}`,
        overflow: "hidden",
      }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
        }}>
          <thead>
            <tr style={{ background: COLORS.bg, borderBottom: `1px solid ${COLORS.border}` }}>
              {["Proyecto", "Solicitante", "Monto Crédito", "Comisión", "Fecha", "Estado"].map((header) => (
                <th
                  key={header}
                  style={{
                    padding: "1rem",
                    textAlign: "left",
                    color: COLORS.navy,
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredClosures.map((closure) => (
              <tr
                key={closure.id}
                style={{
                  borderBottom: `1px solid ${COLORS.border}`,
                  transition: "background 0.2s",
                  "&:hover": { background: COLORS.bg },
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = COLORS.bg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <td style={{
                  padding: "1rem",
                  color: COLORS.navy,
                  fontWeight: 600,
                  fontSize: "0.95rem",
                }}>
                  {closure.projectName}
                </td>
                <td style={{
                  padding: "1rem",
                  color: COLORS.text,
                  fontSize: "0.95rem",
                }}>
                  {closure.solicitanteName}
                </td>
                <td style={{
                  padding: "1rem",
                  color: COLORS.navy,
                  fontWeight: 600,
                  fontSize: "0.95rem",
                }}>
                  ${closure.creditAmount.toLocaleString()}
                </td>
                <td style={{
                  padding: "1rem",
                  color: COLORS.gold,
                  fontWeight: 700,
                  fontSize: "0.95rem",
                }}>
                  ${closure.commission.toLocaleString()}
                </td>
                <td style={{
                  padding: "1rem",
                  color: COLORS.textMuted,
                  fontSize: "0.95rem",
                }}>
                  {new Date(closure.closureDate).toLocaleDateString('es-MX')}
                </td>
                <td style={{
                  padding: "1rem",
                }}>
                  <span style={{
                    display: "inline-block",
                    padding: "0.4rem 0.9rem",
                    background: closure.status === "completed" ? COLORS.green : COLORS.amber,
                    color: "white",
                    borderRadius: "20px",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                  }}>
                    {closure.status === "completed" ? "Pagada" : "Pendiente"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {filteredClosures.length === 0 && (
        <div style={{
          background: "white",
          padding: "3rem 2rem",
          borderRadius: "8px",
          textAlign: "center",
          border: `1px solid ${COLORS.border}`,
          marginTop: "2rem",
        }}>
          <p style={{ color: COLORS.textMuted, fontSize: "1.1rem" }}>
            No hay cierres en este estado.
          </p>
        </div>
      )}
    </div>
  );
}
```

---

# 5️⃣ ACTUALIZAR: `src/pages/DashboardPage.jsx`

**Encuentra la lista de `tabs` y AGREGA estas dos nuevas líneas:**

```javascript
// Dentro de const tabs = [...]
const tabs = [
  { id: "inicio",       label: "Inicio",            icon: "🏠" },
  { id: "solicitantes", label: "Solicitantes",     icon: "👥" },
  { id: "cumplimiento", label: "Cumplimiento",     icon: "✓"  },
  { id: "proyectos",    label: "Mis Proyectos",    icon: "📁" },
  { id: "otorgantes",   label: "Otorgantes",       icon: "🏦" },
  { id: "servicios",    label: "Mis Servicios",    icon: "💼" },  {/* ← NUEVA */}
  { id: "comisiones",   label: "Comisiones",       icon: "💰" },  {/* ← NUEVA */}
];
```

**Y en la función `renderContent()`, AGREGA estos casos:**

```javascript
case "servicios": return <ServiceOrdersPage />;
case "comisiones": return <CommissionsPage />;
```

**Y AGREGA estos imports al inicio:**

```javascript
import ServiceOrdersPage from "../pages/ServiceOrdersPage";
import CommissionsPage from "../pages/CommissionsPage";
```

---

# 6️⃣ ACTUALIZAR: `src/App.jsx`

**Agrega esta ruta (después de /services y antes de /dashboard):**

```javascript
<Route path="/service-orders" element={<ProtectedRoute><><Header /><ServiceOrdersPage /></></ProtectedRoute>} />
<Route path="/commissions" element={<ProtectedRoute><><Header /><CommissionsPage /></></ProtectedRoute>} />
```

---

# ✅ CHECKLIST SCRIPT B

```
[ ] Creado: src/pages/ServiceOrdersPage.jsx
[ ] Creado: src/components/Services/ServiceOrderCard.jsx
[ ] Creado: src/components/Services/ServiceOrderDetailPanel.jsx
[ ] Creado: src/pages/CommissionsPage.jsx
[ ] Actualizado: DashboardPage.jsx (tabs + cases + imports)
[ ] Actualizado: App.jsx (rutas)
[ ] Ejecutado: npm run dev
[ ] Verificado: Dashboard tiene 2 nuevas tabs
[ ] Verificado: Servicios y Comisiones cargan sin errores
[ ] Verificado: Timeline aparece en el panel de detalles
[ ] Verificado: Chat funciona (mock)
```

---

## 🎯 RESUMEN FINAL (A + B)

**TIENES AHORA:**

✅ Sección de Servicios en Landing
✅ Formulario de solicitud de servicios
✅ Dashboard de órdenes de servicio
✅ Timeline + Chat por orden
✅ Dashboard de comisiones para otorgantes
✅ Tracking de cierre de créditos

**PRÓXIMO PASO:**

Conectar todo a APIs reales (backend):
- Service Orders API
- Commissions API
- Payment Gateway (Stripe)

**¿YA EMPEZASTE A COPIAR?** ⚡

Cualquier duda, avísame. Todo está listo para pegar.
