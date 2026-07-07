// Reporte ejecutivo del checklist de 12 Requisitos Mínimos — mismo patrón de
// líneas Markdown que buildInstitutionalMemo() en scoringEngine.js, aplicado
// al resultado de getReadinessChecklist() en readinessChecklistService.js.
// buildReadinessMemo() (Markdown) y buildReadinessMemoPdf() (PDF) comparten
// los mismos datos vía assembleReadinessReport() para no duplicar el cálculo
// de progreso/críticos pendientes.
import PDFDocument from 'pdfkit';
import { getRubric, READINESS_MODULE_WEIGHTS, computeWeightedGlobalScore } from '../config/readinessRubrics.js';

const SCOPE_NOTE = 'Este reporte refleja el estado del checklist de 12 Requisitos Mínimos y, cuando hay documento real cargado, el resultado de un agente de IA especializado por rúbrica. No constituye aprobación crediticia, opinión legal/fiscal/financiera ni dictamen vinculante de una entidad otorgante.';
const TECHNICAL_SCOPE_NOTE = 'Este reporte técnico refleja el estado documental y las evaluaciones de IA disponibles al momento de su generación. Es una herramienta de apoyo a due diligence, no un dictamen legal, fiscal, financiero ni una aprobación de crédito. La decisión final corresponde al analista/comité del otorgante.';

function itemLabel(itemId, country) {
  return getRubric(itemId, country)?.label || itemId;
}

function assembleReadinessReport(checklistResult, order = {}) {
  const items = checklistResult.items || [];
  const country = checklistResult.country || order?.metadata?.country || 'MX';
  const total = items.length;
  const completados = items.filter((item) => item.estado === 'listo').length;
  const criticosPendientes = items.filter((item) => item.critico && item.estado !== 'listo');
  const progreso = total ? Math.round((completados / total) * 100) : 0;
  const listoParaEnviar = criticosPendientes.length === 0;

  const metadata = order.metadata || {};
  const caseNumber = order.case_number || `NSD-${String(order.id || '').slice(0, 8).toUpperCase()}`;
  const projectName = order.project_name || metadata.projectName || metadata.companyName || 'Proyecto sin nombre';

  const detalle = items.map((item) => ({
    id: item.id,
    label: itemLabel(item.id, country),
    critico: Boolean(item.critico),
    estadoLabel: item.estado === 'listo' ? 'Listo' : item.enRevision ? 'En revisión' : 'Pendiente',
    reviewScore: item.reviewScore != null ? item.reviewScore : null,
    reviewSummary: item.reviewSummary || null,
    recommendation: item.recommendation || null,
    structureScore: item.structureScore != null ? item.structureScore : null,
    weight: READINESS_MODULE_WEIGHTS[item.id] ?? null,
    findings: (item.reviewFindings || []).slice(0, 3)
  }));

  return {
    caseNumber,
    projectName,
    country,
    total,
    completados,
    progreso,
    listoParaEnviar,
    criticosPendientesLabels: criticosPendientes.map((item) => itemLabel(item.id, country)),
    globalScore: checklistResult.globalScore || computeWeightedGlobalScore(items),
    detalle
  };
}

export function buildReadinessMemo(checklistResult, order = {}) {
  const data = assembleReadinessReport(checklistResult, order);

  const lines = [
    '# Reporte de Preparación — Checklist de 12 Requisitos Mínimos',
    '',
    '## 1. Resumen ejecutivo',
    `- Expediente: ${data.caseNumber}`,
    `- Proyecto: ${data.projectName}`,
    `- País: ${data.country}`,
    `- Score global ponderado: ${data.globalScore.score}/100 — ${data.globalScore.label}`,
    `- Completados: ${data.completados}/${data.total} (${data.progreso}%)`,
    `- Requisitos críticos pendientes: ${data.criticosPendientesLabels.length}`,
    `- Listo para prevalidación NEXUS: ${data.listoParaEnviar ? 'Sí' : 'No'}`,
    '',
    '## 2. Requisitos críticos pendientes',
    ...(data.criticosPendientesLabels.length ? data.criticosPendientesLabels.map((label) => `- ${label}`) : ['- Ninguno.']),
    '',
    '## 3. Detalle por requisito',
    ...data.detalle.flatMap((item) => {
      const scoreLine = item.reviewScore != null ? ` — Score IA: ${item.reviewScore}/100` : '';
      const findingsLines = item.findings.map((finding) => `  - ${finding}`);
      return [`- **${item.label}**${item.critico ? ' (crítico)' : ''}: ${item.estadoLabel}${scoreLine}`, ...findingsLines];
    }),
    '',
    '## 4. Nota de alcance',
    SCOPE_NOTE,
    '',
    `Generado: ${new Date().toLocaleString('es-MX')}`
  ];

  return {
    globalProgress: data.progreso,
    completados: data.completados,
    total: data.total,
    criticalPending: data.criticosPendientesLabels.length,
    readyToSubmit: data.listoParaEnviar,
    memo: {
      title: `Reporte de Preparación ${data.caseNumber}`,
      format: 'markdown',
      content: lines.join('\n')
    }
  };
}

export function buildReadinessMemoPdf(checklistResult, order = {}) {
  const data = assembleReadinessReport(checklistResult, order);

  const doc = new PDFDocument({ margin: 50, size: 'letter' });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  const finished = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  doc.font('Helvetica-Bold').fontSize(16)
    .text('Reporte de Preparación — Checklist de 12 Requisitos Mínimos');
  doc.moveDown(1);

  doc.font('Helvetica-Bold').fontSize(12).text('1. Resumen ejecutivo');
  doc.font('Helvetica').fontSize(10);
  doc.text(`Expediente: ${data.caseNumber}`);
  doc.text(`Proyecto: ${data.projectName}`);
  doc.text(`País: ${data.country}`);
  doc.text(`Score global ponderado: ${data.globalScore.score}/100 — ${data.globalScore.label}`);
  doc.text(`Completados: ${data.completados}/${data.total} (${data.progreso}%)`);
  doc.text(`Requisitos críticos pendientes: ${data.criticosPendientesLabels.length}`);
  doc.text(`Listo para prevalidación NEXUS: ${data.listoParaEnviar ? 'Sí' : 'No'}`);
  doc.moveDown(1);

  doc.font('Helvetica-Bold').fontSize(12).text('2. Requisitos críticos pendientes');
  doc.font('Helvetica').fontSize(10);
  if (data.criticosPendientesLabels.length) {
    data.criticosPendientesLabels.forEach((label) => doc.text(`• ${label}`));
  } else {
    doc.text('Ninguno.');
  }
  doc.moveDown(1);

  doc.font('Helvetica-Bold').fontSize(12).text('3. Detalle por requisito');
  data.detalle.forEach((item) => {
    const scoreLine = item.reviewScore != null ? ` — Score IA: ${item.reviewScore}/100` : '';
    doc.moveDown(0.4);
    doc.font('Helvetica-Bold').fontSize(10)
      .text(`${item.label}${item.critico ? ' (crítico)' : ''}: ${item.estadoLabel}${scoreLine}`);
    doc.font('Helvetica').fontSize(9);
    item.findings.forEach((finding) => doc.text(`- ${finding}`, { indent: 12 }));
  });
  doc.moveDown(1);

  doc.font('Helvetica-Bold').fontSize(12).text('4. Nota de alcance');
  doc.font('Helvetica').fontSize(9).text(SCOPE_NOTE);
  doc.moveDown(1);
  doc.fontSize(8).text(`Generado: ${new Date().toLocaleString('es-MX')}`);

  doc.end();

  return finished.then((buffer) => ({
    globalProgress: data.progreso,
    completados: data.completados,
    total: data.total,
    criticalPending: data.criticosPendientesLabels.length,
    readyToSubmit: data.listoParaEnviar,
    caseNumber: data.caseNumber,
    buffer
  }));
}

function inconsistencyLines(inconsistencies) {
  if (!inconsistencies?.length) return ['Ninguna contradicción detectada entre los documentos evaluados hasta el momento.'];
  return inconsistencies.map((inc) => `"${inc.field || inc.cross_reference_type}": ${inc.message || inc.details || 'sin detalle'}`);
}

// Reporte técnico (sección 22.2 del plan) -- más extenso que el ejecutivo del
// solicitante: incluye score por módulo con su peso, resumen/recomendación
// por documento y las contradicciones reales detectadas entre documentos.
// Pensado para el otorgante, pero accesible con el mismo control de acceso
// que memo.md/memo.pdf (dueño del expediente u otorgante autorizado).
export function buildReadinessTechnicalMemo(checklistResult, order = {}, inconsistencies = []) {
  const data = assembleReadinessReport(checklistResult, order);
  const inconLines = inconsistencyLines(inconsistencies);

  const lines = [
    '# Reporte Técnico de Due Diligence — Para uso del Otorgante',
    '',
    '## 1. Resumen ejecutivo',
    `- Expediente: ${data.caseNumber}`,
    `- Proyecto: ${data.projectName}`,
    `- País: ${data.country}`,
    `- Score global ponderado: ${data.globalScore.score}/100 — ${data.globalScore.label}`,
    `- Clasificación/acción sugerida: ${data.globalScore.action}`,
    `- Completados: ${data.completados}/${data.total} (${data.progreso}%)`,
    `- Requisitos críticos pendientes: ${data.criticosPendientesLabels.length}`,
    '',
    '## 2. Score por módulo (ponderado)',
    ...data.detalle.map((item) => {
      const score = item.reviewScore != null ? `${item.reviewScore}/100` : 'sin evaluar';
      const peso = item.weight != null ? `${item.weight}%` : 'n/d';
      return `- ${item.label}${item.critico ? ' (crítico)' : ''} — peso ${peso} — score ${score}`;
    }),
    '',
    '## 3. Análisis documental detallado',
    ...data.detalle.flatMap((item) => {
      const scoreLine = item.reviewScore != null ? ` — Score IA: ${item.reviewScore}/100` : '';
      const structureLine = item.structureScore != null ? ` — Score estructural: ${item.structureScore}/100` : '';
      const summaryLines = item.reviewSummary ? [`  - Resumen: ${item.reviewSummary}`] : [];
      const findingsLines = item.findings.map((f) => `  - Hallazgo: ${f}`);
      const recommendationLines = item.recommendation ? [`  - Recomendación: ${item.recommendation}`] : [];
      return [
        `- **${item.label}**${item.critico ? ' (crítico)' : ''}: ${item.estadoLabel}${scoreLine}${structureLine}`,
        ...summaryLines,
        ...findingsLines,
        ...recommendationLines
      ];
    }),
    '',
    '## 4. Inconsistencias detectadas entre documentos',
    ...inconLines.map((line) => `- ${line}`),
    '',
    '## 5. Nota de alcance',
    TECHNICAL_SCOPE_NOTE,
    '',
    `Generado: ${new Date().toLocaleString('es-MX')}`
  ];

  return {
    globalScore: data.globalScore,
    globalProgress: data.progreso,
    readyToSubmit: data.listoParaEnviar,
    memo: {
      title: `Reporte Técnico ${data.caseNumber}`,
      format: 'markdown',
      content: lines.join('\n')
    }
  };
}

export function buildReadinessTechnicalMemoPdf(checklistResult, order = {}, inconsistencies = []) {
  const data = assembleReadinessReport(checklistResult, order);
  const inconLines = inconsistencyLines(inconsistencies);

  const doc = new PDFDocument({ margin: 50, size: 'letter' });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  const finished = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  doc.font('Helvetica-Bold').fontSize(16).text('Reporte Técnico de Due Diligence — Para uso del Otorgante');
  doc.moveDown(1);

  doc.font('Helvetica-Bold').fontSize(12).text('1. Resumen ejecutivo');
  doc.font('Helvetica').fontSize(10);
  doc.text(`Expediente: ${data.caseNumber}`);
  doc.text(`Proyecto: ${data.projectName}`);
  doc.text(`País: ${data.country}`);
  doc.text(`Score global ponderado: ${data.globalScore.score}/100 — ${data.globalScore.label}`);
  doc.text(`Clasificación/acción sugerida: ${data.globalScore.action}`);
  doc.text(`Completados: ${data.completados}/${data.total} (${data.progreso}%)`);
  doc.text(`Requisitos críticos pendientes: ${data.criticosPendientesLabels.length}`);
  doc.moveDown(1);

  doc.font('Helvetica-Bold').fontSize(12).text('2. Score por módulo (ponderado)');
  doc.font('Helvetica').fontSize(9);
  data.detalle.forEach((item) => {
    const score = item.reviewScore != null ? `${item.reviewScore}/100` : 'sin evaluar';
    const peso = item.weight != null ? `${item.weight}%` : 'n/d';
    doc.text(`• ${item.label}${item.critico ? ' (crítico)' : ''} — peso ${peso} — score ${score}`);
  });
  doc.moveDown(1);

  doc.font('Helvetica-Bold').fontSize(12).text('3. Análisis documental detallado');
  data.detalle.forEach((item) => {
    const scoreLine = item.reviewScore != null ? ` — Score IA: ${item.reviewScore}/100` : '';
    const structureLine = item.structureScore != null ? ` — Score estructural: ${item.structureScore}/100` : '';
    doc.moveDown(0.4);
    doc.font('Helvetica-Bold').fontSize(10)
      .text(`${item.label}${item.critico ? ' (crítico)' : ''}: ${item.estadoLabel}${scoreLine}${structureLine}`);
    doc.font('Helvetica').fontSize(9);
    if (item.reviewSummary) doc.text(`Resumen: ${item.reviewSummary}`, { indent: 12 });
    item.findings.forEach((f) => doc.text(`Hallazgo: ${f}`, { indent: 12 }));
    if (item.recommendation) doc.text(`Recomendación: ${item.recommendation}`, { indent: 12 });
  });
  doc.moveDown(1);

  doc.font('Helvetica-Bold').fontSize(12).text('4. Inconsistencias detectadas entre documentos');
  doc.font('Helvetica').fontSize(9);
  inconLines.forEach((line) => doc.text(`• ${line}`));
  doc.moveDown(1);

  doc.font('Helvetica-Bold').fontSize(12).text('5. Nota de alcance');
  doc.font('Helvetica').fontSize(9).text(TECHNICAL_SCOPE_NOTE);
  doc.moveDown(1);
  doc.fontSize(8).text(`Generado: ${new Date().toLocaleString('es-MX')}`);

  doc.end();

  return finished.then((buffer) => ({
    globalScore: data.globalScore,
    globalProgress: data.progreso,
    readyToSubmit: data.listoParaEnviar,
    caseNumber: data.caseNumber,
    buffer
  }));
}
