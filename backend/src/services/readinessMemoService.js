// Reporte ejecutivo del checklist de 12 Requisitos Mínimos — mismo patrón de
// líneas Markdown que buildInstitutionalMemo() en scoringEngine.js, aplicado
// al resultado de getReadinessChecklist() en readinessChecklistService.js.
import { getRubric } from '../config/readinessRubrics.js';

function itemLabel(itemId) {
  return getRubric(itemId)?.label || itemId;
}

export function buildReadinessMemo(checklistResult, order = {}) {
  const items = checklistResult.items || [];
  const total = items.length;
  const completados = items.filter((item) => item.estado === 'listo').length;
  const criticosPendientes = items.filter((item) => item.critico && item.estado !== 'listo');
  const progreso = total ? Math.round((completados / total) * 100) : 0;
  const listoParaEnviar = criticosPendientes.length === 0;

  const metadata = order.metadata || {};
  const caseNumber = order.case_number || `NSD-${String(order.id || '').slice(0, 8).toUpperCase()}`;
  const projectName = order.project_name || metadata.projectName || metadata.companyName || 'Proyecto sin nombre';

  const lines = [
    '# Reporte de Preparación — Checklist de 12 Requisitos Mínimos',
    '',
    '## 1. Resumen ejecutivo',
    `- Expediente: ${caseNumber}`,
    `- Proyecto: ${projectName}`,
    `- Completados: ${completados}/${total} (${progreso}%)`,
    `- Requisitos críticos pendientes: ${criticosPendientes.length}`,
    `- Listo para prevalidación NEXUS: ${listoParaEnviar ? 'Sí' : 'No'}`,
    '',
    '## 2. Requisitos críticos pendientes',
    ...(criticosPendientes.length ? criticosPendientes.map((item) => `- ${itemLabel(item.id)}`) : ['- Ninguno.']),
    '',
    '## 3. Detalle por requisito',
    ...items.flatMap((item) => {
      const label = itemLabel(item.id);
      const estadoLabel = item.estado === 'listo' ? 'Listo' : item.enRevision ? 'En revisión' : 'Pendiente';
      const scoreLine = item.reviewScore != null ? ` — Score IA: ${item.reviewScore}/100` : '';
      const findingsLines = (item.reviewFindings || []).slice(0, 3).map((finding) => `  - ${finding}`);
      return [`- **${label}**${item.critico ? ' (crítico)' : ''}: ${estadoLabel}${scoreLine}`, ...findingsLines];
    }),
    '',
    '## 4. Nota de alcance',
    'Este reporte refleja el estado del checklist de 12 Requisitos Mínimos y, cuando hay documento real cargado, el resultado de un agente de IA especializado por rúbrica. No constituye aprobación crediticia, opinión legal/fiscal/financiera ni dictamen vinculante de una entidad otorgante.',
    '',
    `Generado: ${new Date().toLocaleString('es-MX')}`
  ];

  return {
    globalProgress: progreso,
    completados,
    total,
    criticalPending: criticosPendientes.length,
    readyToSubmit: listoParaEnviar,
    memo: {
      title: `Reporte de Preparación ${caseNumber}`,
      format: 'markdown',
      content: lines.join('\n')
    }
  };
}
