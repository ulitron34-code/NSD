import { error, debug, info, warn } from '../utils/logger';
// ============================================
// SERVICIO DE EXPEDIENTES
// Vincula Solicitante con Otorgante
// ============================================

export function createExpediente(expedienteData) {
  return new Promise((resolve, reject) => {
    try {
      const openDB = indexedDB.open('nsd-app', 1);

      openDB.onsuccess = () => {
        const db = openDB.result;
        const tx = db.transaction('expedientes', 'readwrite');
        const store = tx.objectStore('expedientes');

        const expediente = {
          id: `EXP-${Date.now()}`,
          solicitanteId: expedienteData.solicitanteId,
          solicitanteName: expedienteData.solicitanteName,
          solicitanteEmail: expedienteData.solicitanteEmail,
          otorganteId: expedienteData.otorganteId,
          otorganteName: expedienteData.otorganteName,
          otorganteEmail: expedienteData.otorganteEmail,
          title: expedienteData.title,
          description: expedienteData.description || '',
          amount: expedienteData.amount || 0,
          sector: expedienteData.sector || 'General',
          status: 'activo', // activo, pausado, cerrado
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          documents: [],
          requirements: [],
          messages: []
        };

        const request = store.add(expediente);

        request.onsuccess = () => resolve(expediente);
        request.onerror = () => reject(request.error);

        tx.onerror = () => reject(tx.error);
      };

      openDB.onerror = () => reject(openDB.error);
    } catch (err) {
      reject(err);
    }
  });
}

// Obtener expedientes del usuario (como solicitante O como otorgante)
export function getExpedientesForUser(userId) {
  return new Promise((resolve, reject) => {
    try {
      const openDB = indexedDB.open('nsd-app', 1);

      openDB.onsuccess = () => {
        const db = openDB.result;
        const tx = db.transaction('expedientes', 'readonly');
        const store = tx.objectStore('expedientes');

        const request = store.getAll();

        request.onsuccess = () => {
          const allExpedientes = request.result;
          // Filtrar: expedientes donde eres solicitante O donde eres otorgante
          const miExpedientes = allExpedientes.filter(exp =>
            exp.solicitanteId === userId || exp.otorganteId === userId
          );
          resolve(miExpedientes);
        };

        request.onerror = () => reject(request.error);
        tx.onerror = () => reject(tx.error);
      };

      openDB.onerror = () => reject(openDB.error);
    } catch (err) {
      reject(err);
    }
  });
}

// Obtener expediente por ID
export function getExpediente(expedienteId) {
  return new Promise((resolve, reject) => {
    try {
      const openDB = indexedDB.open('nsd-app', 1);

      openDB.onsuccess = () => {
        const db = openDB.result;
        const tx = db.transaction('expedientes', 'readonly');
        const store = tx.objectStore('expedientes');

        const request = store.get(expedienteId);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        tx.onerror = () => reject(tx.error);
      };

      openDB.onerror = () => reject(openDB.error);
    } catch (err) {
      reject(err);
    }
  });
}

// Actualizar expediente
export function updateExpediente(expedienteId, updates) {
  return new Promise((resolve, reject) => {
    try {
      const openDB = indexedDB.open('nsd-app', 1);

      openDB.onsuccess = () => {
        const db = openDB.result;
        const tx = db.transaction('expedientes', 'readwrite');
        const store = tx.objectStore('expedientes');

        const getRequest = store.get(expedienteId);

        getRequest.onsuccess = () => {
          const expediente = getRequest.result;
          if (!expediente) {
            reject(new Error('Expediente no encontrado'));
            return;
          }

          const updated = {
            ...expediente,
            ...updates,
            updatedAt: new Date().toISOString()
          };

          const putRequest = store.put(updated);
          putRequest.onsuccess = () => resolve(updated);
          putRequest.onerror = () => reject(putRequest.error);
        };

        getRequest.onerror = () => reject(getRequest.error);
        tx.onerror = () => reject(tx.error);
      };

      openDB.onerror = () => reject(openDB.error);
    } catch (err) {
      reject(err);
    }
  });
}

// Agregar documento a expediente
export function addDocumentToExpediente(expedienteId, documentId) {
  return new Promise((resolve, reject) => {
    getExpediente(expedienteId).then(exp => {
      if (!exp.documents.includes(documentId)) {
        exp.documents.push(documentId);
        updateExpediente(expedienteId, { documents: exp.documents })
          .then(resolve)
          .catch(reject);
      } else {
        resolve(exp);
      }
    }).catch(reject);
  });
}

// Agregar requerimiento a expediente
export function addRequirementToExpediente(expedienteId, requirementId) {
  return new Promise((resolve, reject) => {
    getExpediente(expedienteId).then(exp => {
      if (!exp.requirements.includes(requirementId)) {
        exp.requirements.push(requirementId);
        updateExpediente(expedienteId, { requirements: exp.requirements })
          .then(resolve)
          .catch(reject);
      } else {
        resolve(exp);
      }
    }).catch(reject);
  });
}

// Agregar mensaje a expediente
export function addMessageToExpediente(expedienteId, messageId) {
  return new Promise((resolve, reject) => {
    getExpediente(expedienteId).then(exp => {
      if (!exp.messages.includes(messageId)) {
        exp.messages.push(messageId);
        updateExpediente(expedienteId, { messages: exp.messages })
          .then(resolve)
          .catch(reject);
      } else {
        resolve(exp);
      }
    }).catch(reject);
  });
}

// Obtener resumen de expediente (para dashboard)
export function getExpedienteSummary(expedienteId) {
  return new Promise((resolve, reject) => {
    getExpediente(expedienteId).then(exp => {
      resolve({
        id: exp.id,
        title: exp.title,
        status: exp.status,
        solicitante: exp.solicitanteName,
        otorgante: exp.otorganteName,
        amount: exp.amount,
        documentsCount: exp.documents.length,
        requirementsCount: exp.requirements.length,
        messagesCount: exp.messages.length,
        createdAt: exp.createdAt,
        updatedAt: exp.updatedAt
      });
    }).catch(reject);
  });
}

// Obtener expedientes que el usuario puede VER (como solicitante o como otorgante)
export function getVisibleExpedientes(userId) {
  return getExpedientesForUser(userId);
}

// Verificar si usuario tiene acceso a expediente
export function canAccessExpediente(userId, expedienteId) {
  return new Promise((resolve, reject) => {
    getExpediente(expedienteId).then(exp => {
      const hasAccess = exp.solicitanteId === userId || exp.otorganteId === userId;
      resolve(hasAccess);
    }).catch(reject);
  });
}

// Crear expediente demo (para testing)
export function createDemoExpediente() {
  return createExpediente({
    solicitanteId: 'user-solicitante-001',
    solicitanteName: 'Empresa Solicitante',
    solicitanteEmail: 'empresa@ejemplo.com',
    otorganteId: 'user-otorgante-001',
    otorganteName: 'Fondo de Inversión',
    otorganteEmail: 'fondo@ejemplo.com',
    title: 'TechStart México - Crédito $500,000',
    description: 'Solicitud de crédito para expansión y capital de trabajo',
    amount: 500000,
    sector: 'Tecnología'
  });
}
