export const BRAND = {
  productName: "NSD Platform",
  shortName: "NSD IF",
  legalName: "NSD International Finance",
  futureName: "NAGMAR International Finance",
  tagline: "Compliance + NSD IF",
  category: "Compliance SaaS",
  contactEmail: "info@nsd.com",
  contactPhone: "+52 XX XXXX XXXX",
  location: "Ciudad de Mexico",
  logoAlt: "NSD Platform",
};

export function brandLabel(key, fallback = "") {
  return BRAND[key] || fallback;
}
