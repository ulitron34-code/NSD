import { error, debug, info, warn } from '../utils/logger';
// ============================================
// GUARDAR DOCUMENTO EN INDEXEDDB
// ============================================
export function saveDocument(db, file, orderId, userId) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const tx = db.transaction('documents', 'readwrite');
        const store = tx.objectStore('documents');

        const doc = {
          id: `doc-${Date.now()}`,
          orderId,
          filename: file.name,
          filesize: file.size,
          filetype: file.type,
          filedata: reader.result, // Archivo binario
          uploadedAt: new Date().toISOString(),
          uploadedBy: userId,
          status: 'uploaded',
          risk: 'Bajo',
          reviewer: null,
          notes: '',
          version: 1
        };

        const request = store.add(doc);

        request.onsuccess = () => resolve(doc);
        request.onerror = () => reject(request.error);

        tx.onerror = () => reject(tx.error);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

// ============================================
// OBTENER DOCUMENTOS DE UNA ORDEN
// ============================================
export function getDocumentsByOrder(db, orderId) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    try {
      const tx = db.transaction('documents', 'readonly');
      const store = tx.objectStore('documents');
      const index = store.index('orderId');

      const request = index.getAll(orderId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);

      tx.onerror = () => reject(tx.error);
    } catch (err) {
      reject(err);
    }
  });
}

// ============================================
// OBTENER UN DOCUMENTO
// ============================================
export function getDocument(db, docId) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    try {
      const tx = db.transaction('documents', 'readonly');
      const store = tx.objectStore('documents');
      const request = store.get(docId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);

      tx.onerror = () => reject(tx.error);
    } catch (err) {
      reject(err);
    }
  });
}

// ============================================
// ACTUALIZAR DOCUMENTO
// ============================================
export function updateDocument(db, docId, updates) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    try {
      const tx = db.transaction('documents', 'readwrite');
      const store = tx.objectStore('documents');

      // Primero obtener el documento actual
      const getRequest = store.get(docId);

      getRequest.onsuccess = () => {
        const doc = getRequest.result;
        if (!doc) {
          reject(new Error('Document not found'));
          return;
        }

        const updated = { ...doc, ...updates, version: (doc.version || 1) + 1 };

        const updateRequest = store.put(updated);
        updateRequest.onsuccess = () => resolve(updated);
        updateRequest.onerror = () => reject(updateRequest.error);
      };

      getRequest.onerror = () => reject(getRequest.error);
      tx.onerror = () => reject(tx.error);
    } catch (err) {
      reject(err);
    }
  });
}

// ============================================
// ELIMINAR DOCUMENTO
// ============================================
export function deleteDocument(db, docId) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    try {
      const tx = db.transaction('documents', 'readwrite');
      const store = tx.objectStore('documents');
      const request = store.delete(docId);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);

      tx.onerror = () => reject(tx.error);
    } catch (err) {
      reject(err);
    }
  });
}

// ============================================
// GUARDAR LOG (AUDITORÍA)
// ============================================
export function saveLog(db, action, entityType, entityId, userId, changes) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    try {
      const tx = db.transaction('logs', 'readwrite');
      const store = tx.objectStore('logs');

      const log = {
        timestamp: new Date().toISOString(),
        action,
        entityType,
        entityId,
        userId,
        changes,
        userAgent: navigator.userAgent
      };

      const request = store.add(log);

      request.onsuccess = () => resolve(log);
      request.onerror = () => reject(request.error);

      tx.onerror = () => reject(tx.error);
    } catch (err) {
      reject(err);
    }
  });
}

// ============================================
// OBTENER LOGS DE UNA ENTIDAD
// ============================================
export function getLogsByEntity(db, entityId) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    try {
      const tx = db.transaction('logs', 'readonly');
      const store = tx.objectStore('logs');

      const request = store.getAll();

      request.onsuccess = () => {
        const allLogs = request.result;
        const filtered = allLogs.filter(log => log.entityId === entityId);
        const sorted = filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        resolve(sorted);
      };

      request.onerror = () => reject(request.error);
      tx.onerror = () => reject(tx.error);
    } catch (err) {
      reject(err);
    }
  });
}

// ============================================
// OBTENER TODOS LOS LOGS
// ============================================
export function getAllLogs(db) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    try {
      const tx = db.transaction('logs', 'readonly');
      const store = tx.objectStore('logs');
      const request = store.getAll();

      request.onsuccess = () => {
        const logs = request.result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        resolve(logs);
      };

      request.onerror = () => reject(request.error);
      tx.onerror = () => reject(tx.error);
    } catch (err) {
      reject(err);
    }
  });
}

// ============================================
// LIMPIAR BASE DE DATOS (DESARROLLO)
// ============================================
export function clearDatabase(db) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    try {
      const tx = db.transaction(['documents', 'logs'], 'readwrite');
      const docsStore = tx.objectStore('documents');
      const logsStore = tx.objectStore('logs');

      const clearDocs = docsStore.clear();
      const clearLogs = logsStore.clear();

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    } catch (err) {
      reject(err);
    }
  });
}
