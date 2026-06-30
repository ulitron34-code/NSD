// Modelo de datos comun para entidades detectadas por el gateway regulatorio de NSD.
// Estandariza el resultado de cualquier screener en una estructura uniforme
// que puede encolarse, auditarse y presentarse en el Case Manager.

// Fabrica un EntityRecord a partir de los campos disponibles.
// Cualquier campo omitido queda como null para facilitar el merge posterior.
export function createEntityRecord({
  // Identidad
  name = null,
  aliases = [],
  type = null,           // 'individual' | 'entity' | 'vessel' | 'aircraft' | 'other'

  // Identificadores
  identifiers = [],      // [{ kind: 'passport'|'rfc'|'ein'|'cnpj'|'register'|'license', value }]
  nationality = null,
  jurisdiction = null,

  // Programa / autoridad
  program = null,        // e.g. 'OFAC_SDN', 'UN_SC', 'FATF_GREY'
  authority = null,      // e.g. 'OFAC', 'UN Security Council', 'CNBV'
  reason = null,         // motivo de la sancion o designacion
  status = null,         // 'active' | 'removed' | 'expired' | 'unknown'

  // Evidencia
  source = null,         // modulo que lo detecto, e.g. 'interpolScreening'
  sourceUrl = null,
  sourceVersion = null,
  ingestedAt = null,

  // Score de coincidencia (llenado por matchingEngine al comparar)
  score = null,
  confidence = null,     // 'high' | 'medium' | 'low'
} = {}) {
  return {
    name,
    aliases: Array.isArray(aliases) ? aliases : [],
    type,
    identifiers: Array.isArray(identifiers) ? identifiers : [],
    nationality,
    jurisdiction,
    program,
    authority,
    reason,
    status,
    source,
    sourceUrl,
    sourceVersion,
    ingestedAt: ingestedAt || new Date().toISOString(),
    score,
    confidence,
  };
}

// Convierte un resultado crudo de un screener existente al modelo comun.
// Util para el gateway consolidado sin reescribir los screeners actuales.
export function fromLegacyMatch({ name, type, program, score, list } = {}) {
  return createEntityRecord({
    name,
    type,
    program: program || list || null,
    score,
    confidence: score >= 90 ? 'high' : score >= 75 ? 'medium' : 'low',
  });
}
