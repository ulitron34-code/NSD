export const navigationByRole = Object.freeze({
  applicant: [
    { id: "home", label: "Inicio", path: "/dashboard" },
    { id: "finance", label: "Financiamiento", path: "/dashboard/nu/finance" },
    { id: "intelligence", label: "Investigación", path: "/dashboard/nu/intelligence" },
    { id: "projects", label: "Mi proyecto", path: "/dashboard/nu/project" },
    { id: "documents", label: "Documentos", path: "/dashboard/nu/documents" },
    { id: "followup", label: "Seguimiento", path: "/dashboard/nu/follow-up" },
  ],
  grantor: [
    { id: "home", label: "Inicio", path: "/dashboard" },
    { id: "cases", label: "Expedientes", path: "/dashboard/nu/cases" },
    { id: "intelligence", label: "Intelligence", path: "/dashboard/nu/intelligence" },
    { id: "decisions", label: "Decisiones", path: "/dashboard/nu/decisions" },
    { id: "reports", label: "Reportes", path: "/dashboard/nu/reports" },
  ],
  admin: [
    { id: "home", label: "Inicio", path: "/dashboard" },
    { id: "operations", label: "Operación", path: "/dashboard/nu/admin/operations" },
    { id: "configuration", label: "Configuración", path: "/dashboard/nu/admin/configuration" },
    { id: "ai", label: "IA y agentes", path: "/dashboard/nu/admin/ai" },
    { id: "integrations", label: "Integraciones", path: "/dashboard/nu/admin/integrations" },
    { id: "security", label: "Seguridad", path: "/dashboard/nu/admin/security" },
    { id: "system", label: "Sistema", path: "/dashboard/nu/admin/system" },
  ],
});
