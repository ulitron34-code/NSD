import React, { useState, useEffect } from "react";
import { useNotification } from "../../hooks/useNotification";
import { useAuth } from "../../hooks/useAuth";
import { COLORS } from "../../utils/constants";
import {
  sendMessage,
  getConversationForUser,
  markMessageAsRead,
  markConversationAsRead,
  getUnreadMessages,
  getAllConversations
} from "../../services/messagingServiceV2";
import { getExpedientesForUser } from "../../services/expedienteService";

// FASE 5: MessagingTab completamente conectado a messagingServiceV2

export default function MessagingTab() {
  const { addNotification } = useNotification();
  const { user } = useAuth();

  // FASE 5: Estados
  const [expedientes, setExpedientes] = useState([]);
  const [selectedExpediente, setSelectedExpediente] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Formulario
  const [formData, setFormData] = useState({
    subject: "",
    body: "",
  });

  // FASE 5: Cargar expedientes
  useEffect(() => {
    if (!user) return;

    const loadExpedientes = async () => {
      try {
        const exps = await getExpedientesForUser(user.id);
        setExpedientes(exps);
        // Auto-seleccionar el primero
        if (exps.length > 0 && !selectedExpediente) {
          setSelectedExpediente(exps[0]);
        }
      } catch (err) {
        console.error("Error loading expedientes:", err);
      }
    };

    loadExpedientes();
  }, [user]);

  // FASE 5: Cargar conversación del expediente
  useEffect(() => {
    if (!selectedExpediente || !user) {
      setLoading(false);
      return;
    }

    const loadConversation = async () => {
      try {
        setLoading(true);

        // Obtener mensajes de la conversación
        const msgs = await getConversationForUser(user.id, selectedExpediente.id);
        setMessages(msgs);

        // Contar sin leer
        const unread = await getUnreadMessages(user.id);
        const inThisExp = unread.filter(m => m.expedienteId === selectedExpediente.id);
        setUnreadCount(inThisExp.length);

        // Marcar como leídos los de esta conversación
        inThisExp.forEach(msg => {
          markMessageAsRead(msg.id).catch(err => console.log("Mark read error:", err));
        });

        setLoading(false);
      } catch (err) {
        console.error("Error loading conversation:", err);
        setLoading(false);
      }
    };

    loadConversation();

    // FASE 5: Auto-refresh cada 5 segundos
    const interval = setInterval(loadConversation, 5000);
    return () => clearInterval(interval);
  }, [selectedExpediente, user]);

  // FASE 5: Enviar mensaje
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!formData.body.trim()) {
      addNotification("Escribe un mensaje", "error");
      return;
    }

    if (!selectedExpediente) {
      addNotification("Selecciona un expediente", "error");
      return;
    }

    try {
      // Determinar a quién va el mensaje
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
        subject: formData.subject || "Sin asunto",
        body: formData.body,
        priority: "normal"
      });

      // Recargar conversación
      const msgs = await getConversationForUser(user.id, selectedExpediente.id);
      setMessages(msgs);

      setFormData({ subject: "", body: "" });
      addNotification("✅ Mensaje enviado. Destinatario notificado", "success");
    } catch (err) {
      console.error("Error sending message:", err);
      addNotification("Error al enviar mensaje", "error");
    }
  };

  // FASE 5: Marcar todo como leído
  const handleMarkAllAsRead = async () => {
    if (!selectedExpediente) return;

    try {
      await markConversationAsRead(user.id, selectedExpediente.id);
      setUnreadCount(0);
      const msgs = await getConversationForUser(user.id, selectedExpediente.id);
      setMessages(msgs);
      addNotification("Marcado como leído", "success");
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const isOtorgante = selectedExpediente?.otorganteId === user?.id;

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1.5rem", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ color: COLORS.navy, fontSize: "2rem", marginBottom: "0.5rem" }}>
            💬 Mensajería
          </h1>
          <p style={{ color: COLORS.textMuted, maxWidth: "760px" }}>
            Comunicación directa con {isOtorgante ? "el Solicitante" : "el Otorgante"}
            {unreadCount > 0 && ` · ${unreadCount} sin leer`}
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
            ✓ Marcar todo como leído
          </button>
        )}
      </div>

      {/* SELECTOR DE EXPEDIENTE */}
      {expedientes.length > 0 && (
        <div style={{
          background: COLORS.white,
          padding: "1rem",
          borderRadius: "8px",
          marginBottom: "1.5rem",
          border: `1px solid ${COLORS.border}`
        }}>
          <label style={{ fontWeight: 700, color: COLORS.navy, marginRight: "1rem" }}>
            Expediente:
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
            background: COLORS.white,
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
              <p style={{ color: COLORS.textMuted, textAlign: "center" }}>Cargando...</p>
            )}

            {!loading && messages.length === 0 && (
              <p style={{ color: COLORS.textMuted, textAlign: "center" }}>
                No hay mensajes en esta conversación
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
                      {!msg.read && !isFromMe && " • Sin leer"}
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
            <input
              type="text"
              placeholder="Asunto (opcional)"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              style={{
                padding: "0.75rem",
                border: `1px solid ${COLORS.border}`,
                borderRadius: "6px",
                fontSize: "0.9rem",
              }}
            />
            <textarea
              placeholder="Escribe tu mensaje..."
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
              📤 Enviar mensaje
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
