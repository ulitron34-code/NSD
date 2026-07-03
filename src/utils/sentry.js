// ============================================
// NEXUS PLATFORM - SENTRY ERROR TRACKING
// Production error monitoring and reporting
// ============================================

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/browser';

// Environment check
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const IS_PRODUCTION = import.meta.env.PROD;
const IS_DEV = import.meta.env.DEV;

/**
 * Initialize Sentry for error tracking
 * Only in production with valid DSN
 */
export function initSentry() {
  // Skip initialization in development or if no DSN
  if (!SENTRY_DSN || IS_DEV) {
    console.log('[Sentry] Running without error tracking (development mode)');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Performance monitoring
    integrations: [
      new BrowserTracing({
        // Trace React rendering performance
        reactStyles: true,
      }),
    ],
    
    // Sample rate for performance traces (1% in production)
    tracesSampleRate: IS_PRODUCTION ? 0.01 : 1.0,
    
    // Sample rate for error events (100% - we want all errors)
    replaysSessionSampleRate: IS_PRODUCTION ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0, // All sessions with errors
    
    // Environment
    environment: IS_PRODUCTION ? 'production' : 'staging',
    
    // Release tracking
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',
    
    // Custom tags
    initialScope: {
      tags: {
        'source': 'frontend',
        'app': 'nsd-platform',
      },
    },
    
    // Before send hook for sanitizing data
    beforeSend(event, hint) {
      // Don't send errors from the extension or third-party scripts
      if (event.sdk?.name === 'sentry.browser.extension') {
        return null;
      }
      
      // Sanitize sensitive data
      if (event.request?.cookies) {
        delete event.request.cookies;
      }
      
      return event;
    },
    
    // Error filter
    denyUrls: [
      // Chrome extensions
      /extensions/i,
      // Third-party scripts
      /google-analytics/i,
      /googletagmanager/i,
      /facebook.net/i,
    ],
  });

  console.log('[Sentry] Error tracking initialized');
}

/**
 * Wrap a component with Sentry error boundary
 */
export const SentryErrorBoundary = Sentry.withErrorBoundary;

/**
 * Track a custom event
 */
export function trackEvent(name, data = {}) {
  if (!SENTRY_DSN || IS_DEV) return;
  
  Sentry.captureEvent({
    message: name,
    level: 'info',
    extra: data,
  });
}

/**
 * Track a user action
 */
export function trackAction(action, label, value) {
  if (!SENTRY_DSN || IS_DEV) return;
  
  Sentry.addBreadcrumb({
    category: action,
    message: label,
    data: { value },
    level: 'info',
  });
}

/**
 * Set user context for error tracking
 */
export function setUserContext(user) {
  if (!SENTRY_DSN || IS_DEV) return;
  
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username || user.email?.split('@')[0],
      profileType: user.profileType,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add context for debugging
 */
export function setContext(name, data) {
  if (!SENTRY_DSN || IS_DEV) return;
  
  Sentry.setContext(name, data);
}

/**
 * Report a non-error issue
 */
export function reportInfo(message, data = {}) {
  if (!SENTRY_DSN || IS_DEV) return;
  
  Sentry.captureMessage(message, 'info');
  if (Object.keys(data).length > 0) {
    Sentry.setContext('extra', data);
  }
}

/**
 * Report a warning
 */
export function reportWarning(message, data = {}) {
  if (!SENTRY_DSN || IS_DEV) {
    console.warn(`[Warning] ${message}`, data);
    return;
  }
  
  Sentry.captureMessage(message, 'warning');
  if (Object.keys(data).length > 0) {
    Sentry.setContext('warning_data', data);
  }
}

/**
 * Manually capture an error
 */
export function captureError(error, context = {}) {
  if (!SENTRY_DSN || IS_DEV) {
    console.error('[Error]', error, context);
    return;
  }
  
  Sentry.captureException(error, {
    extra: context,
  });
}

// Export Sentry for advanced usage
export { Sentry };

export default {
  initSentry,
  SentryErrorBoundary,
  trackEvent,
  trackAction,
  setUserContext,
  setContext,
  reportInfo,
  reportWarning,
  captureError,
  Sentry,
};