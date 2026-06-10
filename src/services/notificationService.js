// ============================================
// SISTEMA DE NOTIFICACIONES
// Alertas para Solicitante y Otorgante
// ============================================

export function createNotification(db, notificationData) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    try {
      const tx = db.transaction('notifications', 'readwrite');
      const store = tx.objectStore('notifications');

      const notification = {
        id: `notif-${Date.now()}`,
        userId: notificationData.userId,
        type: notificationData.type, // 'requirement', 'approval', 'rejection', 'message'
        title: notificationData.title,
        message: notificationData.message,
        relatedId: notificationData.relatedId, // ID del requerimiento, documento, etc.
        relatedType: notificationData.relatedType, // 'requirement', 'document'
        read: false,
        readAt: null,
        createdAt: new Date().toISOString(),
        priority: notificationData.priority || 'normal' // high, normal, low
      };

      const request = store.add(notification);

      request.onsuccess = () => resolve(notification);
      request.onerror = () => reject(request.error);

      tx.onerror = () => reject(tx.error);
    } catch (err) {
      reject(err);
    }
  });
}

// Obtener notificaciones de un usuario
export function getNotificationsByUser(db, userId) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    try {
      const tx = db.transaction('notifications', 'readonly');
      const store = tx.objectStore('notifications');
      const index = store.index('userId');

      const request = index.getAll(userId);

      request.onsuccess = () => {
        const notifications = request.result.sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        resolve(notifications);
      };

      request.onerror = () => reject(request.error);
      tx.onerror = () => reject(tx.error);
    } catch (err) {
      reject(err);
    }
  });
}

// Obtener notificaciones no leídas
export function getUnreadNotifications(db, userId) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    try {
      const tx = db.transaction('notifications', 'readonly');
      const store = tx.objectStore('notifications');

      const request = store.getAll();

      request.onsuccess = () => {
        const unread = request.result
          .filter(n => n.userId === userId && !n.read)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        resolve(unread);
      };

      request.onerror = () => reject(request.error);
      tx.onerror = () => reject(tx.error);
    } catch (err) {
      reject(err);
    }
  });
}

// Marcar notificación como leída
export function markNotificationAsRead(db, notificationId) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    try {
      const tx = db.transaction('notifications', 'readwrite');
      const store = tx.objectStore('notifications');

      const getRequest = store.get(notificationId);

      getRequest.onsuccess = () => {
        const notification = getRequest.result;
        if (!notification) {
          reject(new Error('Notification not found'));
          return;
        }

        const updated = {
          ...notification,
          read: true,
          readAt: new Date().toISOString()
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

// Marcar todas como leídas
export function markAllAsRead(db, userId) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    try {
      const tx = db.transaction('notifications', 'readwrite');
      const store = tx.objectStore('notifications');

      const request = store.getAll();

      request.onsuccess = () => {
        const notifications = request.result.filter(n => n.userId === userId && !n.read);

        notifications.forEach(notif => {
          const updated = {
            ...notif,
            read: true,
            readAt: new Date().toISOString()
          };
          store.put(updated);
        });

        tx.oncomplete = () => resolve(notifications.length);
      };

      request.onerror = () => reject(request.error);
      tx.onerror = () => reject(tx.error);
    } catch (err) {
      reject(err);
    }
  });
}

// Eliminar notificación
export function deleteNotification(db, notificationId) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    try {
      const tx = db.transaction('notifications', 'readwrite');
      const store = tx.objectStore('notifications');
      const request = store.delete(notificationId);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);

      tx.onerror = () => reject(tx.error);
    } catch (err) {
      reject(err);
    }
  });
}

// Helpers para crear notificaciones específicas
export async function notifyNewRequirement(db, userId, requirementTitle, requirementId) {
  return createNotification(db, {
    userId,
    type: 'requirement',
    title: '📋 Nuevo requerimiento',
    message: `Se solicita: ${requirementTitle}`,
    relatedId: requirementId,
    relatedType: 'requirement',
    priority: 'high'
  });
}

export async function notifyRequirementApproved(db, userId, requirementTitle, requirementId) {
  return createNotification(db, {
    userId,
    type: 'approval',
    title: '✅ Requerimiento aprobado',
    message: `Tu respuesta para "${requirementTitle}" fue aprobada.`,
    relatedId: requirementId,
    relatedType: 'requirement',
    priority: 'normal'
  });
}

export async function notifyRequirementRejected(db, userId, requirementTitle, requirementId, feedback) {
  return createNotification(db, {
    userId,
    type: 'rejection',
    title: '❌ Requerimiento rechazado',
    message: `Tu respuesta para "${requirementTitle}" fue rechazada. Feedback: ${feedback}`,
    relatedId: requirementId,
    relatedType: 'requirement',
    priority: 'high'
  });
}
