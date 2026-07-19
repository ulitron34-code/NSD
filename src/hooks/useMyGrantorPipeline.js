import { warn } from '../utils/logger';
import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { otorganteAPI } from "../services/api";
import { readSelectedExpedienteId, subscribeSelectedExpediente, writeSelectedExpedienteId } from "./useSelectedExpediente";

// Resuelve el pipeline real autorizado del otorgante vía otorganteAPI.pipeline()
// (data_room_shares aceptados/compartidos), mismo patrón que useMyOrders.js
// para solicitante. Se mantiene vacío en modo demo.
export function useMyGrantorPipeline() {
  const { user } = useAuth();
  const isDemo = Boolean(user?.demo);
  const [pipeline, setPipeline] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(() => readSelectedExpedienteId() || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo) {
      setLoading(false);
      return;
    }
    let active = true;
    otorganteAPI.pipeline()
      .then(({ data }) => {
        if (!active) return;
        const entries = Array.isArray(data) ? data : [];
        setPipeline(entries);
        setSelectedOrderId((current) => {
          const nextId = entries.some((entry) => entry.order?.id === current) ? current : entries[0]?.order?.id || null;
          if (nextId) writeSelectedExpedienteId(nextId);
          return nextId;
        });
      })
      .catch((err) => warn("SVC", "No se pudo cargar el pipeline real del otorgante", err))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isDemo]);

  useEffect(() => subscribeSelectedExpediente((id) => setSelectedOrderId(id || null)), []);

  const selectedEntry = pipeline.find((entry) => entry.order?.id === selectedOrderId) || pipeline[0] || null;
  const authorizedOrder = selectedEntry?.order || null;
  return { pipeline, selectedEntry, authorizedOrder, orderId: authorizedOrder?.id || null, selectOrder: writeSelectedExpedienteId, isDemo, loading };
}
