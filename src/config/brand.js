import { isNuxeraExperienceEnabled } from "../experience/experienceFlags";

// Fe de erratas y adenda de identidad (NUXERA_Fe_de_Erratas_Identidad_y_Nomenclatura_v1,
// 2026-07-17): NUXERA Financial Intelligence sustituye a NEXUS como nombre oficial de
// trabajo. NUXERA es la identidad visible por defecto; NEXUS queda como fallback
// reversible solo si VITE_NUXERA_EXPERIENCE_ENABLED se configura explicitamente en false.
const NEXUS_BRAND = {
  name: "NEXUS",
  legalName: "NEXUS Secure Due-Diligence Unit",
  tagline: "Secure Due-diligence Unit",
  productName: "NEXUS Platform",
  category: "Compliance SaaS",
  contactEmail: "info@nsd.com",
  contactPhone: "+52 XX XXXX XXXX",
  location: "Ciudad de Mexico",
  logoAlt: "NEXUS",
  logoSrc: "/logo-nexus.png",
};

const NUXERA_BRAND = {
  name: "NUXERA",
  legalName: "NUXERA Financial Intelligence",
  tagline: "Financial Intelligence",
  productName: "NUXERA Financial Intelligence",
  category: "Financial Intelligence",
  contactEmail: "info@nsd.com",
  contactPhone: "+52 XX XXXX XXXX",
  location: "Ciudad de Mexico",
  logoAlt: "NUXERA",
  logoSrc: "/logo-nuxera.png",
  logoMarkSrc: "/logo-nuxera-mark.png",
};

export const BRAND = isNuxeraExperienceEnabled() ? NUXERA_BRAND : NEXUS_BRAND;

export function brandLabel(key, fallback = "") {
  return BRAND[key] || fallback;
}
