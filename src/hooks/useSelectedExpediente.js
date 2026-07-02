const KEY = "nsd_selected_expediente";

export function useSelectedExpediente() {
  const getSelectedExpedienteId = () => localStorage.getItem(KEY) || "";
  const setSelectedExpedienteId = (id) => {
    if (id) localStorage.setItem(KEY, id);
  };
  return { getSelectedExpedienteId, setSelectedExpedienteId };
}
