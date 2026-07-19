const KEY = "nsd_selected_expediente";
const EVENT = "nsd:selected-expediente-changed";

export function readSelectedExpedienteId() {
  return localStorage.getItem(KEY) || "";
}

export function writeSelectedExpedienteId(id) {
  if (!id) return;
  localStorage.setItem(KEY, id);
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { id } }));
}

export function subscribeSelectedExpediente(callback) {
  const handleChange = (event) => callback(event.detail?.id || readSelectedExpedienteId());
  window.addEventListener(EVENT, handleChange);
  return () => window.removeEventListener(EVENT, handleChange);
}

export function useSelectedExpediente() {
  const getSelectedExpedienteId = readSelectedExpedienteId;
  const setSelectedExpedienteId = writeSelectedExpedienteId;
  return { getSelectedExpedienteId, setSelectedExpedienteId };
}
