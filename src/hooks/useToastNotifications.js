// ============================================
// NSD PLATFORM - TOAST HOOK
// Easy-to-use hook for toast notifications
// ============================================

import { useToast } from '../context/ToastContext';

/**
 * Custom hook for toast notifications
 * Usage:
 * 
 * const { showSuccess, showError, showWarning, showInfo } = useToast();
 * 
 * showSuccess('Documento guardado', 'Éxito');
 * showError('No se pudo conectar al servidor', 'Error de red');
 * showWarning('Límite de archivos alcanzado', 'Advertencia');
 * showInfo('Nueva actualización disponible', 'Info');
 * 
 * // With action
 * showSuccess('Orden creada', 'Éxito', {
 *   label: 'Ver orden',
 *   onClick: () => navigate('/order/123')
 * });
 */
export function useToastNotifications() {
  const toast = useToast();

  const showSuccess = (message, title = 'Éxito', action = null) => {
    return toast.success(message, title, action);
  };

  const showError = (message, title = 'Error', action = null) => {
    return toast.error(message, title, action);
  };

  const showWarning = (message, title = 'Advertencia', action = null) => {
    return toast.warning(message, title, action);
  };

  const showInfo = (message, title = 'Info', action = null) => {
    return toast.info(message, title, action);
  };

  // Generic toast with custom options
  const showToast = (options) => {
    return toast.addToast(options);
  };

  // Async wrapper for API calls
  const withToast = async (asyncFn, { 
    successMessage = 'Operación exitosa',
    errorMessage = 'Algo salió mal',
    loadingMessage = 'Procesando...'
  } = {}) => {
    try {
      const result = await asyncFn();
      if (successMessage) {
        showSuccess(successMessage);
      }
      return { success: true, data: result };
    } catch (error) {
      const message = error.response?.data?.error || error.message || errorMessage;
      showError(message, 'Error');
      return { success: false, error };
    }
  };

  return {
    // Shortcut methods
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showToast,
    
    // Utilities
    withToast,
    removeToast: toast.removeToast,
  };
}

export default useToastNotifications;