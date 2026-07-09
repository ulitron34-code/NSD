import { describe, it, expect, vi, beforeEach } from 'vitest';

const anthropicCreateMock = vi.fn();
const openaiCreateMock = vi.fn();

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    constructor() {}
    messages = { create: anthropicCreateMock };
  }
}));

vi.mock('openai', () => ({
  default: class {
    constructor({ baseURL } = {}) {
      this.baseURL = baseURL || 'https://api.openai.com/v1';
    }
    chat = {
      completions: {
        create: (args) => openaiCreateMock({ baseURL: this.baseURL, ...args })
      }
    };
  }
}));

async function loadProvider() {
  return import('./aiJsonProvider.js');
}

function clearProviderKeys() {
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.OPENAI_API_KEY;
  delete process.env.DEEPSEEK_API_KEY;
  delete process.env.NVIDIA_API_KEY;
}

describe('aiJsonProvider.generateJsonWithFallback', () => {
  beforeEach(() => {
    vi.resetModules();
    anthropicCreateMock.mockReset();
    openaiCreateMock.mockReset();
    clearProviderKeys();
  });

  it('hasAnyJsonProvider es false cuando no hay ninguna key configurada', async () => {
    const { hasAnyJsonProvider } = await loadProvider();
    expect(hasAnyJsonProvider()).toBe(false);
  });

  it('usa Anthropic cuando está configurado y responde bien', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    anthropicCreateMock.mockResolvedValue({
      content: [{ text: '{"ok":true}' }],
      usage: { input_tokens: 100, output_tokens: 50 }
    });

    const { generateJsonWithFallback } = await loadProvider();
    const result = await generateJsonWithFallback('system', 'user');

    expect(result.provider).toBe('anthropic');
    expect(result.text).toBe('{"ok":true}');
    expect(result.costUsd).toBeGreaterThan(0);
    expect(openaiCreateMock).not.toHaveBeenCalled();
  });

  it('cae a DeepSeek si Anthropic falla y DeepSeek está configurado', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    process.env.DEEPSEEK_API_KEY = 'sk-deepseek-test';
    anthropicCreateMock.mockRejectedValue(new Error('rate limit'));
    openaiCreateMock.mockImplementation(async ({ baseURL }) => {
      if (baseURL === 'https://api.deepseek.com/v1') {
        return { choices: [{ message: { content: '{"ok":"deepseek"}' } }], usage: { prompt_tokens: 10, completion_tokens: 5 } };
      }
      throw new Error(`baseURL inesperado en el test: ${baseURL}`);
    });

    const { generateJsonWithFallback } = await loadProvider();
    const result = await generateJsonWithFallback('system', 'user');

    expect(result.provider).toBe('deepseek');
    expect(result.text).toBe('{"ok":"deepseek"}');
    expect(result.attemptedBeforeSuccess).toEqual([{ provider: 'anthropic', error: 'rate limit' }]);
  });

  it('prueba NVIDIA si Anthropic y DeepSeek fallan', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    process.env.DEEPSEEK_API_KEY = 'sk-deepseek-test';
    process.env.NVIDIA_API_KEY = 'nvidia-test';
    anthropicCreateMock.mockRejectedValue(new Error('anthropic caido'));
    openaiCreateMock.mockImplementation(async ({ baseURL }) => {
      if (baseURL === 'https://api.deepseek.com/v1') throw new Error('deepseek caido');
      if (baseURL === 'https://integrate.api.nvidia.com/v1') {
        return { choices: [{ message: { content: '{"ok":"nvidia"}' } }], usage: { prompt_tokens: 8, completion_tokens: 4 } };
      }
      throw new Error(`baseURL inesperado: ${baseURL}`);
    });

    const { generateJsonWithFallback } = await loadProvider();
    const result = await generateJsonWithFallback('system', 'user');

    expect(result.provider).toBe('nvidia');
    expect(result.attemptedBeforeSuccess.map((a) => a.provider)).toEqual(['anthropic', 'deepseek']);
  });

  it('lanza error honesto cuando todos los proveedores configurados fallan', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    anthropicCreateMock.mockRejectedValue(new Error('anthropic caido'));

    const { generateJsonWithFallback } = await loadProvider();
    await expect(generateJsonWithFallback('system', 'user')).rejects.toThrow(/Todos los proveedores/);
  });

  it('lanza error honesto cuando ningun proveedor esta configurado', async () => {
    const { generateJsonWithFallback } = await loadProvider();
    await expect(generateJsonWithFallback('system', 'user')).rejects.toThrow(/Ningún proveedor de IA está configurado/);
  });
});
