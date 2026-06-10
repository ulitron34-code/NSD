import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { COLORS } from "../utils/constants";

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
  const [filter, setFilter] = useState("all");

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