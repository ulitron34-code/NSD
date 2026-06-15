import { error, debug, info, warn } from '../utils/logger';
// ============================================
// SERVICIO DE MENSAJERÍA AISLADO POR USUARIO
// ============================================

import { addMessageToExpediente } from './expedienteService';
import { createNotification } from './notificationService';

export function sendMessage(messageData) {
  return new Promise((resolve, reject) => {
    try {
      const openDB = indexedDB.open('nsd-app', 1);

      openDB.onsuccess = () => {
        const db = openDB.result;
        const tx = db.transaction('messages', 'readwrite');
        const store = tx.objectStore('messages');

        const message = {
          id: `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,

          // AISLAMIENTO: Quién envía y quién recibe
          fromUserId: messageData.fromUserId,
          fromUserType: messageData.fromUserType || 'solicitante', // solicitante, otorgante
          fromUserName: messageData.fromUserName,
          toUserId: messageData.toUserId,
          toUserType: messageData.toUserType,
          toUserName: messageData.toUserName,

          // Vinculación a expediente
          expedienteId: messageData.expedienteId,
          orderId: messageData.orderId || messageData.expedienteId,

          // Contenido
          subject: messageData.subject || '',
          body: messageData.body,
          messageType: messageData.messageType || 'text', // text, alert, update

          // Estados
          read: false,
          readAt: null,
          createdAt: new Date().toISOString(),

          // Metadatos
          attachments: messageData.attachments || [],
          tags: messageData.tags || [],
          priority: messageData.priority || 'normal' // low, normal, high
        };

        const request = store.add(message);

        request.onsuccess = () => {
          // Auto-vincular a expediente
          if (messageData.expedienteId) {
            addMessageToExpediente(messageData.expedienteId, message.id)
              .then(() => {
                // Notificar al destinatario
                if (messageData.toUserId) {
                  createNotification({
                    userId: messageData.toUserId,
                    type: 'message',
                    title: `Nuevo mensaje: ${message.subject || 'Sin asunto'}`,
                    message: message.body.substring(0, 100) + (message.body.length > 100 ? '...' : ''),
                    relatedId: message.id,
                    priority: message.priority
                  }).catch(err => debug("SVC", 'Notification error:', err));
                }
                resolve(message);
              })
              .catch(() => resolve(message));
          } else {
            resolve(message);
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

// Obtener mensajes DEL usuario (que ha enviado o recibido)
export function getConversationForUser(userId, expedienteId) {
  return new Promise((resolve, reject) => {
    try {
      const openDB = indexedDB.open('nsd-app', 1);

      openDB.onsuccess = () => {
        const db = openDB.result;
        const tx = db.transaction('messages', 'readonly');
        const store = tx.objectStore('messages');

        const request = store.getAll();

        request.onsuccess = () => {
          const allMessages = request.result;
          // AISLAMIENTO: Mensajes en esta conversación del usuario
          const conversation = allMessages.filter(msg =>
            msg.expedienteId === expedienteId &&
            (msg.fromUserId === userId || msg.toUserId === userId)
          );
          resolve(conversation.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
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

// Obtener mensajes SIN LEER del usuario
export function getUnreadMessages(userId) {
  return new Promise((resolve, reject) => {
    try {
      const openDB = indexedDB.open('nsd-app', 1);

      openDB.onsuccess = () => {
        const db = openDB.result;
        const tx = db.transaction('messages', 'readonly');
        const store = tx.objectStore('messages');

        const request = store.getAll();

        request.onsuccess = () => {
          const allMessages = request.result;
          // Mensajes dirigidos a este usuario que no ha leído
          const unread = allMessages.filter(msg =>
            msg.toUserId === userId && !msg.read
          );
          resolve(unread.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
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

// Marcar mensaje como leído
export function markMessageAsRead(messageId) {
  return new Promise((resolve, reject) => {
    try {
      const openDB = indexedDB.open('nsd-app', 1);

      openDB.onsuccess = () => {
        const db = openDB.result;
        const tx = db.transaction('messages', 'readwrite');
        const store = tx.objectStore('messages');

        const getRequest = store.get(messageId);

        getRequest.onsuccess = () => {
          const msg = getRequest.result;
          if (!msg) {
            reject(new Error('Mensaje no encontrado'));
            return;
          }

          const updated = {
            ...msg,
            read: true,
            readAt: new Date().toISOString()
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

// Marcar toda la conversación como leída
export function markConversationAsRead(userId, expedienteId) {
  return new Promise((resolve, reject) => {
    getConversationForUser(userId, expedienteId).then(messages => {
      const unread = messages.filter(m => !m.read && m.toUserId === userId);

      if (unread.length === 0) {
        resolve({ marked: 0 });
        return;
      }

      try {
        const openDB = indexedDB.open('nsd-app', 1);

        openDB.onsuccess = () => {
          const db = openDB.result;
          const tx = db.transaction('messages', 'readwrite');
          const store = tx.objectStore('messages');

          let marked = 0;

          unread.forEach(msg => {
            const updated = {
              ...msg,
              read: true,
              readAt: new Date().toISOString()
            };

            const putRequest = store.put(updated);

            putRequest.onsuccess = () => {
              marked++;
              if (marked === unread.length) {
                resolve({ marked: marked });
              }
            };

            putRequest.onerror = () => {
              // Continuar marcando otros mensajes
              marked++;
              if (marked === unread.length) {
                resolve({ marked: marked });
              }
            };
          });

          tx.onerror = () => reject(tx.error);
        };

        openDB.onerror = () => reject(openDB.error);
      } catch (err) {
        reject(err);
      }
    }).catch(reject);
  });
}

// Obtener resumen de conversación
export function getConversationSummary(userId, expedienteId) {
  return new Promise((resolve, reject) => {
    getConversationForUser(userId, expedienteId).then(messages => {
      const unread = messages.filter(m => !m.read && m.toUserId === userId);

      resolve({
        total: messages.length,
        read: messages.filter(m => m.read).length,
        unread: unread.length,
        lastMessage: messages[messages.length - 1] || null,
        byType: messages.reduce((acc, m) => {
          acc[m.messageType] = (acc[m.messageType] || 0) + 1;
          return acc;
        }, {})
      });
    }).catch(reject);
  });
}

// Obtener todas las conversaciones del usuario
export function getAllConversations(userId) {
  return new Promise((resolve, reject) => {
    try {
      const openDB = indexedDB.open('nsd-app', 1);

      openDB.onsuccess = () => {
        const db = openDB.result;
        const tx = db.transaction('messages', 'readonly');
        const store = tx.objectStore('messages');

        const request = store.getAll();

        request.onsuccess = () => {
          const allMessages = request.result;
          // Obtener todos los expedientes únicos del usuario
          const expedientes = new Set(
            allMessages
              .filter(m => m.fromUserId === userId || m.toUserId === userId)
              .map(m => m.expedienteId)
          );

          const conversations = Array.from(expedientes).map(expId => {
            const messages = allMessages.filter(
              m => m.expedienteId === expId && (m.fromUserId === userId || m.toUserId === userId)
            );

            const unread = messages.filter(m => !m.read && m.toUserId === userId).length;
            const lastMessage = messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

            return {
              expedienteId: expId,
              totalMessages: messages.length,
              unreadCount: unread,
              lastMessage: lastMessage
            };
          });

          resolve(conversations.sort((a, b) => new Date(b.lastMessage?.createdAt) - new Date(a.lastMessage?.createdAt)));
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
