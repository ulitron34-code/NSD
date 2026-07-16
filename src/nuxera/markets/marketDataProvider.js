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
    driver: "Volatilidad por inventarios, geopolítica y demanda industrial.",
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

export function getMarketProviderStatus() {
  return {
    provider: "NUXERA local delayed provider",
    mode: "delayed-demo",
    delayLabel: "Datos simulados / no tiempo real",
    provenance: "Dataset local controlado para diseno de experiencia y politicas de monitoreo.",
    asOf: "2026-07-16T12:00:00-06:00",
    disclaimer: "Informacion para monitoreo y contexto. No constituye recomendacion de inversion, trading ni credito.",
  };
}

export function getMarketWatchlist(role = "applicant") {
  const status = getMarketProviderStatus();
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