// ============================================
// NEXUS PLATFORM - PRICING & SUBSCRIPTION SERVICE
// Stripe Integration for SaaS monetization
// ============================================

import { apiLogger } from '../utils/logger';

// Plan definitions
export const PLANS = {
  STARTER: {
    id: 'plan_starter',
    name: {
      es: 'Inicial',
      en: 'Starter'
    },
    description: {
      es: 'Para startups y PyMEs comenzando su journey de compliance',
      en: 'For startups and SMEs starting their compliance journey'
    },
    price: {
      MXN: 5980, // ~$299 USD
      USD: 299
    },
    interval: 'month',
    features: [
      {
        key: 'expedientes',
        es: '5 expedientes activos',
        en: '5 active files',
        included: true
      },
      {
        key: 'usuarios',
        es: '3 usuarios',
        en: '3 users',
        included: true
      },
      {
        key: 'documentos',
        es: '100 documentos/mes',
        en: '100 documents/month',
        included: true
      },
      {
        key: 'storage',
        es: '2 GB almacenamiento',
        en: '2 GB storage',
        included: true
      },
      {
        key: 'ai_triage',
        es: 'Triaje IA básico',
        en: 'Basic AI triage',
        included: true
      },
      {
        key: 'ai_forensic',
        es: 'Análisis forense IA',
        en: 'AI forensic analysis',
        included: false
      },
      {
        key: 'kyb',
        es: 'Validación KYB/KYC',
        en: 'KYB/KYC validation',
        included: false
      },
      {
        key: 'biometricos',
        es: 'Biométricos',
        en: 'Biometrics',
        included: false
      },
      {
        key: 'data_room',
        es: 'Data room compartido',
        en: 'Shared data room',
        included: true
      },
      {
        key: 'api_access',
        es: 'API access',
        en: 'API access',
        included: false
      },
      {
        key: 'soporte',
        es: 'Email soporte',
        en: 'Email support',
        included: true
      },
      {
        key: 'sla',
        es: 'SLA 99.5%',
        en: '99.5% SLA',
        included: false
      }
    ],
    limits: {
      maxExpedientes: 5,
      maxUsuarios: 3,
      maxDocumentosMes: 100,
      maxStorageGB: 2
    }
  },
  GROWTH: {
    id: 'plan_growth',
    name: {
      es: 'Crecimiento',
      en: 'Growth'
    },
    description: {
      es: 'Para empresas en crecimiento con necesidades de compliance más robustas',
      en: 'For growing companies with more robust compliance needs'
    },
    price: {
      MXN: 13980, // ~$699 USD
      USD: 699
    },
    interval: 'month',
    popular: true,
    features: [
      {
        key: 'expedientes',
        es: '25 expedientes activos',
        en: '25 active files',
        included: true
      },
      {
        key: 'usuarios',
        es: '10 usuarios',
        en: '10 users',
        included: true
      },
      {
        key: 'documentos',
        es: '500 documentos/mes',
        en: '500 documents/month',
        included: true
      },
      {
        key: 'storage',
        es: '10 GB almacenamiento',
        en: '10 GB storage',
        included: true
      },
      {
        key: 'ai_triage',
        es: 'Triaje IA avanzado',
        en: 'Advanced AI triage',
        included: true
      },
      {
        key: 'ai_forensic',
        es: 'Análisis forense IA',
        en: 'AI forensic analysis',
        included: true
      },
      {
        key: 'kyb',
        es: 'Validación KYB/KYC básica',
        en: 'Basic KYB/KYC validation',
        included: true
      },
      {
        key: 'biometricos',
        es: 'Biométricos',
        en: 'Biometrics',
        included: false
      },
      {
        key: 'data_room',
        es: 'Data room compartido',
        en: 'Shared data room',
        included: true
      },
      {
        key: 'api_access',
        es: 'API access básico',
        en: 'Basic API access',
        included: true
      },
      {
        key: 'soporte',
        es: 'Email + Chat优先级',
        en: 'Email + Priority chat',
        included: true
      },
      {
        key: 'sla',
        es: 'SLA 99.5%',
        en: '99.5% SLA',
        included: true
      }
    ],
    limits: {
      maxExpedientes: 25,
      maxUsuarios: 10,
      maxDocumentosMes: 500,
      maxStorageGB: 10
    }
  },
  ENTERPRISE: {
    id: 'plan_enterprise',
    name: {
      es: 'Empresarial',
      en: 'Enterprise'
    },
    description: {
      es: 'Para instituciones financieras y fondos con necesidades de compliance enterprise',
      en: 'For financial institutions and funds with enterprise compliance needs'
    },
    price: {
      MXN: 17980, // ~$899 USD
      USD: 899
    },
    interval: 'month',
    features: [
      {
        key: 'expedientes',
        es: 'Expedientes ilimitados',
        en: 'Unlimited files',
        included: true
      },
      {
        key: 'usuarios',
        es: 'Usuarios ilimitados',
        en: 'Unlimited users',
        included: true
      },
      {
        key: 'documentos',
        es: 'Documentos ilimitados',
        en: 'Unlimited documents',
        included: true
      },
      {
        key: 'storage',
        es: '100 GB almacenamiento',
        en: '100 GB storage',
        included: true
      },
      {
        key: 'ai_triage',
        es: 'Triaje IA enterprise',
        en: 'Enterprise AI triage',
        included: true
      },
      {
        key: 'ai_forensic',
        es: 'Análisis forense IA completo',
        en: 'Full AI forensic analysis',
        included: true
      },
      {
        key: 'kyb',
        es: 'Validación KYB/KYC completa',
        en: 'Full KYB/KYC validation',
        included: true
      },
      {
        key: 'biometricos',
        es: 'Biométricos avanzados',
        en: 'Advanced biometrics',
        included: true
      },
      {
        key: 'data_room',
        es: 'Data room con branding',
        en: 'White-label data room',
        included: true
      },
      {
        key: 'api_access',
        es: 'API access completo',
        en: 'Full API access',
        included: true
      },
      {
        key: 'soporte',
        es: 'Soporte dedicado 24/7',
        en: 'Dedicated 24/7 support',
        included: true
      },
      {
        key: 'sla',
        es: 'SLA 99.9%',
        en: '99.9% SLA',
        included: true
      },
      {
        key: 'custom',
        es: 'Integraciones custom',
        en: 'Custom integrations',
        included: true
      },
      {
        key: 'onboarding',
        es: 'Onboarding dedicado',
        en: 'Dedicated onboarding',
        included: true
      }
    ],
    limits: {
      maxExpedientes: -1, // unlimited
      maxUsuarios: -1,
      maxDocumentosMes: -1,
      maxStorageGB: 100
    }
  }
};

// Subscription status
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELED: 'canceled',
  TRIALING: 'trialing',
  INCOMPLETE: 'incomplete'
};

// Helper to get plan by ID
export function getPlanById(planId) {
  const plans = Object.values(PLANS);
  return plans.find(p => p.id === planId);
}

// Get localized plan info
export function getPlanInfo(plan, language = 'es') {
  if (!plan) return null;
  
  return {
    id: plan.id,
    name: plan.name[language] || plan.name.es,
    description: plan.description[language] || plan.description.es,
    price: plan.price,
    interval: plan.interval,
    popular: plan.popular || false,
    features: plan.features.map(f => ({
      ...f,
      text: f[language] || f.es
    }))
  };
}

// Check if feature is included in plan
export function hasFeature(plan, featureKey) {
  if (!plan) return false;
  const feature = plan.features.find(f => f.key === featureKey);
  return feature?.included || false;
}

// Check if user is within plan limits
export function checkLimits(plan, usage) {
  const limits = plan?.limits || {};
  const violations = [];

  if (limits.maxExpedientes > 0 && usage.expedientes > limits.maxExpedientes) {
    violations.push({
      type: 'expedientes',
      used: usage.expedientes,
      limit: limits.maxExpedientes,
      message: 'Has alcanzado el límite de expedientes para tu plan'
    });
  }

  if (limits.maxUsuarios > 0 && usage.usuarios > limits.maxUsuarios) {
    violations.push({
      type: 'usuarios',
      used: usage.usuarios,
      limit: limits.maxUsuarios,
      message: 'Has alcanzado el límite de usuarios para tu plan'
    });
  }

  if (limits.maxDocumentosMes > 0 && usage.documentosMes > limits.maxDocumentosMes) {
    violations.push({
      type: 'documentos',
      used: usage.documentosMes,
      limit: limits.maxDocumentosMes,
      message: 'Has alcanzado el límite de documentos para este mes'
    });
  }

  return {
    withinLimits: violations.length === 0,
    violations
  };
}

// Get upgrade recommendation
export function getUpgradeRecommendation(currentPlan, usage, language = 'es') {
  const check = checkLimits(currentPlan, usage);
  
  if (check.withinLimits) return null;
  
  // Find next plan with higher limits
  const plans = Object.values(PLANS);
  const currentPlanIndex = plans.findIndex(p => p.id === currentPlan?.id);
  
  if (currentPlanIndex < plans.length - 1) {
    const nextPlan = plans[currentPlanIndex + 1];
    return {
      plan: getPlanInfo(nextPlan, language),
      reasons: check.violations.map(v => v.message)
    };
  }
  
  return null;
}

// Simulate subscription check (demo mode)
export async function checkSubscription(userId) {
  apiLogger.request('Subscription', 'Checking subscription for user:', userId);
  
  // Demo mode: always return Growth plan
  const demoSubscription = {
    id: 'sub_demo_123',
    status: SUBSCRIPTION_STATUS.ACTIVE,
    plan: PLANS.GROWTH,
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    cancelAtPeriodEnd: false,
    trialEnd: null
  };
  
  return demoSubscription;
}

// Simulate upgrade (demo mode)
export async function upgradeSubscription(userId, newPlanId) {
  apiLogger.request('Subscription', `Upgrading user ${userId} to plan ${newPlanId}`);
  
  const newPlan = getPlanById(newPlanId);
  if (!newPlan) {
    throw new Error('Plan no encontrado');
  }
  
  // In demo mode, just return success
  return {
    success: true,
    subscription: {
      id: 'sub_demo_upgraded',
      status: SUBSCRIPTION_STATUS.ACTIVE,
      plan: newPlan,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  };
}

// Get pricing for display (handles currency conversion)
export function getDisplayPrice(plan, currency = 'USD') {
  const price = plan.price[currency.toUpperCase()] || plan.price.USD;
  const symbol = currency === 'MXN' ? '$' : '$';
  const formatted = `${symbol}${price.toLocaleString()}`;
  
  return {
    amount: price,
    formatted,
    currency,
    interval: plan.interval
  };
}

export default {
  PLANS,
  SUBSCRIPTION_STATUS,
  getPlanById,
  getPlanInfo,
  hasFeature,
  checkLimits,
  getUpgradeRecommendation,
  checkSubscription,
  upgradeSubscription,
  getDisplayPrice
};