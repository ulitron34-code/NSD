import { pickLang } from "../../data/requisitosMinimos";

const marketRowsSource = [
  {
    symbol: "MXN/USD",
    name: { es: "Peso mexicano / dolar", en: "Mexican peso / dollar" },
    assetClass: "FX",
    region: "MX",
    value: "18.42",
    change: "+0.18%",
    riskLevel: "medium",
    risk: { es: "Medio", en: "Medium" },
    driver: { es: "Sensibilidad a tasas, remesas y apetito global por riesgo.", en: "Sensitivity to rates, remittances and global risk appetite." },
  },
  {
    symbol: "TIIE 28",
    name: { es: "Tasa interbancaria de equilibrio", en: "Interbank equilibrium rate" },
    assetClass: "Rates",
    region: "MX",
    value: "10.25%",
    change: "0 pb",
    riskLevel: "low",
    risk: { es: "Bajo", en: "Low" },
    driver: { es: "Referencia para costo de deuda local y refinanciamiento.", en: "Reference for local debt cost and refinancing." },
  },
  {
    symbol: "S&P/BMV IPC",
    name: { es: "Indice accionario Mexico", en: "Mexico equity index" },
    assetClass: "Equity",
    region: "MX",
    value: "58,210",
    change: "-0.42%",
    riskLevel: "medium",
    risk: { es: "Medio", en: "Medium" },
    driver: { es: "Liquidez local, reportes corporativos y flujos internacionales.", en: "Local liquidity, corporate reports and international flows." },
  },
  {
    symbol: "WTI",
    name: { es: "Petroleo WTI", en: "WTI crude oil" },
    assetClass: "Commodity",
    region: "Global",
    value: "82.10",
    change: "+1.05%",
    riskLevel: "high",
    risk: { es: "Alto", en: "High" },
    driver: { es: "Volatilidad por inventarios, geopolitica y demanda industrial.", en: "Volatility from inventories, geopolitics and industrial demand." },
  },
];

const marketEventsSource = [
  {
    id: "banxico-rate-window",
    title: { es: "Ventana de decision monetaria", en: "Monetary decision window" },
    severity: "watch",
    impact: { es: "Puede mover costo financiero, refinanciamiento y sensibilidad de DSCR.", en: "Can move financial cost, refinancing and DSCR sensitivity." },
  },
  {
    id: "fx-volatility",
    title: { es: "Volatilidad cambiaria", en: "FX volatility" },
    severity: "caution",
    impact: { es: "Revisar exposicion USD en ingresos, deuda, CAPEX o proveedores.", en: "Review USD exposure in revenue, debt, CAPEX or suppliers." },
  },
  {
    id: "commodity-inputs",
    title: { es: "Presion en insumos", en: "Input cost pressure" },
    severity: "watch",
    impact: { es: "Afecta margenes en energia, transporte, agricultura e industria.", en: "Affects margins in energy, transportation, agriculture and industry." },
  },
];

export const MARKET_PROVIDER_STATES = {
  LOCAL_DELAYED: "local-delayed",
  DEGRADED: "degraded",
  UNLICENSED: "unlicensed",
};

const providerStatesSource = {
  [MARKET_PROVIDER_STATES.LOCAL_DELAYED]: {
    provider: "NUXERA local delayed provider",
    mode: "delayed-demo",
    health: "operational",
    label: { es: "Proveedor local disponible", en: "Local provider available" },
    delayLabel: { es: "Datos simulados / no tiempo real", en: "Simulated data / not real-time" },
    provenance: { es: "Dataset local controlado para diseno de experiencia y politicas de monitoreo.", en: "Controlled local dataset for experience design and monitoring policies." },
    asOf: "2026-07-16T12:00:00-06:00",
    realtimeAvailable: false,
    degradation: false,
    fallbackStrategy: { es: "Usar snapshot local versionado y mostrar procedencia antes de cada lectura.", en: "Use a versioned local snapshot and show provenance before each reading." },
  },
  [MARKET_PROVIDER_STATES.DEGRADED]: {
    provider: "NUXERA provider fallback",
    mode: "informative-fallback",
    health: "degraded",
    label: { es: "Proveedor degradado", en: "Degraded provider" },
    delayLabel: { es: "Fallback informativo / sin tiempo real", en: "Informative fallback / no real-time" },
    provenance: { es: "Snapshot local activado por falla o timeout del proveedor primario.", en: "Local snapshot activated by primary provider failure or timeout." },
    asOf: "2026-07-16T12:00:00-06:00",
    realtimeAvailable: false,
    degradation: true,
    fallbackStrategy: { es: "Mantener contexto local, bloquear alertas automaticas y solicitar revision humana.", en: "Keep local context, block automated alerts and request human review." },
  },
  [MARKET_PROVIDER_STATES.UNLICENSED]: {
    provider: "NUXERA license gate",
    mode: "license-required",
    health: "blocked",
    label: { es: "Proveedor no licenciado", en: "Unlicensed provider" },
    delayLabel: { es: "Licencia pendiente / no tiempo real", en: "License pending / not real-time" },
    provenance: { es: "No hay proveedor licenciado conectado; solo se permite contexto local controlado.", en: "No licensed provider is connected; only controlled local context is allowed." },
    asOf: "2026-07-16T12:00:00-06:00",
    realtimeAvailable: false,
    degradation: true,
    fallbackStrategy: { es: "Desactivar lecturas externas hasta registrar licencia, SLA, cobertura y auditoria.", en: "Disable external readings until license, SLA, coverage and audit are recorded." },
  },
};

const disclaimerSource = { es: "Informacion para monitoreo y contexto. No constituye recomendacion de inversion, trading ni credito.", en: "Information for monitoring and context. It does not constitute investment, trading or credit advice." };

const providerActionsSource = {
  [MARKET_PROVIDER_STATES.LOCAL_DELAYED]: [
    { es: "Mostrar modo delayed-demo y procedencia local en pantalla.", en: "Show delayed-demo mode and local provenance on screen." },
    { es: "Mantener alertas como senales de revision humana.", en: "Keep alerts as human-review signals." },
    { es: "Conectar proveedor licenciado solo mediante tarea aprobada de backend/API.", en: "Connect a licensed provider only through an approved backend/API task." },
  ],
  [MARKET_PROVIDER_STATES.DEGRADED]: [
    { es: "Avisar degradacion visible al usuario antes de la watchlist.", en: "Show visible degradation notice to the user before the watchlist." },
    { es: "Usar snapshot local y suspender automatismos dependientes del proveedor.", en: "Use the local snapshot and suspend provider-dependent automation." },
    { es: "Registrar incidente, hora del snapshot y responsable de revision.", en: "Log the incident, snapshot time and review owner." },
  ],
  [MARKET_PROVIDER_STATES.UNLICENSED]: [
    { es: "Bloquear cualquier claim de tiempo real o cobertura licenciada.", en: "Block any real-time or licensed-coverage claim." },
    { es: "Mostrar solo contexto educativo-operativo con procedencia local.", en: "Show only educational/operational context with local provenance." },
    { es: "Requerir licencia, contrato de datos y politica de auditoria antes de activar feeds.", en: "Require a license, data contract and audit policy before activating feeds." },
  ],
};

function resolveProviderState(providerState) {
  return providerStatesSource[providerState] ? providerState : MARKET_PROVIDER_STATES.LOCAL_DELAYED;
}

export function getMarketProviderStatus(providerState = MARKET_PROVIDER_STATES.LOCAL_DELAYED, language = "es") {
  const resolvedState = resolveProviderState(providerState);
  const state = providerStatesSource[resolvedState];

  return {
    ...state,
    label: pickLang(state.label, language),
    delayLabel: pickLang(state.delayLabel, language),
    provenance: pickLang(state.provenance, language),
    fallbackStrategy: pickLang(state.fallbackStrategy, language),
    state: resolvedState,
    disclaimer: pickLang(disclaimerSource, language),
  };
}

export function canUseRealtimeMarketData(status = getMarketProviderStatus()) {
  return Boolean(status.realtimeAvailable && status.mode === "licensed-realtime");
}

export function getProviderDegradationPlan(providerState = MARKET_PROVIDER_STATES.LOCAL_DELAYED, language = "es") {
  const status = getMarketProviderStatus(providerState, language);

  return {
    state: status.state,
    health: status.health,
    label: status.label,
    fallbackStrategy: status.fallbackStrategy,
    realtimeAvailable: canUseRealtimeMarketData(status),
    actions: (providerActionsSource[status.state] || []).map((action) => pickLang(action, language)),
  };
}

export function getMarketWatchlist(role = "applicant", providerState = MARKET_PROVIDER_STATES.LOCAL_DELAYED, language = "es") {
  const status = getMarketProviderStatus(providerState, language);
  const scopeByRole = {
    applicant: { es: "Monitorear variables que pueden afectar costo, margen y viabilidad del proyecto.", en: "Monitor variables that can affect the project's cost, margin and viability." },
    grantor: { es: "Monitorear variables que pueden afectar riesgo, apetito y covenants.", en: "Monitor variables that can affect risk, appetite and covenants." },
    admin: { es: "Monitorear cobertura, politicas y salud de proveedores antes de activar datos licenciados.", en: "Monitor coverage, policies and provider health before activating licensed data." },
  };

  return {
    status,
    scope: pickLang(scopeByRole[role] || scopeByRole.applicant, language),
    rows: marketRowsSource.map((row) => ({
      ...row,
      name: pickLang(row.name, language),
      risk: pickLang(row.risk, language),
      driver: pickLang(row.driver, language),
    })),
    events: marketEventsSource.map((event) => ({
      ...event,
      title: pickLang(event.title, language),
      impact: pickLang(event.impact, language),
    })),
    degradationPlan: getProviderDegradationPlan(status.state, language),
  };
}

export function buildMarketWatchlistForExpedient(context, providerState = MARKET_PROVIDER_STATES.LOCAL_DELAYED, language = "es") {
  const base = getMarketWatchlist(context?.role, providerState, language);
  const order = context?.order;
  if (!order || context?.isDemo) return base;

  const metadata = order.metadata || {};
  const projectName = order.project_name || order.projectName || order.case_number || order.id;
  const country = metadata.country || "MX";
  const sector = metadata.sector || pickLang({ es: "sector no especificado", en: "sector not specified" }, language);
  const risk = order.risk_level || order.riskLevel || pickLang({ es: "por validar", en: "to validate" }, language);
  const relevantRows = base.rows.filter((row) => row.region === country || row.region === "Global" || country === "MX");
  const isHighRisk = ["alto", "high"].includes(String(risk).toLowerCase());

  return {
    ...base,
    source: "expedient-context",
    expedientId: order.id,
    scope: pickLang(
      { es: `Monitoreo contextual para ${projectName}: ${sector}, ${country}, riesgo ${risk}.`, en: `Contextual monitoring for ${projectName}: ${sector}, ${country}, ${risk} risk.` },
      language
    ),
    rows: relevantRows,
    events: [
      {
        id: "selected-expedient-risk",
        title: pickLang({ es: `Riesgo declarado del expediente: ${risk}`, en: `File's declared risk: ${risk}` }, language),
        severity: isHighRisk ? "caution" : "watch",
        impact: pickLang(
          { es: `Validar sensibilidad de ${projectName} a tasas, FX e insumos antes de una decision humana.`, en: `Validate ${projectName}'s sensitivity to rates, FX and inputs before a human decision.` },
          language
        ),
      },
      ...base.events,
    ],
  };
}

export function getMonitoringPolicies(language = "es") {
  return [
    { es: "Mostrar procedencia y retraso antes de cualquier lectura de mercado.", en: "Show provenance and delay before any market reading." },
    { es: "Separar explicaciones de contexto de recomendaciones financieras.", en: "Separate contextual explanations from financial recommendations." },
    { es: "Degradar a modo informativo si un proveedor falla o no tiene licencia activa.", en: "Degrade to informative mode if a provider fails or lacks an active license." },
    { es: "Registrar alertas como senales de revision humana, no como decisiones automaticas.", en: "Log alerts as human-review signals, not automated decisions." },
  ].map((policy) => pickLang(policy, language));
}
