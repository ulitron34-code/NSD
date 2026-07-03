// ============================================
// NEXUS PLATFORM - TOAST NOTIFICATIONS CONTEXT
// Beautiful, accessible toast notifications
// ============================================

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// Toast types and their styling
const TOAST_TYPES = {
  success: {
    icon: '✓',
    bg: '#ECFDF5',
    border: '#10B981',
    text: '#065F46',
    iconBg: '#D1FAE5',
  },
  error: {
    icon: '✕',
    bg: '#FEF2F2',
    border: '#EF4444',
    text: '#991B1B',
    iconBg: '#FEE2E2',
  },
  warning: {
    icon: '⚠',
    bg: '#FFFBEB',
    border: '#F59E0B',
    text: '#92400E',
    iconBg: '#FEF3C7',
  },
  info: {
    icon: 'ℹ',
    bg: '#EFF6FF',
    border: '#3B82F6',
    text: '#1E40AF',
    iconBg: '#DBEAFE',
  },
};

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // Auto-dismiss toasts
  useEffect(() => {
    const timers = toasts.map((toast) => {
      if (toast.autoClose !== false) {
        return setTimeout(() => {
          removeToast(toast.id);
        }, toast.duration || 5000);
      }
      return null;
    });

    return () => timers.forEach((t) => t && clearTimeout(t));
  }, [toasts]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ type = 'info', title, message, duration, action, persistent = false }) => {
    const id = `toast-${++toastId}`;
    const toast = {
      id,
      type,
      title,
      message,
      duration: duration || 5000,
      action,
      persistent,
      createdAt: Date.now(),
    };

    setToasts((prev) => {
      const updated = [toast, ...prev];
      // Keep max 5 toasts visible
      if (updated.length > 5) {
        return updated.slice(0, 5);
      }
      return updated;
    });

    return id;
  }, []);

  const success = useCallback((message, title = 'Éxito') => {
    return addToast({ type: 'success', title, message });
  }, [addToast]);

  const error = useCallback((message, title = 'Error') => {
    return addToast({ type: 'error', title, message, duration: 8000 }); // Errors stay longer
  }, [addToast]);

  const warning = useCallback((message, title = 'Advertencia') => {
    return addToast({ type: 'warning', title, message });
  }, [addToast]);

  const info = useCallback((message, title = 'Info') => {
    return addToast({ type: 'info', title, message });
  }, [addToast]);

  // Progress bar for auto-dismiss
  const ProgressBar = ({ duration }) => {
    const [progress, setProgress] = useState(100);

    useEffect(() => {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
        setProgress(remaining);
        if (remaining <= 0) clearInterval(interval);
      }, 50);
      return () => clearInterval(interval);
    }, [duration]);

    return (
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '3px',
          width: `${progress}%`,
          background: 'currentColor',
          opacity: 0.3,
          borderRadius: '0 0 0 8px',
          transition: 'width 50ms linear',
        }}
      />
    );
  };

  // Single Toast Component
  const Toast = ({ toast }) => {
    const style = TOAST_TYPES[toast.type] || TOAST_TYPES.info;

    return (
      <div
        role="alert"
        aria-live="polite"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '14px 16px',
          background: style.bg,
          borderLeft: `4px solid ${style.border}`,
          borderRadius: '10px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          minWidth: '320px',
          maxWidth: '420px',
          position: 'relative',
          overflow: 'hidden',
          animation: 'slideInToast 0.3s ease-out',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: style.iconBg,
            color: style.border,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: 'bold',
            flexShrink: 0,
          }}
        >
          {style.icon}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {toast.title && (
            <p
              style={{
                fontWeight: 700,
                color: style.text,
                margin: '0 0 4px 0',
                fontSize: '14px',
                lineHeight: 1.4,
              }}
            >
              {toast.title}
            </p>
          )}
          <p
            style={{
              color: style.text,
              fontSize: '14px',
              lineHeight: 1.5,
              margin: 0,
              opacity: 0.9,
            }}
          >
            {toast.message}
          </p>

          {/* Action button */}
          {toast.action && (
            <button
              onClick={() => {
                toast.action.onClick?.();
                removeToast(toast.id);
              }}
              style={{
                marginTop: '10px',
                padding: '6px 14px',
                background: style.border,
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.target.style.opacity = '0.85')}
              onMouseLeave={(e) => (e.target.style.opacity = '1')}
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={() => removeToast(toast.id)}
          aria-label="Cerrar"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: style.text,
            fontSize: '20px',
            opacity: 0.5,
            padding: '2px 6px',
            borderRadius: '4px',
            transition: 'opacity 0.2s, background 0.2s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.target.style.opacity = '1';
            e.target.style.background = 'rgba(0,0,0,0.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.opacity = '0.5';
            e.target.style.background = 'transparent';
          }}
        >
          ×
        </button>

        {/* Progress bar */}
        {toast.autoClose !== false && (
          <ProgressBar duration={toast.duration || 5000} />
        )}
      </div>
    );
  };

  // Container Component
  const ToastContainer = () => {
    if (toasts.length === 0) return null;

    return (
      <>
        {/* CSS for animations */}
        <style>{`
          @keyframes slideInToast {
            from {
              opacity: 0;
              transform: translateX(100%);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}</style>

        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            zIndex: 99999,
            pointerEvents: 'none',
          }}
        >
          {toasts.map((toast) => (
            <div key={toast.id} style={{ pointerEvents: 'auto' }}>
              <Toast toast={toast} />
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        success,
        error,
        warning,
        info,
      }}
    >
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

// Hook for using toast notifications
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Return no-op functions if not in provider
    return {
      success: () => {},
      error: () => {},
      warning: () => {},
      info: () => {},
      addToast: () => {},
      removeToast: () => {},
    };
  }
  return context;
}

export default ToastContext;