import { warn } from '../utils/logger';
import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { otorganteAPI } from "../services/api";

// Resuelve el pipeline real autorizado del otorgante vía otorganteAPI.pipeline()
// (data_room_shares aceptados/compartidos), mismo patrón que useMyOrders.js
// para solicitante. Se mantiene vacío en modo demo.
export function useMyGrantorPipeline() {
  const { user } = useAuth();
  const isDemo = Boolean(user?.demo);
  const [pipeline, setPipeline] = useState([]);
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
        setPipeline(Array.isArray(data) ? data : []);
      })
      .catch((err) => warn("SVC", "No se pudo cargar el pipeline real del otorgante", err))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isDemo]);

  return { pipeline, orderId: pipeline[0]?.order?.id || null, isDemo, loading };
}
