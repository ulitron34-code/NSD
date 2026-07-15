// Retrieval-Augmented Generation sobre pgvector (Supabase). Ver
// backend/sql_migrations_pendientes/2026-07-14_rag_vector_embeddings.sql
// para el esquema (dos tablas de chunks + funciones RPC de similitud
// coseno). Dos ámbitos separados porque tienen dueño y ciclo de vida
// distintos:
//   - reference_source_chunks: catálogo compartido, lo mantiene un
//     Administrador editando `reference_sources.content`.
//   - document_chunks: por expediente, se reemplazan cada vez que el
//     documento correspondiente se re-revisa.
// Sin OPENAI_API_KEY (embeddingsService.hasEmbeddingsProvider() === false),
// toda función de este módulo se degrada a no-op/vacío sin lanzar error --
// mismo criterio de "reportar el hueco honestamente" que el resto del repo
// (INEGI/Banxico/CNBV sin token, etc.), para que un expediente sin esa key
// configurada siga funcionando exactamente igual que antes de esta migración.
import { supabaseAdmin } from '../config/supabase.js';
import { chunkText, embedTexts, hasEmbeddingsProvider } from './embeddingsService.js';

const EMBED_BATCH_SIZE = 64;

async function embedInBatches(texts) {
  const embeddings = [];
  for (let i = 0; i < texts.length; i += EMBED_BATCH_SIZE) {
    const batch = texts.slice(i, i + EMBED_BATCH_SIZE);
    const result = await embedTexts(batch);
    embeddings.push(...result.embeddings);
  }
  return embeddings;
}

// Reemplaza (no acumula) los chunks de una fuente regulatoria en cada
// llamada -- si no se hiciera así, editar el contenido de una fuente dejaría
// chunks viejos huérfanos que seguirían apareciendo en búsquedas futuras.
export async function ingestReferenceSourceContent(referenceSourceId, content) {
  await supabaseAdmin.from('reference_source_chunks').delete().eq('reference_source_id', referenceSourceId);

  if (!hasEmbeddingsProvider()) {
    console.warn('[ragService] OPENAI_API_KEY no configurado -- no se indexó el contenido de la fuente regulatoria (búsqueda RAG no la encontrará hasta que se configure).');
    return { chunked: 0, skipped: true };
  }

  const chunks = chunkText(content);
  if (!chunks.length) return { chunked: 0, skipped: false };

  const embeddings = await embedInBatches(chunks);
  const rows = chunks.map((chunkContent, index) => ({
    reference_source_id: referenceSourceId,
    chunk_index: index,
    content: chunkContent,
    embedding: embeddings[index]
  }));

  const { error } = await supabaseAdmin.from('reference_source_chunks').insert(rows);
  if (error) throw error;
  return { chunked: rows.length, skipped: false };
}

// Se llama cada vez que documents.js termina de extraer texto de un
// documento -- reemplaza los chunks previos del mismo documento (una
// re-revisión con archivo corregido no debe dejar chunks del archivo
// anterior conviviendo con los nuevos).
export async function ingestDocumentText(documentId, orderId, text) {
  await supabaseAdmin.from('document_chunks').delete().eq('document_id', documentId);

  if (!hasEmbeddingsProvider()) return { chunked: 0, skipped: true };

  const chunks = chunkText(text);
  if (!chunks.length) return { chunked: 0, skipped: false };

  const embeddings = await embedInBatches(chunks);
  const rows = chunks.map((chunkContent, index) => ({
    document_id: documentId,
    order_id: orderId,
    chunk_index: index,
    content: chunkContent,
    embedding: embeddings[index]
  }));

  const { error } = await supabaseAdmin.from('document_chunks').insert(rows);
  if (error) throw error;
  return { chunked: rows.length, skipped: false };
}

// Fundamenta la evaluación de un rubro (readinessRubricAgent.js) en el texto
// real de las fuentes regulatorias que el Administrador cargó, en vez de
// solo el conocimiento previo del modelo -- reduce alucinación regulatoria.
// Vacío si no hay proveedor o no hay chunks indexados todavía (el llamador
// ya está preparado para ese caso, mismo patrón que estudio_mercado con
// INEGI/Banxico cuando esas fuentes no responden).
export async function searchReferenceSources(query, { countryCode = null, matchCount = 3 } = {}) {
  if (!hasEmbeddingsProvider()) return [];

  const { embeddings } = await embedTexts([query]);
  if (!embeddings[0]) return [];

  const { data, error } = await supabaseAdmin.rpc('match_reference_source_chunks', {
    query_embedding: embeddings[0],
    match_count: matchCount,
    filter_country: countryCode
  });
  if (error) throw error;

  return (data || []).map((row) => ({
    referenceSourceId: row.reference_source_id,
    sourceName: row.source_name,
    content: row.content,
    similarity: row.similarity
  }));
}

// Complementa a readinessCrossRefAgent.js (que solo compara campos atómicos
// EXACTOS tras normalizar) con una señal semántica: contenido parecido entre
// documentos DISTINTOS del mismo expediente, redactado distinto pero
// hablando de lo mismo -- útil para apuntar a un posible duplicado o
// contradicción que la comparación exacta no puede ver. No reemplaza al
// auditor cruzado existente, es una señal adicional.
export async function findSimilarDocumentChunks(orderId, documentId, text, { matchCount = 5, minSimilarity = 0.82 } = {}) {
  if (!hasEmbeddingsProvider()) return [];

  // Primeros chunks representativos del documento, no todo su contenido --
  // suficiente para detectar solape con otro documento sin multiplicar
  // llamadas de embeddings por cada chunk del documento completo.
  const queryChunks = chunkText(text).slice(0, 3);
  if (!queryChunks.length) return [];

  const embeddings = await embedInBatches(queryChunks);
  const seen = new Set();
  const results = [];

  for (const embedding of embeddings) {
    const { data, error } = await supabaseAdmin.rpc('match_document_chunks', {
      query_embedding: embedding,
      match_count: matchCount,
      filter_order_id: orderId,
      exclude_document_id: documentId
    });
    if (error) throw error;

    for (const row of data || []) {
      if (row.similarity < minSimilarity || seen.has(row.chunk_id)) continue;
      seen.add(row.chunk_id);
      results.push({ documentId: row.document_id, content: row.content, similarity: row.similarity });
    }
  }

  return results.sort((a, b) => b.similarity - a.similarity);
}
