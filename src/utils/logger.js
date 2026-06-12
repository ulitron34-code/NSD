// ============================================
// SISTEMA DE LOGGING CENTRALIZADO
// Reemplaza console.log/error con logging estructurado
// Soporta diferentes niveles y entorno (dev/prod)
// ============================================

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
};

// Nivel de log actual (configurable)
let currentLevel = LOG_LEVELS.INFO;

// Determinar si estamos en desarrollo
const isDevelopment = import.meta.env?.DEV ?? false;

// Configurar nivel de logging
export function setLogLevel(level) {
  if (Object.values(LOG_LEVELS).includes(level)) {
    currentLevel = level;
  }
}

// Habilitar modo desarrollo (nivel DEBUG)
export function enableDebugMode() {
  currentLevel = LOG_LEVELS.DEBUG;
}

// Deshabilitar todos los logs (producción)
export function disableLogging() {
  currentLevel = LOG_LEVELS.NONE;
}

// Formatear mensaje con timestamp
function formatMessage(level, prefix, ...args) {
  const timestamp = new Date().toISOString();
  const prefixStr = prefix ? `[${prefix}]` : '';
  return {
    timestamp,
    level: LOG_LEVELS[level],
    levelName: level,
    prefix,
    message: args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ')
  };
}

// Imprimir solo en desarrollo
function printToConsole(formatted) {
  if (!isDevelopment && formatted.level >= LOG_LEVELS.ERROR) {
    // En producción, solo mostrar errores críticos
    console.error(`[${formatted.levelName}] ${formatted.prefix || ''}`, formatted.message);
  } else if (isDevelopment) {
    const args = formatted.message;
    switch (formatted.level) {
      case LOG_LEVELS.DEBUG:
        console.debug(`[${formatted.levelName}] ${formatted.prefix || ''}`, args);
        break;
      case LOG_LEVELS.INFO:
        console.info(`[${formatted.levelName}] ${formatted.prefix || ''}`, args);
        break;
      case LOG_LEVELS.WARN:
        console.warn(`[${formatted.levelName}] ${formatted.prefix || ''}`, args);
        break;
      case LOG_LEVELS.ERROR:
        console.error(`[${formatted.levelName}] ${formatted.prefix || ''}`, args);
        break;
    }
  }
}

// ============================================
// FUNCIONES DE LOG PUBLICAS
// ============================================

export function debug(prefix, ...args) {
  if (currentLevel <= LOG_LEVELS.DEBUG) {
    const formatted = formatMessage('DEBUG', prefix, ...args);
    printToConsole(formatted);
  }
}

export function info(prefix, ...args) {
  if (currentLevel <= LOG_LEVELS.INFO) {
    const formatted = formatMessage('INFO', prefix, ...args);
    printToConsole(formatted);
  }
}

export function warn(prefix, ...args) {
  if (currentLevel <= LOG_LEVELS.WARN) {
    const formatted = formatMessage('WARN', prefix, ...args);
    printToConsole(formatted);
  }
}

export function error(prefix, ...args) {
  if (currentLevel <= LOG_LEVELS.ERROR) {
    const formatted = formatMessage('ERROR', prefix, ...args);
    printToConsole(formatted);
  }
}

// ============================================
// HELPERS PARA CASOS COMUNES
// ============================================

// Logger para API requests
export const apiLogger = {
  request: (method, url, data) => debug('API', `${method} ${url}`, data),
  success: (method, url, response) => info('API', `${method} ${url} ✓`),
  error: (method, url, error) => error('API', `${method} ${url} ✗`, error?.message || error)
};

// Logger para autenticación
export const authLogger = {
  login: (email) => debug('AUTH', `Login attempt: ${email}`),
  success: (userId) => info('AUTH', `Login success: ${userId}`),
  failure: (reason) => warn('AUTH', `Login failed: ${reason}`),
  logout: () => info('AUTH', 'User logged out')
};

// Logger para servicios de datos
export const dataLogger = {
  read: (service, id) => debug('DATA', `Reading ${service}:`, id),
  write: (service, id, data) => debug('DATA', `Writing ${service}:`, id),
  delete: (service, id) => debug('DATA', `Deleting ${service}:`, id),
  error: (service, error) => error('DATA', `${service} error:`, error?.message || error)
};

// En producción, deshabilitar logging detallado
if (!isDevelopment) {
  disableLogging();
}

export default {
  debug,
  info,
  warn,
  error,
  setLogLevel,
  enableDebugMode,
  disableLogging,
  apiLogger,
  authLogger,
  dataLogger
};