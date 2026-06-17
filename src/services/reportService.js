import { error, debug, info, warn } from '../utils/logger';
import { escapeHtml as esc } from '../utils/htmlEscape';
// ============================================
// GENERADOR DE REPORTES
// Crea PDF/HTML/Markdown de expedientes
// ============================================

export function generateExpedienteReport(expedient, score, documents, requirements) {
  const timestamp = new Date().toLocaleString('es-MX');
  const reportId = `REPORT-${Date.now()}`;

  return {
    id: reportId,
    title: `Reporte de Expediente: ${expedient?.name || 'Sin nombre'}`,
    timestamp,
    format: 'html',
    html: buildExpedienteHTML(expedient, score, documents, requirements, timestamp, reportId)
  };
}

function buildExpedienteHTML(expedient, score, documents, requirements, timestamp, reportId) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte de Expediente</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      max-width: 900px;
      margin: 0 auto;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 3px solid #0F1F2E;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    h1 {
      color: #0F1F2E;
      margin: 0 0 10px 0;
      font-size: 24px;
    }
    .meta {
      color: #666;
      font-size: 12px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      background: #0F1F2E;
      color: white;
      padding: 10px 15px;
      border-radius: 4px;
      font-weight: 700;
      margin-bottom: 15px;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .score-card {
      background: linear-gradient(135deg, #0F1F2E 0%, #1B3A5C 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .score-value {
      font-size: 48px;
      font-weight: 800;
      margin: 10px 0;
    }
    .score-status {
      display: inline-block;
      padding: 8px 16px;
      background: white;
      border-radius: 4px;
      font-weight: 700;
      margin-top: 10px;
    }
    .score-status.verde {
      color: #2E7D32;
    }
    .score-status.amarillo {
      color: #F59E0B;
    }
    .score-status.rojo {
      color: #C62828;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 20px;
    }
    .info-item {
      background: #f9f9f9;
      padding: 12px;
      border-left: 3px solid #C9A84C;
      border-radius: 4px;
    }
    .info-label {
      color: #666;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .info-value {
      color: #0F1F2E;
      font-weight: 700;
      font-size: 14px;
    }
    .breakdown {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 15px;
    }
    .breakdown-item {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 10px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }
    .breakdown-item:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    .breakdown-category {
      font-weight: 700;
      color: #0F1F2E;
    }
    .breakdown-score {
      text-align: right;
      color: #C9A84C;
      font-weight: 700;
    }
    .progress-bar {
      background: #e0e0e0;
      height: 8px;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 5px;
    }
    .progress-fill {
      height: 100%;
      background: #C9A84C;
      border-radius: 4px;
    }
    .document-list {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 4px;
    }
    .document-item {
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .document-item:last-child {
      border-bottom: none;
    }
    .document-status {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 700;
      margin-left: 10px;
    }
    .status-approved {
      background: rgba(46, 125, 50, 0.2);
      color: #2E7D32;
    }
    .status-pending {
      background: rgba(255, 152, 0, 0.2);
      color: #F59E0B;
    }
    .next-steps {
      background: #E8F5E9;
      border-left: 4px solid #2E7D32;
      padding: 15px;
      border-radius: 4px;
      margin-top: 20px;
    }
    .next-steps h3 {
      margin: 0 0 10px 0;
      color: #2E7D32;
      font-size: 14px;
    }
    .next-steps ul {
      margin: 0;
      padding-left: 20px;
      color: #333;
    }
    .next-steps li {
      margin-bottom: 5px;
    }
    .footer {
      border-top: 1px solid #eee;
      padding-top: 20px;
      margin-top: 30px;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .container {
        box-shadow: none;
        margin: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Reporte de Expediente</h1>
      <div class="meta">
        <p>Generado: ${esc(timestamp)}</p>
        <p>ID: ${esc(reportId)}</p>
      </div>
    </div>

    <!-- INFORMACIÓN GENERAL -->
    <div class="section">
      <div class="section-title">📋 Información General</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Proyecto</div>
          <div class="info-value">${esc(expedient?.name) || 'N/A'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Solicitante</div>
          <div class="info-value">${esc(expedient?.applicant) || 'N/A'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Sector</div>
          <div class="info-value">${esc(expedient?.sector) || 'N/A'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Monto Solicitado</div>
          <div class="info-value">${esc(expedient?.amountLabel) || 'N/A'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Riesgo</div>
          <div class="info-value">${esc(expedient?.risk) || 'N/A'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Estado</div>
          <div class="info-value">${esc(expedient?.status) || 'N/A'}</div>
        </div>
      </div>
    </div>

    <!-- PUNTUACIÓN -->
    <div class="section">
      <div class="section-title">🎯 Evaluación y Puntuación</div>
      ${score ? `
      <div class="score-card">
        <div>Puntuación Total</div>
        <div class="score-value">${score.totalScore}/100</div>
        <span class="score-status ${esc(score.status.toLowerCase())}">${esc(score.status)}</span>
      </div>
      <div class="breakdown">
        ${score.breakdown.map(item => `
        <div class="breakdown-item">
          <div class="breakdown-category">${esc(item.category)}</div>
          <div class="breakdown-score">${item.earned}/${item.weight}</div>
        </div>
        <div style="grid-column: 1/-1;">
          <small style="color: #666;">${esc(item.detail)}</small>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${(item.earned / item.weight) * 100}%"></div>
          </div>
        </div>
        `).join('')}
      </div>
      ${score.nextActions.length > 0 ? `
      <div class="next-steps">
        <h3>📌 Próximos Pasos</h3>
        <ul>
          ${score.nextActions.map(action => `<li>${esc(action)}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
      ` : '<p>Sin evaluación disponible</p>'}
    </div>

    <!-- DOCUMENTOS -->
    <div class="section">
      <div class="section-title">📄 Documentos Cargados</div>
      ${documents && documents.length > 0 ? `
      <div class="document-list">
        ${documents.map(doc => `
        <div class="document-item">
          <strong>${esc(doc.filename || doc.name)}</strong>
          <span class="document-status ${doc.status === 'approved' ? 'status-approved' : 'status-pending'}">
            ${doc.status === 'approved' ? 'Aprobado' : 'Pendiente'}
          </span>
          <br/>
          <small style="color: #666;">Riesgo: ${esc(doc.risk) || 'N/A'} | Revisor: ${esc(doc.reviewer) || 'N/A'}</small>
        </div>
        `).join('')}
      </div>
      ` : '<p>Sin documentos cargados</p>'}
    </div>

    <!-- REQUERIMIENTOS -->
    <div class="section">
      <div class="section-title">📬 Requerimientos y Solicitudes</div>
      ${requirements && requirements.length > 0 ? `
      <div class="document-list">
        ${requirements.map(req => `
        <div class="document-item">
          <strong>${esc(req.title)}</strong>
          <span class="document-status ${req.status === 'approved' ? 'status-approved' : 'status-pending'}">
            ${req.status === 'approved' ? 'Aprobado' : 'Pendiente'}
          </span>
          <br/>
          <small style="color: #666;">Prioridad: ${esc(req.priority) || 'normal'} | Creado: ${new Date(req.createdAt).toLocaleDateString('es-MX')}</small>
          ${req.dueDate ? `<br/><small style="color: #666;">Vencimiento: ${new Date(req.dueDate).toLocaleDateString('es-MX')}</small>` : ''}
        </div>
        `).join('')}
      </div>
      ` : '<p>Sin requerimientos pendientes</p>'}
    </div>

    <div class="footer">
      <p>Este reporte fue generado automáticamente por el sistema NSD.</p>
      <p>Para más información, contacte al administrador de cumplimiento.</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Descargar HTML como archivo
export function downloadReport(report) {
  const element = document.createElement('a');
  const file = new Blob([report.html], { type: 'text/html' });
  element.href = URL.createObjectURL(file);
  element.download = `${report.id}.html`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  URL.revokeObjectURL(element.href);
}

// Abrir en nueva ventana para imprimir
export function printReport(report) {
  const printWindow = window.open('', '', 'height=600,width=800');
  printWindow.document.write(report.html);
  printWindow.document.close();
  printWindow.print();
}

// Enviar como Email (requeriría backend)
export function sendReportByEmail(report, email) {
  debug("SVC", `Enviar reporte ${report.id} a ${email}`);
  // Aquí iría una llamada a API para enviar el email
  return Promise.resolve({
    success: true,
    message: `Reporte enviado a ${email}`
  });
}
