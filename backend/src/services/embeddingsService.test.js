import { describe, it, expect, vi, beforeEach } from 'vitest';

const embeddingsCreateMock = vi.fn();

vi.mock('openai', () => ({
  default: class {
    constructor() {}
    embeddings = { create: (args) => embeddingsCreateMock(args) };
  }
}));

async function loadService() {
  return import('./embeddingsService.js');
}

describe('embeddingsService', () => {
  beforeEach(() => {
    vi.resetModules();
    embeddingsCreateMock.mockReset();
    delete process.env.OPENAI_API_KEY;
  });

  it('hasEmbeddingsProvider es false sin OPENAI_API_KEY', async () => {
    const { hasEmbeddingsProvider } = await loadService();
    expect(hasEmbeddingsProvider()).toBe(false);
  });

  it('hasEmbeddingsProvider es true con OPENAI_API_KEY', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    const { hasEmbeddingsProvider } = await loadService();
    expect(hasEmbeddingsProvider()).toBe(true);
  });

  it('embedTexts lanza error explícito sin proveedor configurado', async () => {
    const { embedTexts } = await loadService();
    await expect(embedTexts(['hola'])).rejects.toThrow(/OPENAI_API_KEY no configurado/);
  });

  it('embedTexts regresa embeddings en el orden correcto y calcula costo', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    embeddingsCreateMock.mockResolvedValue({
      data: [
        { index: 1, embedding: [0.2, 0.2] },
        { index: 0, embedding: [0.1, 0.1] }
      ],
      usage: { total_tokens: 1000 }
    });

    const { embedTexts } = await loadService();
    const result = await embedTexts(['primero', 'segundo']);

    expect(result.embeddings).toEqual([[0.1, 0.1], [0.2, 0.2]]);
    expect(result.model).toBe('text-embedding-3-small');
    expect(result.usage.totalTokens).toBe(1000);
    expect(result.costUsd).toBeGreaterThan(0);
  });

  it('embedTexts con array vacío no llama al proveedor', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    const { embedTexts } = await loadService();
    const result = await embedTexts([]);
    expect(result.embeddings).toEqual([]);
    expect(embeddingsCreateMock).not.toHaveBeenCalled();
  });

  it('chunkText regresa un solo chunk si el texto cabe en la ventana', async () => {
    const { chunkText } = await loadService();
    expect(chunkText('texto corto')).toEqual(['texto corto']);
  });

  it('chunkText regresa vacío para texto vacío/nulo', async () => {
    const { chunkText } = await loadService();
    expect(chunkText('')).toEqual([]);
    expect(chunkText(null)).toEqual([]);
  });

  it('chunkText trocea texto largo con traslape', async () => {
    const { chunkText } = await loadService();
    const text = 'a'.repeat(3200);
    const chunks = chunkText(text, { chunkSize: 1500, overlap: 200 });

    expect(chunks.length).toBeGreaterThan(1);
    // Cada chunk (salvo el último) mide exactamente chunkSize.
    expect(chunks[0].length).toBe(1500);
    // El traslape asegura que el final del primer chunk reaparece al inicio del segundo.
    expect(chunks[1].startsWith(chunks[0].slice(-200))).toBe(true);
  });
});
