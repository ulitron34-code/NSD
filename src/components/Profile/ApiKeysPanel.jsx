import React, { useState, useEffect, useCallback } from "react";
import { COLORS } from "../../utils/constants";
import { apiKeysAPI } from "../../services/api";

const PERMISSION_LABELS = {
  "*": "Acceso completo",
  "orders:read": "Ver expedientes",
  "documents:read": "Ver documentos",
  "compliance:read": "Ver compliance",
  "checklist:read": "Ver checklist"
};

const PERMISSION_OPTIONS = Object.entries(PERMISSION_LABELS).filter(([k]) => k !== "*");

function KeyBadge({ keyPrefix, isActive }) {
  return (
    <span style={{
      fontFamily: "monospace", fontSize: "0.82rem", background: isActive ? "#EEF2FF" : "#F5F5F5",
      color: isActive ? "#3730A3" : "#9E9E9E", border: `1px solid ${isActive ? "#C7D2FE" : "#E0E0E0"}`,
      borderRadius: "5px", padding: "0.2rem 0.55rem"
    }}>{keyPrefix}</span>
  );
}

export default function ApiKeysPanel() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPerms, setNewKeyPerms] = useState(["*"]);
  const [newKeyExpires, setNewKeyExpires] = useState("");
  const [revealed, setRevealed] = useState(null); // raw key after creation
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiKeysAPI.list();
      setKeys(res.data.data || []);
    } catch {
      setError("No se pudieron cargar las API keys");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const perms = newKeyPerms.includes("*") ? ["*"] : newKeyPerms;
      const res = await apiKeysAPI.create({
        name: newKeyName.trim(),
        permissions: perms,
        expiresAt: newKeyExpires || null
      });
      const created = res.data.data;
      setRevealed(created.raw_key);
      setKeys((prev) => [created, ...prev]);
      setNewKeyName("");
      setNewKeyPerms(["*"]);
      setNewKeyExpires("");
      setShowForm(false);
    } catch {
      setError("Error al crear la API key");
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm("¿Revocar esta API key? Los sistemas que la usen dejarán de funcionar.")) return;
    try {
      await apiKeysAPI.revoke(id);
      setKeys((prev) => prev.map((k) => k.id === id ? { ...k, is_active: false } : k));
    } catch {
      setError("Error al revocar la key");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar permanentemente esta API key? Esta acción no se puede deshacer.")) return;
    try {
      await apiKeysAPI.delete(id);
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch {
      setError("Error al eliminar la key");
    }
  };

  const togglePerm = (perm) => {
    if (perm === "*") { setNewKeyPerms(["*"]); return; }
    setNewKeyPerms((prev) => {
      const without = prev.filter((p) => p !== "*" && p !== perm);
      return prev.includes(perm) ? without : [...without, perm];
    });
  };

  const card = { background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.25rem 1.5rem", marginBottom: "0.75rem" };
  const btn = (variant = "primary") => ({
    padding: "0.5rem 1.1rem", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.82rem",
    background: variant === "primary" ? COLORS.navy : variant === "danger" ? "#FFEBEE" : "#F5F5F5",
    color: variant === "primary" ? "#fff" : variant === "danger" ? "#C62828" : COLORS.text
  });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ margin: 0, color: COLORS.navy, fontSize: "1.5rem" }}>API Keys</h2>
          <p style={{ margin: "0.3rem 0 0", color: COLORS.textMuted, fontSize: "0.85rem" }}>
            Integra NAGMAR directamente en tus sistemas enviando el header <code style={{ fontFamily: "monospace", background: "#F3F4F6", padding: "0 4px", borderRadius: "3px" }}>X-API-Key: nag_...</code>
          </p>
        </div>
        {!showForm && (
          <button style={btn("primary")} onClick={() => setShowForm(true)}>+ Nueva API Key</button>
        )}
      </div>

      {/* Key revelada tras creación */}
      {revealed && (
        <div style={{ background: "#E8F5E9", border: "1px solid #A5D6A7", borderRadius: "10px", padding: "1.25rem 1.5rem", marginBottom: "1.25rem" }}>
          <div style={{ fontWeight: 700, color: "#2E7D32", marginBottom: "0.6rem" }}>
            API key creada — cópiala ahora, no se volverá a mostrar
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <code style={{ fontFamily: "monospace", fontSize: "0.88rem", background: "#fff", border: "1px solid #C8E6C9", borderRadius: "6px", padding: "0.5rem 0.9rem", flex: 1, wordBreak: "break-all" }}>
              {revealed}
            </code>
            <button style={btn("secondary")} onClick={() => { navigator.clipboard.writeText(revealed); }}>Copiar</button>
            <button style={btn("danger")} onClick={() => setRevealed(null)}>Cerrar</button>
          </div>
        </div>
      )}

      {/* Formulario nueva key */}
      {showForm && (
        <div style={{ ...card, marginBottom: "1.5rem", background: "#FAFAFA" }}>
          <form onSubmit={handleCreate}>
            <div style={{ fontWeight: 700, color: COLORS.navy, marginBottom: "1rem" }}>Nueva API Key</div>
            <div style={{ display: "grid", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: COLORS.textMuted, marginBottom: "0.35rem" }}>Nombre / descripción</label>
                <input
                  autoFocus
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="ej. Integración ERP producción"
                  style={{ width: "100%", padding: "0.6rem 0.9rem", border: `1px solid ${COLORS.border}`, borderRadius: "6px", fontSize: "0.88rem", boxSizing: "border-box" }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: COLORS.textMuted, marginBottom: "0.5rem" }}>Permisos</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  <button type="button" onClick={() => togglePerm("*")} style={{ ...btn(newKeyPerms.includes("*") ? "primary" : "secondary"), fontSize: "0.78rem" }}>
                    Acceso completo
                  </button>
                  {PERMISSION_OPTIONS.map(([k, label]) => (
                    <button key={k} type="button" onClick={() => togglePerm(k)}
                      style={{ ...btn(newKeyPerms.includes(k) ? "primary" : "secondary"), fontSize: "0.78rem" }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: COLORS.textMuted, marginBottom: "0.35rem" }}>Vence el (opcional)</label>
                <input
                  type="date"
                  value={newKeyExpires}
                  onChange={(e) => setNewKeyExpires(e.target.value)}
                  style={{ padding: "0.6rem 0.9rem", border: `1px solid ${COLORS.border}`, borderRadius: "6px", fontSize: "0.88rem" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
              <button type="submit" style={btn("primary")} disabled={creating}>
                {creating ? "Creando..." : "Crear API Key"}
              </button>
              <button type="button" style={btn("secondary")} onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div style={{ color: "#C62828", background: "#FFEBEE", border: "1px solid #EF9A9A", borderRadius: "7px", padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.85rem" }}>
          {error}
        </div>
      )}

      {/* Lista de keys */}
      {loading ? (
        <div style={{ color: COLORS.textMuted, fontSize: "0.85rem" }}>Cargando...</div>
      ) : keys.length === 0 ? (
        <div style={{ ...card, textAlign: "center", padding: "2.5rem", color: COLORS.textMuted }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🔑</div>
          <div style={{ fontWeight: 600, marginBottom: "0.35rem" }}>Sin API keys</div>
          <div style={{ fontSize: "0.82rem" }}>Crea una key para integrar NAGMAR en tus sistemas</div>
        </div>
      ) : (
        keys.map((key) => (
          <div key={key.id} style={{ ...card, opacity: key.is_active ? 1 : 0.6 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <KeyBadge keyPrefix={key.key_prefix} isActive={key.is_active} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.92rem", color: COLORS.text }}>{key.name}</div>
                  <div style={{ fontSize: "0.75rem", color: COLORS.textMuted, marginTop: "0.15rem" }}>
                    {(key.permissions || []).map((p) => PERMISSION_LABELS[p] || p).join(", ")}
                    {key.expires_at && ` · Vence ${new Date(key.expires_at).toLocaleDateString("es-MX")}`}
                    {key.last_used_at && ` · Usado ${new Date(key.last_used_at).toLocaleDateString("es-MX")}`}
                    {!key.last_used_at && " · Nunca usado"}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {key.is_active && (
                  <button style={btn("secondary")} onClick={() => handleRevoke(key.id)}>Revocar</button>
                )}
                <button style={btn("danger")} onClick={() => handleDelete(key.id)}>Eliminar</button>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Docs de uso */}
      {keys.length > 0 && (
        <div style={{ marginTop: "1.75rem", background: "#F8F9FC", border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "1.25rem 1.5rem" }}>
          <div style={{ fontWeight: 700, color: COLORS.navy, marginBottom: "0.75rem", fontSize: "0.88rem" }}>Cómo usar tu API key</div>
          <pre style={{ margin: 0, fontSize: "0.78rem", color: "#374151", background: "#1E293B", color: "#E2E8F0", borderRadius: "7px", padding: "1rem", overflow: "auto" }}>{`# Ver expedientes
curl https://codex-backendnsd.onrender.com/api/orders \\
  -H "X-API-Key: nag_tu_key_aqui"

# Ver compliance de un expediente
curl https://codex-backendnsd.onrender.com/api/orders/{id}/compliance-monitor \\
  -H "X-API-Key: nag_tu_key_aqui"

# Ver documentos de un expediente
curl https://codex-backendnsd.onrender.com/api/documents/{orderId} \\
  -H "X-API-Key: nag_tu_key_aqui"`}</pre>
        </div>
      )}
    </div>
  );
}
