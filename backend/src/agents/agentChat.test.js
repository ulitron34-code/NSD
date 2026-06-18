import { describe, it, expect, vi, beforeEach } from 'vitest';

const createMock = vi.fn();

vi.mock('../config/supabase.js', () => ({
  supabase: {},
  supabaseAdmin: { from: vi.fn() }
}));

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    constructor() {}
    messages = { create: createMock };
  }
}));

function makeBuilder(result) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject)
  };
  return builder;
}

// agentChat.js decide si usar IA real leyendo ANTHROPIC_API_KEY al cargar el
// módulo, así que cada test recarga el módulo (y su dependencia de supabase)
// para que la variable de entorno tome efecto.
async function loadAgentChat() {
  const { supabaseAdmin } = await import('../config/supabase.js');
  const { chatWithExpediente } = await import('./agentChat.js');
  return { supabaseAdmin, chatWithExpediente };
}

describe('agentChat.chatWithExpediente', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    delete process.env.ANTHROPIC_API_KEY;
  });

  it('avisa cuando el expediente no tiene documentos cargados', async () => {
    const { supabaseAdmin, chatWithExpediente } = await loadAgentChat();
    supabaseAdmin.from.mockImplementation((table) => {
      if (table === 'documents') return makeBuilder({ data: [], error: null });
      throw new Error(`Tabla inesperada: ${table}`);
    });
    const result = await chatWithExpediente('exp-1', '¿Cuál es el RFC?');
    expect(result.response).toMatch(/No se encontraron documentos/);
  });

  it('avisa cuando los documentos aún no fueron procesados por el clasificador', async () => {
    const { supabaseAdmin, chatWithExpediente } = await loadAgentChat();
    supabaseAdmin.from.mockImplementation((table) => {
      if (table === 'documents') return makeBuilder({ data: [{ id: 'd1', filename: 'a.pdf', document_type: 'RFC_CSF' }], error: null });
      if (table === 'document_extractions') return makeBuilder({ data: [], error: null });
      throw new Error(`Tabla inesperada: ${table}`);
    });
    const result = await chatWithExpediente('exp-2', '¿Cuál es el RFC?');
    expect(result.response).toMatch(/Agente Clasificador/);
  });

  it('responde en modo simulado (sin fabricar cifras) cuando no hay ANTHROPIC_API_KEY configurada', async () => {
    const { supabaseAdmin, chatWithExpediente } = await loadAgentChat();
    supabaseAdmin.from.mockImplementation((table) => {
      if (table === 'documents') return makeBuilder({ data: [{ id: 'd1', filename: 'a.pdf', document_type: 'RFC_CSF' }], error: null });
      if (table === 'document_extractions') return makeBuilder({ data: [{ document_id: 'd1', extracted_data: { textContent: 'RFC ABC010101AB1' } }], error: null });
      throw new Error(`Tabla inesperada: ${table}`);
    });
    const result = await chatWithExpediente('exp-3', '¿Cuál es el RFC?');
    expect(result.simulated).toBe(true);
    expect(result.response).toMatch(/Modo simulado/);
    expect(createMock).not.toHaveBeenCalled();
  });

  it('usa el modelo claude-sonnet-4-6 y devuelve la respuesta real cuando hay API key configurada', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test-123';
    createMock.mockResolvedValue({ content: [{ text: 'El RFC es ABC010101AB1.' }] });
    const { supabaseAdmin, chatWithExpediente } = await loadAgentChat();
    supabaseAdmin.from.mockImplementation((table) => {
      if (table === 'documents') return makeBuilder({ data: [{ id: 'd1', filename: 'a.pdf', document_type: 'RFC_CSF' }], error: null });
      if (table === 'document_extractions') return makeBuilder({ data: [{ document_id: 'd1', extracted_data: { textContent: 'RFC ABC010101AB1' } }], error: null });
      throw new Error(`Tabla inesperada: ${table}`);
    });
    const result = await chatWithExpediente('exp-4', '¿Cuál es el RFC?');
    expect(result.response).toBe('El RFC es ABC010101AB1.');
    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({ model: 'claude-sonnet-4-6' }));
  });
});
