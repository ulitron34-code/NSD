import { supabaseAdmin } from '../config/supabase.js';

// Catálogo de fuentes oficiales (sección 5.2/6 del plan) — trazabilidad de
// qué fuente respalda cada tipo de verificación, incluyendo las que hoy son
// "consulta manual" o "solo nombrada". No sustituye a los servicios reales
// (satBlacklistScreening.js, ofacScreening.js, etc.), solo los documenta.
export async function listReferenceSources({ country, sourceType, integrationStatus } = {}) {
  let query = supabaseAdmin.from('reference_sources').select('*').eq('is_active', true);

  if (country) query = query.or(`country_code.eq.${country},country_code.is.null`);
  if (sourceType) query = query.eq('source_type', sourceType);
  if (integrationStatus) query = query.eq('integration_status', integrationStatus);

  const { data, error } = await query.order('name', { ascending: true });
  if (error) throw error;
  return data || [];
}
