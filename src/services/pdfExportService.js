// ============================================
// SERVICIO DE EXPORTACIÓN A PDF
// Genera PDFs profesionales de expedientes
// ============================================

export async function generateExpedientePDF(expediente, requirements, documents, messages) {
  try {
    // Crear HTML para PDF
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${expediente.title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 40px;
              max-width: 900px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #0F1F2E;
              padding-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              color: #0F1F2E;
              font-size: 28px;
            }
            .header p {
              margin: 5px 0;
              color: #666;
              font-size: 14px;
            }
            .section {
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            .section h2 {
              color: #1B3A5C;
              border-left: 4px solid #C9A84C;
              padding-left: 12px;
              margin-bottom: 15px;
              font-size: 18px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 20px;
            }
            .info-item {
              background: #f5f5f5;
              padding: 12px;
              border-radius: 6px;
            }
            .info-label {
              font-weight: bold;
              color: #0F1F2E;
              font-size: 12px;
              text-transform: uppercase;
              margin-bottom: 5px;
            }
            .info-value {
              color: #333;
              font-size: 14px;
            }
            .status-badge {
              display: inline-block;
              padding: 6px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
            }
            .status-activo {
              background: #E8F5E9;
              color: #2E7D32;
            }
            .status-pausado {
              background: #FFF3CD;
              color: #F57F17;
            }
            .status-cerrado {
              background: #FFEBEE;
              color: #C62828;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th {
              background: #f5f5f5;
              color: #0F1F2E;
              padding: 12px;
              text-align: left;
              font-weight: bold;
              border-bottom: 2px solid #ddd;
            }
            td {
              padding: 10px 12px;
              border-bottom: 1px solid #ddd;
            }
            tr:nth-child(even) {
              background: #f9f9f9;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin-bottom: 20px;
            }
            .stat-card {
              background: #f5f5f5;
              padding: 15px;
              border-radius: 6px;
              text-align: center;
              border-top: 3px solid #C9A84C;
            }
            .stat-number {
              font-size: 24px;
              font-weight: bold;
              color: #0F1F2E;
            }
            .stat-label {
              font-size: 12px;
              color: #666;
              margin-top: 5px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #666;
              font-size: 12px;
              text-align: center;
            }
            .activity-item {
              margin-bottom: 15px;
              padding-bottom: 15px;
              border-bottom: 1px solid #eee;
            }
            .activity-item:last-child {
              border-bottom: none;
            }
            .activity-icon {
              font-size: 16px;
              margin-right: 10px;
            }
            .activity-time {
              font-size: 12px;
              color: #999;
              margin-top: 5px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${expediente.title}</h1>
            <p>ID: ${expediente.id}</p>
            <p>Generado: ${new Date().toLocaleDateString('es-MX')}</p>
          </div>

          <!-- INFORMACIÓN GENERAL -->
          <div class="section">
            <h2>Información del Expediente</h2>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Solicitante</div>
                <div class="info-value">${expediente.solicitanteName}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Otorgante</div>
                <div class="info-value">${expediente.otorganteName}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Monto</div>
                <div class="info-value">$${(expediente.amount || 0).toLocaleString()}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Sector</div>
                <div class="info-value">${expediente.sector}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Estado</div>
                <div class="info-value">
                  <span class="status-badge status-${expediente.status}">
                    ${expediente.status}
                  </span>
                </div>
              </div>
              <div class="info-item">
                <div class="info-label">Creado</div>
                <div class="info-value">${new Date(expediente.createdAt).toLocaleDateString('es-MX')}</div>
              </div>
            </div>
          </div>

          <!-- ESTADÍSTICAS -->
          <div class="section">
            <h2>Resumen de Actividad</h2>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-number">${documents.length}</div>
                <div class="stat-label">Documentos</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${requirements.length}</div>
                <div class="stat-label">Requerimientos</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${messages.length}</div>
                <div class="stat-label">Mensajes</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${Math.ceil((new Date() - new Date(expediente.createdAt)) / (1000 * 60 * 60 * 24))}</div>
                <div class="stat-label">Días en proceso</div>
              </div>
            </div>
          </div>

          <!-- DOCUMENTOS -->
          <div class="section">
            <h2>Documentos (${documents.length})</h2>
            ${documents.length > 0 ? `
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  ${documents.map(doc => `
                    <tr>
                      <td>${doc.fileName}</td>
                      <td>${doc.documentType || '-'}</td>
                      <td><span class="status-badge status-${doc.status}">${doc.status}</span></td>
                      <td>${new Date(doc.uploadedAt).toLocaleDateString('es-MX')}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p>Sin documentos</p>'}
          </div>

          <!-- REQUERIMIENTOS -->
          <div class="section">
            <h2>Requerimientos (${requirements.length})</h2>
            ${requirements.length > 0 ? `
              <table>
                <thead>
                  <tr>
                    <th>Requerimiento</th>
                    <th>Prioridad</th>
                    <th>Estado</th>
                    <th>Vencimiento</th>
                  </tr>
                </thead>
                <tbody>
                  ${requirements.map(req => `
                    <tr>
                      <td>${req.title}</td>
                      <td>${req.priority}</td>
                      <td><span class="status-badge status-${req.status}">${req.status}</span></td>
                      <td>${req.dueDate ? new Date(req.dueDate).toLocaleDateString('es-MX') : '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p>Sin requerimientos</p>'}
          </div>

          <!-- ACTIVIDAD RECIENTE -->
          <div class="section">
            <h2>Actividad Reciente</h2>
            ${messages.length > 0 ? messages.slice(0, 5).map(msg => `
              <div class="activity-item">
                <strong>${msg.fromUserName}:</strong> ${msg.body}
                <div class="activity-time">${new Date(msg.createdAt).toLocaleDateString('es-MX')} ${new Date(msg.createdAt).toLocaleTimeString('es-MX', {hour: '2-digit', minute: '2-digit'})}</div>
              </div>
            `).join('') : '<p>Sin actividad reciente</p>'}
          </div>

          <div class="footer">
            <p>Documento generado automáticamente por NSD Compliance Platform</p>
            <p>${new Date().toLocaleString('es-MX')}</p>
          </div>
        </body>
      </html>
    `;

    // Simular descarga (en real usaría library como jsPDF)
    downloadHTML(html, `${expediente.id}_${expediente.title}.html`);

    return { success: true, fileName: `${expediente.id}_${expediente.title}.html` };
  } catch (err) {
    throw new Error(`Error generando PDF: ${err.message}`);
  }
}

// Helper para descargar HTML como file
function downloadHTML(html, filename) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Versión PDF mejorada (usando canvas para gráficos)
export function generateExpedientePDFWithCharts(expediente, requirements) {
  const reqStats = {
    pending: requirements.filter(r => r.status === 'pending').length,
    provided: requirements.filter(r => r.status === 'provided').length,
    approved: requirements.filter(r => r.status === 'approved').length,
    rejected: requirements.filter(r => r.status === 'rejected').length
  };

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${expediente.title}</title>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
          }
          h1 { color: #0F1F2E; }
          canvas { max-width: 500px; }
          .chart-container {
            position: relative;
            width: 300px;
            height: 300px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <h1>${expediente.title}</h1>
        <p>ID: ${expediente.id}</p>

        <h2>Estado de Requerimientos</h2>
        <div class="chart-container">
          <canvas id="reqChart"></canvas>
        </div>

        <script>
          const ctx = document.getElementById('reqChart').getContext('2d');
          new Chart(ctx, {
            type: 'doughnut',
            data: {
              labels: ['Pendientes', 'Respondidos', 'Aprobados', 'Rechazados'],
              datasets: [{
                data: [${reqStats.pending}, ${reqStats.provided}, ${reqStats.approved}, ${reqStats.rejected}],
                backgroundColor: ['#FFA500', '#2E7D32', '#1976D2', '#C62828']
              }]
            }
          });
        </script>

        <p>Documento generado: ${new Date().toLocaleString()}</p>
      </body>
    </html>
  `;

  downloadHTML(html, `${expediente.id}_chart.html`);
}
