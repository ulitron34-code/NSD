export const NUXERA_SECTION_TYPES = Object.freeze({
  LEGACY_ADAPTER: "legacy-adapter",
  PLACEHOLDER: "placeholder",
});

export const nuxeraSectionRegistry = Object.freeze({
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