import { describe, it, expect, vi, beforeEach } from 'vitest';

// Contraparte de readinessRubricAgent.test.js (que solo ejercita los caminos
// de fallback sin ANTHROPIC_API_KEY). Este archivo mockea @anthropic-ai/sdk
// para probar el camino real: evaluateWithClaude() + el agente estructural
// real (evaluateStructureWithClaude(), sección 15.2 del plan) corriendo en
// paralelo. Mismo patrón de resetModules()/import dinámico que agentChat.test.js,
// porque `anthropic` se calcula una sola vez al cargar el módulo según
// process.env.ANTHROPIC_API_KEY.
const createMock = vi.fn();
const openaiCreateMock = vi.fn();

vi.mock('../config/supabase.js', () => ({
  supabaseAdmin: { from: vi.fn(() => ({})) }
}));

vi.mock('../services/documentIntelligenceService.js', () => ({
  getCrossReferences: vi.fn(async () => []),
  logAgentAction: vi.fn(async () => {}),
  saveExtraction: vi.fn(async () => {}),
  saveVerifications: vi.fn(async () => {}),
  getExtraction: vi.fn(async () => null)
}));

vi.mock('../services/gleifService.js', () => ({
  searchLegalEntity: vi.fn(async () => ({ matches: [] }))
}));

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    constructor() {}
    messages = { create: createMock };
  }
}));

// Necesario porque aiJsonProvider.js (usado por readinessRubricAgent.js desde
// la sección 23.2 del plan) instancia un cliente OpenAI-compatible para
// DeepSeek/NVIDIA además de Anthropic.
vi.mock('openai', () => ({
  default: class {
    constructor({ baseURL } = {}) {
      this.baseURL = baseURL;
    }
    chat = { completions: { create: (args) => openaiCreateMock({ baseURL: this.baseURL, ...args }) } };
  }
}));

async function loadEvaluate() {
  const { evaluateReadinessDocument } = await import('./readinessRubricAgent.js');
  return evaluateReadinessDocument;
}

const CONTENT_RESPONSE = {
  score: 78,
  status: 'yellow',
  summary: 'Documento aceptable con observaciones.',
  findings: ['Falta anexo de cronograma.'],
  missing_items: [],
  red_flags: [],
  recommendation: 'Agregar cronograma de ejecución.',
  confidence: 0.85,
  extracted_fields: {
    monto_solicitado: '$500,000',
    razon_social: 'Comercializadora Azteca SA de CV',
    fecha_documento: '2026-01-15',
    rfc: 'CAZ010101AAA',
    representante_legal: 'Juan Pérez',
    capex: '$100,000',
    deuda_total: '$50,000'
  }
};

const STRUCTURE_RESPONSE = {
  structure_score: 82,
  missing_sections: ['Anexos'],
  weak_sections: [{ section: 'Estrategia comercial', issue: 'sin metas medibles' }],
  strengths: ['Resumen ejecutivo claro'],
  red_flags: [],
  recommendation: 'Agregar anexos de soporte.',
  confidence: 0.9
};

function mockClaudeResponses({ content = CONTENT_RESPONSE, structure = STRUCTURE_RESPONSE, structureError = null } = {}) {
  createMock.mockImplementation(async ({ system }) => {
    const isStructureCall = system.includes('revisión estructural');
    if (isStructureCall) {
      if (structureError) throw structureError;
      return { content: [{ text: JSON.stringify(structure) }] };
    }
    return { content: [{ text: JSON.stringify(content) }] };
  });
}

describe('evaluateReadinessDocument con ANTHROPIC_API_KEY configurada', () => {
  beforeEach(() => {
    vi.resetModules();
    createMock.mockReset();
    openaiCreateMock.mockReset();
    delete process.env.OPENAI_API_KEY;
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.NVIDIA_API_KEY;
    process.env.ANTHROPIC_API_KEY = 'sk-test-123';
  });

  it('combina el score de contenido con el juicio estructural real de Claude', async () => {
    mockClaudeResponses();
    const evaluateReadinessDocument = await loadEvaluate();

    const result = await evaluateReadinessDocument({
      documentTypeCode: 'READY_PLAN_NEGOCIOS',
      extractedText: 'Resumen ejecutivo del plan de negocios...',
      order: { metadata: {} }
    });

    expect(createMock).toHaveBeenCalledTimes(2);
    expect(result.score).toBe(78);
    expect(result.warnings).toEqual([]);
    expect(result.findings.some((f) => f.includes('Estrategia comercial') && f.includes('sin metas medibles'))).toBe(true);
    expect(result.extracted_data.find((e) => e.key === 'structure_score')?.value).toBe(82);
    expect(result.extracted_data.find((e) => e.key === 'fortalezas_estructura')?.value).toContain('Resumen ejecutivo claro');
    expect(result.extracted_data.find((e) => e.key === 'confidence')?.value).toBe(0.85);
    expect(result.extracted_data.find((e) => e.key === 'human_review_required')?.value).toBe(false);
    expect(result.extracted_data.find((e) => e.key === 'rfc')?.value).toBe('CAZ010101AAA');
    expect(result.extracted_data.find((e) => e.key === 'representante_legal')?.value).toBe('Juan Pérez');
    expect(result.extracted_data.find((e) => e.key === 'capex')?.value).toBe('$100,000');
    expect(result.extracted_data.find((e) => e.key === 'deuda_total')?.value).toBe('$50,000');
  });

  it('marca human_review_required cuando la confianza es baja aunque el score sea alto', async () => {
    mockClaudeResponses({ content: { ...CONTENT_RESPONSE, score: 90, status: 'green', confidence: 0.3 } });
    const evaluateReadinessDocument = await loadEvaluate();

    const result = await evaluateReadinessDocument({
      documentTypeCode: 'READY_PLAN_NEGOCIOS',
      extractedText: 'Resumen ejecutivo del plan de negocios...',
      order: { metadata: {} }
    });

    expect(result.score).toBe(90);
    expect(result.extracted_data.find((e) => e.key === 'human_review_required')?.value).toBe(true);
  });

  it('marca human_review_required cuando el agente estructural reporta una bandera roja', async () => {
    mockClaudeResponses({ structure: { ...STRUCTURE_RESPONSE, red_flags: ['Secciones mezcladas sin orden lógico'] } });
    const evaluateReadinessDocument = await loadEvaluate();

    const result = await evaluateReadinessDocument({
      documentTypeCode: 'READY_PLAN_NEGOCIOS',
      extractedText: 'Resumen ejecutivo del plan de negocios...',
      order: { metadata: {} }
    });

    expect(result.findings.some((f) => f.includes('Bandera roja estructural'))).toBe(true);
    expect(result.extracted_data.find((e) => e.key === 'human_review_required')?.value).toBe(true);
  });

  it('cae a la heurística de estructura por palabras clave si la llamada estructural de Claude falla', async () => {
    mockClaudeResponses({ structureError: new Error('Fallo de red simulado') });
    const evaluateReadinessDocument = await loadEvaluate();

    const result = await evaluateReadinessDocument({
      documentTypeCode: 'READY_PLAN_NEGOCIOS',
      extractedText: 'Resumen ejecutivo del plan de negocios...',
      order: { metadata: {} }
    });

    expect(result.score).toBe(78);
    expect(result.warnings.some((w) => w.includes('revisión estructural con IA no estuvo disponible'))).toBe(true);
    expect(result.extracted_data.some((e) => e.key === 'structure_score')).toBe(true);
  });

  it("bloquea DeepSeek para contenido sensible si Anthropic falla y cae a heuristica segura", async () => {
    process.env.DEEPSEEK_API_KEY = 'sk-deepseek-test';
    createMock.mockRejectedValue(new Error('anthropic caído'));
    openaiCreateMock.mockImplementation(async ({ baseURL, messages }) => {
      if (baseURL !== 'https://api.deepseek.com/v1') throw new Error(`baseURL inesperado: ${baseURL}`);
      const isStructureCall = messages[0].content.includes('revisión estructural');
      return {
        choices: [{ message: { content: JSON.stringify(isStructureCall ? STRUCTURE_RESPONSE : CONTENT_RESPONSE) } }],
        usage: { prompt_tokens: 200, completion_tokens: 100 }
      };
    });

    const evaluateReadinessDocument = await loadEvaluate();
    const result = await evaluateReadinessDocument({
      documentTypeCode: 'READY_PLAN_NEGOCIOS',
      extractedText: 'Resumen ejecutivo del plan de negocios...',
      order: { metadata: {} }
    });

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.extracted_data.find((e) => e.key === "ai_provider")?.value).not.toBe("deepseek");
    expect(result.warnings.join(" " )).toContain("heurística");
  });
});
