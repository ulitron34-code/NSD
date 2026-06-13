// ============================================
// NSD PLATFORM - EXPORT SERVICE
// PDF/CSV/Excel Export Functionality
// ============================================

import { uiText } from './runtimeCopy';
import { apiLogger } from './logger';

/**
 * Convert data to CSV format
 */
export function convertToCSV(data, headers) {
  if (!data || data.length === 0) return '';
  
  const headerRow = headers.map(h => `"${h.label}"`).join(',');
  const rows = data.map(row => 
    headers.map(h => {
      let value = row[h.key] ?? '';
      // Handle objects/nested values
      if (typeof value === 'object') {
        value = JSON.stringify(value);
      }
      // Escape quotes and wrap in quotes
      value = String(value).replace(/"/g, '""');
      return `"${value}"`;
    }).join(',')
  );
  
  return [headerRow, ...rows].join('\n');
}

/**
 * Download a file
 */
export function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export data as CSV
 */
export function exportToCSV(data, filename, headers, language = 'es') {
  const csv = convertToCSV(data, headers);
  downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
  apiLogger.success('Export', `Exported ${data.length} rows to CSV`);
}

/**
 * Export data as JSON
 */
export function exportToJSON(data, filename) {
  const json = JSON.stringify(data, null, 2);
  downloadFile(json, `${filename}.json`, 'application/json');
  apiLogger.success('Export', `Exported ${data.length} items to JSON`);
}

/**
 * Generate a simple PDF report using browser print
 */
export function exportToPDF(reportData, filename, options = {}) {
  const {
    title = 'NSD Report',
    subtitle = '',
    dateFormat = 'long'
  } = options;
  
  const date = new Date().toLocaleDateString('es-MX', { 
    year: 'numeric', 
    month: dateFormat === 'short' ? 'short' : 'long', 
    day: 'numeric' 
  });
  
  // Create HTML for print
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1E293B; }
        .header { border-bottom: 3px solid #C9A227; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #0F1F2E; font-size: 24px; margin-bottom: 5px; }
        .header .subtitle { color: #64748B; font-size: 14px; }
        .header .date { color: #64748B; font-size: 12px; margin-top: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #0F1F2E; color: white; padding: 12px 10px; text-align: left; font-size: 12px; }
        td { padding: 10px; border-bottom: 1px solid #E2E8F0; font-size: 13px; }
        tr:nth-child(even) { background: #F8FAFC; }
        .summary { margin-top: 30px; padding: 20px; background: #F8FAFC; border-radius: 8px; }
        .summary h3 { color: #0F1F2E; margin-bottom: 10px; }
        .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .summary-item { text-align: center; }
        .summary-item .value { font-size: 24px; font-weight: bold; color: #C9A227; }
        .summary-item .label { font-size: 12px; color: #64748B; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E2E8F0; font-size: 11px; color: #64748B; text-align: center; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
        <div class="date">Generado: ${date}</div>
      </div>
      
      ${reportData.table ? `
        <table>
          <thead>
            <tr>${reportData.table.headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${reportData.table.rows.map(row => `
              <tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}
      
      ${reportData.summary ? `
        <div class="summary">
          <h3>Resumen / Summary</h3>
          <div class="summary-grid">
            ${reportData.summary.map(item => `
              <div class="summary-item">
                <div class="value">${item.value}</div>
                <div class="label">${item.label}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      <div class="footer">
        <p>NSD Platform - Compliance as a Service | NSD.com</p>
        <p>Este documento es confidencial y esta protegido por medidas de seguridad.</p>
      </div>
    </body>
    </html>
  `;
  
  // Open print dialog
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
    apiLogger.success('Export', `PDF report generated: ${title}`);
  }
}

/**
 * Export expediente details as PDF
 */
export function exportExpedientePDF(expediente, language = 'es') {
  const L = (es, en) => uiText({ language }, es, en);
  
  const reportData = {
    summary: [
      { value: expediente.id?.slice(0, 8) || 'N/A', label: L('Expediente ID', 'File ID') },
      { value: expediente.averageScore || 'N/A', label: L('Score', 'Score') },
      { value: expediente.status || L('En revisión', 'In review'), label: L('Estado', 'Status') },
    ],
    table: {
      headers: [
        L('Campo', 'Field'),
        L('Valor', 'Value')
      ],
      rows: [
        [L('Nombre del proyecto', 'Project name'), expediente.name || 'N/A'],
        [L('Solicitante', 'Applicant'), expediente.applicant || 'N/A'],
        [L('Sector', 'Sector'), expediente.sector || 'N/A'],
        [L('País', 'Country'), expediente.country || 'N/A'],
        [L('Monto solicitado', 'Requested amount'), expediente.amountLabel || 'N/A'],
        [L('Uso de fondos', 'Use of funds'), expediente.useOfFunds || 'N/A'],
        [L('Riesgo', 'Risk'), expediente.risk || 'N/A'],
        [L('Fecha de creación', 'Creation date'), expediente.createdAt ? new Date(expediente.createdAt).toLocaleDateString() : 'N/A'],
      ]
    }
  };
  
  exportToPDF(reportData, `expediente-${expediente.id}`, {
    title: L('Reporte de Expediente', 'File Report'),
    subtitle: expediente.name || '',
  });
}

/**
 * Export pipeline as CSV
 */
export function exportPipelineCSV(pipeline, language = 'es') {
  const headers = [
    { key: 'id', label: L('ID', 'ID') },
    { key: 'name', label: L('Proyecto', 'Project') },
    { key: 'applicant', label: L('Solicitante', 'Applicant') },
    { key: 'sector', label: L('Sector', 'Sector') },
    { key: 'amountLabel', label: L('Monto', 'Amount') },
    { key: 'averageScore', label: L('Score', 'Score') },
    { key: 'risk', label: L('Riesgo', 'Risk') },
    { key: 'status', label: L('Estado', 'Status') },
    { key: 'gate', label: L('Gate', 'Gate') },
    { key: 'createdAt', label: L('Fecha', 'Date') },
  ];
  
  const data = pipeline.map(item => ({
    ...item,
    createdAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '',
  }));
  
  exportToCSV(data, `pipeline-${new Date().toISOString().split('T')[0]}`, headers, language);
}

export default {
  convertToCSV,
  downloadFile,
  exportToCSV,
  exportToJSON,
  exportToPDF,
  exportExpedientePDF,
  exportPipelineCSV,
};