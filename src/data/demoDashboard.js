import { COLORS } from "../utils/constants";

export const complianceTrend = [
  { month: "Ene", completos: 58, pendientes: 21 },
  { month: "Feb", completos: 64, pendientes: 18 },
  { month: "Mar", completos: 71, pendientes: 16 },
  { month: "Abr", completos: 76, pendientes: 14 },
  { month: "May", completos: 82, pendientes: 11 },
  { month: "Jun", completos: 87, pendientes: 8 },
];

export const caseStatus = [
  { name: "Aprobados", value: 32, color: COLORS.green },
  { name: "En revision", value: 14, color: COLORS.amber },
  { name: "Observados", value: 7, color: "#C62828" },
  { name: "Por vencer", value: 10, color: COLORS.navyLight },
];

export const riskData = [
  { range: "Bajo", count: 28 },
  { range: "Medio", count: 18 },
  { range: "Alto", count: 9 },
  { range: "Critico", count: 3 },
];

export const dashboardKpis = [
  { title: "Cumplimiento general", value: "87%", helper: "+5% vs mes anterior", color: COLORS.green },
  { title: "Expedientes activos", value: "63", helper: "14 en revision", color: COLORS.navy },
  { title: "Documentos por vencer", value: "10", helper: "3 criticos esta semana", color: COLORS.amber },
  { title: "Riesgos altos", value: "12", helper: "Requieren remediacion", color: "#C62828" },
];
