import { error, debug, info, warn } from '../utils/logger';
// ============================================
// SERVICIO DE DOCUMENTOS AISLADO POR USUARIO
// ============================================

import { addDocumentToExpediente } from './expedienteService';

export function createDocument(documentData) {
  return new Promise((resolve, reject) => {
    try {
      const openDB = indexedDB.open('nsd-app', 1);

      openDB.onsuccess = () => {
        const db = openDB.result;
        const tx = db.transaction('documents', 'readwrite');
        const store = tx.objectStore('documents');

        const document = {
          id: `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          // AISLAMIENTO POR USUARIO: el documento está vinculado al usuario que lo crea
          userId: documentData.userId || 'unknown',
          expedienteId: documentData.expedienteId,
          orderId: documentData.orderId || documentData.expedienteId,

          // Datos del documento
          fileName: documentData.fileName,
          fileType: documentData.fileType,
          fileSize: documentData.fileSize,
          documentType: documentData.documentType || 'general',
          description: documentData.description || '',

          // Estado
          status: 'pending', // pending, approved, rejected, overdue
          uploadedAt: new Date().toISOString(),
          approvedAt: null,
          rejectedAt: null,
          approvedBy: null,
          rejectionReason: null,

          // Metadatos
          confidential: documentData.confidential || false,
          tags: documentData.tags || [],
          priority: documentData.priority || 'normal',
          dueDate: documentData.dueDate || null,
        };

        const request = store.add(document);

        request.onsuccess = () => {
          // Auto-vincular a expediente si existe
          if (documentData.expedienteId) {
            addDocumentToExpediente(documentData.expedienteId, document.id)
              .then(() => resolve(document))
              .catch(() => resolve(document)); // Resolver de todas formas
          } else {
            resolve(document);
          }
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

// Obtener documentos SOLO del usuario actual
export function getDocumentsByUser(userId) {
  return new Promise((resolve, reject) => {
    try {
      const openDB = indexedDB.open('nsd-app', 1);

      openDB.onsuccess = () => {
        const db = openDB.result;
        const tx = db.transaction('documents', 'readonly');
        const store = tx.objectStore('documents');

        const request = store.getAll();

        request.onsuccess = () => {
          const allDocs = request.result;
          // AISLAMIENTO: Solo documentos del usuario
          const userDocs = allDocs.filter(doc => doc.userId === userId);
          resolve(userDocs);
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

// Obtener documentos de un expediente específico (que el usuario tiene acceso)
export function getDocumentsByExpediente(expedienteId, userId) {
  return new Promise((resolve, reject) => {
    try {
      const openDB = indexedDB.open('nsd-app', 1);

      openDB.onsuccess = () => {
        const db = openDB.result;
        const tx = db.transaction('documents', 'readonly');
        const store = tx.objectStore('documents');

        const request = store.getAll();

        request.onsuccess = () => {
          const allDocs = request.result;
          // Filtrar por expediente Y usuario
          const expDocs = allDocs.filter(doc =>
            doc.expedienteId === expedienteId && doc.userId === userId
          );
          resolve(expDocs);
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

// Obtener documento por ID
export function getDocument(documentId) {
  return new Promise((resolve, reject) => {
    try {
      const openDB = indexedDB.open('nsd-app', 1);

      openDB.onsuccess = () => {
        const db = openDB.result;
        const tx = db.transaction('documents', 'readonly');
        const store = tx.objectStore('documents');

        const request = store.get(documentId);

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

// Actualizar estado de documento
export function updateDocumentStatus(documentId, status, approvedBy = null, rejectionReason = null) {
  return new Promise((resolve, reject) => {
    try {
      const openDB = indexedDB.open('nsd-app', 1);

      openDB.onsuccess = () => {
        const db = openDB.result;
        const tx = db.transaction('documents', 'readwrite');
        const store = tx.objectStore('documents');

        const getRequest = store.get(documentId);

        getRequest.onsuccess = () => {
          const doc = getRequest.result;
          if (!doc) {
            reject(new Error('Documento no encontrado'));
            return;
          }

          const updated = {
            ...doc,
            status: status,
            approvedBy: approvedBy
          };

          if (status === 'approved') {
            updated.approvedAt = new Date().toISOString();
          } else if (status === 'rejected') {
            updated.rejectedAt = new Date().toISOString();
            updated.rejectionReason = rejectionReason;
          }

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

// Eliminar documento
export function deleteDocument(documentId) {
  return new Promise((resolve, reject) => {
    try {
      const openDB = indexedDB.open('nsd-app', 1);

      openDB.onsuccess = () => {
        const db = openDB.result;
        const tx = db.transaction('documents', 'readwrite');
        const store = tx.objectStore('documents');

        const request = store.delete(documentId);

        request.onsuccess = () => resolve({ deleted: true });
        request.onerror = () => reject(request.error);
        tx.onerror = () => reject(tx.error);
      };

      openDB.onerror = () => reject(openDB.error);
    } catch (err) {
      reject(err);
    }
  });
}

// Obtener estadísticas de documentos del usuario
export function getDocumentStats(userId) {
  return new Promise((resolve, reject) => {
    getDocumentsByUser(userId).then(docs => {
      resolve({
        total: docs.length,
        approved: docs.filter(d => d.status === 'approved').length,
        pending: docs.filter(d => d.status === 'pending').length,
        rejected: docs.filter(d => d.status === 'rejected').length,
        byType: docs.reduce((acc, d) => {
          acc[d.documentType] = (acc[d.documentType] || 0) + 1;
          return acc;
        }, {})
      });
    }).catch(reject);
  });
}
