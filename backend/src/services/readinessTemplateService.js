// Plantillas descargables (sección 31 del plan). En vez de escribir 12
// documentos de plantilla a mano -- con el riesgo de que se desincronicen
// de la rúbrica real que usa readinessRubricAgent.js -- este servicio genera
// cada plantilla en Markdown a partir de READINESS_RUBRICS
// (backend/src/config/readinessRubrics.js), la misma fuente de verdad que
// arma el prompt de evaluación. Así la plantilla siempre pide exactamente lo
// que el agente va a evaluar, sin duplicar ni inventar contenido nuevo.
import { READINESS_RUBRICS } from '../config/readinessRubrics.js';

const LIST_FIELDS = [
  ['estructuraEsperada', 'Estructura / secciones esperadas'],
  ['documentosEsperados', 'Documentos esperados'],
  ['validacionesMinimas', 'Validaciones mínimas'],
  ['evaluacionesMinimas', 'Evaluaciones mínimas'],
  ['revisionesMinimas', 'Revisiones mínimas'],
  ['revisionMinima', 'Revisión mínima'],
  ['reglas', 'Reglas']
];

function renderChecklist(items) {
  return items.map((item) => `- [ ] ${item}`).join('\n');
}

function renderCriteriaTable(criterios) {
  const rows = criterios.map((c) => `| ${c.nombre} | ${c.peso} |`).join('\n');
  return `| Criterio | Peso |\n|---|---:|\n${rows}`;
}

const FOOTER = [
  '---',
  '',
  '_Plantilla generada automáticamente a partir de la rúbrica vigente de la plataforma. No constituye asesoría legal, fiscal, financiera ni ambiental — es una guía de trabajo para preparar el documento antes de subirlo a revisión._'
].join('\n');

function buildFromRubric(rubricKey, title, intro) {
  const rubric = READINESS_RUBRICS[rubricKey];
  const lines = [`# Plantilla: ${title}`, '', '> Complete cada sección antes de subir el documento. Las casillas son una guía de trabajo, no se guardan en la plataforma.', ''];
  if (intro) lines.push(intro, '');

  for (const [key, label] of LIST_FIELDS) {
    if (rubric[key]?.length) {
      lines.push(`## ${label}`, renderChecklist(rubric[key]), '');
    }
  }
  if (rubric.indicadoresMinimos?.length) {
    lines.push('## Indicadores mínimos a incluir', renderChecklist(rubric.indicadoresMinimos), '');
  }
  if (rubric.fuentesSugeridas?.length) {
    lines.push('## Fuentes sugeridas para sustentar el documento', rubric.fuentesSugeridas.map((s) => `- ${s}`).join('\n'), '');
  }
  if (rubric.marcosReferencia?.length) {
    lines.push('## Marcos de referencia contra los que se evaluará', rubric.marcosReferencia.map((s) => `- ${s}`).join('\n'), '');
  }
  if (rubric.criterios?.length) {
    lines.push('## Criterios de evaluación (peso)', renderCriteriaTable(rubric.criterios), '');
  }
  if (rubric.banderasRojas?.length) {
    lines.push('## Banderas rojas a evitar', rubric.banderasRojas.map((s) => `- ${s}`).join('\n'), '');
  }

  lines.push(FOOTER);
  return lines.join('\n');
}

// Beneficiario controlador (sección 31, plantilla 7) no tiene una rúbrica
// propia -- vive repartido entre doc_corporativa y doc_kyc. Se compone
// explícitamente de las piezas reales de ambas rúbricas, sin inventar
// criterios nuevos.
function buildBeneficiarioControlador() {
  const corporativa = READINESS_RUBRICS.doc_corporativa;
  const kyc = READINESS_RUBRICS.doc_kyc;
  const lines = [
    '# Plantilla: Beneficiario controlador',
    '',
    '> Complete cada sección antes de subir el documento. Compuesta a partir de los criterios reales de Documentación corporativa y KYC/KYB que evalúa la plataforma.',
    '',
    '## Datos mínimos a identificar',
    renderChecklist([
      'Nombre completo de cada persona física que es beneficiario controlador final',
      'Porcentaje de participación o control (directo e indirecto)',
      'Naturaleza del control (accionario, votos, capacidad de designar administración, etc.)',
      'Documento de identificación oficial vigente de cada beneficiario',
      'Estructura accionaria completa hasta llegar a personas físicas'
    ]),
    '',
    '## Screening obligatorio',
    renderChecklist(['Screening PEP (personas políticamente expuestas)', 'Screening OFAC/SDN/Consolidated List']),
    '',
    '## Criterios de evaluación relacionados (peso dentro de su rúbrica de origen)',
    renderCriteriaTable([
      ...corporativa.criterios.filter((c) => /beneficiario|accionist/i.test(c.nombre)),
      ...kyc.criterios.filter((c) => /beneficiario|screening|pep/i.test(c.nombre))
    ]),
    '',
    '## Banderas rojas a evitar',
    renderChecklist([
      'Beneficiario controlador no identificado',
      'Estructura de accionistas opaca',
      'Coincidencia positiva en listas OFAC/SDN sin aclaración'
    ]),
    '',
    FOOTER
  ];
  return lines.join('\n');
}

// Uso de recursos (sección 31, plantilla 8) tampoco tiene rúbrica propia --
// aparece como criterio dentro de plan_negocios y modelo_financiero. Mismo
// criterio de composición que beneficiario_controlador.
function buildUsoDeRecursos() {
  const planNegocios = READINESS_RUBRICS.plan_negocios;
  const modeloFinanciero = READINESS_RUBRICS.modelo_financiero;
  const lines = [
    '# Plantilla: Uso de recursos',
    '',
    '> Complete cada sección antes de subir el documento. Compuesta a partir de los criterios reales de Plan de negocios y Modelo financiero que evalúa la plataforma.',
    '',
    '## Elementos mínimos a incluir',
    renderChecklist([
      'Monto total solicitado',
      'Desglose del uso de recursos por rubro (CAPEX, OPEX, capital de trabajo, refinanciamiento, etc.)',
      'Calendario/cronograma de aplicación de los recursos',
      'Justificación de cada rubro (por qué se necesita, qué resultado produce)',
      'Consistencia explícita entre el monto solicitado, el uso de recursos y el modelo financiero'
    ]),
    '',
    '## Criterios de evaluación relacionados (peso dentro de su rúbrica de origen)',
    renderCriteriaTable([
      ...planNegocios.criterios.filter((c) => /uso de recursos|modelo financiero/i.test(c.nombre)),
      ...modeloFinanciero.criterios.filter((c) => /uso de recursos/i.test(c.nombre))
    ]),
    '',
    '## Banderas rojas a evitar',
    renderChecklist([
      'Uso de recursos no explicado',
      'Uso de recursos no coincide con monto solicitado',
      'Contradicción entre monto solicitado, uso de recursos y modelo financiero'
    ]),
    '',
    FOOTER
  ];
  return lines.join('\n');
}

// Reporte ejecutivo de proyecto (sección 31, plantilla 12): no evalúa un
// documento del checklist, es una guía para que el solicitante arme SU
// PROPIO resumen antes de presentarse -- distinto del reporte que la
// plataforma genera automáticamente (readinessMemoService.js). Estructura
// tomada literalmente de la sección 22.1 del plan ("Reporte ejecutivo para
// solicitante"), no inventada.
function buildReporteEjecutivo() {
  const lines = [
    '# Plantilla: Reporte ejecutivo de proyecto',
    '',
    '> Guía para preparar un resumen ejecutivo propio del proyecto, complementario al reporte que la plataforma genera automáticamente sobre el expediente cargado.',
    '',
    '## Estructura sugerida (2 a 4 páginas)',
    renderChecklist([
      'Score global y nivel de preparación (referencia al que reporta la plataforma)',
      'Resumen de hallazgos principales',
      'Faltantes críticos identificados',
      'Recomendaciones y plan de corrección',
      'Tabla de estado de documentos del checklist',
      'Próximos pasos y fecha objetivo para completar el expediente'
    ]),
    '',
    FOOTER
  ];
  return lines.join('\n');
}

// Catálogo de las 12 plantillas de la sección 31 del plan. `code` es el
// identificador estable usado en la URL de descarga.
export const READINESS_TEMPLATES = [
  { code: 'plan_negocios', title: 'Plan de negocios', build: () => buildFromRubric('plan_negocios', 'Plan de negocios') },
  { code: 'estudio_viabilidad', title: 'Estudio de viabilidad', build: () => buildFromRubric('estudio_viabilidad', 'Estudio de viabilidad') },
  { code: 'estudio_mercado', title: 'Estudio de mercado y marketing', build: () => buildFromRubric('estudio_mercado', 'Estudio de mercado y marketing') },
  { code: 'matriz_riesgos', title: 'Matriz de riesgos', build: () => buildFromRubric('marco_riesgos', 'Matriz de riesgos') },
  { code: 'modelo_financiero', title: 'Modelo financiero y proyecciones', build: () => buildFromRubric('modelo_financiero', 'Modelo financiero y proyecciones') },
  { code: 'estructura_corporativa', title: 'Estructura corporativa', build: () => buildFromRubric('doc_corporativa', 'Estructura corporativa') },
  { code: 'beneficiario_controlador', title: 'Beneficiario controlador', build: buildBeneficiarioControlador },
  { code: 'uso_de_recursos', title: 'Uso de recursos', build: buildUsoDeRecursos },
  { code: 'esg_impacto', title: 'ESG & Impact Financing', build: () => buildFromRubric('esg', 'ESG & Impact Financing') },
  { code: 'alineacion_ods', title: 'Alineación con ODS ONU', build: () => buildFromRubric('ods', 'Alineación con ODS ONU') },
  { code: 'checklist_ambiental', title: 'Impacto ambiental, social y gobernanza', build: () => buildFromRubric('esia', 'Impacto ambiental, social y gobernanza') },
  { code: 'reporte_ejecutivo', title: 'Reporte ejecutivo de proyecto', build: buildReporteEjecutivo }
];

export function listReadinessTemplates() {
  return READINESS_TEMPLATES.map(({ code, title }) => ({ code, title }));
}

export function buildReadinessTemplateMarkdown(code) {
  const template = READINESS_TEMPLATES.find((t) => t.code === code);
  if (!template) return null;
  return { title: template.title, content: template.build() };
}
