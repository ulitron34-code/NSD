// Servicio de verificación de identidad contra listas de sanciones
// Busca en corpus: listas SAT, sanciones EEUU/UE/Canadá, y APIs públicas como fallback

import { supabaseAdmin } from '../config/supabase.js';
import { searchCorpus } from './corpusService.js';

const SANCTIONS_MATCH_THRESHOLD = 0.75;
const API_TIMEOUT_MS = 5000;

async function searchOpenSanctions(query) {
  try {
    const response = await fetch(`https://api.opensanctions.org/search?q=${encodeURIComponent(query)}`, {
      timeout: API_TIMEOUT_MS
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.results || []).map(r => ({
      name: r.name,
      type: r.type,
      sanctions: r.sanctions || [],
      source: 'opensanctions',
      similarity: 0.95 // API match = high confidence
    }));
  } catch (error) {
    console.warn(`OpenSanctions API error: ${error.message}`);
    return [];
  }
}

async function searchInternalCorpus(query) {
  try {
    const results = await searchCorpus(query, {
      sourceType: 'identity_verification',
      matchCount: 10
    });
    return results
      .filter(r => r.similarity >= SANCTIONS_MATCH_THRESHOLD)
      .map(r => ({
        name: r.title,
        source: r.sourceType,
        sourceUrl: r.sourceUrl,
        content: r.content,
        similarity: r.similarity,
        corpusDocumentId: r.corpusDocumentId
      }));
  } catch (error) {
    console.warn(`Internal corpus search error: ${error.message}`);
    return [];
  }
}

export async function verifyIdentity(query) {
  if (!query || typeof query !== 'string') {
    throw new Error('Query debe ser un string no vacío');
  }

  const trimmedQuery = query.trim();
  if (trimmedQuery.length < 2) {
    throw new Error('Query debe tener al menos 2 caracteres');
  }

  const [internalMatches, apiMatches] = await Promise.all([
    searchInternalCorpus(trimmedQuery),
    searchOpenSanctions(trimmedQuery)
  ]);

  const allMatches = [...internalMatches, ...apiMatches];
  const hasMatches = allMatches.length > 0;
  const highRiskMatches = allMatches.filter(m => m.similarity >= 0.85);

  return {
    query: trimmedQuery,
    hasMatches,
    matchCount: allMatches.length,
    riskLevel: highRiskMatches.length > 0 ? 'high' : (hasMatches ? 'medium' : 'low'),
    matches: allMatches.slice(0, 5), // Top 5 matches
    timestamp: new Date().toISOString(),
    sources: {
      internal: internalMatches.length,
      opensanctions: apiMatches.length
    }
  };
}

export async function getVerificationStats() {
  try {
    const { count: corpusCount } = await supabaseAdmin
      .from('corpus_documents')
      .select('id', { count: 'exact', head: true })
      .eq('source_type', 'identity_verification');

    const { count: chunkCount } = await supabaseAdmin
      .from('corpus_chunks')
      .select('id', { count: 'exact', head: true });

    return {
      corpusDocuments: corpusCount || 0,
      corpusChunks: chunkCount || 0,
      ready: (corpusCount || 0) > 0
    };
  } catch (error) {
    console.error('Error fetching verification stats:', error);
    return { corpusDocuments: 0, corpusChunks: 0, ready: false };
  }
}
