import { error, debug } from '../../utils/logger';
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNotification } from "../../hooks/useNotification";
import { useAuth } from "../../hooks/useAuth";
import { useMyOrders } from "../../hooks/useMyOrders";
import { COLORS } from "../../utils/constants";
import { uiText } from "../../utils/runtimeCopy";
import {
  sendMessage,
  getConversationForUser,
  markMessageAsRead,
  markConversationAsRead,
  getUnreadMessages
} from "../../services/messagingServiceV2";
import { getExpedientesForUser } from "../../services/expedienteService";
import { messagingAPI } from "../../services/api";

// Normaliza filas reales de `messages` (backend) al mismo shape minimo que
// usa el render, para no bifurcar todo el JSX entre demo/real.
function normalizeRealMessage(row, userId) {
  return {
    id: row.id,
    fromUserId: row.sender_user_id,
    fromUserName: row.sender_email || "—",
    subject: null,
    body: row.body,
    createdAt: row.created_at,
    read: Boolean(row.read_at) || row.sender_user_id === userId
  };
}

export default function MessagingTab() {
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);
  const { orders: realOrders, orderId: defaultRealOrderId, isDemo } = useMyOrders();

  const [expedientes, setExpedientes] = useState([]);
  const [selectedExpediente, setSelectedExpediente] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const [formData, setFormData] = useState({
    subject: "",
    body: "",
  });

  // Cargar la lista de expedientes disponibles para elegir conversación.
  useEffect(() => {
    if (!user) return;

    if (isDemo) {
      const loadExpedientes = async () => {
        try {
          const exps = await getExpedientesForUser(user.id);
          setExpedientes(exps);
          if (exps.length > 0 && !selectedExpediente) {
            setSelectedExpediente(exps[0]);
          }
        } catch (err) {
          error("SVC", "Error loading expedientes:", err);
        }
      };
      loadExpedientes();
      return;
    }

    const mapped = realOrders.map((order) => ({
      id: order.id,
      title: order.project_name || order.metadata?.projectName || order.case_number || 'Expediente'
    }));
    setExpedientes(mapped);
    if (mapped.length > 0 && !selectedExpediente) {
      setSelectedExpediente(mapped[0]);
    }
  }, [user, isDemo, realOrders]);

  useEffect(() => {
    if (!selectedExpediente || !user) {
      setLoading(false);
      return;
    }

    const loadConversationDemo = async () => {
      try {
        setLoading(true);
        const msgs = await getConversationForUser(user.id, selectedExpediente.id);
        setMessages(msgs);

        const unread = await getUnreadMessages(user.id);
        const inThisExp = unread.filter(m => m.expedienteId === selectedExpediente.id);
        setUnreadCount(inThisExp.length);

        inThisExp.forEach(msg => {
          markMessageAsRead(msg.id).catch(err => debug("SVC", "Mark read error:", err));
        });
      } catch (err) {
        error("SVC", "Error loading conversation:", err);
      } finally {
        setLoading(false);
      }
    };

    const loadConversationReal = async () => {
      try {
        setLoading(true);
        const { data } = await messagingAPI.list(selectedExpediente.id);
        const normalized = (data || []).map((row) => normalizeRealMessage(row, user.id));
        setMessages(normalized);
        setUnreadCount(normalized.filter((m) => !m.read).length);
      } catch (err) {
        error("SVC", "Error loading real conversation:", err);
      } finally {
        setLoading(false);
      }
    };

    const loadConversation = isDemo ? loadConversationDemo : loadConversationReal;
    loadConversation();

    const interval = setInterval(loadConversation, 5000);
    return () => clearInterval(interval);
  }, [selectedExpediente, user, isDemo]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!formData.body.trim()) {
      addNotification(L("Escribe un mensaje", "Please write a message"), "error");
      return;
    }

    if (!selectedExpediente) {
      addNotification(L("Selecciona un expediente", "Select a compliance file"), "error");
      return;
    }

    try {
      if (isDemo) {
        const isOtorgante = selectedExpediente.otorganteId === user.id;
        const toUserId = isOtorgante ? selectedExpediente.solicitanteId : selectedExpediente.otorganteId;
        const toUserName = isOtorgante ? selectedExpediente.solicitanteName : selectedExpediente.otorganteName;

        await sendMessage({
          fromUserId: user.id,
          fromUserType: isOtorgante ? "otorgante" : "solicitante",
          fromUserName: user.email,
          toUserId: toUserId,
          toUserType: isOtorgante ? "solicitante" : "otorgante",
          toUserName: toUserName,
          expedienteId: selectedExpediente.id,
          subject: formData.subject || L("Sin asunto", "No Subject"),
          body: formData.body,
          priority: "normal"
        });

        const msgs = await getConversationForUser(user.id, selectedExpediente.id);
        setMessages(msgs);
      } else {
        await messagingAPI.send(selectedExpediente.id, formData.body);
        const { data } = await messagingAPI.list(selectedExpediente.id);
        setMessages((data || []).map((row) => normalizeRealMessage(row, user.id)));
      }

      setFormData({ subject: "", body: "" });
      addNotification(L("✅ Mensaje enviado. Destinatario notificado", "✅ Message sent. Recipient notified"), "success");
    } catch (err) {
      error("SVC", "Error sending message:", err);
      addNotification(L("Error al enviar mensaje", "Error sending message"), "error");
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!selectedExpediente) return;

    try {
      if (isDemo) {
        await markConversationAsRead(user.id, selectedExpediente.id);
        const msgs = await getConversationForUser(user.id, selectedExpediente.id);
        setMessages(msgs);
      } else {
        await messagingAPI.markRead(selectedExpediente.id);
        const { data } = await messagingAPI.list(selectedExpediente.id);
        setMessages((data || []).map((row) => normalizeRealMessage(row, user.id)));
      }
      setUnreadCount(0);
      addNotification(L("Marcado como leído", "Marked as read"), "success");
    } catch (err) {
      error("SVC", "Error:", err);
    }
  };

  const isOtorgante = isDemo ? selectedExpediente?.otorganteId === user?.id : false;

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1.5rem", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ color: COLORS.navy, fontSize: "2rem", marginBottom: "0.5rem" }}>
            💬 {L("Mensajería", "Messaging")}
          </h1>
          <p style={{ color: COLORS.textMuted, maxWidth: "760px" }}>
            {L("Comunicación directa con", "Direct communication with")} {isOtorgante ? L("el Solicitante", "the Applicant") : L("el Otorgante", "the Funding Provider")}
            {unreadCount > 0 && ` · ${unreadCount} ${L("sin leer", "unread")}`}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            style={{
              padding: "0.75rem 1.25rem",
              background: COLORS.green,
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ✓ {L("Marcar todo como leído", "Mark all as read")}
          </button>
        )}
      </div>

      {/* SELECTOR DE EXPEDIENTE */}
      {expedientes.length > 0 && (
        <div style={{
          background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
          padding: "1rem",
          borderRadius: "8px",
          marginBottom: "1.5rem",
          border: `1px solid ${COLORS.border}`
        }}>
          <label style={{ fontWeight: 700, color: COLORS.navy, marginRight: "1rem" }}>
            {L("Expediente:", "Compliance File:")}
          </label>
          <select
            value={selectedExpediente?.id || ""}
            onChange={(e) => {
              const exp = expedientes.find(x => x.id === e.target.value);
              setSelectedExpediente(exp);
            }}
            style={{
              padding: "0.5rem 0.75rem",
              border: `1px solid ${COLORS.border}`,
              borderRadius: "4px",
              fontSize: "0.9rem"
            }}
          >
            {expedientes.map(exp => (
              <option key={exp.id} value={exp.id}>
                {exp.title} ({exp.id})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* CONVERSACIÓN */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
        {/* ÁREA DE MENSAJES */}
        <div
          style={{
            background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
            borderRadius: "10px",
            border: `1px solid ${COLORS.border}`,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            height: "500px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          {/* MENSAJES */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {loading && (
              <p style={{ color: COLORS.textMuted, textAlign: "center" }}>{L("Cargando...", "Loading...")}</p>
            )}

            {!loading && messages.length === 0 && (
              <p style={{ color: COLORS.textMuted, textAlign: "center" }}>
                {L("No hay mensajes en esta conversación", "No messages in this conversation")}
              </p>
            )}

            {!loading && messages.map((msg) => {
              const isFromMe = msg.fromUserId === user?.id;
              return (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    justifyContent: isFromMe ? "flex-end" : "flex-start",
                    marginBottom: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "70%",
                      background: isFromMe ? COLORS.gold : COLORS.bg,
                      color: isFromMe ? COLORS.navy : COLORS.text,
                      padding: "1rem",
                      borderRadius: "8px",
                      borderTopLeftRadius: isFromMe ? "8px" : "2px",
                      borderTopRightRadius: isFromMe ? "2px" : "8px",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                    }}
                  >
                    <p style={{ fontWeight: 700, fontSize: "0.9rem", margin: "0 0 0.35rem 0" }}>
                      {msg.fromUserName}
                      {msg.subject && ` · ${msg.subject}`}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: 1.5 }}>
                      {msg.body}
                    </p>
                    <p style={{
                      fontSize: "0.75rem",
                      opacity: 0.6,
                      margin: "0.5rem 0 0 0"
                    }}>
                      {new Date(msg.createdAt).toLocaleTimeString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {!msg.read && !isFromMe && ` • ${L("Sin leer", "Unread")}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* FORMULARIO */}
          <form
            onSubmit={handleSendMessage}
            style={{
              padding: "1.5rem",
              borderTop: `1px solid ${COLORS.border}`,
              background: COLORS.bg,
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            {isDemo && (
              <input
                type="text"
                placeholder={L("Asunto (opcional)", "Subject (optional)")}
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                style={{
                  padding: "0.75rem",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                }}
              />
            )}
            <textarea
              placeholder={L("Escribe tu mensaje...", "Type your message...")}
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              style={{
                padding: "0.75rem",
                border: `1px solid ${COLORS.border}`,
                borderRadius: "6px",
                fontSize: "0.9rem",
                minHeight: "80px",
                resize: "none",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "0.75rem",
                background: COLORS.gold,
                color: COLORS.navy,
                border: "none",
                borderRadius: "6px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              📤 {L("Enviar mensaje", "Send Message")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}