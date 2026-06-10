import React from 'react';
import { COLORS } from '../../utils/constants';

export default function AIReviewPanel({ review }) {
  if (!review) return null;

  const { status, score, summary, findings, missing_items, extracted_data, warnings } = review;

  if (status === 'processing') {
    return (
      <div style={{
        background: 'white',
        borderRadius: '8px',
        border: `1px solid ${COLORS.border}`,
        padding: '2rem',
        marginTop: '1.5rem',
        textAlign: 'center',
        boxShadow: COLORS.shadowSm
      }}>
        <div style={{
          display: 'inline-block',
          width: '40px',
          height: '40px',
          border: `3px solid ${COLORS.border}`,
          borderTop: `3px solid ${COLORS.gold}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '1rem'
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <h3 style={{ color: COLORS.navy, fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.4rem' }}>
          Auditoría de IA en Progreso...
        </h3>
        <p style={{ color: COLORS.textMuted, fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
          DeepSeek y Claude 3.5 Sonnet están extrayendo y analizando las métricas financieras de este documento. La pantalla se actualizará automáticamente al terminar.
        </p>
      </div>
    );
  }

  const getStatusColor = () => {
    switch (status) {
      case 'green': return COLORS.green;
      case 'yellow': return COLORS.amber;
      case 'red': return '#dc2626';
      default: return COLORS.navy;
    }
  };

  const statusColor = getStatusColor();

  return (
    <div style={{
      background: 'white',
      borderRadius: '8px',
      border: `1px solid ${COLORS.border}`,
      padding: '1.5rem',
      marginTop: '1.5rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ color: COLORS.navy, fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
          Resultado del Análisis IA
        </h3>
        <div style={{
          background: `${statusColor}15`,
          color: statusColor,
          padding: '0.5rem 1rem',
          borderRadius: '20px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span style={{ fontSize: '1.2rem' }}>{score}/100</span>
          <span>Riesgo {status === 'green' ? 'Bajo' : status === 'yellow' ? 'Medio' : 'Alto'}</span>
        </div>
      </div>

      <p style={{ color: COLORS.text, marginBottom: '1.5rem', lineHeight: 1.6 }}>{summary}</p>

      {warnings && warnings.length > 0 && (
        <div style={{
          background: '#fef2f2',
          borderLeft: '4px solid #dc2626',
          padding: '1rem',
          marginBottom: '1.5rem',
          borderRadius: '4px'
        }}>
          <h4 style={{ color: '#dc2626', margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>⚠️ Alertas Detectadas</h4>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#991b1b', fontSize: '0.9rem' }}>
            {warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div>
          <h4 style={{ color: COLORS.navy, margin: '0 0 0.75rem 0', fontSize: '0.95rem' }}>Datos Extraídos</h4>
          <div style={{ background: COLORS.bg, borderRadius: '6px', padding: '1rem' }}>
            {extracted_data && extracted_data.length > 0 ? (
              extracted_data.map((data, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: i === extracted_data.length - 1 ? 0 : '0.5rem', fontSize: '0.85rem' }}>
                  <span style={{ color: COLORS.textMuted }}>{data.key}:</span>
                  <span style={{ color: COLORS.navy, fontWeight: 600, textAlign: 'right' }}>{data.value}</span>
                </div>
              ))
            ) : (
              <p style={{ margin: 0, fontSize: '0.85rem', color: COLORS.textMuted }}>No se encontraron datos clave.</p>
            )}
          </div>
        </div>

        <div>
          <h4 style={{ color: COLORS.navy, margin: '0 0 0.75rem 0', fontSize: '0.95rem' }}>Hallazgos Positivos</h4>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', color: COLORS.text, fontSize: '0.85rem' }}>
            {findings?.map((f, i) => <li key={i} style={{ marginBottom: '0.25rem' }}>{f}</li>)}
          </ul>
        </div>
      </div>

      {missing_items && missing_items.length > 0 && (
        <div>
          <h4 style={{ color: COLORS.navy, margin: '0 0 0.75rem 0', fontSize: '0.95rem' }}>Elementos Faltantes o Pendientes</h4>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', color: COLORS.textMuted, fontSize: '0.85rem' }}>
            {missing_items.map((m, i) => <li key={i} style={{ marginBottom: '0.25rem' }}>{m}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
