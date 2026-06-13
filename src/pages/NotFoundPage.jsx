import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { COLORS } from '../utils/constants';

export default function NotFoundPage() {
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
      <div style={{ textAlign: 'center', maxWidth: '500px' }}>
        {/* 404 Illustration */}
        <div
          style={{
            width: '180px',
            height: '180px',
            margin: '0 auto 2rem',
            position: 'relative',
          }}
        >
          {/* Document/folder icon */}
          <svg
            viewBox="0 0 100 100"
            style={{ width: '100%', height: '100%' }}
          >
            <rect
              x="20"
              y="25"
              width="60"
              height="55"
              rx="4"
              fill="#E2E8F0"
              stroke="#CBD5E1"
              strokeWidth="2"
            />
            <rect
              x="25"
              y="35"
              width="50"
              height="4"
              rx="2"
              fill="#94A3B8"
            />
            <rect
              x="25"
              y="45"
              width="40"
              height="3"
              rx="1.5"
              fill="#CBD5E1"
            />
            <rect
              x="25"
              y="53"
              width="35"
              height="3"
              rx="1.5"
              fill="#CBD5E1"
            />
            <rect
              x="25"
              y="61"
              width="45"
              height="3"
              rx="1.5"
              fill="#CBD5E1"
            />
            {/* Question mark */}
            <text
              x="50"
              y="88"
              textAnchor="middle"
              fontSize="40"
              fontWeight="bold"
              fill={COLORS.gold}
            >
              ?
            </text>
          </svg>
        </div>

        {/* Error Code */}
        <p
          style={{
            color: COLORS.gold,
            fontSize: '0.85rem',
            fontWeight: 900,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: '0.5rem',
          }}
        >
          Error 404
        </p>

        {/* Title */}
        <h1
          style={{
            fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
            color: COLORS.navy,
            marginBottom: '1rem',
            fontWeight: 900,
            lineHeight: 1.2,
          }}
        >
          Página no encontrada
        </h1>

        {/* Description */}
        <p
          style={{
            color: COLORS.textMuted,
            fontSize: '1rem',
            lineHeight: 1.7,
            marginBottom: '2rem',
          }}
        >
          Lo sentimos, la página que buscas no existe o ha sido movida.
          Puede ser que el enlace esté roto o que hayas escrito mal la dirección.
        </p>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '0.875rem 1.75rem',
              borderRadius: '10px',
              border: `2px solid ${COLORS.navy}`,
              background: 'transparent',
              color: COLORS.navy,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontSize: '0.95rem',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = COLORS.navy;
              e.target.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = COLORS.navy;
            }}
          >
            ← Volver atrás
          </button>

          <Link
            to="/"
            style={{
              padding: '0.875rem 1.75rem',
              borderRadius: '10px',
              border: 'none',
              background: COLORS.navy,
              color: '#fff',
              fontWeight: 700,
              textDecoration: 'none',
              transition: 'all 0.2s',
              fontSize: '0.95rem',
            }}
          >
            Ir al inicio
          </Link>
        </div>

        {/* Help text */}
        <div
          style={{
            marginTop: '3rem',
            padding: '1.5rem',
            background: COLORS.bg,
            borderRadius: '12px',
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <p
            style={{
              color: COLORS.textMuted,
              fontSize: '0.85rem',
              marginBottom: '0.75rem',
            }}
          >
            Si crees que esto es un error, contacta a soporte:
          </p>
          <a
            href="mailto:soporte@nsd.com"
            style={{
              color: COLORS.navy,
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: '0.9rem',
            }}
          >
            soporte@nsd.com
          </a>
        </div>

        {/* Quick links */}
        <div style={{ marginTop: '2rem' }}>
          <p
            style={{
              color: COLORS.textMuted,
              fontSize: '0.8rem',
              marginBottom: '0.75rem',
            }}
          >
            También puedes intentar:
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/services"
              style={{
                color: COLORS.gold,
                fontSize: '0.85rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Servicios
            </Link>
            <Link
              to="/dashboard"
              style={{
                color: COLORS.gold,
                fontSize: '0.85rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Dashboard
            </Link>
            <Link
              to="/contact"
              style={{
                color: COLORS.gold,
                fontSize: '0.85rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Contacto
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}