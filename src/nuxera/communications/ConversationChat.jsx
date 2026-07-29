import { useState } from "react";
import { sendNuxeraConversationTurn } from "./conversationAgentBackendAdapter";
import { isNuxeraExperienceEnabled } from "../../experience/experienceFlags";

const STATUS_LABELS = Object.freeze({
  "conversation-turn-ready": { es: "Respondido", en: "Answered" },
  "conversation-turn-blocked": { es: "Bloqueado", en: "Blocked" },
  "conversation-turn-output-blocked": { es: "Respuesta retenida", en: "Response withheld" },
  "nuxera-conversation-turn-unavailable": { es: "No disponible", en: "Unavailable" },
});

function pick(entry, language) {
  return entry?.[language] || entry?.es || "";
}

function statusLabel(status, language) {
  return pick(STATUS_LABELS[status], language) || status;
}

export default function ConversationChat({ role, orderId = null, isDemo = false, language = "es" }) {
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState([]);
  const [sending, setSending] = useState(false);
  const experienceEnabled = isNuxeraExperienceEnabled();
  const requiresOrderId = role !== "admin";
  const canSend = experienceEnabled && !isDemo && (!requiresOrderId || Boolean(orderId)) && !sending;

  async function handleSend(event) {
    event.preventDefault();
    const message = input.trim();
    if (!message || !canSend) return;

    setSending(true);
    setInput("");
    const turn = await sendNuxeraConversationTurn({ role, orderId, selectedId: orderId, message });
    setTurns((current) => [...current, { message, turn }]);
    setSending(false);
  }

  return (
    <section className="nuxera-conversation-chat" aria-label={language === "en" ? "NUXERA assistant" : "Asistente NUXERA"}>
      <header>
        <span>{language === "en" ? "Assistant" : "Asistente"}</span>
        <h2>
          {role === "admin"
            ? (language === "en" ? "Ask about operations status" : "Pregunta sobre el estado operativo")
            : (language === "en" ? "Ask about this file" : "Pregunta sobre este expediente")}
        </h2>
      </header>

      {!experienceEnabled && (
        <p className="nuxera-conversation-chat-disabled">
          {language === "en"
            ? "Conversation runtime is disabled by default. It stays off until explicitly approved for a controlled environment."
            : "El runtime conversacional permanece apagado por defecto. Sigue asi hasta aprobarse explicitamente en un entorno controlado."}
        </p>
      )}

      {experienceEnabled && requiresOrderId && (isDemo || !orderId) && (
        <p className="nuxera-conversation-chat-disabled">
          {language === "en"
            ? "Select a real authorized file to chat with the assistant; demo sessions cannot start a real turn."
            : "Selecciona un expediente real autorizado para conversar; las sesiones demo no pueden iniciar un turno real."}
        </p>
      )}

      <ol className="nuxera-conversation-chat-log">
        {turns.map((entry, index) => (
          <li key={index}>
            <p className="nuxera-conversation-chat-user">{entry.message}</p>
            <div className="nuxera-conversation-chat-assistant">
              <span>{statusLabel(entry.turn.status, language)}</span>
              <p>
                {entry.turn.answer
                  || (language === "en" ? "No answer was returned for this turn." : "No se recibio respuesta para este turno.")}
              </p>
              {entry.turn.provider && <small>{entry.turn.provider}</small>}
            </div>
          </li>
        ))}
      </ol>

      <form onSubmit={handleSend}>
        <label htmlFor={`nuxera-conversation-chat-input-${role}`}>
          {language === "en" ? "Message" : "Mensaje"}
        </label>
        <input
          id={`nuxera-conversation-chat-input-${role}`}
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={!canSend}
          placeholder={role === "admin"
            ? (language === "en" ? "Ask about delivery failures, readiness or audit activity..." : "Pregunta sobre fallas de entrega, readiness o actividad de auditoria...")
            : (language === "en" ? "Ask about missing evidence, risk or next steps..." : "Pregunta sobre evidencia faltante, riesgo o siguientes pasos...")}
        />
        <button type="submit" disabled={!canSend || !input.trim()}>
          {sending ? (language === "en" ? "Sending..." : "Enviando...") : (language === "en" ? "Send" : "Enviar")}
        </button>
      </form>

      <footer>
        <small>
          {language === "en"
            ? "The assistant cannot approve financing, issue term sheets, grant access or send notifications automatically."
            : "El asistente no puede aprobar financiamiento, emitir term sheets, otorgar accesos ni enviar notificaciones automaticamente."}
        </small>
      </footer>
    </section>
  );
}
