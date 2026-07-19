const marketRows = [
  {
    symbol: "MXN/USD",
    name: "Peso mexicano / dolar",
    assetClass: "FX",
    region: "MX",
    value: "18.42",
    change: "+0.18%",
    risk: "Medio",
    driver: "Sensibilidad a tasas, remesas y apetito global por riesgo.",
  },
  {
    symbol: "TIIE 28",
    name: "Tasa interbancaria de equilibrio",
    assetClass: "Rates",
    region: "MX",
    value: "10.25%",
    change: "0 pb",
    risk: "Bajo",
    driver: "Referencia para costo de deuda local y refinanciamiento.",
  },
  {
    symbol: "S&P/BMV IPC",
    name: "Indice accionario Mexico",
    assetClass: "Equity",
    region: "MX",
    value: "58,210",
    change: "-0.42%",
    risk: "Medio",
    driver: "Liquidez local, reportes corporativos y flujos internacionales.",
  },
  {
    symbol: "WTI",
    name: "Petroleo WTI",
    assetClass: "Commodity",
    region: "Global",
    value: "82.10",
    change: "+1.05%",
    risk: "Alto",
    driver: "Volatilidad por inventarios, geopolitica y demanda industrial.",
  },
];

const marketEvents = [
  {
    id: "banxico-rate-window",
    title: "Ventana de decision monetaria",
    severity: "watch",
    impact: "Puede mover costo financiero, refinanciamiento y sensibilidad de DSCR.",
  },
  {
    id: "fx-volatility",
    title: "Volatilidad cambiaria",
    severity: "caution",
    impact: "Revisar exposicion USD en ingresos, deuda, CAPEX o proveedores.",
  },
  {
    id: "commodity-inputs",
    title: "Presion en insumos",
    severity: "watch",
    impact: "Afecta margenes en energia, transporte, agricultura e industria.",
  },
];

export const MARKET_PROVIDER_STATES = {
  LOCAL_DELAYED: "local-delayed",
  DEGRADED: "degraded",
  UNLICENSED: "unlicensed",
};

const providerStates = {
  [MARKET_PROVIDER_STATES.LOCAL_DELAYED]: {
    provider: "NUXERA local delayed provider",
    mode: "delayed-demo",
    health: "operational",
    label: "Proveedor local disponible",
    delayLabel: "Datos simulados / no tiempo real",
    provenance: "Dataset local controlado para diseno de experiencia y politicas de monitoreo.",
    asOf: "2026-07-16T12:00:00-06:00",
    realtimeAvailable: false,
    degradation: false,
    fallbackStrategy: "Usar snapshot local versionado y mostrar procedencia antes de cada lectura.",
  },
  [MARKET_PROVIDER_STATES.DEGRADED]: {
    provider: "NUXERA provider fallback",
    mode: "informative-fallback",
    health: "degraded",
    label: "Proveedor degradado",
    delayLabel: "Fallback informativo / sin tiempo real",
    provenance: "Snapshot local activado por falla o timeout del proveedor primario.",
    asOf: "2026-07-16T12:00:00-06:00",
    realtimeAvailable: false,
    degradation: true,
    fallbackStrategy: "Mantener contexto local, bloquear alertas automaticas y solicitar revision humana.",
  },
  [MARKET_PROVIDER_STATES.UNLICENSED]: {
    provider: "NUXERA license gate",
    mode: "license-required",
    health: "blocked",
    label: "Proveedor no licenciado",
    delayLabel: "Licencia pendiente / no tiempo real",
    provenance: "No hay proveedor licenciado conectado; solo se permite contexto local controlado.",
    asOf: "2026-07-16T12:00:00-06:00",
    realtimeAvailable: false,
    degradation: true,
    fallbackStrategy: "Desactivar lecturas externas hasta registrar licencia, SLA, cobertura y auditoria.",
  },
};

const disclaimer = "Informacion para monitoreo y contexto. No constituye recomendacion de inversion, trading ni credito.";

const providerActions = {
  [MARKET_PROVIDER_STATES.LOCAL_DELAYED]: [
    "Mostrar modo delayed-demo y procedencia local en pantalla.",
    "Mantener alertas como senales de revision humana.",
    "Conectar proveedor licenciado solo mediante tarea aprobada de backend/API.",
  ],
  [MARKET_PROVIDER_STATES.DEGRADED]: [
    "Avisar degradacion visible al usuario antes de la watchlist.",
    "Usar snapshot local y suspender automatismos dependientes del proveedor.",
    "Registrar incidente, hora del snapshot y responsable de revision.",
  ],
  [MARKET_PROVIDER_STATES.UNLICENSED]: [
    "Bloquear cualquier claim de tiempo real o cobertura licenciada.",
    "Mostrar solo contexto educativo-operativo con procedencia local.",
    "Requerir licencia, contrato de datos y politica de auditoria antes de activar feeds.",
  ],
};

function resolveProviderState(providerState) {
  return providerStates[providerState] ? providerState : MARKET_PROVIDER_STATES.LOCAL_DELAYED;
}

export function getMarketProviderStatus(providerState = MARKET_PROVIDER_STATES.LOCAL_DELAYED) {
  const resolvedState = resolveProviderState(providerState);

  return {
    ...providerStates[resolvedState],
    state: resolvedState,
    disclaimer,
  };
}

export function canUseRealtimeMarketData(status = getMarketProviderStatus()) {
  return Boolean(status.realtimeAvailable && status.mode === "licensed-realtime");
}

export function getProviderDegradationPlan(providerState = MARKET_PROVIDER_STATES.LOCAL_DELAYED) {
  const status = getMarketProviderStatus(providerState);

  return {
    state: status.state,
    health: status.health,
    label: status.label,
    fallbackStrategy: status.fallbackStrategy,
    realtimeAvailable: canUseRealtimeMarketData(status),
    actions: providerActions[status.state],
  };
}

export function getMarketWatchlist(role = "applicant", providerState = MARKET_PROVIDER_STATES.LOCAL_DELAYED) {
  const status = getMarketProviderStatus(providerState);
  const scopeByRole = {
    applicant: "Monitorear variables que pueden afectar costo, margen y viabilidad del proyecto.",
    grantor: "Monitorear variables que pueden afectar riesgo, apetito y covenants.",
    admin: "Monitorear cobertura, politicas y salud de proveedores antes de activar datos licenciados.",
  };

  return {
    status,
    scope: scopeByRole[role] || scopeByRole.applicant,
    rows: marketRows,
    events: marketEvents,
    degradationPlan: getProviderDegradationPlan(status.state),
  };
}

export function buildMarketWatchlistForExpedient(context, providerState = MARKET_PROVIDER_STATES.LOCAL_DELAYED) {
  const base = getMarketWatchlist(context?.role, providerState);
  const order = context?.order;
  if (!order || context?.isDemo) return base;

  const metadata = order.metadata || {};
  const projectName = order.project_name || order.projectName || order.case_number || order.id;
  const country = metadata.country || "MX";
  const sector = metadata.sector || "sector no especificado";
  const risk = order.risk_level || order.riskLevel || "por validar";
  const relevantRows = base.rows.filter((row) => row.region === country || row.region === "Global" || country === "MX");

  return {
    ...base,
    source: "expedient-context",
    expedientId: order.id,
    scope: `Monitoreo contextual para ${projectName}: ${sector}, ${country}, riesgo ${risk}.`,
    rows: relevantRows,
    events: [
      {
        id: "selected-expedient-risk",
        title: `Riesgo declarado del expediente: ${risk}`,
        severity: String(risk).toLowerCase() === "alto" ? "caution" : "watch",
        impact: `Validar sensibilidad de ${projectName} a tasas, FX e insumos antes de una decision humana.`,
      },
      ...base.events,
    ],
  };
}

export function getMonitoringPolicies() {
  return [
    "Mostrar procedencia y retraso antes de cualquier lectura de mercado.",
    "Separar explicaciones de contexto de recomendaciones financieras.",
    "Degradar a modo informativo si un proveedor falla o no tiene licencia activa.",
    "Registrar alertas como senales de revision humana, no como decisiones automaticas.",
  ];
}
