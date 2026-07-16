const ROLE_ALIASES = Object.freeze({
  solicitante: "applicant",
  applicant: "applicant",
  otorgante: "grantor",
  grantor: "grantor",
  lender: "grantor",
  nsd_admin: "admin",
  admin: "admin",
  compliance_officer: "admin",
});

export function resolveWorkspaceRole(user, demoMode) {
  const candidate = demoMode || user?.role || "solicitante";
  return ROLE_ALIASES[candidate] || "applicant";
}
