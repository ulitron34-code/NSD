// ============================================
// NEXUS PLATFORM - BREADCRUMBS COMPONENT
// Navigation breadcrumbs for better UX
// ============================================

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { COLORS } from '../../utils/constants';

// Breadcrumb trail configuration
const BREADCRUMB_CONFIG = {
  '/': { label: 'Inicio', icon: '🏠' },
  '/dashboard': { label: 'Dashboard', icon: '📊' },
  '/services': { label: 'Servicios', icon: '⚙️' },
  '/service-orders': { label: 'Mis Órdenes', icon: '📋' },
  '/checkout': { label: 'Checkout', icon: '💳' },
  '/profile': { label: 'Mi Perfil', icon: '👤' },
  '/settings': { label: 'Configuración', icon: '⚙️' },
  '/contact': { label: 'Contacto', icon: '📧' },
  '/about': { label: 'Nosotros', icon: 'ℹ️' },
  '/pricing': { label: 'Planes', icon: '💰' },
};

// Get breadcrumb label for a path
function getBreadcrumbLabel(path, index) {
  // Check exact match first
  if (BREADCRUMB_CONFIG[path]) {
    return BREADCRUMB_CONFIG[path];
  }

  // Try to match partial paths
  const pathParts = path.split('/').filter(Boolean);
  const basePath = '/' + pathParts.slice(0, pathParts.length - 1).join('/');

  if (BREADCRUMB_CONFIG[basePath]) {
    const config = BREADCRUMB_CONFIG[basePath];
    return {
      label: config.label,
      icon: config.icon,
      dynamic: true,
    };
  }

  // Default: capitalize the last part
  const lastPart = pathParts[pathParts.length - 1] || 'Inicio';
  return {
    label: lastPart
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase()),
    icon: '📄',
  };
}

export default function Breadcrumbs({ customItems, separator = '›' }) {
  const location = useLocation();

  // Use custom items if provided
  const items = customItems || location.pathname
    .split('/')
    .filter(Boolean)
    .reduce((acc, part, index, arr) => {
      const path = '/' + arr.slice(0, index + 1).join('/');
      const config = getBreadcrumbLabel(path, index);
      acc.push({
        path,
        label: config.label,
        icon: config.icon,
        isLast: index === arr.length - 1,
        isDynamic: config.dynamic,
      });
      return acc;
    }, []);

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '12px 0',
        fontSize: '0.875rem',
        color: COLORS.textMuted,
        overflowX: 'auto',
        whiteSpace: 'nowrap',
      }}
    >
      {/* Home link */}
      <Link
        to="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          color: COLORS.textMuted,
          textDecoration: 'none',
          padding: '4px 8px',
          borderRadius: '6px',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = COLORS.navy;
          e.currentTarget.style.background = COLORS.bg;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = COLORS.textMuted;
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <span>🏠</span>
        <span style={{ display: 'none', '@media (minWidth: 768px)': { display: 'inline' } }}>
          Inicio
        </span>
      </Link>

      {/* Breadcrumb items */}
      {items.map((item, index) => (
        <React.Fragment key={item.path}>
          {/* Separator */}
          <span
            style={{
              color: COLORS.textMuted,
              fontSize: '1rem',
              opacity: 0.5,
            }}
          >
            {separator}
          </span>

          {/* Item */}
          {item.isLast ? (
            // Current page (not clickable)
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: COLORS.navy,
                fontWeight: 600,
                padding: '4px 8px',
                background: `${COLORS.gold}15`,
                borderRadius: '6px',
              }}
            >
              {item.icon && <span>{item.icon}</span>}
              {item.label}
            </span>
          ) : (
            // Clickable link
            <Link
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: COLORS.textMuted,
                textDecoration: 'none',
                padding: '4px 8px',
                borderRadius: '6px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = COLORS.navy;
                e.currentTarget.style.background = COLORS.bg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = COLORS.textMuted;
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {item.icon && <span>{item.icon}</span>}
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

// Helper hook for generating breadcrumbs dynamically
export function useBreadcrumbs() {
  const location = useLocation();

  return React.useMemo(() => {
    return location.pathname
      .split('/')
      .filter(Boolean)
      .reduce((acc, part, index, arr) => {
        const path = '/' + arr.slice(0, index + 1).join('/');
        const config = getBreadcrumbLabel(path, index);
        acc.push({
          path,
          label: config.label,
          icon: config.icon,
          isLast: index === arr.length - 1,
        });
        return acc;
      }, []);
  }, [location.pathname]);
}