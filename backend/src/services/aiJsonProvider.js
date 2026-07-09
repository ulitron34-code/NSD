// Estrategia multi-proveedor IA (sección 23.2 del plan). Antes, el pipeline
// real de evaluación de documentos (readinessRubricAgent.js) dependía 100% de
// Anthropic: si fallaba (rate limit, timeout, error de red) caía directo a la
// heurística de reglas sin intentar otro proveedor real. NVIDIA NIM y
// DeepSeek ya estaban aprovisionados en Render (aiEngine.js los usa para el
// checklist demo/localStorage) pero nunca se ofrecían como respaldo al
// pipeline real por documento. Este módulo intenta, en orden: Anthropic ->
// OpenAI (si está configurado) -> DeepSeek -> NVIDIA NIM. Solo si TODOS
// fallan o ninguno está configurado, el llamador debe caer a su propia
// heurística -- este módulo nunca inventa una evaluación ni reintenta contra
// el mismo proveedor que ya falló.
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
const NVIDIA_KEY = process.env.NVIDIA_API_KEY;

const anthropic = ANTHROPIC_KEY ? new Anthropic({ apiKey: ANTHROPIC_KEY }) : null;
const openai = OPENAI_KEY ? new OpenAI({ apiKey: OPENAI_KEY }) : null;
// DeepSeek y NVIDIA NIM exponen API compatible con OpenAI.
const deepseek = DEEPSEEK_KEY ? new OpenAI({ apiKey: DEEPSEEK_KEY, baseURL: 'https://api.deepseek.com/v1' }) : null;
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
  { name: 'anthropic', model: 'claude-sonnet-4-6', enabled: () => Boolean(anthropic), call: (s, u, t) => callAnthropic(s, u, t) },
  { name: 'openai', model: 'gpt-4o-mini', enabled: () => Boolean(openai), call: (s, u) => callOpenAiCompatible(openai, 'gpt-4o-mini', s, u) },
  { name: 'deepseek', model: 'deepseek-chat', enabled: () => Boolean(deepseek), call: (s, u) => callOpenAiCompatible(deepseek, 'deepseek-chat', s, u) },
  { name: 'nvidia', model: 'meta/llama-3.1-8b-instruct', enabled: () => Boolean(nvidia), call: (s, u) => callOpenAiCompatible(nvidia, 'meta/llama-3.1-8b-instruct', s, u) }
];

export function hasAnyJsonProvider() {
  return PROVIDER_CHAIN.some((p) => p.enabled());
}

// Precio aproximado por 1M de tokens (entrada/salida), solo para estimar
// costo en reportes -- no es facturación real, es orientativo (sección 21.3
// "costos por evaluación" / sección 30 "costo IA por expediente" del plan).
const PRICING_PER_MILLION_TOKENS = {
  anthropic: { input: 3, output: 15 },
  openai: { input: 0.15, output: 0.6 },
  deepseek: { input: 0.27, output: 1.1 },
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
export async function generateJsonWithFallback(systemPrompt, userContent, { maxTokens = 1400 } = {}) {
  const attempted = [];
  for (const provider of PROVIDER_CHAIN) {
    if (!provider.enabled()) continue;
    try {
      const { text, usage } = await provider.call(systemPrompt, userContent, maxTokens);
      return {
        text,
        provider: provider.name,
        model: provider.model,
        usage,
        costUsd: estimateCostUsd(provider.name, usage),
        attemptedBeforeSuccess: attempted
      };
    } catch (err) {
      attempted.push({ provider: provider.name, error: err.message });
      console.warn(`[aiJsonProvider] Proveedor "${provider.name}" falló, probando el siguiente disponible:`, err.message);
    }
  }

  const error = new Error(attempted.length
    ? `Todos los proveedores de IA configurados fallaron (${attempted.map((a) => a.provider).join(', ')}).`
    : 'Ningún proveedor de IA está configurado (ANTHROPIC_API_KEY/OPENAI_API_KEY/DEEPSEEK_API_KEY/NVIDIA_API_KEY).');
  error.attempted = attempted;
  throw error;
}
