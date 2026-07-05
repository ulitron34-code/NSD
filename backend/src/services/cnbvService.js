// Verificación de entidades supervisadas por la CNBV.
// A diferencia de SAT/Buró/INEGI/Banxico, la CNBV NO publica una API pública
// para consultar su Padrón de Entidades Supervisadas (confirmado contra
// PLAN_INTEGRACION_MODULO_READINESS_CUMPLIMIENTO.md sección 5.1: "Consulta
// manual/integración posterior"). Este servicio sigue el mismo patrón
// isConfigured()/real/fallback que el resto, por si en el futuro se contrata
// un proveedor de datos que scrapee o replique el padrón — pero hoy siempre
// cae al modo manual porque no existe una fuente real que consultar.
const CNBV_PADRON_API_URL = process.env.CNBV_PADRON_API_URL;
const CNBV_PADRON_API_KEY = process.env.CNBV_PADRON_API_KEY;
const OFFICIAL_SEARCH_URL = 'https://www.cnbv.gob.mx/paginas/busquedaentidades.aspx';

export function isConfigured() {
  return Boolean(CNBV_PADRON_API_URL && CNBV_PADRON_API_KEY);
}

export async function checkSupervisedEntity(entityName) {
  const name = String(entityName || '').trim();

  if (isConfigured()) {
    try {
      const res = await fetch(`${CNBV_PADRON_API_URL}?q=${encodeURIComponent(name)}`, {
        headers: { Authorization: `Bearer ${CNBV_PADRON_API_KEY}` },
        signal: AbortSignal.timeout(8000)
      });
      if (!res.ok) throw new Error(`CNBV HTTP ${res.status}`);
      const data = await res.json();
      return {
        name,
        verified: Boolean(data?.found),
        entityType: data?.entityType || null,
        requiresManualCheck: false,
        source: 'CNBV_PROVIDER_API'
      };
    } catch (err) {
      console.warn('[CNBV] Error al consultar proveedor de datos:', err.message);
    }
  }

  return {
    name,
    verified: null,
    entityType: null,
    requiresManualCheck: true,
    officialUrl: OFFICIAL_SEARCH_URL,
    note: 'La CNBV no tiene API pública para el Padrón de Entidades Supervisadas — verificar manualmente en el link oficial.',
    source: 'MANUAL_ONLY'
  };
}
