import { supabaseAdmin } from '../config/supabase.js';

// Catálogo de fuentes oficiales (sección 5.2/6 del plan) — trazabilidad de
// qué fuente respalda cada tipo de verificación, incluyendo las que hoy son
// "consulta manual" o "solo nombrada". No sustituye a los servicios reales
// (satBlacklistScreening.js, ofacScreening.js, etc.), solo los documenta.
export async function listReferenceSources({ country, sourceType, integrationStatus, includeInactive } = {}) {
  let query = supabaseAdmin.from('reference_sources').select('*');
  if (!includeInactive) query = query.eq('is_active', true);

  if (country) query = query.or(`country_code.eq.${country},country_code.is.null`);
  if (sourceType) query = query.eq('source_type', sourceType);
  if (integrationStatus) query = query.eq('integration_status', integrationStatus);

  const { data, error } = await query.order('name', { ascending: true });
  if (error) throw error;
  return data || [];
}

const INTEGRATION_STATUSES = new Set(['real_api', 'real_scraping', 'rule_based', 'manual', 'named_only']);

function sanitizeReferenceSourcePayload(payload = {}) {
  const name = String(payload.name || '').trim();
  const sourceType = String(payload.sourceType || '').trim();
  if (!name) throw new Error('El nombre de la fuente es obligatorio.');
  if (!sourceType) throw new Error('El tipo de fuente es obligatorio.');

  const integrationStatus = payload.integrationStatus || 'manual';
  if (!INTEGRATION_STATUSES.has(integrationStatus)) {
    throw new Error(`integrationStatus inválido: "${integrationStatus}". Debe ser una de: ${[...INTEGRATION_STATUSES].join(', ')}.`);
  }

  return {
    name,
    source_type: sourceType,
    country_code: payload.countryCode || null,
    url: payload.url || null,
    integration_status: integrationStatus,
    update_frequency: payload.updateFrequency || null,
    reliability_level: payload.reliabilityLevel || 'official',
    notes: payload.notes || null
  };
}

// Solo Administrador (seccion 8.1 del plan: "gestionar catalogos... fuentes")
// puede crear/editar/desactivar fuentes -- gateado por requireAdmin en la
// ruta, no aqui. Desactivacion en vez de DELETE fisico: reusa la misma
// columna is_active que ya filtra listReferenceSources(), sin perder
// trazabilidad de fuentes que se dejaron de usar.
export async function createReferenceSource(payload) {
  const row = sanitizeReferenceSourcePayload(payload);
  const { data, error } = await supabaseAdmin.from('reference_sources').insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function updateReferenceSource(id, payload) {
  const row = sanitizeReferenceSourcePayload(payload);
  const { data, error } = await supabaseAdmin.from('reference_sources').update(row).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deactivateReferenceSource(id) {
  const { data, error } = await supabaseAdmin
    .from('reference_sources')
    .update({ is_active: false })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
