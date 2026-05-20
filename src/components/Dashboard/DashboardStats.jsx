import React, { useState } from "react";
import { COLORS } from "../../utils/constants";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function DashboardStats() {
  // Datos simulados
  const analysisData = [
    {month: "Ene", analizados: 24, aprobados: 18},
    {month: "Feb", analizados: 32, aprobados: 25},
    {month: "Mar", analizados: 28, aprobados: 22},
    {month: "Abr", analizados: 35, aprobados: 28},
    {month: "May", analizados: 42, aprobados: 35},
    {month: "Jun", analizados: 38, aprobados: 32},
  ];

  const projectsData = [
    {name: "Draft", value: 8, color: COLORS.textMuted},
    {name: "Submitted", value: 12, color: COLORS.amber},
    {name: "Approved", value: 5, color: COLORS.green},
  ];

  const scoreDistribution = [
    {range: "0-50", count: 2},
    {range: "50-70", count: 8},
    {range: "70-85", count: 15},
    {range: "85-100", count: 5},
  ];

  return (
    <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "2rem", marginBottom: "2rem"}}>
      {/* KPIs Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "1rem",
        gridColumn: "1 / -1",
      }}>
        {[
          {title: "Análisis Realizados", value: "199", icon: "👥", color: COLORS.navy},
          {title: "Proyectos Activos", value: "25", icon: "📁", color: COLORS.gold},
          {title: "Tasa de Aprobación", value: "88%", icon: "✓", color: COLORS.green},
          {title: "Score Promedio", value: "76", icon: "📊", color: COLORS.amber},
        ].map((kpi, i) => (
          <div key={i} style={{
            background: COLORS.white,
            padding: "1.5rem",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            borderTop: `4px solid ${kpi.color}`,
          }}>
            <div style={{fontSize: "1.8rem", marginBottom: "0.5rem"}}>{kpi.icon}</div>
            <p style={{color: COLORS.textMuted, fontSize: "0.85rem", marginBottom: "0.5rem"}}>
              {kpi.title}
            </p>
            <p style={{color: COLORS.navy, fontWeight: "700", fontSize: "1.8rem"}}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Line Chart: Análisis por Mes */}
      <div style={{
        background: COLORS.white,
        padding: "1.5rem",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}>
        <h3 style={{color: COLORS.navy, marginBottom: "1rem", fontWeight: "600"}}>
          Análisis Realizados (Últimos 6 meses)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analysisData}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
            <XAxis dataKey="month" stroke={COLORS.textMuted} />
            <YAxis stroke={COLORS.textMuted} />
            <Tooltip 
              contentStyle={{background: COLORS.white, border: `1px solid ${COLORS.border}`}}
              cursor={{stroke: COLORS.gold}}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="analizados" 
              stroke={COLORS.navy} 
              strokeWidth={2}
              name="Total Analizados"
              dot={{fill: COLORS.navy}}
            />
            <Line 
              type="monotone" 
              dataKey="aprobados" 
              stroke={COLORS.green} 
              strokeWidth={2}
              name="Aprobados"
              dot={{fill: COLORS.green}}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart: Estado de Proyectos */}
      <div style={{
        background: COLORS.white,
        padding: "1.5rem",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}>
        <h3 style={{color: COLORS.navy, marginBottom: "1rem", fontWeight: "600"}}>
          Estado de Proyectos
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={projectsData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({name, value}) => `${name}: ${value}`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {projectsData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Bar Chart: Distribución de Scores */}
      <div style={{
        background: COLORS.white,
        padding: "1.5rem",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}>
        <h3 style={{color: COLORS.navy, marginBottom: "1rem", fontWeight: "600"}}>
          Distribución de Scores
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={scoreDistribution}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
            <XAxis dataKey="range" stroke={COLORS.textMuted} />
            <YAxis stroke={COLORS.textMuted} />
            <Tooltip 
              contentStyle={{background: COLORS.white, border: `1px solid ${COLORS.border}`}}
            />
            <Bar dataKey="count" fill={COLORS.gold} name="Cantidad" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
