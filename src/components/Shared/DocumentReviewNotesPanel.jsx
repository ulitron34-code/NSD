import { error as logError } from "../../utils/logger";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../utils/constants";
import { uiText } from "../../utils/runtimeCopy";
import { reviewNotesAPI } from "../../services/api";

const DECISION_OPTIONS = [
  { value: "approved", es: "Aprobar", en: "Approve" },
  { value: "rejected", es: "Rechazar", en: "Reject" },
  { value: "needs_more_info", es: "Pedir más información", en: "Request more info" },
  { value: "note", es: "Solo comentar", en: "Comment only" },
];

const DECISION_COLOR = {
  approved: COLORS.green,
  rejected: "#C62828",
  needs_more_info: COLORS.amber,
  note: COLORS.textMuted,
};

// Workflow humano de revision (seccion 7 del plan): historial de
// decisiones/comentarios de un analista sobre la evaluacion de IA de un
// documento. La escritura la valida el backend (permiso score:update, rol
// analista/administrador) -- este panel siempre muestra el formulario, y si
// el usuario no tiene el rol correcto, el backend regresa 403 y se muestra
// el error tal cual, sin fingir un gateo de permisos que el frontend no
// puede verificar (no hay concepto de rol en el AuthContext todavia).
export default function DocumentReviewNotesPanel({ orderId, documentId }) {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState("approved");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchNotes = useCallback(async () => {
    try {
      const { data } = await reviewNotesAPI.list(orderId, documentId);
      setNotes(data.notes || []);
    } catch (err) {
      logError("SVC", "No se pudieron cargar las notas de revisión", err);
    } finally {
      setLoading(false);
    }
  }, [orderId, documentId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      await reviewNotesAPI.add(orderId, documentId, decision, comment.trim() || null);
      setComment("");
      setFeedback({ type: "success", text: L("Nota registrada.", "Note recorded.") });
      await fetchNotes();
    } catch (err) {
      const message = err?.response?.data?.error
        || L("No se pudo registrar la nota (verifica que tu cuenta tenga permiso de analista).", "Could not record the note (check that your account has analyst permission).");
      setFeedback({ type: "error", text: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: "7px", padding: "0.75rem", background: "white", marginTop: "0.5rem" }}>
      <p style={{ margin: "0 0 0.5rem", color: COLORS.navy, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {L("Revisión humana", "Human review")}
      </p>

      {loading ? (
        <p style={{ color: COLORS.textMuted, fontSize: "0.75rem" }}>{L("Cargando…", "Loading…")}</p>
      ) : notes.length === 0 ? (
        <p style={{ color: COLORS.textMuted, fontSize: "0.75rem" }}>{L("Sin notas todavía.", "No notes yet.")}</p>
      ) : (
        <div style={{ display: "grid", gap: "0.4rem", marginBottom: "0.6rem" }}>
          {notes.map((note) => (
            <div key={note.id} style={{ fontSize: "0.72rem", color: COLORS.text, borderLeft: `3px solid ${DECISION_COLOR[note.decision] || COLORS.border}`, paddingLeft: "0.5rem" }}>
              <span style={{ fontWeight: 900, color: DECISION_COLOR[note.decision] || COLORS.navy }}>
                {DECISION_OPTIONS.find((d) => d.value === note.decision)?.[i18n.language?.startsWith("en") ? "en" : "es"] || note.decision}
              </span>
              {note.comment && <span> — {note.comment}</span>}
              <div style={{ color: COLORS.textMuted, fontSize: "0.65rem" }}>
                {new Date(note.created_at).toLocaleString(i18n.language?.startsWith("en") ? "en-US" : "es-MX")}
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.4rem" }}>
        <select
          value={decision}
          onChange={(e) => setDecision(e.target.value)}
          style={{ padding: "0.4rem", borderRadius: "5px", border: `1px solid ${COLORS.border}`, fontSize: "0.75rem" }}
        >
          {DECISION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{L(opt.es, opt.en)}</option>
          ))}
        </select>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={L("Comentario (opcional)", "Comment (optional)")}
          rows={2}
          style={{ padding: "0.4rem", borderRadius: "5px", border: `1px solid ${COLORS.border}`, fontSize: "0.75rem", fontFamily: "inherit" }}
        />
        <button
          type="submit"
          disabled={submitting}
          style={{ border: "none", borderRadius: "5px", padding: "0.4rem 0.6rem", fontSize: "0.72rem", fontWeight: 900, cursor: submitting ? "wait" : "pointer", background: COLORS.navy, color: "white", justifySelf: "start" }}
        >
          {submitting ? L("Guardando…", "Saving…") : L("Registrar decisión", "Record decision")}
        </button>
        {feedback && (
          <p style={{ margin: 0, fontSize: "0.7rem", color: feedback.type === "error" ? "#C62828" : COLORS.green, fontWeight: 700 }}>
            {feedback.text}
          </p>
        )}
      </form>
    </div>
  );
}
