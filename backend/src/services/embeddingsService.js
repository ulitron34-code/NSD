// Proveedor de embeddings para RAG (sección "RAG/vector DB" del plan --
// nunca existió antes en el repo). Anthropic/DeepSeek/NVIDIA no exponen API
// de embeddings hoy, así que a diferencia de aiJsonProvider.js (cascada de 4
// proveedores) aquí solo hay uno: OpenAI. Sin OPENAI_API_KEY este servicio
// queda inerte -- hasEmbeddingsProvider() devuelve false y ragService.js se
// salta la indexación/búsqueda sin inventar un resultado, mismo criterio que
// el resto de integraciones opcionales del repo (INEGI/Banxico/etc.).
import OpenAI from 'openai';

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const openai = OPENAI_KEY ? new OpenAI({ apiKey: OPENAI_KEY }) : null;

export const EMBEDDING_MODEL = 'text-embedding-3-small';
export const EMBEDDING_DIMENSIONS = 1536;

// Precio aproximado por 1M tokens -- orientativo, no facturación real (mismo
// criterio que PRICING_PER_MILLION_TOKENS en aiJsonProvider.js).
const PRICE_PER_MILLION_TOKENS = 0.02;

export function hasEmbeddingsProvider() {
  return Boolean(openai);
}

function estimateCostUsd(totalTokens) {
  if (!totalTokens) return 0;
  return Number((totalTokens * (PRICE_PER_MILLION_TOKENS / 1_000_000)).toFixed(6));
}

// Ventana deliberadamente conservadora por caracteres (no hay tokenizer real
// cargado aquí, es una aproximación suficiente para RAG, no para facturación
// exacta) con traslape para no cortar una idea a la mitad entre chunks
// contiguos.
export function chunkText(text, { chunkSize = 1500, overlap = 200 } = {}) {
  const clean = String(text || '').trim();
  if (!clean) return [];
  if (clean.length <= chunkSize) return [clean];

  const chunks = [];
  let start = 0;
  while (start < clean.length) {
    const end = Math.min(start + chunkSize, clean.length);
    chunks.push(clean.slice(start, end));
    if (end >= clean.length) break;
    start = end - overlap;
  }
  return chunks;
}

// OpenAI acepta un array de strings en una sola llamada -- el llamador
// (ragService.js) es responsable de trocear en lotes si hay muchos textos,
// esta función no impone un límite artificial.
export async function embedTexts(texts) {
  if (!openai) throw new Error('OPENAI_API_KEY no configurado -- no hay proveedor de embeddings disponible.');
  if (!texts.length) return { embeddings: [], model: EMBEDDING_MODEL, usage: { totalTokens: 0 }, costUsd: 0 };

  const response = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: texts });

  const embeddings = [...response.data]
    .sort((a, b) => a.index - b.index)
    .map((item) => item.embedding);
  const totalTokens = response.usage?.total_tokens || 0;

  return {
    embeddings,
    model: EMBEDDING_MODEL,
    usage: { totalTokens },
    costUsd: estimateCostUsd(totalTokens)
  };
}
