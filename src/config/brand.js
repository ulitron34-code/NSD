import { isNuxeraExperienceEnabled } from "../experience/experienceFlags";

// Fe de erratas y adenda de identidad (NUXERA_Fe_de_Erratas_Identidad_y_Nomenclatura_v1,
// 2026-07-17): NUXERA Financial Intelligence sustituye a NEXUS como nombre oficial de
// trabajo. Se mantiene NEXUS como marca visible por defecto -- el cambio de marca en
// vivo se activa con el mismo flag que ya gobierna la experiencia NUXERA, para que
// encender/apagar la identidad nueva sea reversible en un solo lugar.
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
};

export const BRAND = isNuxeraExperienceEnabled() ? NUXERA_BRAND : NEXUS_BRAND;

export function brandLabel(key, fallback = "") {
  return BRAND[key] || fallback;
}
