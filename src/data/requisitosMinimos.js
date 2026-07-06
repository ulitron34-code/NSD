export function pickLang(field, language) {
  if (!field || typeof field !== "object") return field;
  return String(language || "es").toLowerCase().startsWith("en") ? field.en : field.es;
}

export const REQUISITOS_CATEGORIAS = [
  { id: "documentacion", label: { es: "Documentación Corporativa & Compliance", en: "Corporate Documentation & Compliance" } },
  { id: "viabilidad", label: { es: "Viabilidad & Mercado", en: "Viability & Market" } },
  { id: "financiero", label: { es: "Financiero & Transparencia", en: "Financial & Transparency" } },
  { id: "impacto", label: { es: "Impacto & Gobernanza", en: "Impact & Governance" } },
];

export const REQUISITOS_MINIMOS = [
  {
    id: "doc_corporativa",
    categoria: "documentacion",
    label: { es: "Documentación Corporativa", en: "Corporate Documentation" },
    detalle: { es: "Acta constitutiva, estatutos, RFC, poder notarial.", en: "Bylaws, articles of incorporation, tax ID, notarial power." },
    critico: false,
  },
  {
    id: "identificacion_oficial",
    categoria: "documentacion",
    label: { es: "Identificación Oficial (INE/Pasaporte)", en: "Official ID (National ID/Passport)" },
    detalle: { es: "INE vigente (frente y reverso) o pasaporte del representante legal.", en: "Valid national ID (front and back) or passport of the legal representative." },
    critico: true,
  },
  {
    id: "doc_kyc",
    categoria: "documentacion",
    label: { es: "Documentación KYC y de Cumplimiento", en: "KYC and Compliance Documentation" },
    detalle: { es: "Beneficiario controlador, CURP/RFC, comprobante de domicilio.", en: "Ultimate beneficial owner, national tax IDs, proof of address." },
    critico: false,
  },
  {
    id: "marco_riesgos",
    categoria: "documentacion",
    label: { es: "Marco de Gestión de Riesgos", en: "Risk Management Framework" },
    detalle: { es: "Matriz de riesgos, mitigantes, plan de acción.", en: "Risk matrix, mitigants, action plan." },
    critico: true,
  },
  {
    id: "estudio_viabilidad",
    categoria: "viabilidad",
    label: { es: "Estudio de Viabilidad", en: "Feasibility Study" },
    detalle: { es: "Análisis de factibilidad técnica, operativa, legal.", en: "Technical, operational and legal feasibility analysis." },
    critico: false,
  },
  {
    id: "estudio_mercado",
    categoria: "viabilidad",
    label: { es: "Estudio de Mercado y Marketing", en: "Market and Marketing Study" },
    detalle: { es: "Tamaño de mercado, competencia, estrategia comercial.", en: "Market size, competition, go-to-market strategy." },
    critico: false,
  },
  {
    id: "plan_negocios",
    categoria: "viabilidad",
    label: { es: "Plan de Negocios", en: "Business Plan" },
    detalle: { es: "Descripción del modelo, go-to-market, hitos.", en: "Business model description, go-to-market, milestones." },
    critico: false,
  },
  {
    id: "modelo_financiero",
    categoria: "financiero",
    label: { es: "Modelo Financiero y Proyecciones", en: "Financial Model and Projections" },
    detalle: { es: "Estados financieros históricos, proyecciones a 3-5 años, supuestos.", en: "Historical financial statements, 3-5 year projections, assumptions." },
    critico: false,
  },
  {
    id: "viabilidad_financiera",
    categoria: "financiero",
    label: { es: "Revisión de Viabilidad Financiera", en: "Financial Viability Review" },
    detalle: { es: "TIR, VAN, payback, análisis de sensibilidad.", en: "IRR, NPV, payback, sensitivity analysis." },
    critico: false,
  },
  {
    id: "transparencia_documental",
    categoria: "financiero",
    label: { es: "Transparencia Documental", en: "Documentary Transparency" },
    detalle: { es: "Auditoría de documentos, integridad de archivos, trazabilidad.", en: "Document audit, file integrity, traceability." },
    critico: false,
  },
  {
    id: "ods",
    categoria: "impacto",
    label: { es: "Alineación con ODS de la ONU", en: "UN SDG Alignment" },
    detalle: { es: "Identificar ODS relevantes, indicadores de impacto.", en: "Identify relevant SDGs, impact indicators." },
    critico: false,
  },
  {
    id: "esg",
    categoria: "impacto",
    label: { es: "Apartado ESG & Impact Financing", en: "ESG & Impact Financing" },
    detalle: { es: "Environmental, Social, Governance; criterios de impacto.", en: "Environmental, Social, Governance; impact criteria." },
    critico: true,
  },
  {
    id: "esia",
    categoria: "impacto",
    label: { es: "Impacto Ambiental, Social y de Gobernanza", en: "Environmental, Social and Governance Impact" },
    detalle: { es: "Evaluación ESIA, indicadores de impacto social, transparencia.", en: "ESIA assessment, social impact indicators, transparency." },
    critico: false,
  },
];

export const DEMO_EXPEDIENTE_ID = "demo-order-001";

// Los 17 Objetivos de Desarrollo Sostenible (ONU) — referencia oficial y estable,
// usada para que el requisito "ods" sea una selección concreta y no un checkbox vago.
export const UN_SDG_GOALS = [
  { numero: 1, es: "Fin de la pobreza", en: "No Poverty" },
  { numero: 2, es: "Hambre cero", en: "Zero Hunger" },
  { numero: 3, es: "Salud y bienestar", en: "Good Health and Well-being" },
  { numero: 4, es: "Educación de calidad", en: "Quality Education" },
  { numero: 5, es: "Igualdad de género", en: "Gender Equality" },
  { numero: 6, es: "Agua limpia y saneamiento", en: "Clean Water and Sanitation" },
  { numero: 7, es: "Energía asequible y no contaminante", en: "Affordable and Clean Energy" },
  { numero: 8, es: "Trabajo decente y crecimiento económico", en: "Decent Work and Economic Growth" },
  { numero: 9, es: "Industria, innovación e infraestructura", en: "Industry, Innovation and Infrastructure" },
  { numero: 10, es: "Reducción de las desigualdades", en: "Reduced Inequalities" },
  { numero: 11, es: "Ciudades y comunidades sostenibles", en: "Sustainable Cities and Communities" },
  { numero: 12, es: "Producción y consumo responsables", en: "Responsible Consumption and Production" },
  { numero: 13, es: "Acción por el clima", en: "Climate Action" },
  { numero: 14, es: "Vida submarina", en: "Life Below Water" },
  { numero: 15, es: "Vida de ecosistemas terrestres", en: "Life on Land" },
  { numero: 16, es: "Paz, justicia e instituciones sólidas", en: "Peace, Justice and Strong Institutions" },
  { numero: 17, es: "Alianzas para lograr los objetivos", en: "Partnerships for the Goals" },
];

// Heurística local (sin llamada externa) que resume el estado del checklist como si fuera
// una revisión de un agente IA — mismo patrón que runAiReview()/executeAIAgentsAnalysis()
// ya usados en el resto del dashboard (findings basados en reglas, no un modelo real).
export function generarRevisionIARequisitos(items, language) {
  const isEn = String(language || "es").toLowerCase().startsWith("en");
  const pendientes = items.filter((item) => item.estado !== "listo");
  const criticos = pendientes.filter((item) => item.critico);
  const score = Math.round(((items.length - pendientes.length) / items.length) * 100);

  const findings = [];
  findings.push(
    criticos.length > 0
      ? (isEn
          ? `Blocking: ${criticos.length} critical requirement(s) missing — ${criticos.map((i) => i.label.en).join(", ")}.`
          : `Bloqueante: faltan ${criticos.length} requisito(s) crítico(s) — ${criticos.map((i) => i.label.es).join(", ")}.`)
      : (isEn ? "No critical requirements are blocking submission." : "No hay requisitos críticos bloqueando el envío.")
  );

  const porCategoria = {};
  pendientes.forEach((item) => {
    porCategoria[item.categoria] = (porCategoria[item.categoria] || 0) + 1;
  });
  Object.entries(porCategoria).forEach(([categoria, count]) => {
    const categoriaInfo = REQUISITOS_CATEGORIAS.find((c) => c.id === categoria);
    const categoriaLabel = categoriaInfo ? pickLang(categoriaInfo.label, language) : categoria;
    findings.push(
      isEn
        ? `${count} item(s) pending in category "${categoriaLabel}".`
        : `${count} elemento(s) pendiente(s) en la categoría "${categoriaLabel}".`
    );
  });

  if (pendientes.length === 0) {
    findings.push(isEn ? "All 13 minimum requirements are complete." : "Los 13 requisitos mínimos están completos.");
  }

  return { score, findings };
}
