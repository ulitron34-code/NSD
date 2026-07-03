export const BRAND = {
  name: "NEXUS",
  legalName: "NEXUS Secure Due-Diligence Unit",
  tagline: "Secure Due-diligence Unit",
  productName: "NEXUS Platform",
  category: "Compliance SaaS",
  contactEmail: "info@nsd.com",
  contactPhone: "+52 XX XXXX XXXX",
  location: "Ciudad de Mexico",
  logoAlt: "NEXUS",
};

export function brandLabel(key, fallback = "") {
  return BRAND[key] || fallback;
}
