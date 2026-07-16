import { getNuxeraEngineNavigationItems } from "../engines/engineRegistry";

const sharedEngines = getNuxeraEngineNavigationItems();

export const navigationByRole = {
  applicant: [
    { id: "home", label: "Inicio", path: "/dashboard" },
    ...sharedEngines,
    { id: "followup", label: "Seguimiento", path: "/dashboard/nuxera/followup" },
  ],
  grantor: [
    { id: "home", label: "Mesa de decision", path: "/dashboard" },
    { id: "queue", label: "Cola de casos", path: "/dashboard/nuxera/queue" },
    ...sharedEngines,
  ],
  admin: [
    { id: "home", label: "Consola", path: "/dashboard" },
    { id: "operations", label: "Operacion", path: "/dashboard/nuxera/operations" },
    { id: "security", label: "Seguridad", path: "/dashboard/nuxera/security" },
    { id: "ai", label: "IA y agentes", path: "/dashboard/nuxera/ai" },
    { id: "system", label: "Sistema", path: "/dashboard/nuxera/system" },
  ],
};