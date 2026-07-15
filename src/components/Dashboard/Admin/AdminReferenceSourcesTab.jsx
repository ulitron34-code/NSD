import { error as logError } from '../../../utils/logger';
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNotification } from "../../../hooks/useNotification";
import { adminAPI } from "../../../services/api";
import { COLORS } from "../../../utils/constants";
import { uiText } from "../../../utils/runtimeCopy";

const INTEGRATION_STATUSES = ["real_api", "real_scraping", "rule_based", "manual", "named_only"];

const EMPTY_FORM = { id: null, name: "", sourceType: "", countryCode: "", url: "", integrationStatus: "manual", notes: "", content: "" };

export default function AdminReferenceSourcesTab() {
  const { i18n } = useTranslation();
  const L = (es, en) => uiText(i18n, es, en);
  const { addNotification } = useNotification();

  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchSources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await adminAPI.listReferenceSources({ includeInactive: true });
      setSources(data.sources || []);
    } catch (err) {
      logError("SVC", "No se pudo cargar el catalogo de fuentes", err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSources(); }, [fetchSources]);

  const startEdit = (source) => {
    setForm({
      id: source.id,
      name: source.name || "",
      sourceType: source.source_type || "",
      countryCode: source.country_code || "",
      url: source.url || "",
      integrationStatus: source.integration_status || "manual",
      notes: source.notes || "",
      content: source.content || ""
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name, sourceType: form.sourceType, countryCode: form.countryCode || null,
        url: form.url || null, integrationStatus: form.integrationStatus, notes: form.notes || null,
        content: form.content || null
      };
      if (form.id) {
        await adminAPI.updateReferenceSource(form.id, payload);
      } else {
        await adminAPI.createReferenceSource(payload);
      }
      setForm(EMPTY_FORM);
      await fetchSources();
      addNotification(L("Fuente guardada.", "Source saved."), "success");
    } catch (err) {
      logError("SVC", "No se pudo guardar la fuente de referencia", err);
      addNotification(err.response?.data?.error || err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await adminAPI.deactivateReferenceSource(id);
      await fetchSources();
      addNotification(L("Fuente desactivada.", "Source deactivated."), "success");
    } catch (err) {
      logError("SVC", "No se pudo desactivar la fuente", err);
      addNotification(err.response?.data?.error || err.message, "error");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.25rem", boxShadow: COLORS.shadowSm }}>
        <p style={{ margin: 0, color: COLORS.gold, fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {L("Administrador", "Administrator")}
        </p>
        <h2 style={{ color: COLORS.navy, fontSize: "1.08rem", margin: "0.35rem 0 1rem" }}>
          {L("Catálogo de fuentes de referencia", "Reference sources catalog")}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.6rem", marginBottom: "1rem" }}>
          <input required placeholder={L("Nombre", "Name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ padding: "0.5rem", borderRadius: "6px", border: `1px solid ${COLORS.border}` }} />
          <input required placeholder={L("Tipo (regulatorio, mercado...)", "Type (regulatory, market...)")} value={form.sourceType} onChange={(e) => setForm({ ...form, sourceType: e.target.value })} style={{ padding: "0.5rem", borderRadius: "6px", border: `1px solid ${COLORS.border}` }} />
          <input placeholder={L("País (vacío = global)", "Country (empty = global)")} value={form.countryCode} onChange={(e) => setForm({ ...form, countryCode: e.target.value })} style={{ padding: "0.5rem", borderRadius: "6px", border: `1px solid ${COLORS.border}` }} />
          <input placeholder="URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} style={{ padding: "0.5rem", borderRadius: "6px", border: `1px solid ${COLORS.border}` }} />
          <select value={form.integrationStatus} onChange={(e) => setForm({ ...form, integrationStatus: e.target.value })} style={{ padding: "0.5rem", borderRadius: "6px", border: `1px solid ${COLORS.border}` }}>
            {INTEGRATION_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <input placeholder={L("Notas", "Notes")} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ padding: "0.5rem", borderRadius: "6px", border: `1px solid ${COLORS.border}` }} />
          <textarea
            placeholder={L("Contenido regulatorio (texto real de la norma/estándar, para búsqueda RAG)", "Regulatory content (real text of the rule/standard, for RAG search)")}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={4}
            style={{ padding: "0.5rem", borderRadius: "6px", border: `1px solid ${COLORS.border}`, gridColumn: "1 / -1", fontFamily: "inherit", resize: "vertical" }}
          />
          <p style={{ gridColumn: "1 / -1", margin: 0, fontSize: "0.75rem", color: COLORS.textMuted }}>
            {L(
              "Si se llena, este texto se indexa automáticamente (RAG) y los agentes de evaluación lo citan como contexto real al revisar documentos.",
              "If filled, this text is automatically indexed (RAG) and evaluation agents cite it as real context when reviewing documents."
            )}
          </p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="submit" disabled={saving} style={{ padding: "0.5rem 1rem", borderRadius: "6px", border: "none", background: COLORS.navy, color: "white", fontWeight: 800, cursor: saving ? "wait" : "pointer" }}>
              {form.id ? L("Guardar cambios", "Save changes") : L("Agregar fuente", "Add source")}
            </button>
            {form.id && (
              <button type="button" onClick={() => setForm(EMPTY_FORM)} style={{ padding: "0.5rem 1rem", borderRadius: "6px", border: `1px solid ${COLORS.border}`, background: "white", fontWeight: 800, cursor: "pointer" }}>
                {L("Cancelar", "Cancel")}
              </button>
            )}
          </div>
        </form>

        {loading && <p style={{ color: COLORS.textMuted }}>{L("Cargando fuentes...", "Loading sources...")}</p>}
        {error && <p style={{ color: "#C62828", fontWeight: 700 }}>{error}</p>}

        {!loading && !error && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: `2px solid ${COLORS.border}` }}>
                  <th style={{ padding: "0.5rem" }}>{L("Nombre", "Name")}</th>
                  <th style={{ padding: "0.5rem" }}>{L("Tipo", "Type")}</th>
                  <th style={{ padding: "0.5rem" }}>{L("País", "Country")}</th>
                  <th style={{ padding: "0.5rem" }}>{L("Integración", "Integration")}</th>
                  <th style={{ padding: "0.5rem" }}>{L("RAG", "RAG")}</th>
                  <th style={{ padding: "0.5rem" }}>{L("Activa", "Active")}</th>
                  <th style={{ padding: "0.5rem" }}></th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.id} style={{ borderBottom: `1px solid ${COLORS.border}`, opacity: s.is_active ? 1 : 0.5 }}>
                    <td style={{ padding: "0.5rem", fontWeight: 700 }}>{s.name}</td>
                    <td style={{ padding: "0.5rem" }}>{s.source_type}</td>
                    <td style={{ padding: "0.5rem" }}>{s.country_code || L("Global", "Global")}</td>
                    <td style={{ padding: "0.5rem" }}>{s.integration_status}</td>
                    <td style={{ padding: "0.5rem" }}>{s.content ? L("Indexado", "Indexed") : L("Sin contenido", "No content")}</td>
                    <td style={{ padding: "0.5rem" }}>{s.is_active ? L("Sí", "Yes") : L("No", "No")}</td>
                    <td style={{ padding: "0.5rem", display: "flex", gap: "0.4rem" }}>
                      <button onClick={() => startEdit(s)} style={{ padding: "0.3rem 0.6rem", borderRadius: "5px", border: `1px solid ${COLORS.border}`, background: "white", fontSize: "0.75rem", fontWeight: 800, cursor: "pointer" }}>
                        {L("Editar", "Edit")}
                      </button>
                      {s.is_active && (
                        <button onClick={() => handleDeactivate(s.id)} style={{ padding: "0.3rem 0.6rem", borderRadius: "5px", border: "1px solid #C62828", background: "white", color: "#C62828", fontSize: "0.75rem", fontWeight: 800, cursor: "pointer" }}>
                          {L("Desactivar", "Deactivate")}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
