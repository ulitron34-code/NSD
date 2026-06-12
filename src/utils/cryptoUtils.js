// ============================================
// UTILIDADES CRIPTOGRÁFICAS SEGURAS
// Para uso en autenticación y generación de tokens
// ============================================

/**
 * Genera un token único y criptográficamente seguro
 * @param {number} prefixLength - Longitud del prefijo aleatorio (default: 8)
 * @returns {string} Token seguro en formato: tok_<randomhex>_<timestamp>_<uuid>
 */
export function generateSecureToken(prefixLength = 8) {
  const randomBytes = crypto.getRandomValues(new Uint8Array(prefixLength));
  const randomHex = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  const timestamp = Date.now().toString(36);
  const uuid = crypto.randomUUID();
  
  return `tok_${randomHex}_${timestamp}_${uuid}`;
}

/**
 * Genera un nonce seguro para CSRF protection
 * @returns {string} Nonce hexadecimal de 32 bytes
 */
export function generateCSRFNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Genera una clave de sesión segura
 * @param {number} length - Longitud en bytes (default: 32)
 * @returns {string} Clave en formato base64url
 */
export function generateSessionKey(length = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Verifica si Web Crypto API está disponible
 * @returns {boolean}
 */
export function isCryptoAvailable() {
  return typeof crypto !== 'undefined' && 
         typeof crypto.getRandomValues === 'function' && 
         typeof crypto.randomUUID === 'function';
}