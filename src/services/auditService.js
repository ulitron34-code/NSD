import { error, debug, info, warn } from '../utils/logger';
// ============================================
// SERVICIO DE AUDITORÍA / LOGS
// Registra TODA la actividad del sistema
// ============================================

export function logActivity(activity) {
  return new Promise((resolve, reject) => {
    try {
      const openDB = indexedDB.open('nsd-app', 1);

      openDB.onsuccess = () => {
        const db = openDB.result;

        // Crear tabla si no existe
        if (!db.objectStoreNames.contains('activity_logs')) {
          debug('AUDIT', 'Activity logs table not found, will create on next upgrade');
        }

        const tx = db.transaction('logs', 'readwrite');
        const store = tx.objectStore('logs');

        const log = {
          timestamp: new Date().toISOString(),
          userId: activity.userId,
          type: activity.type, // document_upload, requirement_created, message_sent, requirement_approved, etc
          expedienteId: activity.expedienteId,
          title: activity.title,
          description: activity.description || '',
          entityId: activity.entityId, // ID del documento, requerimiento, mensaje, etc
          action: activity.action, // create, update, delete, approve, reject, respond
          metadata: activity.metadata || {} // datos adicionales
        };

        const request = store.add(log);

        request.onsuccess = () => resolve(log);
        request.onerror = () => reject(request.error);
        tx.onerror = () => reject(tx.error);
      };

      openDB.onerror = () => reject(openDB.error);
    } catch (err) {
      reject(err);
    }
  });
}

// Obtener logs del usuario
export function getActivityLogs(userId, limit = 100) {
  return new Promise((resolve, reject) => {
    try {
      const openDB = indexedDB.open('nsd-app', 1);

      openDB.onsuccess = () => {
        const db = openDB.result;
        const tx = db.transaction('logs', 'readonly');
        const store = tx.objectStore('logs');

        const request = store.getAll();

        request.onsuccess = () => {
          const allLogs = request.result;
          const userLogs = allLogs
            .filter(log => log.userId === userId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
          resolve(userLogs);
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

// Obtener logs de un expediente
export function getExpedienteActivityLogs(expedienteId) {
  return new Promise((resolve, reject) => {
    try {
      const openDB = indexedDB.open('nsd-app', 1);

      openDB.onsuccess = () => {
        const db = openDB.result;
        const tx = db.transaction('logs', 'readonly');
        const store = tx.objectStore('logs');

        const request = store.getAll();

        request.onsuccess = () => {
          const allLogs = request.result;
          const expLogs = allLogs
            .filter(log => log.expedienteId === expedienteId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          resolve(expLogs);
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

// Obtener resumen de actividad
export function getActivitySummary(userId) {
  return new Promise((resolve, reject) => {
    getActivityLogs(userId, 1000).then(logs => {
      const summary = {
        totalActivities: logs.length,
        byType: {},
        byAction: {},
        today: 0,
        thisWeek: 0,
        lastActivity: logs[0] || null
      };

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      logs.forEach(log => {
        // Por tipo
        summary.byType[log.type] = (summary.byType[log.type] || 0) + 1;

        // Por acción
        summary.byAction[log.action] = (summary.byAction[log.action] || 0) + 1;

        // Hoy
        const logDate = new Date(log.timestamp);
        if (logDate >= today) summary.today++;

        // Esta semana
        if (logDate >= weekAgo) summary.thisWeek++;
      });

      resolve(summary);
    }).catch(reject);
  });
}

// Limpiar logs (archivar)
export function clearOldLogs(daysToKeep = 30) {
  return new Promise((resolve, reject) => {
    try {
      const openDB = indexedDB.open('nsd-app', 1);

      openDB.onsuccess = () => {
        const db = openDB.result;
        const tx = db.transaction('logs', 'readwrite');
        const store = tx.objectStore('logs');

        const request = store.getAll();

        request.onsuccess = () => {
          const allLogs = request.result;
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

          let deleted = 0;
          allLogs.forEach(log => {
            if (new Date(log.timestamp) < cutoffDate) {
              store.delete(log.id);
              deleted++;
            }
          });

          resolve({ deleted, remaining: allLogs.length - deleted });
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

// Helper: Crear entrada de log automáticamente en servicios
export async function auditDocumentUpload(userId, expedienteId, documentName) {
  return logActivity({
    userId,
    type: 'document_upload',
    action: 'create',
    expedienteId,
    title: `Documento subido: ${documentName}`,
    description: `${documentName} subido al expediente`,
    metadata: { documentName }
  });
}

export async function auditRequirementCreated(userId, expedienteId, requirementTitle) {
  return logActivity({
    userId,
    type: 'requirement_created',
    action: 'create',
    expedienteId,
    title: `Requerimiento creado: ${requirementTitle}`,
    description: `Se creó requerimiento: ${requirementTitle}`,
    metadata: { requirementTitle }
  });
}

export async function auditRequirementApproved(userId, expedienteId, requirementTitle) {
  return logActivity({
    userId,
    type: 'requirement_approved',
    action: 'approve',
    expedienteId,
    title: `Requerimiento aprobado: ${requirementTitle}`,
    description: `Se aprobó: ${requirementTitle}`,
    metadata: { requirementTitle }
  });
}

export async function auditMessageSent(userId, expedienteId, recipientName) {
  return logActivity({
    userId,
    type: 'message_sent',
    action: 'create',
    expedienteId,
    title: `Mensaje enviado a ${recipientName}`,
    description: `Mensaje enviado en expediente`,
    metadata: { recipientName }
  });
}
