// Categorización heurística por palabra clave de las "Bandera roja..." que
// generan los agentes dentro de document_reviews.findings (texto libre, no
// hay un campo `red_flags[].type` estructurado como sugiere la sección 16
// del plan). Compartido por readinessMetricsService.js (sección 30,
// "banderas rojas más comunes") y readinessMemoService.js (sección 29,
// resumen anonimizado -- necesita el CONTEO por categoría sin exponer el
// texto libre original, que puede citar nombres/RFC/montos literales del
// documento fuente).
export const RED_FLAG_CATEGORIES = [
  { test: /OFAC|PEP/i, label: 'Screening OFAC/PEP' },
  { test: /SAT[\s-]?69-?B/i, label: 'Riesgo fiscal SAT 69-B' },
  { test: /DSCR/i, label: 'DSCR insuficiente' },
  { test: /beneficiario controlador/i, label: 'Beneficiario controlador no identificado' },
  { test: /estructural/i, label: 'Estructura documental débil' },
  { test: /pasivo/i, label: 'Pasivos ocultos o no explicados' },
  { test: /litigio/i, label: 'Litigios relevantes no declarados' },
  { test: /greenwashing/i, label: 'ESG sin evidencia (greenwashing)' },
  { test: /vencid|vigencia/i, label: 'Documento con vigencia vencida' }
];

export function categorizeRedFlag(text) {
  const match = RED_FLAG_CATEGORIES.find((category) => category.test.test(text));
  return match ? match.label : 'Otras banderas rojas';
}

export function isRedFlagFinding(text) {
  return /bandera roja/i.test(text || '');
}
