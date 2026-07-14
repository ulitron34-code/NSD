// Conector Buró de Crédito / Círculo de Crédito México.
// Migrado desde services/bureauCreditService.js (mismo comportamiento) al
// patrón de conectores de creditProviderGateway.js -- ver investigacion en
// listado_buros_credito_apis_internacional.md: Círculo de Crédito es el
// candidato recomendado para integrar primero en México (API Hub visible,
// sandbox y producción), Buró de Crédito como segundo objetivo.
//
// PROD: reemplazar MOCK_DB con la llamada real cuando haya contrato firmado
// con cualquiera de los dos. BURO_API_URL/BURO_API_KEY quedan como nombres
// genéricos -- apuntan al proveedor mexicano que se contrate primero.
export const PROVIDER_CODE = 'buro_credito_mx';

const BURO_API_URL = process.env.BURO_API_URL;
const BURO_API_KEY = process.env.BURO_API_KEY;

export function isConfigured() {
  return Boolean(BURO_API_URL && BURO_API_KEY);
}

const MOCK_DB = {
  ABC123456XYZ: { score: 750, grade: 'A', delinquency: 0, active_accounts: 5, utilization: 35 },
  DEF789012UVW: { score: 820, grade: 'AA', delinquency: 0, active_accounts: 8, utilization: 22 },
  CANCELADO123: { score: 450, grade: 'D', delinquency: 12, active_accounts: 2, utilization: 95 }
};

export async function getReport(identifier) {
  const normalized = String(identifier || '').toUpperCase().trim();

  if (isConfigured()) {
    try {
      const res = await fetch(`${BURO_API_URL}/score`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${BURO_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfc: normalized }),
        signal: AbortSignal.timeout(8000)
      });
      if (!res.ok) throw new Error(`Buro HTTP ${res.status}`);
      const data = await res.json();
      return {
        valid: true,
        identifier: normalized,
        score: data.score ?? data.puntuacion ?? null,
        grade: data.grade ?? data.grado ?? null,
        delinquency: data.delinquency ?? data.meses_morosidad ?? 0,
        active_accounts: data.active_accounts ?? data.cuentas_activas ?? null,
        utilization: data.utilization ?? data.utilizacion ?? null,
        source: 'BURO_API'
      };
    } catch (err) {
      console.warn('[BuroCreditoMx] Error al consultar API real:', err.message);
    }
  }

  if (MOCK_DB[normalized]) {
    return { valid: true, identifier: normalized, ...MOCK_DB[normalized], source: 'MOCK_DB' };
  }
  return {
    valid: true,
    identifier: normalized,
    score: 710,
    grade: 'B',
    delinquency: 0,
    active_accounts: 3,
    utilization: 45,
    source: 'MOCK_DYNAMIC'
  };
}
