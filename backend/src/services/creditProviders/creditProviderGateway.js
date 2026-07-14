// Credit Intelligence Provider Layer -- capa de homologación de burós de
// crédito internacionales (ver listado_buros_credito_apis_internacional.md,
// sección 10 "Arquitectura recomendada para el SaaS"). Mismo patrón que
// regulatoryGateway.js: un punto de entrada único que elige el conector
// correcto por país, normaliza el resultado y lo persiste para trazabilidad.
//
// Hoy solo hay un conector real (México, migrado desde el antiguo
// bureauCreditService.js). Agregar un país nuevo es: escribir
// connectors/<pais>.connector.js con isConfigured()/getReport(identifier), y
// una línea en CONNECTORS_BY_COUNTRY -- el día que haya contrato con
// Círculo de Crédito, Equifax, Serasa, etc. no hace falta tocar nada más.
import { supabaseAdmin } from '../../config/supabase.js';
import * as buroCreditoMx from './connectors/buroCreditoMx.connector.js';

const CONNECTORS_BY_COUNTRY = {
  MX: buroCreditoMx
};

export function isProviderConfigured(countryCode = 'MX') {
  const connector = CONNECTORS_BY_COUNTRY[countryCode];
  return Boolean(connector?.isConfigured?.());
}

export function hasConnector(countryCode) {
  return Boolean(CONNECTORS_BY_COUNTRY[countryCode]);
}

async function persistReport({ connector, countryCode, identifier, orderId, result, requestStatus, errorMessage }) {
  try {
    const { data: provider } = await supabaseAdmin
      .from('credit_providers')
      .select('id')
      .eq('provider_code', connector.PROVIDER_CODE)
      .maybeSingle();

    if (!provider?.id) return;

    await supabaseAdmin.from('credit_reports').insert([{
      order_id: orderId ?? null,
      provider_id: provider.id,
      country_code: countryCode,
      subject_identifier: identifier,
      score: Number.isFinite(result?.score) ? result.score : null,
      risk_band: result?.grade ?? null,
      normalized_payload: result,
      retrieved_at: new Date().toISOString()
    }]);

    await supabaseAdmin.from('credit_provider_audit_logs').insert([{
      provider_id: provider.id,
      order_id: orderId ?? null,
      request_status: requestStatus,
      error_message: errorMessage
    }]);
  } catch (persistErr) {
    // La bitácora es best-effort: si falla, no debe tumbar el screening real.
    console.warn('[creditProviderGateway] Error al persistir reporte/bitácora:', persistErr.message);
  }
}

// getCreditReport({ countryCode, identifier, orderId }) -> reporte normalizado
// orderId es opcional (algunos flujos, como el screening standalone de
// nsdApplicantAgent.js, no tienen un expediente en contexto).
export async function getCreditReport({ countryCode = 'MX', identifier, orderId = null } = {}) {
  const connector = CONNECTORS_BY_COUNTRY[countryCode];

  if (!connector) {
    return {
      valid: false,
      identifier,
      error: `Sin conector de crédito para el país ${countryCode}`,
      source: 'NOT_CONFIGURED'
    };
  }

  let result;
  let requestStatus = 'success';
  let errorMessage = null;
  try {
    result = await connector.getReport(identifier);
  } catch (err) {
    requestStatus = 'error';
    errorMessage = err.message;
    result = { valid: false, identifier, error: err.message, source: 'ERROR' };
  }

  await persistReport({ connector, countryCode, identifier, orderId, result, requestStatus, errorMessage });

  return result;
}
