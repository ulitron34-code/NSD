// ============================================
// GUARDAR CONFIGURACIÓN EN LOCALSTORAGE
// ============================================
export function saveConfig(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error('Error saving config:', err);
    return false;
  }
}

// ============================================
// OBTENER CONFIGURACIÓN
// ============================================
export function getConfig(key, defaultValue = null) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  } catch (err) {
    console.error('Error getting config:', err);
    return defaultValue;
  }
}

// ============================================
// ELIMINAR CONFIGURACIÓN
// ============================================
export function deleteConfig(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (err) {
    console.error('Error deleting config:', err);
    return false;
  }
}

// ============================================
// LIMPIAR TODO LOCALSTORAGE
// ============================================
export function clearAllStorage() {
  try {
    localStorage.clear();
    return true;
  } catch (err) {
    console.error('Error clearing storage:', err);
    return false;
  }
}

// ============================================
// GESTIONAR USUARIO ACTUAL
// ============================================
export function setCurrentUser(user) {
  saveConfig('currentUser', user);
}

export function getCurrentUser() {
  return getConfig('currentUser', null);
}

export function clearCurrentUser() {
  deleteConfig('currentUser');
}

// ============================================
// GESTIONAR ORDEN ACTUAL
// ============================================
export function setCurrentOrder(orderId) {
  saveConfig('currentOrderId', orderId);
}

export function getCurrentOrder() {
  return getConfig('currentOrderId', 'order-demo-001');
}

// ============================================
// GESTIONAR PREFERENCIAS
// ============================================
export function setPreferences(prefs) {
  saveConfig('preferences', prefs);
}

export function getPreferences() {
  return getConfig('preferences', {
    language: 'es',
    theme: 'light',
    autoSave: true
  });
}
