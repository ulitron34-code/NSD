import { useCallback, useState } from "react";
import { REQUISITOS_MINIMOS, DEMO_EXPEDIENTE_ID } from "../data/requisitosMinimos";

function storageKey(expedienteId) {
  return `nsd_requisitos_${expedienteId || DEMO_EXPEDIENTE_ID}`;
}

function readState(expedienteId) {
  try {
    const raw = localStorage.getItem(storageKey(expedienteId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeState(expedienteId, state) {
  try {
    localStorage.setItem(storageKey(expedienteId), JSON.stringify(state));
  } catch {
    // localStorage no disponible (modo privado, cuota llena, etc.) — se ignora, el estado sigue en memoria.
  }
}

export function useRequisitosMinimos(expedienteId = DEMO_EXPEDIENTE_ID) {
  const [estado, setEstado] = useState(() => readState(expedienteId));

  const actualizarMeta = useCallback((itemId, patch) => {
    setEstado((prev) => {
      const next = { ...prev, [itemId]: { ...(prev[itemId] || {}), ...patch } };
      writeState(expedienteId, next);
      return next;
    });
  }, [expedienteId]);

  const marcarEstado = useCallback((itemId, valor) => actualizarMeta(itemId, { estado: valor }), [actualizarMeta]);
  const adjuntarEvidencia = useCallback((itemId, filename) => actualizarMeta(itemId, { evidenciaNombre: filename }), [actualizarMeta]);
  const toggleSdg = useCallback((itemId, numero) => {
    setEstado((prev) => {
      const actuales = prev[itemId]?.sdg || [];
      const sdg = actuales.includes(numero) ? actuales.filter((n) => n !== numero) : [...actuales, numero];
      const next = { ...prev, [itemId]: { ...(prev[itemId] || {}), sdg } };
      writeState(expedienteId, next);
      return next;
    });
  }, [expedienteId]);

  const items = REQUISITOS_MINIMOS.map((item) => ({
    ...item,
    estado: estado[item.id]?.estado || "pendiente",
    evidenciaNombre: estado[item.id]?.evidenciaNombre || null,
    sdg: estado[item.id]?.sdg || [],
  }));

  const completados = items.filter((item) => item.estado === "listo").length;
  const criticosPendientes = items.filter((item) => item.critico && item.estado !== "listo");
  const progreso = Math.round((completados / items.length) * 100);
  const listoParaEnviar = criticosPendientes.length === 0;

  return {
    items,
    completados,
    total: items.length,
    progreso,
    criticosPendientes,
    listoParaEnviar,
    marcarEstado,
    adjuntarEvidencia,
    toggleSdg,
  };
}
