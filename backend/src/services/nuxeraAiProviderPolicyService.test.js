import { beforeEach, describe, expect, it, vi } from 'vitest';

async function loadService() {
  vi.resetModules();
  return import('./nuxeraAiProviderPolicyService.js');
}

function clearProviderKeys() {
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.OPENAI_API_KEY;
  delete process.env.KIMI_API_KEY;
  delete process.env.DEEPSEEK_API_KEY;
  delete process.env.NVIDIA_API_KEY;
}

describe('nuxeraAiProviderPolicyService', () => {
  beforeEach(() => {
    clearProviderKeys();
  });

  it('requires a primary provider for sensitive document review', async () => {
    process.env.KIMI_API_KEY = 'sk-kimi-test';
    process.env.DEEPSEEK_API_KEY = 'sk-deepseek-test';

    const { getNuxeraAiProviderPolicy } = await loadService();
    const policy = getNuxeraAiProviderPolicy();

    expect(policy.status).toBe('primary-provider-required');
    expect(policy.sensitiveRuntimeReady).toBe(false);
    expect(policy.providers.find((provider) => provider.name === 'kimi')).toMatchObject({
      tier: 'restricted',
      configured: true,
      allowed: false,
      blockedReason: 'restricted-provider-requires-low-risk-anonymized-task'
    });
    expect(JSON.stringify(policy)).not.toContain('sk-kimi-test');
  });

  it('exposes Kimi before DeepSeek for low-risk anonymized paths', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    process.env.KIMI_API_KEY = 'sk-kimi-test';
    process.env.DEEPSEEK_API_KEY = 'sk-deepseek-test';

    const { getNuxeraAiProviderPolicy } = await loadService();
    const policy = getNuxeraAiProviderPolicy();
    const lowRisk = policy.scenarios.find((scenario) => scenario.id === 'low-risk-classification');

    expect(policy.status).toBe('primary-provider-ready');
    expect(policy.sensitiveRuntimeReady).toBe(true);
    expect(policy.restrictedRuntimeReady).toBe(true);
    expect(lowRisk.allowedProviders).toEqual(['anthropic', 'kimi', 'deepseek']);
    expect(policy.providers.map((provider) => provider.name)).toEqual(['anthropic', 'openai', 'kimi', 'deepseek', 'nvidia']);
  });
});