import { useEffect, useState } from 'react';
import { warn } from '../utils/logger';
import { fetchCommercialOffers } from '../services/commercialCatalogService';
import { isCommercialCatalogEnabled } from '../experience/experienceFlags';

// Carga el catálogo comercial real detrás del flag. Mientras el flag esté
// apagado (o si el backend aún no lo tiene activo), devuelve offers: []
// sin lanzar error, para que el llamador pueda mostrar su contenido
// estático de siempre sin cambio de comportamiento.
export function useCommercialOffers(audience, currency = 'USD') {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(isCommercialCatalogEnabled());
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isCommercialCatalogEnabled()) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    fetchCommercialOffers({ audience, currency })
      .then((list) => {
        if (!active) return;
        setOffers(list);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        warn('SVC', 'No se pudo cargar el catálogo comercial', err);
        setOffers([]);
        setError(err);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [audience, currency]);

  return { offers, loading, error };
}
