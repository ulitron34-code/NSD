// Integración con GLEIF (Global Legal Entity Identifier Foundation) — API
// pública y gratuita, sin key, a diferencia de los burós de crédito locales
// (que sí requieren contrato comercial, como BURO_API_URL para México).
// Útil para KYB internacional real (sección 6 del plan): confirma que una
// entidad existe en el registro global de LEI y su estatus (activo/inactivo).
const GLEIF_BASE_URL = 'https://api.gleif.org/api/v1/lei-records';

export async function searchLegalEntity(legalName) {
  const term = String(legalName || '').trim();
  if (!term) {
    return { term, matches: [], source: 'GLEIF_API', note: 'Sin nombre de entidad para buscar.' };
  }

  try {
    const url = `${GLEIF_BASE_URL}?filter[entity.legalName]=${encodeURIComponent(term)}&page[size]=5`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { Accept: 'application/vnd.api+json' } });
    if (!res.ok) throw new Error(`GLEIF HTTP ${res.status}`);

    const body = await res.json();
    const matches = (body.data || []).map((record) => ({
      lei: record.id,
      legalName: record.attributes?.entity?.legalName?.name || null,
      status: record.attributes?.entity?.status || null,
      registrationStatus: record.attributes?.registration?.status || null,
      jurisdiction: record.attributes?.entity?.jurisdiction || null,
      country: record.attributes?.entity?.legalAddress?.country || null
    }));

    return { term, matches, source: 'GLEIF_API' };
  } catch (err) {
    console.warn('[GLEIF] Error al consultar lei-records:', err.message);
    return { term, matches: [], source: 'GLEIF_API', note: `Error al consultar GLEIF: ${err.message}` };
  }
}
