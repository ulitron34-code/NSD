// ============================================
// NEXUS PLATFORM - ANALYTICS DASHBOARD COMPONENT
// Enhanced metrics and KPIs for admin dashboard
// ============================================

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../utils/constants';
import { uiText } from '../utils/runtimeCopy';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

// Demo analytics data
const DEMO_METRICS = {
  totalExpedientes: 156,
  expedientesMes: 23,
  crecimiento: 12.5,
  scorePromedio: 72,
  tasaConversion: 34.2,
  usuariosActivos: 89,
};

// Pipeline by month (last 6 months)
const PIPELINE_DATA = [
  { month: 'Ene', expedientes: 18, score: 68 },
  { month: 'Feb', expedientes: 24, score: 71 },
  { month: 'Mar', expedientes: 31, score: 74 },
  { month: 'Abr', expedientes: 28, score: 72 },
  { month: 'May', expedientes: 35, score: 76 },
  { month: 'Jun', expedientes: 42, score: 78 },
];

// Distribution by sector
const SECTOR_DATA = [
  { name: 'Fintech', value: 35, color: '#1565C0' },
  { name: 'SaaS', value: 28, color: '#C9A227' },
  { name: 'E-commerce', value: 18, color: '#2E7D32' },
  { name: 'Real Estate', value: 12, color: '#7B1FA2' },
  { name: 'Otros', value: 7, color: '#64748B' },
];

// Distribution by risk
const RISK_DATA = [
  { name: 'Bajo', value: 45, color: '#2E7D32' },
  { name: 'Medio', value: 38, color: '#F57C00' },
  { name: 'Alto', value: 17, color: '#C62828' },
];

// Top performing features
const FEATURE_USAGE = [
  { name: 'Triaje IA', usage: 92, trend: '+8%' },
  { name: 'Data Room', usage: 78, trend: '+12%' },
  { name: 'Scoring', usage: 65, trend: '+3%' },
  { name: 'Documentos', usage: 58, trend: '+15%' },
  { name: 'Biométricos', usage: 23, trend: '+0%' },
];

export default function AnalyticsDashboard() {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);
  const isEn = String(i18n.language).toLowerCase().startsWith('en');
  
  const [period, setPeriod] = useState('6m');
  const [selectedMetric, setSelectedMetric] = useState('pipeline');

  // Metric cards data
  const metricCards = useMemo(() => [
    {
      label: L('Total expedientes', 'Total files'),
      value: DEMO_METRICS.totalExpedientes,
      trend: '+23%',
      trendUp: true,
      icon: '📁',
      color: COLORS.navy
    },
    {
      label: L('Este mes', 'This month'),
      value: DEMO_METRICS.expedientesMes,
      trend: '+5',
      trendUp: true,
      icon: '📅',
      color: COLORS.blue
    },
    {
      label: L('Score promedio', 'Average score'),
      value: `${DEMO_METRICS.scorePromedio}%`,
      trend: '+4%',
      trendUp: true,
      icon: '📊',
      color: COLORS.gold
    },
    {
      label: L('Tasa conversión', 'Conversion rate'),
      value: `${DEMO_METRICS.tasaConversion}%`,
      trend: '+2.1%',
      trendUp: true,
      icon: '🎯',
      color: COLORS.green
    },
    {
      label: L('Usuarios activos', 'Active users'),
      value: DEMO_METRICS.usuariosActivos,
      trend: '+12',
      trendUp: true,
      icon: '👥',
      color: '#7B1FA2'
    },
  ], [isEn]);

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 style={{ color: COLORS.navy, marginBottom: '0.25rem' }}>
            {L('Métricas y Analytics', 'Metrics & Analytics')}
          </h2>
          <p style={{ color: COLORS.textMuted, fontSize: '0.9rem' }}>
            {L('Seguimiento de KPIs y rendimiento de la plataforma', 'Platform KPIs and performance tracking')}
          </p>
        </div>
        
        {/* Period Selector */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['1m', '3m', '6m', '1y'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: period === p ? `2px solid ${COLORS.navy}` : `1px solid ${COLORS.border}`,
                background: period === p ? COLORS.navy : COLORS.white,
                color: period === p ? COLORS.white : COLORS.text,
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem'
      }}>
        {metricCards.map((metric, idx) => (
          <div
            key={idx}
            style={{
              background: COLORS.white,
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: COLORS.shadowSm,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>{metric.icon}</span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: metric.trendUp ? COLORS.green : COLORS.red,
                background: metric.trendUp ? '#ECFDF5' : '#FEF2F2',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px'
              }}>
                {metric.trend}
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: COLORS.textMuted, marginBottom: '0.25rem' }}>
              {metric.label}
            </p>
            <p style={{ fontSize: '1.8rem', fontWeight: 900, color: metric.color }}>
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Pipeline Trend */}
        <div style={{
          background: COLORS.white,
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: COLORS.shadowSm,
          border: `1px solid ${COLORS.border}`,
        }}>
          <h3 style={{ color: COLORS.navy, marginBottom: '1rem', fontSize: '1rem' }}>
            {L('Tendencia de expedientes', 'Files trend')}
          </h3>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={PIPELINE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    background: COLORS.white, 
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="expedientes" 
                  stroke={COLORS.navy} 
                  strokeWidth={3}
                  dot={{ fill: COLORS.navy, strokeWidth: 2 }}
                  name={L('Expedientes', 'Files')}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke={COLORS.gold} 
                  strokeWidth={2}
                  dot={{ fill: COLORS.gold, strokeWidth: 2 }}
                  name={L('Score', 'Score')}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sector Distribution */}
        <div style={{
          background: COLORS.white,
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: COLORS.shadowSm,
          border: `1px solid ${COLORS.border}`,
        }}>
          <h3 style={{ color: COLORS.navy, marginBottom: '1rem', fontSize: '1rem' }}>
            {L('Distribución por sector', 'Distribution by sector')}
          </h3>
          <div style={{ height: '250px', display: 'flex', alignItems: 'center' }}>
            <ResponsiveContainer width="60%" height="100%">
              <PieChart>
                <Pie
                  data={SECTOR_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {SECTOR_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1, paddingLeft: '1rem' }}>
              {SECTOR_DATA.map((item, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                  fontSize: '0.85rem'
                }}>
                  <span style={{ 
                    width: '10px', 
                    height: '10px', 
                    borderRadius: '2px',
                    background: item.color
                  }} />
                  <span style={{ color: COLORS.text }}>{item.name}</span>
                  <span style={{ 
                    color: COLORS.textMuted, 
                    marginLeft: 'auto',
                    fontWeight: 600
                  }}>
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Second Charts Row */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Risk Distribution */}
        <div style={{
          background: COLORS.white,
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: COLORS.shadowSm,
          border: `1px solid ${COLORS.border}`,
        }}>
          <h3 style={{ color: COLORS.navy, marginBottom: '1rem', fontSize: '1rem' }}>
            {L('Distribución por riesgo', 'Risk distribution')}
          </h3>
          <div style={{ height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={RISK_DATA} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis type="number" stroke="#64748B" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={12} width={60} />
                <Tooltip 
                  contentStyle={{ 
                    background: COLORS.white, 
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {RISK_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feature Usage */}
        <div style={{
          background: COLORS.white,
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: COLORS.shadowSm,
          border: `1px solid ${COLORS.border}`,
        }}>
          <h3 style={{ color: COLORS.navy, marginBottom: '1rem', fontSize: '1rem' }}>
            {L('Uso de funcionalidades', 'Feature usage')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {FEATURE_USAGE.map((feature, idx) => (
              <div key={idx}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '0.35rem',
                  fontSize: '0.85rem'
                }}>
                  <span style={{ color: COLORS.text }}>{feature.name}</span>
                  <span style={{ color: COLORS.textMuted }}>
                    {feature.usage}% <span style={{ 
                      color: COLORS.green, 
                      fontWeight: 600,
                      fontSize: '0.75rem'
                    }}>{feature.trend}</span>
                  </span>
                </div>
                <div style={{ 
                  height: '8px', 
                  background: COLORS.bg, 
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${feature.usage}%`,
                    background: `linear-gradient(90deg, ${COLORS.navy} 0%, ${COLORS.gold} 100%)`,
                    borderRadius: '4px',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Export Actions */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        justifyContent: 'flex-end',
        paddingTop: '1rem',
        borderTop: `1px solid ${COLORS.border}`
      }}>
        <button
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            border: `1px solid ${COLORS.border}`,
            background: COLORS.white,
            color: COLORS.navy,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          📊 {L('Exportar CSV', 'Export CSV')}
        </button>
        <button
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            border: 'none',
            background: COLORS.navy,
            color: COLORS.white,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          📄 {L('Generar reporte PDF', 'Generate PDF report')}
        </button>
      </div>
    </div>
  );
}