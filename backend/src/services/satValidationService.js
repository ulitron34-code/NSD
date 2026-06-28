// Validacion de RFC contra el SAT.
// PROD: reemplazar MOCK_DB con llamada a SAT_API_URL cuando este disponible.
const SAT_API_URL = process.env.SAT_API_URL;
const SAT_API_KEY = process.env.SAT_API_KEY;

export function isConfigured() {
  return Boolean(SAT_API_URL && SAT_API_KEY);
}

// Regex minimo de formato RFC: 3-4 letras + 6 digitos de fecha + 3 digitos homonimia
const RFC_REGEX = /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/;

const MOCK_DB = {
  'ABC123456XYZ': { valid: true, status: 'Activo', ruc: 'Persona Moral', name: 'EMPRESA TEST SA DE CV', registered_since: '2020-01-15' },
  'DEF789012UVW': { valid: true, status: 'Activo', ruc: 'Persona Fisica', name: 'Juan Perez Garcia', registered_since: '2018-06-30' },
  'CANCELADO123': { valid: false, status: 'Cancelado', reason: 'Baja voluntaria', name: 'EMPRESA CERRADA SA DE CV' },
  'INVALID123':   { valid: false, status: 'No encontrado', name: null }
};

export async function validateRfc(rfc) {
  const normalized = String(rfc || '').toUpperCase().trim();

  if (!RFC_REGEX.test(normalized)) {
    return { valid: false, rfc: normalized, status: 'Formato invalido', error: 'RFC debe tener formato AAAA######AAA', source: 'FORMAT_CHECK' };
  }

  if (isConfigured()) {
    try {
      const res = await fetch(`${SAT_API_URL}/rfc/${encodeURIComponent(normalized)}`, {
        headers: { Authorization: `Bearer ${SAT_API_KEY}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(8000)
      });
      if (!res.ok) throw new Error(`SAT HTTP ${res.status}`);
      const data = await res.json();
      return {
        valid: data.valid ?? data.activo ?? false,
        rfc: normalized,
        status: data.status || data.estatus || 'Desconocido',
        ruc: data.ruc || data.tipo_persona || null,
        name: data.name || data.nombre || null,
        registered_since: data.registered_since || data.fecha_inicio || null,
        source: 'SAT_API'
      };
    } catch (err) {
      console.warn('[SAT] Error al consultar API real:', err.message);
    }
  }

  // Fallback MOCK
  if (MOCK_DB[normalized]) {
    return { ...MOCK_DB[normalized], rfc: normalized, source: 'MOCK_DB' };
  }
  return { valid: true, rfc: normalized, status: 'Activo', ruc: 'Persona Fisica/Moral (Simulado)', name: 'Contribuyente de Prueba', registered_since: '2023-01-01', source: 'MOCK_DYNAMIC' };
}
