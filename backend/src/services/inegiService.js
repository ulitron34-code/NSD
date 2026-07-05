// Integración con INEGI DENUE (Directorio Estadístico Nacional de Unidades
// Económicas) — usada por el agente de rúbrica del Estudio de Mercado para
// dar contexto real de densidad de negocios por actividad/entidad.
// Token gratuito y autoservicio en https://www.inegi.org.mx/servicios/api_denue.html
// (a diferencia de SAT/Buró, que requieren contrato con un proveedor).
const INEGI_API_TOKEN = process.env.INEGI_API_TOKEN;
const DENUE_BASE_URL = 'https://www.inegi.org.mx/app/api/denue/v1/consulta';

export function isConfigured() {
  return Boolean(INEGI_API_TOKEN);
}

// entidad: clave de estado INEGI (01-32). condicion: palabra clave de actividad/giro.
export async function getBusinessDensity(condicion, entidad = '00') {
  const term = String(condicion || '').trim();

  if (isConfigured()) {
    try {
      const url = `${DENUE_BASE_URL}/BuscarEntidad/${encodeURIComponent(term)}/${entidad}/${INEGI_API_TOKEN}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`INEGI HTTP ${res.status}`);
      const data = await res.json();
      const establishments = Array.isArray(data) ? data : [];
      return {
        term,
        entidad,
        establishmentCount: establishments.length,
        sample: establishments.slice(0, 5).map((e) => ({ nombre: e.Nombre, actividad: e.Clase_actividad, municipio: e.Municipio })),
        source: 'DENUE_API'
      };
    } catch (err) {
      console.warn('[INEGI] Error al consultar DENUE:', err.message);
    }
  }

  return {
    term,
    entidad,
    establishmentCount: null,
    sample: [],
    note: 'Sin INEGI_API_TOKEN configurado o error de consulta — sin dato real de densidad de negocios disponible.',
    source: 'MOCK_INEGI'
  };
}
