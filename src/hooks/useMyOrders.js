import { warn } from '../utils/logger';
import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { ordersAPI } from "../services/api";

// Resuelve los expedientes reales del usuario (Solicitante) vía ordersAPI,
// o se mantiene vacío en modo demo — mismo patrón repetido antes en
// FundingReadinessTab.jsx y SubirProyectoTab.jsx, extraído aquí para no
// triplicarlo en los componentes nuevos que también lo necesitan.
export function useMyOrders() {
  const { user } = useAuth();
  const isDemo = Boolean(user?.demo);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo) {
      setLoading(false);
      return;
    }
    let active = true;
    ordersAPI.list()
      .then(({ data }) => {
        if (!active) return;
        const list = (data || []).slice().sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        setOrders(list);
      })
      .catch((err) => warn("SVC", "No se pudieron cargar los expedientes reales", err))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isDemo]);

  return { orders, orderId: orders[0]?.id || null, isDemo, loading };
}
