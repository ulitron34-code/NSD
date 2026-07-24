import { pickLang } from "./requisitosMinimos";

const demoDocumentsSource = [
  {
    id: 1,
    name: { es: "Constancia de situacion fiscal", en: "Tax status certificate" },
    owner: { es: "Empresa", en: "Company" },
    status: "approved",
    expires: "2026-09-12",
    risk: { es: "Bajo", en: "Low" },
    reviewer: { es: "Ana Compliance", en: "Ana Compliance" },
    version: "v3",
    notes: { es: "Documento vigente y consistente con RFC capturado.", en: "Document is current and consistent with the captured tax ID." },
  },
  {
    id: 2,
    name: { es: "Identificacion representante legal", en: "Legal representative ID" },
    owner: { es: "Representante", en: "Representative" },
    status: "review",
    expires: "2026-07-30",
    risk: { es: "Medio", en: "Medium" },
    reviewer: { es: "Luis Riesgos", en: "Luis Riesgos" },
    version: "v1",
    notes: { es: "Pendiente validar coincidencia con poderes.", en: "Pending validation against powers of attorney." },
  },
  {
    id: 3,
    name: { es: "Comprobante de domicilio", en: "Proof of address" },
    owner: { es: "Empresa", en: "Company" },
    status: "observed",
    expires: "2026-06-15",
    risk: { es: "Alto", en: "High" },
    reviewer: { es: "Mariana Legal", en: "Mariana Legal" },
    version: "v2",
    notes: { es: "La fecha de emision supera la vigencia aceptada por politica interna.", en: "The issue date exceeds the validity accepted by internal policy." },
  },
  {
    id: 4,
    name: { es: "Acta constitutiva", en: "Articles of incorporation" },
    owner: { es: "Empresa", en: "Company" },
    status: "approved",
    expires: "2027-01-20",
    risk: { es: "Bajo", en: "Low" },
    reviewer: { es: "Ana Compliance", en: "Ana Compliance" },
    version: "v4",
    notes: { es: "Version completa con objeto social y sello de registro.", en: "Complete version with corporate purpose and registration seal." },
  },
  {
    id: 5,
    name: { es: "Estructura accionaria y UBO", en: "Ownership structure & UBO" },
    owner: { es: "Beneficiarios finales", en: "Ultimate beneficial owners" },
    status: "missing",
    expires: { es: "Sin cargar", en: "Not uploaded" },
    risk: { es: "Critico", en: "Critical" },
    reviewer: { es: "Sin asignar", en: "Unassigned" },
    version: "N/A",
    notes: { es: "Requisito indispensable para cierre de expediente.", en: "Required to close out the file." },
  },
  {
    id: 6,
    name: { es: "Estados financieros", en: "Financial statements" },
    owner: { es: "Empresa", en: "Company" },
    status: "review",
    expires: "2026-08-01",
    risk: { es: "Medio", en: "Medium" },
    reviewer: { es: "Luis Riesgos", en: "Luis Riesgos" },
    version: "v1",
    notes: { es: "Pendiente revisar consistencia contra declaraciones.", en: "Pending consistency check against tax filings." },
  },
];

function localize(value, language) {
  return typeof value === "object" && value !== null ? pickLang(value, language) : value;
}

export function getDemoDocuments(language = "es") {
  return demoDocumentsSource.map((document) => ({
    ...document,
    name: localize(document.name, language),
    owner: localize(document.owner, language),
    expires: localize(document.expires, language),
    risk: localize(document.risk, language),
    reviewer: localize(document.reviewer, language),
    notes: localize(document.notes, language),
  }));
}

// Backwards-compatible default export (Spanish) for call sites not yet passing a language.
export const demoDocuments = getDemoDocuments("es");
