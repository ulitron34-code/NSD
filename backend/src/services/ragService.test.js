import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = { referenceChunks: [], documentChunks: [] };
const rpcMock = vi.fn();

vi.mock('../config/supabase.js', () => {
  function makeBuilder(table) {
    const builder = {
      delete: vi.fn(() => builder),
      eq: vi.fn((col, val) => {
        if (table === 'reference_source_chunks') {
          state.referenceChunks = state.referenceChunks.filter((r) => r[col] !== val);
        } else if (table === 'document_chunks') {
          state.documentChunks = state.documentChunks.filter((r) => r[col] !== val);
        }
        return Promise.resolve({ data: null, error: null });
      }),
      insert: vi.fn((rows) => {
        const arr = Array.isArray(rows) ? rows : [rows];
        if (table === 'reference_source_chunks') state.referenceChunks.push(...arr);
        else if (table === 'document_chunks') state.documentChunks.push(...arr);
        return Promise.resolve({ data: arr, error: null });
      })
    };
    return builder;
  }
  return {
    supabaseAdmin: {
      from: vi.fn((table) => makeBuilder(table)),
      rpc: (...args) => rpcMock(...args)
    }
  };
});

const embeddingsState = { hasProvider: true };
const embedTextsMock = vi.fn();

vi.mock('./embeddingsService.js', () => ({
  hasEmbeddingsProvider: () => embeddingsState.hasProvider,
  chunkText: (text) => {
    const clean = String(text || '');
    if (!clean) return [];
    const chunks = [];
    for (let i = 0; i < clean.length; i += 10) chunks.push(clean.slice(i, i + 10));
    return chunks;
  },
  embedTexts: (texts) => embedTextsMock(texts)
}));

import {
  ingestReferenceSourceContent,
  ingestDocumentText,
  searchReferenceSources,
  findSimilarDocumentChunks
} from './ragService.js';

describe('ragService', () => {
  beforeEach(() => {
    state.referenceChunks = [];
    state.documentChunks = [];
    rpcMock.mockReset();
    embedTextsMock.mockReset();
    embeddingsState.hasProvider = true;
  });

  describe('ingestReferenceSourceContent', () => {
    it('no indexa nada si no hay proveedor de embeddings, pero sí limpia chunks viejos', async () => {
      embeddingsState.hasProvider = false;
      state.referenceChunks = [{ reference_source_id: 'src-1', content: 'viejo' }];

      const result = await ingestReferenceSourceContent('src-1', 'contenido nuevo');

      expect(result).toEqual({ chunked: 0, skipped: true });
      expect(state.referenceChunks).toHaveLength(0);
      expect(embedTextsMock).not.toHaveBeenCalled();
    });

    it('trocea, embebe y reemplaza los chunks de la fuente', async () => {
      state.referenceChunks = [{ reference_source_id: 'src-1', content: 'viejo' }];
      embedTextsMock.mockResolvedValue({ embeddings: [[0.1], [0.2]] });

      const result = await ingestReferenceSourceContent('src-1', '0123456789abcdefghij'); // 20 chars -> 2 chunks de 10

      expect(result.chunked).toBe(2);
      expect(state.referenceChunks).toHaveLength(2);
      expect(state.referenceChunks[0]).toMatchObject({ reference_source_id: 'src-1', chunk_index: 0, content: '0123456789' });
      expect(state.referenceChunks[1].embedding).toEqual([0.2]);
    });
  });

  describe('ingestDocumentText', () => {
    it('reemplaza los chunks previos del mismo documento', async () => {
      state.documentChunks = [{ document_id: 'doc-1', content: 'viejo' }];
      embedTextsMock.mockResolvedValue({ embeddings: [[0.5]] });

      const result = await ingestDocumentText('doc-1', 'order-1', 'texto diez'); // exactamente 10 chars -> 1 chunk con el chunker de prueba

      expect(result.chunked).toBe(1);
      expect(state.documentChunks).toEqual([
        expect.objectContaining({ document_id: 'doc-1', order_id: 'order-1', chunk_index: 0, content: 'texto diez', embedding: [0.5] })
      ]);
    });

    it('no rompe con texto vacío', async () => {
      const result = await ingestDocumentText('doc-1', 'order-1', '');
      expect(result).toEqual({ chunked: 0, skipped: false });
      expect(embedTextsMock).not.toHaveBeenCalled();
    });
  });

  describe('searchReferenceSources', () => {
    it('regresa vacío sin proveedor de embeddings', async () => {
      embeddingsState.hasProvider = false;
      const result = await searchReferenceSources('pregunta');
      expect(result).toEqual([]);
      expect(rpcMock).not.toHaveBeenCalled();
    });

    it('embebe la query y mapea los resultados del RPC', async () => {
      embedTextsMock.mockResolvedValue({ embeddings: [[0.9, 0.1]] });
      rpcMock.mockResolvedValue({
        data: [
          { reference_source_id: 'src-1', source_name: 'CNBV Disposiciones', content: 'texto A', similarity: 0.91 }
        ],
        error: null
      });

      const result = await searchReferenceSources('kyc México', { countryCode: 'MX', matchCount: 3 });

      expect(rpcMock).toHaveBeenCalledWith('match_reference_source_chunks', {
        query_embedding: [0.9, 0.1],
        match_count: 3,
        filter_country: 'MX'
      });
      expect(result).toEqual([
        { referenceSourceId: 'src-1', sourceName: 'CNBV Disposiciones', content: 'texto A', similarity: 0.91 }
      ]);
    });
  });

  describe('findSimilarDocumentChunks', () => {
    it('regresa vacío sin proveedor de embeddings', async () => {
      embeddingsState.hasProvider = false;
      const result = await findSimilarDocumentChunks('order-1', 'doc-1', 'texto');
      expect(result).toEqual([]);
      expect(rpcMock).not.toHaveBeenCalled();
    });

    it('filtra por similitud mínima, deduplica y ordena descendente', async () => {
      embedTextsMock.mockResolvedValue({ embeddings: [[0.1]] });
      rpcMock.mockResolvedValue({
        data: [
          { chunk_id: 'c1', document_id: 'doc-2', content: 'similar fuerte', similarity: 0.9 },
          { chunk_id: 'c2', document_id: 'doc-2', content: 'similar debil', similarity: 0.5 },
          { chunk_id: 'c1', document_id: 'doc-2', content: 'similar fuerte', similarity: 0.9 }
        ],
        error: null
      });

      const result = await findSimilarDocumentChunks('order-1', 'doc-1', '0123456789', { minSimilarity: 0.8 });

      expect(result).toEqual([{ documentId: 'doc-2', content: 'similar fuerte', similarity: 0.9 }]);
    });
  });
});
