import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/ragService.js', () => ({
  searchReferenceSources: vi.fn(async () => []),
}));

describe('projectBuilderAgent.matchFinancingEntity', () => {
  it('matches startup/tech sectors to the family office matrix', async () => {
    const { matchFinancingEntity } = await import('./projectBuilderAgent.js');
    const result = matchFinancingEntity({ sector: 'Tecnologia / Startup' });

    expect(result.matrixKey).toBe('MX_FO_STARTUP');
    expect(result.entityLabel).toBe('FAMILY_OFFICE');
    expect(result.requiredDocuments.length).toBeGreaterThan(0);
    expect(result.requiredDocuments.some((doc) => doc.mandatory)).toBe(true);
  });

  it('matches real estate sectors to the developer matrix', async () => {
    const { matchFinancingEntity } = await import('./projectBuilderAgent.js');
    const result = matchFinancingEntity({ sector: 'Desarrollo Inmobiliario' });

    expect(result.matrixKey).toBe('MX_RE_DEV');
  });

  it('falls back to the default banking matrix when nothing matches', async () => {
    const { matchFinancingEntity } = await import('./projectBuilderAgent.js');
    const result = matchFinancingEntity({ sector: 'Manufactura general' });

    expect(result.matrixKey).toBe('MX_BANCA_MFG');
  });

  it('respects an explicit entityHint over the sector guess', async () => {
    const { matchFinancingEntity } = await import('./projectBuilderAgent.js');
    const result = matchFinancingEntity({ sector: 'Manufactura', entityHint: 'SOFOM' });

    expect(result.matrixKey).toBe('MX_SOFOM');
  });
});

describe('projectBuilderAgent.draftProjectFromAnswers (sin proveedor de IA configurado)', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.NVIDIA_API_KEY;
  });

  it('arma un borrador local por cada uno de los 5 rubros redactables', async () => {
    const { draftProjectFromAnswers, DRAFTABLE_RUBRIC_IDS } = await import('./projectBuilderAgent.js');

    const result = await draftProjectFromAnswers({
      sector: 'Tecnologia / SaaS',
      goal: 'Capital de trabajo',
      amount: '$500,000 MXN',
      useOfFunds: 'Contratar equipo comercial',
      market: 'PYMEs de manufactura',
      advantage: 'Retencion de clientes del 95%',
    }, { language: 'es' });

    expect(result.sections).toHaveLength(DRAFTABLE_RUBRIC_IDS.length);
    expect(result.sections.map((s) => s.rubricId)).toEqual(DRAFTABLE_RUBRIC_IDS);
    expect(result.sections.every((s) => s.source === 'local-template')).toBe(true);
    expect(result.entityMatch.matrixKey).toBe('MX_FO_STARTUP');
  });

  it('la seccion de modelo financiero usa monto y uso de fondos, no inventa cifras', async () => {
    const { draftProjectFromAnswers } = await import('./projectBuilderAgent.js');

    const result = await draftProjectFromAnswers({
      amount: '$500,000 MXN',
      useOfFunds: 'Comprar inventario',
    }, { language: 'es' });

    const financial = result.sections.find((s) => s.rubricId === 'modelo_financiero');
    expect(financial.content).toContain('$500,000 MXN');
    expect(financial.content).toContain('Comprar inventario');
  });

  it('marca la estructura esperada como faltante cuando no hay informacion para una seccion', async () => {
    const { draftProjectFromAnswers } = await import('./projectBuilderAgent.js');

    const result = await draftProjectFromAnswers({}, { language: 'es' });

    const riesgos = result.sections.find((s) => s.rubricId === 'marco_riesgos');
    expect(riesgos.missingStructure.length).toBeGreaterThan(0);
    expect(riesgos.coveredStructure).toEqual([]);
  });

  it('incluye la lista real de documentos obligatorios de la matriz seleccionada', async () => {
    const { draftProjectFromAnswers } = await import('./projectBuilderAgent.js');

    const result = await draftProjectFromAnswers({ sector: 'SOFOM' }, { language: 'es' });

    expect(result.entityMatch.matrixKey).toBe('MX_SOFOM');
    expect(result.entityMatch.requiredDocuments.some((doc) => doc.mandatory)).toBe(true);
  });

  it('expone el alcance explicito de que hacen los agentes y que le toca al humano', async () => {
    const { draftProjectFromAnswers } = await import('./projectBuilderAgent.js');

    const result = await draftProjectFromAnswers({}, { language: 'es' });

    expect(result.scope.agentsDoNotDo.join(' ')).toContain('No aprueban credito');
    expect(result.scope.humanMustReview.length).toBeGreaterThan(0);
  });

  it('nunca lanza si answers viene undefined o con forma invalida', async () => {
    const { draftProjectFromAnswers } = await import('./projectBuilderAgent.js');

    await expect(draftProjectFromAnswers(undefined)).resolves.toHaveProperty('sections');
    await expect(draftProjectFromAnswers(null)).resolves.toHaveProperty('sections');
  });
});

describe('projectBuilderAgent.draftProjectFromAnswers (con proveedor de IA configurado)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doMock('../services/aiJsonProvider.js', () => ({
      hasAnyJsonProvider: () => true,
      generateJsonWithFallback: vi.fn(),
    }));
    vi.doMock('../services/inegiService.js', () => ({
      getBusinessDensity: vi.fn(async (term) => ({ term, establishmentCount: 42, source: 'DENUE_API' })),
    }));
    vi.doMock('../services/banxicoService.js', () => ({
      getKeyIndicators: vi.fn(async () => ({
        exchangeRateFix: { valor: '18.4' },
        referenceRate: { valor: '10.25' },
        inpc: { valor: '134.2' },
        source: 'BANXICO_SIE',
      })),
    }));
    vi.doMock('../services/ragService.js', () => ({
      searchReferenceSources: vi.fn(async () => []),
    }));
  });

  it('usa el borrador de IA por seccion cuando el proveedor responde JSON valido', async () => {
    const { generateJsonWithFallback } = await import('../services/aiJsonProvider.js');
    generateJsonWithFallback.mockResolvedValue({
      text: JSON.stringify({
        content: 'Seccion redactada por IA.',
        coveredStructure: ['Resumen ejecutivo'],
        missingStructure: [],
        redFlagsToWatch: [],
      }),
      provider: 'anthropic',
      model: 'claude-sonnet-4-6',
      costUsd: 0.002,
    });

    const { draftProjectFromAnswers } = await import('./projectBuilderAgent.js');
    const result = await draftProjectFromAnswers({ sector: 'Tecnologia', goal: 'Expansion' }, { language: 'es' });

    expect(result.sections.every((s) => s.source === 'ai-generated')).toBe(true);
    expect(result.sections[0].content).toBe('Seccion redactada por IA.');
  });

  it('enriquece el rubro de estudio de mercado con INEGI y Banxico', async () => {
    const { generateJsonWithFallback } = await import('../services/aiJsonProvider.js');
    generateJsonWithFallback.mockImplementation(async (systemPrompt, userPrompt) => ({
      text: JSON.stringify({ content: userPrompt.includes('INEGI DENUE') ? 'incluye-inegi' : 'sin-inegi', coveredStructure: [], missingStructure: [], redFlagsToWatch: [] }),
      provider: 'anthropic',
      model: 'claude-sonnet-4-6',
      costUsd: 0.001,
    }));

    const { draftProjectFromAnswers } = await import('./projectBuilderAgent.js');
    const result = await draftProjectFromAnswers({ sector: 'Tecnologia', market: 'PYMEs' }, { language: 'es' });

    const mercado = result.sections.find((s) => s.rubricId === 'estudio_mercado');
    const planNegocios = result.sections.find((s) => s.rubricId === 'plan_negocios');
    expect(mercado.content).toBe('incluye-inegi');
    expect(mercado.sourcesUsed.some((s) => s.label.includes('INEGI'))).toBe(true);
    expect(planNegocios.content).toBe('sin-inegi');
  });

  it('cae al borrador local por seccion si el proveedor de IA falla, sin inventar exito', async () => {
    const { generateJsonWithFallback } = await import('../services/aiJsonProvider.js');
    generateJsonWithFallback.mockRejectedValue(new Error('Todos los proveedores de IA configurados fallaron'));

    const { draftProjectFromAnswers } = await import('./projectBuilderAgent.js');
    const result = await draftProjectFromAnswers({ goal: 'Expansion' }, { language: 'es' });

    expect(result.sections.every((s) => s.source === 'local-template')).toBe(true);
    expect(result.sections.every((s) => s.aiError)).toBeTruthy();
  });
});
