export function resolveNuxeraRole(user, demoMode) {
  if (demoMode === "nsd_admin") return "admin";
  if (demoMode === "otorgante") return "grantor";
  if (demoMode === "solicitante") return "applicant";

  const role = String(
    user?.role ||
    user?.profile_type ||
    user?.profileType ||
    user?.user_metadata?.profile_type ||
    "solicitante"
  ).toLowerCase();

  if (["administrador", "admin", "nsd_admin"].includes(role)) return "admin";
  if (["otorgante", "inversionista", "funder", "investor"].includes(role)) return "grantor";
  return "applicant";
}