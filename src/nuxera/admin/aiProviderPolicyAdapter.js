import { useEffect, useState } from "react";
import { nuxeraAiProviderPolicyAPI } from "../../services/api";
import { warn } from "../../utils/logger";
import { pickLang } from "../../data/requisitosMinimos";

const LOCAL_AI_PROVIDER_POLICY = Object.freeze({
  source: "local-fallback",
  id: "nuxera-ai-provider-policy",
  status: "ai-provider-policy-unverified",
  sensitiveRuntimeReady: false,
  restrictedRuntimeReady: false,
  loading: false,
  error: null,
  providers: [
    { name: "anthropic", model: "claude-sonnet-4-6", tier: "primary", riskProfile: "sensitive-approved", configured: false, allowed: true },
    { name: "openai", model: "gpt-4o-mini", tier: "primary", riskProfile: "sensitive-approved", configured: false, allowed: true },
    { name: "kimi", model: "kimi-k3", tier: "restricted", riskProfile: "low-risk-anonymized-only", configured: false, allowed: false },
    { name: "deepseek", model: "deepseek-chat", tier: "restricted", riskProfile: "low-risk-anonymized-only", configured: false, allowed: false },
    { name: "nvidia", model: "meta/llama-3.1-8b-instruct", tier: "restricted", riskProfile: "low-risk-anonymized-only", configured: false, allowed: false },
  ],
  scenarios: [],
  summary: {
    totalProviders: 5,
    configured: 0,
    configuredPrimary: 0,
    configuredRestricted: 0,
    sensitiveAllowedConfigured: 0,
    sensitiveBlockedConfigured: 0,
    scenarioPathsAvailable: 0,
  },
  requiredEnv: ["ANTHROPIC_API_KEY or OPENAI_API_KEY", "KIMI_API_KEY optional", "DEEPSEEK_API_KEY optional"],
  guardrails: ["Local fallback; no confirma llaves, proveedores ni runtime IA."],
});

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

export function normalizeNuxeraAiProviderPolicyResponse(response, language = "es") {
  const payload = response?.aiProviderPolicy || response || null;

  if (!payload || typeof payload !== "object") {
    return {
      ...LOCAL_AI_PROVIDER_POLICY,
      error: "nuxera-ai-provider-policy-missing",
    };
  }

  const sensitiveReady = Boolean(payload.sensitiveRuntimeReady);
  const providers = asArray(payload.providers).length ? asArray(payload.providers) : LOCAL_AI_PROVIDER_POLICY.providers;

  return {
    ...LOCAL_AI_PROVIDER_POLICY,
    source: sensitiveReady ? "remote-primary-ready" : "remote-primary-required",
    label: sensitiveReady
      ? pickLang({ es: "IA sensible con proveedor primario", en: "Sensitive AI has primary provider" }, language)
      : pickLang({ es: "IA sensible requiere proveedor primario", en: "Sensitive AI requires primary provider" }, language),
    id: payload.id || LOCAL_AI_PROVIDER_POLICY.id,
    status: payload.status || LOCAL_AI_PROVIDER_POLICY.status,
    sensitiveRuntimeReady: sensitiveReady,
    restrictedRuntimeReady: Boolean(payload.restrictedRuntimeReady),
    loading: false,
    error: null,
    providers,
    scenarios: asArray(payload.scenarios),
    summary: {
      ...LOCAL_AI_PROVIDER_POLICY.summary,
      ...asObject(payload.summary),
    },
    requiredEnv: asArray(payload.requiredEnv),
    guardrails: [
      ...asArray(payload.guardrails),
      ...asArray(response?.guardrails),
    ].filter(Boolean),
  };
}

export function mergeAiProviderPolicyWithConsole(consoleState, aiPolicy = LOCAL_AI_PROVIDER_POLICY, language = "es") {
  const normalizedPolicy = { ...LOCAL_AI_PROVIDER_POLICY, ...asObject(aiPolicy) };
  const healthSignal = {
    id: "ai-provider-policy",
    label: pickLang({ es: "Política de proveedores IA", en: "AI provider policy" }, language),
    status: normalizedPolicy.status,
    severity: normalizedPolicy.sensitiveRuntimeReady ? "low" : "high",
    signal: pickLang(
      { es: `${normalizedPolicy.summary.configuredPrimary} primarios configurados; ${normalizedPolicy.summary.configuredRestricted} secundarios restringidos.`, en: `${normalizedPolicy.summary.configuredPrimary} primary configured; ${normalizedPolicy.summary.configuredRestricted} restricted secondary.` },
      language
    ),
    nextAction: normalizedPolicy.sensitiveRuntimeReady
      ? pickLang({ es: "Mantener secundarios solo para tareas anonimizadas de bajo riesgo.", en: "Keep secondary providers only for low-risk anonymized tasks." }, language)
      : pickLang({ es: "Configurar ANTHROPIC_API_KEY u OPENAI_API_KEY antes de revisión documental sensible.", en: "Configure ANTHROPIC_API_KEY or OPENAI_API_KEY before sensitive document review." }, language),
  };
  const action = {
    id: "ai-provider-primary-required",
    domain: pickLang({ es: "IA y agentes", en: "AI & agents" }, language),
    priority: "critical-path",
    status: normalizedPolicy.sensitiveRuntimeReady ? "ai-provider-ready" : "ai-provider-primary-required",
    owner: "AI/Ops",
    action: healthSignal.nextAction,
    source: "ai-provider-policy",
    guardrail: pickLang({ es: "Acción humana; la consola no guarda llaves ni llama modelos.", en: "Human action; console does not store keys or call models." }, language),
  };

  return {
    ...consoleState,
    aiProviderPolicy: normalizedPolicy,
    adminHealthSignals: [
      ...consoleState.adminHealthSignals.filter((signal) => signal.id !== healthSignal.id),
      healthSignal,
    ],
    adminActionQueue: [
      action,
      ...consoleState.adminActionQueue.filter((item) => item.id !== action.id),
    ],
    summary: {
      ...consoleState.summary,
      aiProvidersConfigured: normalizedPolicy.summary.configured,
      aiPrimaryProvidersConfigured: normalizedPolicy.summary.configuredPrimary,
      aiRestrictedProvidersConfigured: normalizedPolicy.summary.configuredRestricted,
      aiScenarioPathsAvailable: normalizedPolicy.summary.scenarioPathsAvailable,
    },
    policies: [
      ...consoleState.policies,
      pickLang({ es: "OpenAI/Anthropic quedan como primarios; Kimi/DeepSeek/NVIDIA solo bajo riesgo anonimizado.", en: "OpenAI/Anthropic remain primary; Kimi/DeepSeek/NVIDIA only low-risk anonymized." }, language),
    ],
  };
}

export function useAiProviderPolicy({ enabled = true, language = "es" } = {}) {
  const [state, setState] = useState(LOCAL_AI_PROVIDER_POLICY);

  useEffect(() => {
    let alive = true;

    if (!enabled) {
      setState(LOCAL_AI_PROVIDER_POLICY);
      return () => { alive = false; };
    }

    setState((current) => ({ ...current, loading: true, error: null }));
    nuxeraAiProviderPolicyAPI.getPolicy()
      .then(({ data }) => {
        if (!alive) return;
        setState(normalizeNuxeraAiProviderPolicyResponse(data, language));
      })
      .catch((error) => {
        warn("NUXERA", "AI provider policy unavailable", error?.message || error);
        if (!alive) return;
        setState({
          ...LOCAL_AI_PROVIDER_POLICY,
          loading: false,
          error: error?.response?.data?.code || error?.message || "nuxera-ai-provider-policy-unavailable",
        });
      });

    return () => { alive = false; };
  }, [enabled, language]);

  return state;
}
