import { error, debug, info, warn } from '../utils/logger';
// ============================================
// GESTIÓN DE REQUERIMIENTOS (REQUESTS)
// Permite que Otorgante (Funder) solicite documentos
// a Solicitante (Applicant) en tiempo real
// ============================================

export function createRequirement(db, requirementData) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    try {
      const tx = db.transaction('requirements', 'readwrite');
      const store = tx.objectStore('requirements');

      const requirement = {
        id: `req-${Date.now()}`,
        orderId: requirementData.orderId,
        title: requirementData.title,
        description: requirementData.description,
        documentType: requirementData.documentType,
        priority: requirementData.priority || 'normal', // high, normal, low
        status: 'pending', // pending, provided, approved, rejected, overdue
        createdBy: requirementData.createdBy,
        createdAt: new Date().toISOString(),
        dueDate: requirementData.dueDate,
        responseDocumentId: null,
        respondedAt: null,
        feedback: '',
        isApproved: false,
        version: 1
      };

      const request = store.add(requirement);

      request.onsuccess = () => resolve(requirement);
      request.onerror = () => reject(request.error);

      tx.onerror = () => reject(tx.error);
    } catch (err) {
      reject(err);
    }
  });
}

// Obtener requerimientos de una orden
export function getRequirementsByOrder(db, orderId) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    try {
      const tx = db.transaction('requirements', 'readonly');
      const store = tx.objectStore('requirements');
      const index = store.index('orderId');

      const request = index.getAll(orderId);

      request.onsuccess = () => {
        const results = request.result;
        // Ordenar por prioridad y fecha de creación
        const sorted = results.sort((a, b) => {
          const priorityOrder = { high: 1, normal: 2, low: 3 };
          if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          }
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        resolve(sorted);
      };

      request.onerror = () => reject(request.error);
      tx.onerror = () => reject(tx.error);
    } catch (err) {
      reject(err);
    }
  });
}

// Obtener un requerimiento específico
export function getRequirement(db, requirementId) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    try {
      const tx = db.transaction('requirements', 'readonly');
      const store = tx.objectStore('requirements');
      const request = store.get(requirementId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      tx.onerror = () => reject(tx.error);
    } catch (err) {
      reject(err);
    }
  });
}

// Responder a un requerimiento (adjuntar documento)
export function respondToRequirement(db, requirementId, documentId, feedback = '') {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    try {
      const tx = db.transaction('requirements', 'readwrite');
      const store = tx.objectStore('requirements');

      const getRequest = store.get(requirementId);

      getRequest.onsuccess = () => {
        const requirement = getRequest.result;
        if (!requirement) {
          reject(new Error('Requirement not found'));
          return;
        }

        const updated = {
          ...requirement,
          status: 'provided',
          responseDocumentId: documentId,
          respondedAt: new Date().toISOString(),
          feedback: feedback,
          version: (requirement.version || 1) + 1
        };

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

// Aprobar respuesta a requerimiento
export function approveRequirementResponse(db, requirementId, feedback = '') {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    try {
      const tx = db.transaction('requirements', 'readwrite');
      const store = tx.objectStore('requirements');

      const getRequest = store.get(requirementId);

      getRequest.onsuccess = () => {
        const requirement = getRequest.result;
        if (!requirement) {
          reject(new Error('Requirement not found'));
          return;
        }

        const updated = {
          ...requirement,
          status: 'approved',
          isApproved: true,
          feedback: feedback,
          version: (requirement.version || 1) + 1
        };

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

// Rechazar respuesta
export function rejectRequirementResponse(db, requirementId, feedback) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    try {
      const tx = db.transaction('requirements', 'readwrite');
      const store = tx.objectStore('requirements');

      const getRequest = store.get(requirementId);

      getRequest.onsuccess = () => {
        const requirement = getRequest.result;
        if (!requirement) {
          reject(new Error('Requirement not found'));
          return;
        }

        const updated = {
          ...requirement,
          status: 'rejected',
          isApproved: false,
          feedback: feedback,
          version: (requirement.version || 1) + 1
        };

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

// Calcular estado del pipeline basado en requerimientos
export function calculateRequirementStatus(requirements) {
  const total = requirements.length;
  const approved = requirements.filter(r => r.isApproved).length;
  const pending = requirements.filter(r => r.status === 'pending').length;
  const overdue = requirements.filter(r => {
    if (!r.dueDate) return false;
    return new Date(r.dueDate) < new Date() && r.status !== 'approved';
  }).length;

  return {
    total,
    approved,
    pending,
    overdue,
    completionPercentage: total > 0 ? Math.round((approved / total) * 100) : 0,
    status: overdue > 0 ? 'overdue' : pending === 0 ? 'complete' : 'in_progress'
  };
}
