// ============================================
// NEXUS PLATFORM - ERROR TRACKING SERVICE
// Sentry Integration for production monitoring
// ============================================

// This will be initialized in main.jsx when Sentry is configured
let sentryInitialized = false;

// Initialize Sentry (call this in main.jsx)
// import * as Sentry from '@sentry/react';
// Sentry.init({ dsn: 'your-sentry-dsn' });

/**
 * Track a custom error/event in Sentry
 */
export function trackError(error, context = {}) {
  if (typeof window !== 'undefined' && window.Sentry) {
    window.Sentry.captureException(error, {
      extra: context,
    });
  }
  console.error('[Error Tracking]', error, context);
}

/**
 * Track a custom message in Sentry
 */
export function trackMessage(message, level = 'info', context = {}) {
  if (typeof window !== 'undefined' && window.Sentry) {
    window.Sentry.captureMessage(message, level, {
      extra: context,
    });
  }
  console.log(`[${level.toUpperCase()}]`, message, context);
}

/**
 * Track user action for analytics
 */
export function trackAction(action, properties = {}) {
  // Google Analytics 4 tracking
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, properties);
  }
  
  // Sentry breadcrumb for debugging
  if (typeof window !== 'undefined' && window.Sentry) {
    window.Sentry.addBreadcrumb({
      category: 'action',
      message: action,
      data: properties,
      level: 'info',
    });
  }
  
  console.log('[Action]', action, properties);
}

/**
 * Set user context for Sentry
 */
export function setUserContext(user) {
  if (typeof window !== 'undefined' && window.Sentry) {
    window.Sentry.setUser({
      id: user?.id,
      email: user?.email,
      username: user?.name,
      role: user?.role,
      company: user?.company,
    });
  }
}

/**
 * Add page view breadcrumb
 */
export function trackPageView(page, properties = {}) {
  trackAction('page_view', {
    page,
    ...properties,
  });
}

/**
 * Performance monitoring
 */
export function startPerformanceTrace(name) {
  const start = performance.now();
  return {
    end: () => {
      const duration = performance.now() - start;
      if (typeof window !== 'undefined' && window.Sentry) {
        window.Sentry.addBreadcrumb({
          category: 'performance',
          message: `${name} completed`,
          data: { duration: Math.round(duration) },
          level: 'debug',
        });
      }
      return duration;
    },
  };
}

// Demo mode - mock tracking functions when Sentry is not configured
export const errorTracking = {
  init: () => {
    console.log('[Demo] Error tracking initialized (Sentry not configured)');
    sentryInitialized = true;
  },
  trackError,
  trackMessage,
  trackAction,
  setUserContext,
  trackPageView,
  startPerformanceTrace,
};

export default errorTracking;