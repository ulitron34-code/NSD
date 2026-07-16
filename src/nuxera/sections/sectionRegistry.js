export const NUXERA_SECTION_TYPES = Object.freeze({
  LEGACY_ADAPTER: "legacy-adapter",
  PLACEHOLDER: "placeholder",
});

export const nuxeraSectionRegistry = Object.freeze({
  finance: {
    id: "finance",
    type: NUXERA_SECTION_TYPES.LEGACY_ADAPTER,
    title: "Workspace financiero",
    adapter: "finance-workspace",
  },
  markets: {
    id: "markets",
    type: NUXERA_SECTION_TYPES.LEGACY_ADAPTER,
    title: "Monitoreo de mercado",
    adapter: "markets-workspace",
  },
  intelligence: {
    id: "intelligence",
    type: NUXERA_SECTION_TYPES.LEGACY_ADAPTER,
    title: "Inteligencia documental",
    adapter: "document-intelligence",
  },
});

export function resolveNuxeraSection(section) {
  if (!section || section === "home") return null;
  return nuxeraSectionRegistry[section] || {
    id: section,
    type: NUXERA_SECTION_TYPES.PLACEHOLDER,
    title: section,
  };
}