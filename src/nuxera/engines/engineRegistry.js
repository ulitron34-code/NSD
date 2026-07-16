export const NUXERA_ENGINE_IDS = Object.freeze({
  FINANCE: "finance",
  INTELLIGENCE: "intelligence",
  MARKETS: "markets",
  STRATEGY: "strategy",
});

export const nuxeraEngineRegistry = Object.freeze({
  [NUXERA_ENGINE_IDS.FINANCE]: {
    id: NUXERA_ENGINE_IDS.FINANCE,
    label: "Finance",
    path: "/dashboard/nuxera/finance",
    title: "Workspace financiero",
    adapter: "finance-workspace",
    status: "adapter-mounted",
    description: "Readiness, expedientes, pipeline y operacion financiera por rol.",
  },
  [NUXERA_ENGINE_IDS.INTELLIGENCE]: {
    id: NUXERA_ENGINE_IDS.INTELLIGENCE,
    label: "Intelligence",
    path: "/dashboard/nuxera/intelligence",
    title: "Inteligencia documental",
    adapter: "document-intelligence",
    status: "adapter-mounted",
    description: "Validacion documental y hallazgos reutilizando el modulo operativo existente.",
  },
  [NUXERA_ENGINE_IDS.MARKETS]: {
    id: NUXERA_ENGINE_IDS.MARKETS,
    label: "Markets",
    path: "/dashboard/nuxera/markets",
    title: "Monitoreo de mercado",
    adapter: "markets-workspace",
    status: "foundation-mounted",
    description: "Watchlist delayed, procedencia visible, eventos y politicas de monitoreo.",
  },
  [NUXERA_ENGINE_IDS.STRATEGY]: {
    id: NUXERA_ENGINE_IDS.STRATEGY,
    label: "Strategy",
    path: "/dashboard/nuxera/strategy",
    title: "Soporte de decision",
    adapter: "strategy-workspace",
    status: "foundation-mounted",
    description: "Preguntas, supuestos, escenarios, incertidumbre y plan de accion auditable.",
  },
});

export const nuxeraEngineOrder = Object.freeze([
  NUXERA_ENGINE_IDS.FINANCE,
  NUXERA_ENGINE_IDS.INTELLIGENCE,
  NUXERA_ENGINE_IDS.MARKETS,
  NUXERA_ENGINE_IDS.STRATEGY,
]);

export function getNuxeraEngines() {
  return nuxeraEngineOrder.map((id) => nuxeraEngineRegistry[id]);
}

export function getNuxeraEngine(id) {
  return nuxeraEngineRegistry[id] || null;
}

export function getNuxeraEngineNavigationItems() {
  return getNuxeraEngines().map(({ id, label, path }) => ({ id, label, path }));
}