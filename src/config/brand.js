export const BRAND = {
  name: "NSDU",
  legalName: "NSDU International Finance",
  tagline: "Boutique International Finance",
  productName: "NSDU Platform",
  category: "Compliance SaaS",
  contactEmail: "info@nsd.com",
  contactPhone: "+52 XX XXXX XXXX",
  location: "Ciudad de Mexico",
  logoAlt: "NSDU",
};

export function brandLabel(key, fallback = "") {
  return BRAND[key] || fallback;
}
