import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { COLORS } from '../utils/constants';

export default function ErrorPage({ error }) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${COLORS.bg} 0%, #fff 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '550px' }}>
        {/* Error Illustration */}
        <div
          style={{
            width: '160px',
            height: '160px',
            margin: '0 auto 2rem',
            position: 'relative',
          }}
        >
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
            {/* Warning triangle */}
            <path
              d="M50 15 L90 80 L10 80 Z"
              fill="#FEF2F2"
              stroke="#EF4444"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            {/* X mark */}
            <line x1="35" y1="45" x2="65" y2="75" stroke="#EF4444" strokeWidth="6" strokeLinecap="round" />
            <line x1="65" y1="45" x2="35" y2="75" stroke="#EF4444" strokeWidth="6" strokeLinecap="round" />
          </svg>
        </div>

        {/* Error Code */}
        <p
          style={{
            color: '#EF4444',
            fontSize: '0.85rem',
            fontWeight: 900,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: '0.5rem',
          }}
        >
          Error 500
        </p>

        {/* Title */}
        <h1
          style={{
            fontSize: 'clamp(1.8rem, 5vw, 2.2rem)',
            color: COLORS.navy,
            marginBottom: '1rem',
            fontWeight: 900,
            lineHeight: 1.2,
          }}
        >
          Algo salió mal
        </h1>

        {/* Description */}
        <p
          style={{
            color: COLORS.textMuted,
            fontSize: '1rem',
            lineHeight: 1.7,
            marginBottom: '1.5rem',
          }}
        >
          Estamos experimentando dificultades técnicas. Nuestro equipo ha sido notificado
          y estamos trabajando para resolverlo.
        </p>

        {/* Error details (dev only) */}
        {import.meta.env.DEV && error && (
          <div
            style={{
              background: '#1E293B',
              color: '#E2E8F0',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              textAlign: 'left',
              fontSize: '0.8rem',
              fontFamily: 'monospace',
              overflow: 'auto',
              maxHeight: '150px',
            }}
          >
            <strong style={{ color: '#F59E0B' }}>Error:</strong> {error.message || error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.875rem 1.5rem',
              borderRadius: '10px',
              border: 'none',
              background: COLORS.navy,
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontSize: '0.95rem',
            }}
          >
            🔄 Reintentar
          </button>

          <Link
            to="/"
            style={{
              padding: '0.875rem 1.5rem',
              borderRadius: '10px',
              border: `2px solid ${COLORS.navy}`,
              background: 'transparent',
              color: COLORS.navy,
              fontWeight: 700,
              textDecoration: 'none',
              transition: 'all 0.2s',
              fontSize: '0.95rem',
            }}
          >
            Ir al inicio
          </Link>
        </div>

        {/* Support */}
        <div
          style={{
            marginTop: '2.5rem',
            padding: '1.25rem',
            background: COLORS.bg,
            borderRadius: '12px',
          }}
        >
          <p style={{ color: COLORS.textMuted, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            ¿Necesitas ayuda inmediata?
          </p>
          <a
            href="mailto:soporte@nsd.com"
            style={{
              color: COLORS.gold,
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            Contactar soporte →
          </a>
        </div>
      </div>
    </div>
  );
}