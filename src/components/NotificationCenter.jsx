import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useIndexedDB } from "../hooks/useIndexedDB";
import {
  getUnreadNotifications,
  markNotificationAsRead,
  markAllAsRead,
  deleteNotification
} from "../services/notificationService";
import { COLORS } from "../utils/constants";
import { uiText } from "../utils/runtimeCopy";
import Icon from "./common/icons";

export default function NotificationCenter({ userId }) {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);
  const { db } = useIndexedDB('nsd-app', 1);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!showPanel) return;
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setShowPanel(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") setShowPanel(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showPanel]);

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
      <div style={{ position: 'relative' }} ref={panelRef}>
        <button
          onClick={() => setShowPanel(!showPanel)}
          aria-label={L("Notificaciones", "Notifications")}
          style={{
            position: 'relative',
            background: 'transparent',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: '0.5rem',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Icon name="bell" size={22} />
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
                {L("Notificaciones", "Notifications")} {unreadCount > 0 && `(${unreadCount})`}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
                    {L("Marcar todas", "Mark all")}
                  </button>
                )}
                <button
                  onClick={() => setShowPanel(false)}
                  aria-label={L("Cerrar", "Close")}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: COLORS.textMuted,
                    cursor: 'pointer',
                    fontSize: '1rem',
                    padding: 0,
                    lineHeight: 1
                  }}
                >
                  ✕
                </button>
              </div>
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
                        {new Date(notif.createdAt).toLocaleString(i18n.language === "en" ? "en-US" : "es-MX")}
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
                          {L("Marcar", "Mark")}
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
                  <p>{L("No tienes notificaciones", "You have no notifications")}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
