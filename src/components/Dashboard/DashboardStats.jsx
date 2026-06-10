import React from "react";
import { COLORS } from "../../utils/constants";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { caseStatus, complianceTrend, dashboardKpis, riskData } from "../../data/demoDashboard";

export default function DashboardStats() {
  return (
    <div className="dashboard-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "1rem",
        gridColumn: "1 / -1",
      }}>
        {dashboardKpis.map((kpi) => (
          <div key={kpi.title} style={{
            background: COLORS.white,
            padding: "1.5rem",
            borderRadius: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            borderTop: `4px solid ${kpi.color}`,
          }}>
            <p style={{ color: COLORS.textMuted, fontSize: "0.82rem", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {kpi.title}
            </p>
            <p style={{ color: COLORS.navy, fontWeight: 800, fontSize: "2rem", lineHeight: 1 }}>
              {kpi.value}
            </p>
            <p style={{ color: kpi.color, fontWeight: 600, fontSize: "0.86rem", marginTop: "0.65rem" }}>
              {kpi.helper}
            </p>
          </div>
        ))}
      </div>

      <div style={{
        background: COLORS.white,
        padding: "1.5rem",
        borderRadius: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}>
        <h3 style={{ color: COLORS.navy, marginBottom: "1rem", fontWeight: 700 }}>
          Evolucion de cumplimiento
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={complianceTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
            <XAxis dataKey="month" stroke={COLORS.textMuted} />
            <YAxis stroke={COLORS.textMuted} />
            <Tooltip contentStyle={{ background: COLORS.white, border: `1px solid ${COLORS.border}` }} />
            <Bar dataKey="completos" fill={COLORS.green} name="Completos" />
            <Bar dataKey="pendientes" fill={COLORS.amber} name="Pendientes" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{
        background: COLORS.white,
        padding: "1.5rem",
        borderRadius: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}>
        <h3 style={{ color: COLORS.navy, marginBottom: "1rem", fontWeight: 700 }}>
          Estado de expedientes
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={caseStatus}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={100}
              dataKey="value"
            >
              {caseStatus.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div style={{
        background: COLORS.white,
        padding: "1.5rem",
        borderRadius: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        gridColumn: "1 / -1",
      }}>
        <h3 style={{ color: COLORS.navy, marginBottom: "1rem", fontWeight: 700 }}>
          Distribucion de riesgo
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={riskData}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
            <XAxis dataKey="range" stroke={COLORS.textMuted} />
            <YAxis stroke={COLORS.textMuted} />
            <Tooltip contentStyle={{ background: COLORS.white, border: `1px solid ${COLORS.border}` }} />
            <Bar dataKey="count" fill={COLORS.gold} name="Expedientes" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
