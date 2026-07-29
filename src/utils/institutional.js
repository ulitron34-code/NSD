import { BRAND } from "../config/brand";

export const CASE_STAGES = {
  captura: "Captura",
  revision_documental: "Revision documental",
  scoring: "Scoring",
  data_room: "Data room",
  presentado_otorgantes: "Con otorgantes",
  cerrado: "Cerrado",
};

export const READINESS_GRADES = {
  A: "Expediente robusto",
  B: "Viable con observaciones menores",
  C: "Incompleto pero corregible",
  D: "Riesgo alto o faltantes criticos",
  E: "No presentable en estado actual",
  pendiente: "Pendiente",
};

export const DOCUMENT_TYPES = {
  identidad_kyc: "Identidad / KYC",
  corporativo_legal: "Corporativo legal",
  financiero: "Informacion financiera",
  fiscal: "Informacion fiscal",
  garantias: "Garantias / colateral",
  proyecto: "Proyecto / narrativa ejecutiva",
  reporte_nsd: `Reporte ${BRAND.name}`,
  observaciones: "Observaciones / subsanaciones",
  otro: "Otro documento",
};

export const DOCUMENT_STATUSES = {
  uploaded: "Cargado",
  in_review: "En revision",
  approved: "Aprobado",
  observed: "Observado",
  rejected: "Rechazado",
  expired: "Vencido",
  waived: "Dispensado",
};

export function formatCaseStage(stage = "captura") {
  return CASE_STAGES[stage] || stage;
}

export function formatReadinessGrade(grade = "pendiente") {
  return READINESS_GRADES[String(grade).toUpperCase()] || READINESS_GRADES[grade] || grade;
}

export function formatDocumentType(type = "otro") {
  return DOCUMENT_TYPES[type] || type;
}

export function formatDocumentStatus(status = "uploaded") {
  return DOCUMENT_STATUSES[status] || status;
}
