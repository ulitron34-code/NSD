import { resolveJsonProviderPolicy } from './aiJsonProvider.js';

const POLICY_SCENARIOS = Object.freeze([
  {
    id: 'sensitive-document-review',
    label: 'Sensitive document review',
    options: { dataRisk: 'sensitive', anonymized: false, taskType: 'document-review' },
    expectedPrimaryOnly: true
  },
  {
    id: 'low-risk-classification',
    label: 'Low-risk anonymized classification',
    options: { dataRisk: 'low', anonymized: true, taskType: 'classification' },
    expectedPrimaryOnly: false
  },
  {
    id: 'low-risk-routing',
    label: 'Low-risk anonymized routing',
    options: { dataRisk: 'low', anonymized: true, taskType: 'routing' },
    expectedPrimaryOnly: false
  }
]);

const PROVIDER_COST_HINTS = Object.freeze({
  anthropic: { inputPerMillion: 3, outputPerMillion: 15, posture: 'premium-primary' },
  openai: { inputPerMillion: 0.15, outputPerMillion: 0.6, posture: 'efficient-primary' },
  kimi: { inputPerMillion: 3, outputPerMillion: 15, posture: 'restricted-secondary' },
  deepseek: { inputPerMillion: 0.14, outputPerMillion: 0.28, posture: 'low-cost-restricted-secondary' },
  nvidia: { inputPerMillion: 0.2, outputPerMillion: 0.2, posture: 'restricted-extraction-secondary' }
});

function estimatePilotCost(costHint) {
  if (!costHint) return null;
  const inputTokens = 250000;
  const outputTokens = 75000;
  const cost = (inputTokens * (costHint.inputPerMillion / 1000000)) + (outputTokens * (costHint.outputPerMillion / 1000000));
  return Number(cost.toFixed(4));
}

function summarizeProviders(policy) {
  const providers = policy.providers.map((provider) => ({
    name: provider.name,
    model: provider.model,
    tier: provider.tier,
    riskProfile: provider.riskProfile,
    configured: provider.configured,
    allowed: provider.allowed,
    blockedReason: provider.blockedReason,
    cost: {
      ...PROVIDER_COST_HINTS[provider.name],
      estimatedPilotUsd: estimatePilotCost(PROVIDER_COST_HINTS[provider.name])
    }
  }));

  return {
    providers,
    configured: providers.filter((provider) => provider.configured).length,
    configuredPrimary: providers.filter((provider) => provider.configured && provider.tier === 'primary').length,
    configuredRestricted: providers.filter((provider) => provider.configured && provider.tier === 'restricted').length,
    allowedConfigured: providers.filter((provider) => provider.configured && provider.allowed).length,
    blockedConfigured: providers.filter((provider) => provider.configured && !provider.allowed).length
  };
}

export function getNuxeraAiProviderPolicy() {
  const sensitivePolicy = resolveJsonProviderPolicy({
    dataRisk: 'sensitive',
    anonymized: false,
    taskType: 'document-review'
  });
  const summary = summarizeProviders(sensitivePolicy);
  const scenarios = POLICY_SCENARIOS.map((scenario) => {
    const policy = resolveJsonProviderPolicy(scenario.options);
    const scenarioSummary = summarizeProviders(policy);

    return {
      id: scenario.id,
      label: scenario.label,
      dataRisk: policy.dataRisk,
      anonymized: policy.anonymized,
      taskType: policy.requestedTaskType,
      restrictedAllowed: policy.restrictedAllowed,
      expectedPrimaryOnly: scenario.expectedPrimaryOnly,
      allowedProviders: scenarioSummary.providers
        .filter((provider) => provider.configured && provider.allowed)
        .map((provider) => provider.name),
      allowedRestrictedProviders: scenarioSummary.providers
        .filter((provider) => provider.configured && provider.allowed && provider.tier === 'restricted')
        .map((provider) => provider.name),
      blockedProviders: scenarioSummary.providers
        .filter((provider) => provider.configured && !provider.allowed)
        .map((provider) => provider.name),
      status: scenarioSummary.allowedConfigured > 0 ? 'provider-path-available' : 'provider-path-blocked'
    };
  });

  return {
    id: 'nuxera-ai-provider-policy',
    status: summary.configuredPrimary > 0 ? 'primary-provider-ready' : 'primary-provider-required',
    sensitiveRuntimeReady: summary.configuredPrimary > 0,
    restrictedRuntimeReady: scenarios.some((scenario) => scenario.restrictedAllowed && scenario.allowedRestrictedProviders.length > 0),
    providers: summary.providers,
    scenarios,
    summary: {
      totalProviders: summary.providers.length,
      configured: summary.configured,
      configuredPrimary: summary.configuredPrimary,
      configuredRestricted: summary.configuredRestricted,
      sensitiveAllowedConfigured: summary.allowedConfigured,
      sensitiveBlockedConfigured: summary.blockedConfigured,
      scenarioPathsAvailable: scenarios.filter((scenario) => scenario.status === 'provider-path-available').length,
      estimatedPilotUsd: Number(summary.providers.reduce((total, provider) => total + (provider.configured && provider.allowed ? provider.cost.estimatedPilotUsd || 0 : 0), 0).toFixed(4))
    },
    usageAssumptions: { pilotInputTokens: 250000, pilotOutputTokens: 75000, currency: 'USD', billing: 'estimate-only' },
    requiredEnv: ['ANTHROPIC_API_KEY or OPENAI_API_KEY for sensitive review', 'KIMI_API_KEY optional for low-risk anonymized tasks', 'DEEPSEEK_API_KEY optional secondary fallback'],
    guardrails: [
      'Provider policy is read-only and never exposes API key values.',
      'Anthropic/OpenAI remain the only providers allowed for sensitive document review.',
      'Kimi/DeepSeek/NVIDIA remain restricted to low-risk anonymized tasks with explicit taskType allow-list.',
      'No provider call, notification send, SQL change or production write is performed.'
    ]
  };
}
