import { getNuxeraEngine } from "../engines/engineRegistry";

export const NUXERA_SECTION_TYPES = Object.freeze({
  LEGACY_ADAPTER: "legacy-adapter",
  PLACEHOLDER: "placeholder",
});

export function resolveNuxeraSection(section) {
  if (!section || section === "home") return null;

  const engine = getNuxeraEngine(section);
  if (engine) {
    return {
      id: engine.id,
      type: NUXERA_SECTION_TYPES.LEGACY_ADAPTER,
      title: engine.title,
      adapter: engine.adapter,
      status: engine.status,
    };
  }

  return {
    id: section,
    type: NUXERA_SECTION_TYPES.PLACEHOLDER,
    title: section,
  };
}