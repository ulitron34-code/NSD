// Integración con Banxico SIE (Sistema de Información Económica) — usada por
// los agentes de rúbrica de Estudio de Mercado y Modelo/Viabilidad Financiera
// para dar contexto macroeconómico real (tipo de cambio, tasa de referencia,
// INPC). Token gratuito y autoservicio en https://www.banxico.org.mx/SieAPIRest/service/v1/token
// (a diferencia de SAT/Buró, que requieren contrato con un proveedor).
const BANXICO_API_TOKEN = process.env.BANXICO_API_TOKEN;
const SIE_BASE_URL = 'https://www.banxico.org.mx/SieAPIRest/service/v1/series';

// Series públicas estables del catálogo Banxico SIE.
const SERIES = {
  exchangeRateFix: 'SF43718',   // Tipo de cambio FIX pesos por dólar
  referenceRate: 'SF61745',     // Tasa objetivo de Banxico
  inpc: 'SP1'                   // Índice Nacional de Precios al Consumidor
};

export function isConfigured() {
  return Boolean(BANXICO_API_TOKEN);
}

async function fetchSerie(serieId) {
  const url = `${SIE_BASE_URL}/${serieId}/datos/oportuno?token=${BANXICO_API_TOKEN}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Banxico HTTP ${res.status}`);
  const data = await res.json();
  const dato = data?.bmx?.series?.[0]?.datos?.[0];
  return dato ? { fecha: dato.fecha, valor: dato.dato } : null;
}

export async function getKeyIndicators() {
  if (isConfigured()) {
    try {
      const [exchangeRate, referenceRate, inpc] = await Promise.all([
        fetchSerie(SERIES.exchangeRateFix),
        fetchSerie(SERIES.referenceRate),
        fetchSerie(SERIES.inpc)
      ]);
      return {
        exchangeRateFix: exchangeRate,
        referenceRate,
        inpc,
        source: 'BANXICO_SIE_API'
      };
    } catch (err) {
      console.warn('[Banxico] Error al consultar SIE:', err.message);
    }
  }

  return {
    exchangeRateFix: null,
    referenceRate: null,
    inpc: null,
    note: 'Sin BANXICO_API_TOKEN configurado o error de consulta — sin datos macro reales disponibles.',
    source: 'MOCK_BANXICO'
  };
}
