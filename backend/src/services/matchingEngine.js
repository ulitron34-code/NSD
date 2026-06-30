// Motor centralizado de coincidencias para el gateway regulatorio de NSD.
// Los screeners existentes tienen su propia copia local de normalizeName/fuzzyScore;
// este modulo no los toca. El regulatoryGateway usa este motor para resultados
// mas precisos: word-overlap + score de confianza explicito.

const MATCH_THRESHOLD_HIGH   = 90;
const MATCH_THRESHOLD_MEDIUM = 75;

// Elimina diacriticos, pasa a mayusculas, quita caracteres que no sean alfanumericos.
export function normalizeName(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Score heuristico de 0-100 entre dos cadenas ya normalizadas.
// Orden de evaluacion: identico → substring → solapamiento de palabras.
export function fuzzyScore(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 100;
  if (a.includes(b) || b.includes(a)) return 88;
  const wordsA = a.split(' ');
  const wordsB = b.split(' ');
  const setB = new Set(wordsB);
  const common = wordsA.filter((w) => w.length > 1 && setB.has(w));
  if (!common.length) return 0;
  return Math.round(((common.length * 2) / (wordsA.length + wordsB.length)) * 100);
}

// Compara un nombre buscado contra un array de entradas { normalizedName, ...rest }
// y devuelve solo las que superen el umbral, ordenadas de mayor a menor score.
// entries: Array<{ normalizedName: string, [k: string]: any }>
// Retorna: Array<{ ...entry, score: number, confidence: 'high'|'medium'|'low' }>
export function matchName(searchName, entries = []) {
  const target = normalizeName(searchName);
  if (!target) return [];

  const results = [];
  for (const entry of entries) {
    const score = fuzzyScore(target, entry.normalizedName);
    if (score >= MATCH_THRESHOLD_MEDIUM) {
      results.push({
        ...entry,
        score,
        confidence: score >= MATCH_THRESHOLD_HIGH ? 'high' : score >= MATCH_THRESHOLD_MEDIUM ? 'medium' : 'low'
      });
    }
  }
  results.sort((a, b) => b.score - a.score);
  return results;
}
