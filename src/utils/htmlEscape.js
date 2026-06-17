// ============================================
// ESCAPE DE HTML PARA REPORTES GENERADOS CLIENT-SIDE
// pdfExportService/exportService/reportService inyectan datos de
// usuario (nombres, títulos, mensajes) en HTML vía document.write().
// Esa ventana hereda el origen de la app, así que un <script> sin
// escapar ahí tiene acceso al localStorage (incluido auth_token).
// ============================================

const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}
