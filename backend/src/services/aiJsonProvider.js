// Estrategia multi-proveedor IA (sección 23.2 del plan). Antes, el pipeline
// real de evaluación de documentos (readinessRubricAgent.js) dependía 100% de
// Anthropic: si fallaba (rate limit, timeout, error de red) caía directo a la
// heurística de reglas sin intentar otro proveedor real. NVIDIA NIM y
// DeepSeek ya estaban aprovisionados en Render (aiEngine.js los usa para el
// checklist demo/localStorage) pero nunca se ofrecían como respaldo al
// pipeline real por documento. Este módulo intenta, en orden: Anthropic ->
// OpenAI (si está configurado) -> Kimi/DeepSeek solo para bajo riesgo anonimizado -> NVIDIA NIM. Solo si TODOS
// fallan o ninguno está configurado, el llamador debe caer a su propia
// heurística -- este módulo nunca inventa una evaluación ni reintenta contra
// el mismo proveedor que ya falló.
//
// POLÍTICA DE DATOS SENSIBLES (sección 29.1 del plan: "No enviar datos
// sensibles a proveedores IA sin política definida") -- estado real, sin
// inventar cumplimiento: el texto completo extraído de cada documento
// (identificaciones, RFC, estados financieros, beneficiarios controladores)
// SÍ se envía tal cual a estos proveedores vía su API -- es funcionalmente
// necesario para que el agente extraiga RFC/montos/nombres y haga el
// screening KYC que el producto promete (redactarlo con regex antes de
// enviarlo rompería esa función y podría además dejar pasar PII no
// detectada, dando una falsa sensación de protección). Esto NO se resuelve
// con código: es una decisión de producto/legal pendiente del dueño del
// negocio -- verificar y documentar el acuerdo de tratamiento de datos
// vigente con cada proveedor (Anthropic/OpenAI/Kimi/DeepSeek/NVIDIA) antes de
// procesar documentos reales de clientes en producción. Mientras esa
// verificación no se haga, tratar cualquier documento de prueba como si
// fuera a quedar expuesto al proveedor de IA correspondiente.
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
const KIMI_KEY = process.env.KIMI_API_KEY;
const NVIDIA_KEY = process.env.NVIDIA_API_KEY;

const anthropic = ANTHROPIC_KEY ? new Anthropic({ apiKey: ANTHROPIC_KEY }) : null;
const openai = OPENAI_KEY ? new OpenAI({ apiKey: OPENAI_KEY }) : null;
// DeepSeek y NVIDIA NIM exponen API compatible con OpenAI.
const deepseek = DEEPSEEK_KEY ? new OpenAI({ apiKey: DEEPSEEK_KEY, baseURL: 'https://api.deepseek.com/v1' }) : null;
const kimi = KIMI_KEY ? new OpenAI({ apiKey: KIMI_KEY, baseURL: process.env.KIMI_BASE_URL || 'https://api.moonshot.ai/v1' }) : null;
const nvidia = NVIDIA_KEY ? new OpenAI({ apiKey: NVIDIA_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' }) : null;

async function callAnthropic(systemPrompt, userContent, maxTokens) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }]
  });
  const usage = response.usage
    ? { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens }
    : null;
  return { text: response.content[0].text, usage };
}

async function callOpenAiCompatible(client, model, systemPrompt, userContent) {
  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ],
    response_format: { type: 'json_object' }
  });
  const usage = completion.usage
    ? { inputTokens: completion.usage.prompt_tokens, outputTokens: completion.usage.completion_tokens }
    : null;
  return { text: completion.choices[0].message.content, usage };
}

const PROVIDER_CHAIN = [
  { name: "anthropic", tier: "primary", riskProfile: "sensitive-approved", model: "claude-sonnet-4-6", enabled: () => Boolean(anthropic), call: (s, u, t) => callAnthropic(s, u, t) },
  { name: "openai", tier: "primary", riskProfile: "sensitive-approved", model: process.env.OPENAI_JSON_MODEL || "gpt-4o-mini", enabled: () => Boolean(openai), call: (s, u) => callOpenAiCompatible(openai, process.env.OPENAI_JSON_MODEL || "gpt-4o-mini", s, u) },
  { name: "kimi", tier: "restricted", riskProfile: "low-risk-anonymized-only", model: process.env.KIMI_JSON_MODEL || "kimi-k3", enabled: () => Boolean(kimi), call: (s, u) => callOpenAiCompatible(kimi, process.env.KIMI_JSON_MODEL || "kimi-k3", s, u) },
  { name: "deepseek", tier: "restricted", riskProfile: "low-risk-anonymized-only", model: process.env.DEEPSEEK_JSON_MODEL || "deepseek-chat", enabled: () => Boolean(deepseek), call: (s, u) => callOpenAiCompatible(deepseek, process.env.DEEPSEEK_JSON_MODEL || "deepseek-chat", s, u) },
  { name: "nvidia", tier: "restricted", riskProfile: "low-risk-anonymized-only", model: "meta/llama-3.1-8b-instruct", enabled: () => Boolean(nvidia), call: (s, u) => callOpenAiCompatible(nvidia, "meta/llama-3.1-8b-instruct", s, u) }
];

const LOW_RISK_TASKS = new Set([
  "classification",
  "routing",
  "schema-normalization",
  "public-research-summary",
  "template-drafting",
  "synthetic-test",
  "provider-benchmark"
]);

function isRestrictedProviderAllowed(options = {}) {
  return options.dataRisk === "low"
    && options.anonymized === true
    && LOW_RISK_TASKS.has(options.taskType || "");
}

export function resolveJsonProviderPolicy(options = {}) {
  const restrictedAllowed = isRestrictedProviderAllowed(options);
  const providers = PROVIDER_CHAIN.map((provider) => {
    const configured = provider.enabled();
    const allowed = provider.tier === "primary" || restrictedAllowed;
    return {
      name: provider.name,
      model: provider.model,
      tier: provider.tier,
      riskProfile: provider.riskProfile,
      configured,
      allowed,
      blockedReason: allowed ? null : "restricted-provider-requires-low-risk-anonymized-task"
    };
  });

  return {
    restrictedAllowed,
    requestedTaskType: options.taskType || null,
    dataRisk: options.dataRisk || "sensitive",
    anonymized: options.anonymized === true,
    providers,
    guardrails: [
      "Anthropic/OpenAI are the primary providers for sensitive document review.",
      "Kimi/DeepSeek/NVIDIA are restricted to low-risk anonymized tasks only.",
      "Provider routing must remain configurable; no agent should hardcode a secondary provider for sensitive data."
    ]
  };
}

export function hasAnyJsonProvider() {
  return PROVIDER_CHAIN.some((p) => p.enabled());
}

export function hasAnyAllowedJsonProvider(options = {}) {
  const policy = resolveJsonProviderPolicy(options);
  return policy.providers.some((provider) => provider.configured && provider.allowed);
}

// Precio aproximado por 1M de tokens (entrada/salida), solo para estimar
// costo en reportes -- no es facturación real, es orientativo (sección 21.3
// "costos por evaluación" / sección 30 "costo IA por expediente" del plan).
const PRICING_PER_MILLION_TOKENS = {
  anthropic: { input: 3, output: 15 },
  openai: { input: 0.15, output: 0.6 },
  kimi: { input: 3, output: 15 },
  deepseek: { input: 0.14, output: 0.28 },
  nvidia: { input: 0.2, output: 0.2 }
};

export function estimateCostUsd(provider, usage) {
  if (!usage) return null;
  const pricing = PRICING_PER_MILLION_TOKENS[provider];
  if (!pricing) return null;
  const cost = (usage.inputTokens || 0) * (pricing.input / 1_000_000)
    + (usage.outputTokens || 0) * (pricing.output / 1_000_000);
  return Number(cost.toFixed(6));
}

// Intenta cada proveedor configurado, en orden, con el mismo prompt. Devuelve
// el texto crudo de la respuesta (se espera JSON) junto con qué proveedor lo
// resolvió, para que el llamador guarde una bitácora honesta (sección 28) en
// vez de asumir siempre "Anthropic".
export async function generateJsonWithFallback(systemPrompt, userContent, options = {}) {
  const { maxTokens = 1400 } = options;
  const policy = resolveJsonProviderPolicy(options);
  const attempted = [];

  for (const provider of PROVIDER_CHAIN) {
    const providerPolicy = policy.providers.find((item) => item.name === provider.name);
    if (!provider.enabled()) continue;

    if (!providerPolicy?.allowed) {
      attempted.push({ provider: provider.name, skipped: true, reason: providerPolicy?.blockedReason });
      continue;
    }

    try {
      const { text, usage } = await provider.call(systemPrompt, userContent, maxTokens);
      return {
        text,
        provider: provider.name,
        model: provider.model,
        usage,
        costUsd: estimateCostUsd(provider.name, usage),
        attemptedBeforeSuccess: attempted,
        providerPolicy: { tier: provider.tier, riskProfile: provider.riskProfile }
      };
    } catch (err) {
      attempted.push({ provider: provider.name, error: err.message });
      console.warn(`[aiJsonProvider] Proveedor "${provider.name}" falló, probando el siguiente disponible:`, err.message);
    }
  }

  const configured = policy.providers.filter((provider) => provider.configured);
  const error = new Error(configured.length
    ? `Todos los proveedores de IA configurados fallaron o fueron bloqueados por política (${attempted.map((a) => a.provider).join(", ")}).`
    : "Ningún proveedor de IA está configurado (ANTHROPIC_API_KEY/OPENAI_API_KEY/KIMI_API_KEY/DEEPSEEK_API_KEY/NVIDIA_API_KEY).");
  error.attempted = attempted;
  error.providerPolicy = policy;
  throw error;
}
