// ============================================
// SISTEMA DE MENSAJERÍA
// Chat entre Solicitante y Otorgante
// ============================================

export function sendMessage(db, messageData) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    try {
      const tx = db.transaction('messages', 'readwrite');
      const store = tx.objectStore('messages');

      const message = {
        id: `msg-${Date.now()}-${Math.random()}`,
        orderId: messageData.orderId,
        fromUserId: messageData.fromUserId,
        fromUserType: messageData.fromUserType, // 'solicitante' o 'otorgante'
        toUserId: messageData.toUserId,
        subject: messageData.subject,
        body: messageData.body,
        read: false,
        readAt: null,
        createdAt: new Date().toISOString(),
        attachments: messageData.attachments || []
      };

      const request = store.add(message);

      request.onsuccess = () => resolve(message);
      request.onerror = () => reject(request.error);

      tx.onerror = () => reject(tx.error);
    } catch (err) {
      reject(err);
    }
  });
}

// Obtener conversación
export function getConversation(db, orderId) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    try {
      const tx = db.transaction('messages', 'readonly');
      const store = tx.objectStore('messages');
      const index = store.index('orderId');

      const request = index.getAll(orderId);

      request.onsuccess = () => {
        const messages = request.result.sort((a, b) =>
          new Date(a.createdAt) - new Date(b.createdAt)
        );
        resolve(messages);
      };

      request.onerror = () => reject(request.error);
      tx.onerror = () => reject(tx.error);
    } catch (err) {
      reject(err);
    }
  });
}

// Obtener mensajes no leídos
export function getUnreadMessages(db, orderId, userId) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    try {
      const tx = db.transaction('messages', 'readonly');
      const store = tx.objectStore('messages');

      const request = store.getAll();

      request.onsuccess = () => {
        const unread = request.result.filter(m =>
          m.orderId === orderId &&
          m.toUserId === userId &&
          !m.read
        );
        resolve(unread);
      };

      request.onerror = () => reject(request.error);
      tx.onerror = () => reject(tx.error);
    } catch (err) {
      reject(err);
    }
  });
}

// Marcar mensaje como leído
export function markMessageAsRead(db, messageId) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    try {
      const tx = db.transaction('messages', 'readwrite');
      const store = tx.objectStore('messages');

      const getRequest = store.get(messageId);

      getRequest.onsuccess = () => {
        const message = getRequest.result;
        if (!message) {
          reject(new Error('Message not found'));
          return;
        }

        const updated = {
          ...message,
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

// Marcar conversación completa como leída
export function markConversationAsRead(db, orderId, userId) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    try {
      const tx = db.transaction('messages', 'readwrite');
      const store = tx.objectStore('messages');

      const request = store.getAll();

      request.onsuccess = () => {
        const messages = request.result.filter(m =>
          m.orderId === orderId &&
          m.toUserId === userId &&
          !m.read
        );

        messages.forEach(msg => {
          const updated = {
            ...msg,
            read: true,
            readAt: new Date().toISOString()
          };
          store.put(updated);
        });

        tx.oncomplete = () => resolve(messages.length);
      };

      request.onerror = () => reject(request.error);
      tx.onerror = () => reject(tx.error);
    } catch (err) {
      reject(err);
    }
  });
}

// Eliminar mensaje
export function deleteMessage(db, messageId) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    try {
      const tx = db.transaction('messages', 'readwrite');
      const store = tx.objectStore('messages');
      const request = store.delete(messageId);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);

      tx.onerror = () => reject(tx.error);
    } catch (err) {
      reject(err);
    }
  });
}

// Obtener resumen de conversación
export function getConversationSummary(db, orderId) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    try {
      const tx = db.transaction('messages', 'readonly');
      const store = tx.objectStore('messages');
      const index = store.index('orderId');

      const request = index.getAll(orderId);

      request.onsuccess = () => {
        const messages = request.result;
        const unread = messages.filter(m => !m.read).length;
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
        const messageCount = messages.length;

        resolve({
          total: messageCount,
          unread,
          lastMessage,
          lastMessageTime: lastMessage ? new Date(lastMessage.createdAt) : null
        });
      };

      request.onerror = () => reject(request.error);
      tx.onerror = () => reject(tx.error);
    } catch (err) {
      reject(err);
    }
  });
}
