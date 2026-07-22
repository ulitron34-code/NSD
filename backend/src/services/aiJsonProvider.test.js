import { describe, it, expect, vi, beforeEach } from "vitest";

const anthropicCreateMock = vi.fn();
const openaiCreateMock = vi.fn();

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    constructor() {}
    messages = { create: anthropicCreateMock };
  }
}));

vi.mock("openai", () => ({
  default: class {
    constructor({ baseURL } = {}) {
      this.baseURL = baseURL || "https://api.openai.com/v1";
    }
    chat = {
      completions: {
        create: (args) => openaiCreateMock({ baseURL: this.baseURL, ...args })
      }
    };
  }
}));

async function loadProvider() {
  return import("./aiJsonProvider.js");
}

function clearProviderKeys() {
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.OPENAI_API_KEY;
  delete process.env.KIMI_API_KEY;
  delete process.env.KIMI_BASE_URL;
  delete process.env.KIMI_JSON_MODEL;
  delete process.env.DEEPSEEK_API_KEY;
  delete process.env.DEEPSEEK_JSON_MODEL;
  delete process.env.NVIDIA_API_KEY;
}

describe("aiJsonProvider.generateJsonWithFallback", () => {
  beforeEach(() => {
    vi.resetModules();
    anthropicCreateMock.mockReset();
    openaiCreateMock.mockReset();
    clearProviderKeys();
  });

  it("hasAnyJsonProvider es false cuando no hay ninguna key configurada", async () => {
    const { hasAnyJsonProvider, hasAnyAllowedJsonProvider } = await loadProvider();
    expect(hasAnyJsonProvider()).toBe(false);
    expect(hasAnyAllowedJsonProvider()).toBe(false);
  });

  it("usa Anthropic cuando esta configurado y responde bien", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    anthropicCreateMock.mockResolvedValue({
      content: [{ text: "{\"ok\":true}" }],
      usage: { input_tokens: 100, output_tokens: 50 }
    });

    const { generateJsonWithFallback } = await loadProvider();
    const result = await generateJsonWithFallback("system", "user");

    expect(result.provider).toBe("anthropic");
    expect(result.providerPolicy).toMatchObject({ tier: "primary", riskProfile: "sensitive-approved" });
    expect(result.text).toBe("{\"ok\":true}");
    expect(result.costUsd).toBeGreaterThan(0);
    expect(openaiCreateMock).not.toHaveBeenCalled();
  });

  it("bloquea DeepSeek en contexto sensible aunque este configurado", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    process.env.DEEPSEEK_API_KEY = "sk-deepseek-test";
    anthropicCreateMock.mockRejectedValue(new Error("rate limit"));

    const { generateJsonWithFallback } = await loadProvider();
    await expect(generateJsonWithFallback("system", "user")).rejects.toThrow(/bloqueados por política/);
    expect(openaiCreateMock).not.toHaveBeenCalled();
  });

  it("usa Kimi antes de DeepSeek solo para tareas anonimizadas de bajo riesgo", async () => {
    process.env.KIMI_API_KEY = "sk-kimi-test";
    process.env.DEEPSEEK_API_KEY = "sk-deepseek-test";
    openaiCreateMock.mockImplementation(async ({ baseURL }) => {
      if (baseURL === "https://api.moonshot.ai/v1") {
        return { choices: [{ message: { content: "{\"ok\":\"kimi\"}" } }], usage: { prompt_tokens: 10, completion_tokens: 5 } };
      }
      throw new Error("baseURL inesperado en el test: " + baseURL);
    });

    const { generateJsonWithFallback, resolveJsonProviderPolicy } = await loadProvider();
    const policy = resolveJsonProviderPolicy({ dataRisk: "low", anonymized: true, taskType: "classification" });
    const result = await generateJsonWithFallback("system", "user", { dataRisk: "low", anonymized: true, taskType: "classification" });

    expect(policy.restrictedAllowed).toBe(true);
    expect(result.provider).toBe("kimi");
    expect(result.providerPolicy).toMatchObject({ tier: "restricted", riskProfile: "low-risk-anonymized-only" });
    expect(result.text).toBe("{\"ok\":\"kimi\"}");
  });

  it("cae a DeepSeek para bajo riesgo anonimizado si Kimi falla", async () => {
    process.env.KIMI_API_KEY = "sk-kimi-test";
    process.env.DEEPSEEK_API_KEY = "sk-deepseek-test";
    openaiCreateMock.mockImplementation(async ({ baseURL }) => {
      if (baseURL === "https://api.moonshot.ai/v1") throw new Error("kimi caido");
      if (baseURL === "https://api.deepseek.com/v1") {
        return { choices: [{ message: { content: "{\"ok\":\"deepseek\"}" } }], usage: { prompt_tokens: 8, completion_tokens: 4 } };
      }
      throw new Error("baseURL inesperado: " + baseURL);
    });

    const { generateJsonWithFallback } = await loadProvider();
    const result = await generateJsonWithFallback("system", "user", { dataRisk: "low", anonymized: true, taskType: "schema-normalization" });

    expect(result.provider).toBe("deepseek");
    expect(result.attemptedBeforeSuccess.map((a) => a.provider)).toEqual(["kimi"]);
  });

  it("prueba NVIDIA solo en bajo riesgo anonimizado si Kimi y DeepSeek fallan", async () => {
    process.env.KIMI_API_KEY = "sk-kimi-test";
    process.env.DEEPSEEK_API_KEY = "sk-deepseek-test";
    process.env.NVIDIA_API_KEY = "nvidia-test";
    openaiCreateMock.mockImplementation(async ({ baseURL }) => {
      if (baseURL === "https://api.moonshot.ai/v1") throw new Error("kimi caido");
      if (baseURL === "https://api.deepseek.com/v1") throw new Error("deepseek caido");
      if (baseURL === "https://integrate.api.nvidia.com/v1") {
        return { choices: [{ message: { content: "{\"ok\":\"nvidia\"}" } }], usage: { prompt_tokens: 8, completion_tokens: 4 } };
      }
      throw new Error("baseURL inesperado: " + baseURL);
    });

    const { generateJsonWithFallback } = await loadProvider();
    const result = await generateJsonWithFallback("system", "user", { dataRisk: "low", anonymized: true, taskType: "provider-benchmark" });

    expect(result.provider).toBe("nvidia");
    expect(result.attemptedBeforeSuccess.map((a) => a.provider)).toEqual(["kimi", "deepseek"]);
  });

  it("lanza error honesto cuando todos los proveedores configurados fallan", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    anthropicCreateMock.mockRejectedValue(new Error("anthropic caido"));

    const { generateJsonWithFallback } = await loadProvider();
    await expect(generateJsonWithFallback("system", "user")).rejects.toThrow(/Todos los proveedores/);
  });

  it("lanza error honesto cuando ningun proveedor esta configurado", async () => {
    const { generateJsonWithFallback } = await loadProvider();
    await expect(generateJsonWithFallback("system", "user")).rejects.toThrow(/Ningún proveedor de IA está configurado/);
  });
});
