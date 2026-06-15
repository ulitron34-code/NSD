// ============================================
// UTILIDADES DE VALIDACIÓN Y SANITIZACIÓN
// Seguridad para inputs de usuario
// ============================================

/**
 * Sanitiza un string para prevenir XSS
 * @param {string} input - Texto a sanitizar
 * @returns {string} Texto sanitizado
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // Remover < y >
    .replace(/javascript:/gi, '') // Remover javascript:
    .replace(/on\w+=/gi, '') // Remover event handlers
    .trim();
}

/**
 * Sanitiza email
 * @param {string} email 
 * @returns {string|null}
 */
export function sanitizeEmail(email) {
  if (typeof email !== 'string') return null;
  
  const sanitized = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return emailRegex.test(sanitized) ? sanitized : null;
}

/**
 * Valida fortaleza de contraseña
 * @param {string} password
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePasswordStrength(password) {
  const errors = [];
  
  if (!password || password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Debe contener al menos una mayúscula');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Debe contener al menos una minúscula');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Debe contener al menos un número');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Debe contener al menos un carácter especial');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Rate limiter simple para login
 * Implementación client-side (el backend debe validar también)
 */
export class RateLimiter {
  constructor(maxAttempts = 5, windowMs = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.attempts = new Map();
  }

  /**
   * Registra un intento y retorna si está bloqueado
   */
  recordAttempt(identifier) {
    const now = Date.now();
    const key = `rate_limit_${identifier}`;
    
    let attempts = this.attempts.get(key) || [];
    
    // Limpiar intentos fuera de la ventana
    attempts = attempts.filter(time => now - time < this.windowMs);
    
    if (attempts.length >= this.maxAttempts) {
      return { blocked: true, remainingTime: this.windowMs - (now - attempts[0]) };
    }
    
    attempts.push(now);
    this.attempts.set(key, attempts);
    
    return { 
      blocked: false, 
      attemptsRemaining: this.maxAttempts - attempts.length 
    };
  }

  /**
   * Resetea los intentos para un identificador
   */
  reset(identifier) {
    const key = `rate_limit_${identifier}`;
    this.attempts.delete(key);
  }
}

// Instancia global de rate limiter para login
export const loginRateLimiter = new RateLimiter(5, 60000); // 5 intentos por minuto

/**
 * Valida que un input no contenga caracteres peligrosos
 */
export function containsDangerousChars(input) {
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /expression\s*\(/i,
    /url\s*\(/i,
    /data:/i
  ];
  
  return dangerousPatterns.some(pattern => pattern.test(input));
}

/**
 * Escapa HTML para prevenir XSS
 */
export function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return '';
  
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Valida longitud de input
 */
export function validateLength(input, min = 0, max = Infinity) {
  const len = input?.length || 0;
  return len >= min && len <= max;
}

/**
 * Valida formato de URL
 */
export function isValidUrl(string) {
  try {
    const url = new URL(string);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

export default {
  sanitizeInput,
  sanitizeEmail,
  validatePasswordStrength,
  RateLimiter,
  loginRateLimiter,
  containsDangerousChars,
  escapeHtml,
  validateLength,
  isValidUrl
};