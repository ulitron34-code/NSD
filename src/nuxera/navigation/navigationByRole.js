import { getNuxeraEngineNavigationItems } from "../engines/engineRegistry";

const sharedEngines = getNuxeraEngineNavigationItems();

const APPLICANT_VISIBLE_ENGINE_IDS = ["finance"];
const applicantEngines = sharedEngines
  .filter((item) => APPLICANT_VISIBLE_ENGINE_IDS.includes(item.id))
  .map((item) => (item.id === "finance" ? { ...item, label: { es: "Mi expediente", en: "My file" } } : item));

const navigationByRoleSource = {
  applicant: [
    { id: "home", label: { es: "Inicio", en: "Home" }, path: "/dashboard" },
    ...applicantEngines,
    { id: "followup", label: { es: "Seguimiento", en: "Follow-up" }, path: "/dashboard/nuxera/followup" },
  ],
  grantor: [
    { id: "home", label: { es: "Mesa de decision", en: "Decision desk" }, path: "/dashboard" },
    { id: "queue", label: { es: "Cola de casos", en: "Case queue" }, path: "/dashboard/nuxera/queue" },
    ...sharedEngines,
  ],
  admin: [
    { id: "home", label: { es: "Consola", en: "Console" }, path: "/dashboard" },
    { id: "operations", label: { es: "Operacion", en: "Operations" }, path: "/dashboard/nuxera/operations" },
    { id: "security", label: { es: "Seguridad", en: "Security" }, path: "/dashboard/nuxera/security" },
    { id: "ai", label: { es: "IA y agentes", en: "AI & agents" }, path: "/dashboard/nuxera/ai" },
    { id: "system", label: { es: "Sistema", en: "System" }, path: "/dashboard/nuxera/system" },
  ],
};

function localizeLabel(label, isEnglish) {
  return typeof label === "object" && label !== null ? (isEnglish ? label.en : label.es) : label;
}

export function getNavigationByRole(role, isEnglish = false) {
  const items = navigationByRoleSource[role] || navigationByRoleSource.applicant;
  return items.map((item) => ({ ...item, label: localizeLabel(item.label, isEnglish) }));
}

// Backwards-compatible default export (Spanish) for call sites not yet passing a language.
export const navigationByRole = {
  applicant: getNavigationByRole("applicant", false),
  grantor: getNavigationByRole("grantor", false),
  admin: getNavigationByRole("admin", false),
};
