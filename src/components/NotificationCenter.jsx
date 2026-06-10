import React, { useState, useEffect } from "react";
import { useIndexedDB } from "../hooks/useIndexedDB";
import {
  getUnreadNotifications,
  markNotificationAsRead,
  markAllAsRead,
  deleteNotification
} from "../services/notificationService";
import { COLORS } from "../utils/constants";

export default function NotificationCenter({ userId }) {
  const { db } = useIndexedDB('nsd-app', 1);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);

  // Cargar notificaciones
  useEffect(() => {
    if (!db || !userId) return;

    const loadNotifications = async () => {
      try {
        const unread = await getUnreadNotifications(db, userId);
        setNotifications(unread);
        setUnreadCount(unread.length);
      } catch (err) {
        console.error('Error loading notifications:', err);
      }
    };

    loadNotifications();

    // Recargar cada 10 segundos
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, [db, userId]);

  const handleRead = async (notificationId) => {
    try {
      await markNotificationAsRead(db, notificationId);
      setNotifications(notifications.filter(n => n.id !== notificationId));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleReadAll = async () => {
    try {
      await markAllAsRead(db, userId);
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await deleteNotification(db, notificationId);
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'requirement': return '📋';
      case 'approval': return '✅';
      case 'rejection': return '❌';
      case 'message': return '💬';
      default: return '🔔';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#C62828';
      case 'normal': return COLORS.gold;
      case 'low': return COLORS.textMuted;
      default: return COLORS.text;
    }
  };

  return (
    <>
      {/* BELL ICON */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowPanel(!showPanel)}
          style={{
            position: 'relative',
            background: 'transparent',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '0.5rem'
          }}
        >
          🔔
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#C62828',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                fontWeight: 'bold'
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>

        {/* PANEL */}
        {showPanel && (
          <div
            style={{
              position: 'fixed',
              top: '60px',
              right: '20px',
              width: '320px',
              maxHeight: '500px',
              background: COLORS.white,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              zIndex: 1000,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* HEADER */}
            <div
              style={{
                padding: '1rem',
                borderBottom: `1px solid ${COLORS.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <h3 style={{ color: COLORS.navy, margin: 0, fontWeight: 700 }}>
                Notificaciones {unreadCount > 0 && `(${unreadCount})`}
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleReadAll}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: COLORS.gold,
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textDecoration: 'underline'
                  }}
                >
                  Marcar todas
                </button>
              )}
            </div>

            {/* NOTIFICATIONS LIST */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    style={{
                      padding: '1rem',
                      borderBottom: `1px solid ${COLORS.border}`,
                      background: notif.read ? COLORS.bg : 'rgba(201,168,76,0.06)',
                      borderLeft: `3px solid ${getPriorityColor(notif.priority)}`
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '0.5rem',
                        marginBottom: '0.5rem'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                        <span style={{ fontSize: '1.2rem' }}>
                          {getNotificationIcon(notif.type)}
                        </span>
                        <div style={{ flex: 1 }}>
                          <p
                            style={{
                              color: COLORS.navy,
                              fontWeight: 700,
                              margin: '0 0 0.25rem 0',
                              fontSize: '0.9rem'
                            }}
                          >
                            {notif.title}
                          </p>
                          <p
                            style={{
                              color: COLORS.textMuted,
                              margin: 0,
                              fontSize: '0.8rem',
                              lineHeight: 1.4
                            }}
                          >
                            {notif.message}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notif.id);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: COLORS.textMuted,
                          cursor: 'pointer',
                          fontSize: '1rem',
                          padding: 0
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <p
                        style={{
                          color: COLORS.textMuted,
                          fontSize: '0.7rem',
                          margin: 0
                        }}
                      >
                        {new Date(notif.createdAt).toLocaleString('es-MX')}
                      </p>
                      {!notif.read && (
                        <button
                          onClick={() => handleRead(notif.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: COLORS.gold,
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textDecoration: 'underline'
                          }}
                        >
                          Marcar
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: '2rem 1rem',
                    textAlign: 'center',
                    color: COLORS.textMuted
                  }}
                >
                  <p>No tienes notificaciones</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
