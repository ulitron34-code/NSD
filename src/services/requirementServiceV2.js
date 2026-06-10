// ============================================
// SERVICIO DE REQUERIMIENTOS AISLADO POR USUARIO
// ============================================

import { addRequirementToExpediente } from './expedienteService';
import { createNotification } from './notificationService';

export function createRequirement(requirementData) {
  return new Promise((resolve, reject) => {
    try {
      const openDB = indexedDB.open('nsd-app', 1);

      openDB.onsuccess = () => {
        const db = openDB.result;
        const tx = db.transaction('requirements', 'readwrite');
        const store = tx.objectStore('requirements');

        const requirement = {
          id: `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,

          // AISLAMIENTO: Creado por este usuario
          createdBy: requirementData.createdBy,
          createdByRole: requirementData.createdByRole || 'otorgante', // quién creó
          targetUserId: requirementData.targetUserId, // a quién va dirigida

          // Vinculación a expediente
          expedienteId: requirementData.expedienteId,
          orderId: requirementData.orderId || requirementData.expedienteId,

          // Contenido
          title: requirementData.title,
          description: requirementData.description || '',
          documentType: requirementData.documentType,
          priority: requirementData.priority || 'normal', // high, normal, low
          dueDate: requirementData.dueDate,

          // Estados
          status: 'pending', // pending, provided, approved, rejected, overdue
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          providedAt: null,
          approvedAt: null,
          rejectedAt: null,

          // Respuesta
          responseDocumentId: null,
          feedback: '',
          rejectionReason: '',
          approvedBy: null,
        };

        const request = store.add(requirement);

        request.onsuccess = () => {
          // Auto-vincular a expediente
          if (requirementData.expedienteId) {
            addRequirementToExpediente(requirementData.expedienteId, requirement.id)
              .then(() => {
                // Notificar al usuario destino
                if (requirementData.targetUserId) {
                  createNotification({
                    userId: requirementData.targetUserId,
                    type: 'requirement',
                    title: `Nuevo requerimiento: ${requirement.title}`,
                    message: requirement.description,
                    relatedId: requirement.id,
                    priority: requirement.priority === 'high' ? 'high' : 'normal'
                  }).catch(err => console.log('Notification error:', err));
                }
                resolve(requirement);
              })
              .catch(() => resolve(requirement));
          } else {
            resolve(requirement);
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

// Obtener requerimientos DEL usuario (que el usuario ha recibido)
export function getRequirementsForUser(userId) {
  return new Promise((resolve, reject) => {
    try {
      const openDB = indexedDB.open('nsd-app', 1);

      openDB.onsuccess = () => {
        const db = openDB.result;
        const tx = db.transaction('requirements', 'readonly');
        const store = tx.objectStore('requirements');

        const request = store.getAll();

        request.onsuccess = () => {
          const allReqs = request.result;
          // AISLAMIENTO: Requerimientos dirigidos a este usuario
          const userReqs = allReqs.filter(req => req.targetUserId === userId);
          resolve(userReqs);
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

// Obtener requerimientos de un expediente específico
export function getRequirementsByExpediente(expedienteId) {
  return new Promise((resolve, reject) => {
    try {
      const openDB = indexedDB.open('nsd-app', 1);

      openDB.onsuccess = () => {
        const db = openDB.result;
        const tx = db.transaction('requirements', 'readonly');
        const store = tx.objectStore('requirements');

        const request = store.getAll();

        request.onsuccess = () => {
          const allReqs = request.result;
          const expReqs = allReqs.filter(req => req.expedienteId === expedienteId);
          resolve(expReqs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
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

// Obtener requerimiento por ID
export function getRequirement(requirementId) {
  return new Promise((resolve, reject) => {
    try {
      const openDB = indexedDB.open('nsd-app', 1);

      openDB.onsuccess = () => {
        const db = openDB.result;
        const tx = db.transaction('requirements', 'readonly');
        const store = tx.objectStore('requirements');

        const request = store.get(requirementId);

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

// Responder a requerimiento (usuario target sube documento respuesta)
export function respondToRequirement(requirementId, responseDocumentId) {
  return new Promise((resolve, reject) => {
    getRequirement(requirementId).then(req => {
      if (!req) {
        reject(new Error('Requerimiento no encontrado'));
        return;
      }

      const openDB = indexedDB.open('nsd-app', 1);

      openDB.onsuccess = () => {
        const db = openDB.result;
        const tx = db.transaction('requirements', 'readwrite');
        const store = tx.objectStore('requirements');

        const updated = {
          ...req,
          status: 'provided',
          responseDocumentId: responseDocumentId,
          providedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const putRequest = store.put(updated);

        putRequest.onsuccess = () => {
          // Notificar al creador que hay respuesta
          if (req.createdBy) {
            createNotification({
              userId: req.createdBy,
              type: 'requirement',
              title: `Respuesta a: ${req.title}`,
              message: 'Se ha proporcionado un documento en respuesta a tu requerimiento',
              relatedId: requirementId,
              priority: 'high'
            }).catch(err => console.log('Notification error:', err));
          }
          resolve(updated);
        };

        putRequest.onerror = () => reject(putRequest.error);
        tx.onerror = () => reject(tx.error);
      };

      openDB.onerror = () => reject(openDB.error);
    }).catch(reject);
  });
}

// Aprobar respuesta de requerimiento
export function approveRequirementResponse(requirementId, approvedBy) {
  return new Promise((resolve, reject) => {
    getRequirement(requirementId).then(req => {
      const openDB = indexedDB.open('nsd-app', 1);

      openDB.onsuccess = () => {
        const db = openDB.result;
        const tx = db.transaction('requirements', 'readwrite');
        const store = tx.objectStore('requirements');

        const updated = {
          ...req,
          status: 'approved',
          approvedAt: new Date().toISOString(),
          approvedBy: approvedBy,
          updatedAt: new Date().toISOString()
        };

        const putRequest = store.put(updated);

        putRequest.onsuccess = () => {
          // Notificar al usuario que su respuesta fue aprobada
          if (req.targetUserId) {
            createNotification({
              userId: req.targetUserId,
              type: 'approval',
              title: `Aprobado: ${req.title}`,
              message: 'Tu respuesta ha sido aprobada',
              relatedId: requirementId,
              priority: 'normal'
            }).catch(err => console.log('Notification error:', err));
          }
          resolve(updated);
        };

        putRequest.onerror = () => reject(putRequest.error);
        tx.onerror = () => reject(tx.error);
      };

      openDB.onerror = () => reject(openDB.error);
    }).catch(reject);
  });
}

// Rechazar respuesta de requerimiento
export function rejectRequirementResponse(requirementId, rejectionReason, approvedBy) {
  return new Promise((resolve, reject) => {
    getRequirement(requirementId).then(req => {
      const openDB = indexedDB.open('nsd-app', 1);

      openDB.onsuccess = () => {
        const db = openDB.result;
        const tx = db.transaction('requirements', 'readwrite');
        const store = tx.objectStore('requirements');

        const updated = {
          ...req,
          status: 'rejected',
          rejectionReason: rejectionReason,
          rejectedAt: new Date().toISOString(),
          approvedBy: approvedBy,
          updatedAt: new Date().toISOString()
        };

        const putRequest = store.put(updated);

        putRequest.onsuccess = () => {
          // Notificar al usuario que su respuesta fue rechazada
          if (req.targetUserId) {
            createNotification({
              userId: req.targetUserId,
              type: 'rejection',
              title: `Rechazado: ${req.title}`,
              message: `Motivo: ${rejectionReason}`,
              relatedId: requirementId,
              priority: 'high'
            }).catch(err => console.log('Notification error:', err));
          }
          resolve(updated);
        };

        putRequest.onerror = () => reject(putRequest.error);
        tx.onerror = () => reject(tx.error);
      };

      openDB.onerror = () => reject(openDB.error);
    }).catch(reject);
  });
}

// Obtener estadísticas de requerimientos
export function getRequirementStats(expedienteId) {
  return new Promise((resolve, reject) => {
    getRequirementsByExpediente(expedienteId).then(reqs => {
      resolve({
        total: reqs.length,
        pending: reqs.filter(r => r.status === 'pending').length,
        provided: reqs.filter(r => r.status === 'provided').length,
        approved: reqs.filter(r => r.status === 'approved').length,
        rejected: reqs.filter(r => r.status === 'rejected').length,
        overdue: reqs.filter(r => r.dueDate && new Date(r.dueDate) < new Date() && r.status !== 'approved').length
      });
    }).catch(reject);
  });
}
