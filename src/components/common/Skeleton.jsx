// ============================================
// NEXUS PLATFORM - LOADING SKELETON COMPONENTS
// Beautiful skeleton loaders for better UX
// ============================================

import React from 'react';

const shimmerStyle = `
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
  .skeleton {
    background: linear-gradient(
      90deg,
      #f0f0f0 25%,
      #e0e0e0 50%,
      #f0f0f0 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
    border-radius: 6px;
  }
  [data-theme="dark"] .skeleton {
    background: linear-gradient(
      90deg,
      #2a2a2a 25%,
      #3a3a3a 50%,
      #2a2a2a 75%
    );
    background-size: 200% 100%;
  }
`;

// Inject styles once
if (typeof document !== 'undefined' && !document.getElementById('skeleton-styles')) {
  const style = document.createElement('style');
  style.id = 'skeleton-styles';
  style.textContent = shimmerStyle;
  document.head.appendChild(style);
}

// Base Skeleton Component
export function Skeleton({ width, height, borderRadius = '6px', style = {} }) {
  return (
    <div
      className="skeleton"
      style={{
        width: width || '100%',
        height: height || '20px',
        borderRadius,
        ...style,
      }}
    />
  );
}

// Text Skeleton - simulates text lines
export function TextSkeleton({ lines = 3, lastLineWidth = '60%', gap = '8px' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="16px"
          width={i === lines - 1 ? lastLineWidth : '100%'}
          borderRadius="4px"
        />
      ))}
    </div>
  );
}

// Card Skeleton - simulates a card component
export function CardSkeleton({ showImage = false, lines = 2 }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #E2E8F0',
      }}
    >
      {showImage && <Skeleton height="120px" borderRadius="8px" style={{ marginBottom: '16px' }} />}
      <Skeleton width="70%" height="24px" style={{ marginBottom: '12px' }} />
      <TextSkeleton lines={lines} />
    </div>
  );
}

// Table Skeleton - simulates a data table
export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: '16px', padding: '0 8px' }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} height="16px" width={`${100 / cols}%`} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          style={{
            display: 'flex',
            gap: '16px',
            padding: '12px 8px',
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              height="16px"
              width={`${100 / cols}%`}
              borderRadius="4px"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Dashboard Card Skeleton
export function DashboardCardSkeleton() {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #E2E8F0',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <Skeleton width="40px" height="40px" borderRadius="10px" />
        <Skeleton width="60px" height="20px" borderRadius="10px" />
      </div>
      <Skeleton width="50%" height="14px" style={{ marginBottom: '8px' }} />
      <Skeleton width="80%" height="28px" />
    </div>
  );
}

// Profile Skeleton
export function ProfileSkeleton() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <Skeleton width="64px" height="64px" borderRadius="50%" />
      <div style={{ flex: 1 }}>
        <Skeleton width="40%" height="18px" style={{ marginBottom: '8px' }} />
        <Skeleton width="60%" height="14px" />
      </div>
    </div>
  );
}

// Chart Skeleton
export function ChartSkeleton({ height = '200px' }) {
  return (
    <div style={{ height }}>
      {/* Y-axis labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        {[100, 75, 50, 25, 0].map((val) => (
          <Skeleton key={val} width="30px" height="12px" />
        ))}
      </div>
      {/* Bars */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: 'calc(100% - 24px)' }}>
        {[65, 80, 45, 90, 70, 55, 85, 60, 75, 50, 95, 70].map((h, i) => (
          <Skeleton key={i} width="100%" height={`${h}%`} borderRadius="4px 4px 0 0" />
        ))}
      </div>
    </div>
  );
}

// Page Skeleton - full page loading state
export function PageSkeleton({ type = 'default' }) {
  if (type === 'dashboard') {
    return (
      <div style={{ padding: '24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <Skeleton width="200px" height="32px" style={{ marginBottom: '8px' }} />
          <Skeleton width="300px" height="16px" />
        </div>
        {/* Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[1, 2, 3, 4].map((i) => (
            <DashboardCardSkeleton key={i} />
          ))}
        </div>
        {/* Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          <CardSkeleton showImage lines={3} />
          <CardSkeleton lines={4} />
        </div>
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
          <Skeleton width="150px" height="32px" />
          <Skeleton width="120px" height="32px" />
        </div>
        <TableSkeleton rows={8} cols={5} />
      </div>
    );
  }

  if (type === 'form') {
    return (
      <div style={{ padding: '24px', maxWidth: '600px' }}>
        <Skeleton width="200px" height="32px" style={{ marginBottom: '24px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <Skeleton width="100px" height="14px" style={{ marginBottom: '8px' }} />
            <Skeleton height="44px" borderRadius="8px" />
          </div>
          <div>
            <Skeleton width="100px" height="14px" style={{ marginBottom: '8px' }} />
            <Skeleton height="44px" borderRadius="8px" />
          </div>
          <div>
            <Skeleton width="100px" height="14px" style={{ marginBottom: '8px' }} />
            <Skeleton height="100px" borderRadius="8px" />
          </div>
          <Skeleton width="120px" height="44px" borderRadius="8px" />
        </div>
      </div>
    );
  }

  // Default skeleton
  return (
    <div style={{ padding: '24px' }}>
      <Skeleton width="200px" height="32px" style={{ marginBottom: '16px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {[1, 2, 3].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// Inline loading spinner (alternative to skeleton)
export function Spinner({ size = 24, color = '#0F1F2E' }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `3px solid ${color}20`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  );
}

// Full page loading overlay
export function LoadingOverlay({ message = 'Cargando...' }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(255,255,255,0.9)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99998,
      }}
    >
      <Spinner size={48} color="#0F1F2E" />
      <p
        style={{
          marginTop: '16px',
          color: '#64748B',
          fontSize: '14px',
          fontWeight: 500,
        }}
      >
        {message}
      </p>
    </div>
  );
}

export default {
  Skeleton,
  TextSkeleton,
  CardSkeleton,
  TableSkeleton,
  DashboardCardSkeleton,
  ProfileSkeleton,
  ChartSkeleton,
  PageSkeleton,
  Spinner,
  LoadingOverlay,
};