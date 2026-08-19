import crypto from 'node:crypto';
import { supabaseAdmin } from '../config/supabase.js';
import { chunkText, embedTexts, hasEmbeddingsProvider } from './embeddingsService.js';

const EMBED_BATCH_SIZE = 64;
export const MAX_CORPUS_CONTENT_CHARS = Number(process.env.MAX_CORPUS_CONTENT_CHARS || 250_000);
export const MAX_CORPUS_BATCH_DOCUMENTS = Number(process.env.MAX_CORPUS_BATCH_DOCUMENTS || 25);
export const MAX_CORPUS_MATCH_COUNT = Number(process.env.MAX_CORPUS_MATCH_COUNT || 20);

function hashContent(content) {
  return crypto.createHash('sha256').update(String(content || '')).digest('hex');
}

function normalizeCorpusDocument(input = {}, userId = null) {
  const title = String(input.title || '').trim();
  const content = String(input.content || '').trim();
  if (!title) throw new Error('El titulo del documento es obligatorio.');
  if (content.length < 50) throw new Error('El contenido del documento debe tener al menos 50 caracteres.');
  if (content.length > MAX_CORPUS_CONTENT_CHARS) {
    throw new Error(`El contenido del documento excede el maximo permitido de ${MAX_CORPUS_CONTENT_CHARS} caracteres.`);
  }

  return {
    title,
    content,
    row: {
      title,
      source_type: String(input.sourceType || 'manual').trim(),
      country_code: input.countryCode || null,
      source_url: input.sourceUrl || null,
      storage_path: input.storagePath || null,
      content_hash: hashContent(content),
      metadata: input.metadata || {},
      created_by: userId,
      is_active: input.isActive !== false
    }
  };
}

async function embedInBatches(chunks) {
  const embeddings = [];
  for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
    const batch = chunks.slice(i, i + EMBED_BATCH_SIZE);
    const result = await embedTexts(batch);
    embeddings.push(...result.embeddings);
  }
  return embeddings;
}

export async function ingestCorpusDocument(input, userId = null) {
  const { content, row } = normalizeCorpusDocument(input, userId);

  const { data: document, error } = await supabaseAdmin
    .from('corpus_documents')
    .upsert(row, { onConflict: 'content_hash' })
    .select()
    .single();
  if (error) throw error;

  await supabaseAdmin.from('corpus_chunks').delete().eq('corpus_document_id', document.id);

  if (!hasEmbeddingsProvider()) {
    return { document, chunked: 0, skippedEmbeddings: true };
  }

  const chunks = chunkText(content);
  if (!chunks.length) return { document, chunked: 0, skippedEmbeddings: false };

  const embeddings = await embedInBatches(chunks);
  const rows = chunks.map((chunk, index) => ({
    corpus_document_id: document.id,
    chunk_index: index,
    content: chunk,
    token_estimate: Math.ceil(chunk.length / 4),
    embedding: embeddings[index],
    metadata: { title: document.title, sourceType: document.source_type }
  }));

  const { error: chunksError } = await supabaseAdmin.from('corpus_chunks').insert(rows);
  if (chunksError) throw chunksError;

  return { document, chunked: rows.length, skippedEmbeddings: false };
}

export async function ingestCorpusBatch(documents = [], userId = null) {
  if (!Array.isArray(documents)) throw new Error('documents debe ser un arreglo.');
  if (documents.length > MAX_CORPUS_BATCH_DOCUMENTS) {
    throw new Error(`El lote excede el maximo permitido de ${MAX_CORPUS_BATCH_DOCUMENTS} documentos.`);
  }

  const results = [];
  for (const item of documents) {
    results.push(await ingestCorpusDocument(item, userId));
  }
  return results;
}

export async function searchCorpus(query, { countryCode = null, sourceType = null, matchCount = 8 } = {}) {
  if (!hasEmbeddingsProvider()) return [];
  const boundedMatchCount = Math.max(1, Math.min(Number(matchCount) || 8, MAX_CORPUS_MATCH_COUNT));
  const { embeddings } = await embedTexts([query]);
  if (!embeddings[0]) return [];

  const { data, error } = await supabaseAdmin.rpc('match_corpus_chunks', {
    query_embedding: embeddings[0],
    match_count: boundedMatchCount,
    filter_country: countryCode,
    filter_source_type: sourceType
  });
  if (error) throw error;

  return (data || []).map((row) => ({
    chunkId: row.chunk_id,
    corpusDocumentId: row.corpus_document_id,
    title: row.title,
    sourceType: row.source_type,
    countryCode: row.country_code,
    sourceUrl: row.source_url,
    content: row.content,
    similarity: row.similarity
  }));
}
