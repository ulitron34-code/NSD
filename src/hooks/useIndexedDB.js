import { useState, useEffect } from 'react';

export function useIndexedDB(dbName = 'nsd-app', version = 1) {
  const [db, setDb] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Abrir/crear base de datos
    const request = indexedDB.open(dbName, version);

    request.onerror = () => {
      console.error('DB error:', request.error);
      setError(request.error);
    };

    request.onsuccess = () => {
      const database = request.result;
      setDb(database);
    };

    // Crear tablas en primera apertura
    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Crear "table" (object store) para documentos
      if (!database.objectStoreNames.contains('documents')) {
        const store = database.createObjectStore('documents', { keyPath: 'id' });
        store.createIndex('orderId', 'orderId', { unique: false });
      }

      // Crear "table" para audit logs
      if (!database.objectStoreNames.contains('logs')) {
        const store = database.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
        store.createIndex('entityId', 'entityId', { unique: false });
      }

      // Crear "table" para requerimientos (requests)
      if (!database.objectStoreNames.contains('requirements')) {
        const store = database.createObjectStore('requirements', { keyPath: 'id' });
        store.createIndex('orderId', 'orderId', { unique: false });
        store.createIndex('status', 'status', { unique: false });
      }

      // Crear "table" para notificaciones
      if (!database.objectStoreNames.contains('notifications')) {
        const store = database.createObjectStore('notifications', { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
        store.createIndex('read', 'read', { unique: false });
      }

      // Crear "table" para mensajes
      if (!database.objectStoreNames.contains('messages')) {
        const store = database.createObjectStore('messages', { keyPath: 'id' });
        store.createIndex('orderId', 'orderId', { unique: false });
        store.createIndex('read', 'read', { unique: false });
      }

      // Crear "table" para expedientes
      if (!database.objectStoreNames.contains('expedientes')) {
        const store = database.createObjectStore('expedientes', { keyPath: 'id' });
        store.createIndex('solicitanteId', 'solicitanteId', { unique: false });
        store.createIndex('otorganteId', 'otorganteId', { unique: false });
        store.createIndex('status', 'status', { unique: false });
      }
    };
  }, [dbName, version]);

  return { db, error };
}
