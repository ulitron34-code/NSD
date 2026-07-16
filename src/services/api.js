import { error, debug, info, warn } from '../utils/logger';
import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001/api' : '');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authAPI = {
  register: (email, password, profileType) =>
    api.post('/auth/register', { email, password, profileType }),
  login: (email, password) =>
    api.post('/auth/login', { email, password })
};

// Orders
export const ordersAPI = {
  create: (serviceType, amount, metadata = {}) =>
    api.post('/orders', { serviceType, amount, metadata }),
  list: () =>
    api.get('/orders'),
  getById: (orderId) =>
    api.get(`/orders/${orderId}`),
  requirements: () =>
    api.get('/requirements'),
  updateInstitutional: (orderId, payload) =>
    api.patch(`/orders/${orderId}/institutional`, payload),
  generateExecutiveReport: (orderId) =>
    api.post(`/orders/${orderId}/executive-report`),
  updateBeneficiaryOwners: (orderId, owners) =>
    api.patch(`/orders/${orderId}/beneficiary-owners`, { owners }),
  getBeneficiaryOwnersScreening: (orderId) =>
    api.get(`/orders/${orderId}/beneficiary-owners/screening`),
  archive: (orderId) =>
    api.post(`/orders/${orderId}/archive`),
  unarchive: (orderId) =>
    api.post(`/orders/${orderId}/unarchive`)
};

export const scoringAPI = {
  listMatrices: () =>
    api.get('/scoring/matrices'),
  getOrderScoring: (orderId, matrixKey) =>
    api.get(`/orders/${orderId}/scoring`, { params: matrixKey ? { matrixKey } : {} }),
  getExecutiveReport: (orderId, matrixKey) =>
    api.get(`/orders/${orderId}/scoring/executive-report`, { params: matrixKey ? { matrixKey } : {} }),
  getInstitutionalMemo: (orderId, matrixKey) =>
    api.get(`/orders/${orderId}/scoring/institutional-memo`, { params: matrixKey ? { matrixKey } : {} }),
  downloadInstitutionalMemo: (orderId, matrixKey) =>
    api.get(`/orders/${orderId}/scoring/institutional-memo.md`, {
      params: matrixKey ? { matrixKey } : {},
      responseType: 'blob'
    }),
  getRiskScore: (orderId, sector) =>
    api.get(`/orders/${orderId}/scoring/risk-score`, { params: sector ? { sector } : {} })
};

export const regulatoryAPI = {
  validate: (country, applicant, order) =>
    api.post('/regulatory/validate', { country, applicant, order })
};

export const institutionalAPI = {
  catalogs: () =>
    api.get('/institutional/catalogs')
};

// Payments
export const paymentsAPI = {
  // Check payment status
  getStatus: (orderId) =>
    api.get(`/payments/status/${orderId}`),
  
  // Create payment intent
  createPaymentIntent: (orderId) =>
    api.post('/create-payment-intent', { orderId }),
  
  // Confirm payment from frontend
  confirmPayment: (orderId, paymentIntentId) =>
    api.post('/confirm-payment', { orderId, paymentIntentId }),
  
  // Cancel payment intent (if user abandons)
  cancelPaymentIntent: (paymentIntentId) =>
    api.post('/cancel-payment-intent', { paymentIntentId }),
  
  // Get saved payment methods
  getPaymentMethods: () =>
    api.get('/payment-methods'),
  
  // Request refund (admin)
  requestRefund: (orderId, reason) =>
    api.post('/refund-payment', { orderId, reason })
};

// Documents
export const documentsAPI = {
  getSignedUploadUrl: (orderId, filename) =>
    api.post('/signed-upload-url', { orderId, filename }),
  upload: (orderId, file, documentType) =>
    api.post(`/documents/${orderId}/upload`, file, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-Filename': file.name,
        'X-Content-Type': file.type || 'application/octet-stream',
        ...(documentType ? { 'X-Document-Type': documentType } : {})
      }
    }),
  list: (orderId) =>
    api.get(`/documents/${orderId}`),
  getSignedUrl: (orderId, documentId) =>
    api.get(`/documents/${orderId}/${documentId}/url`),
  getPublicUrl: (orderId, documentId) =>
    api.get(`/documents/${orderId}/${documentId}/url`),
  updateInstitutional: (orderId, documentId, payload) =>
    api.patch(`/documents/${orderId}/${documentId}`, payload),
  review: (orderId, documentId) =>
    api.post(`/documents/${orderId}/${documentId}/review`),
  reviews: (orderId) =>
    api.get(`/documents/${orderId}/reviews`)
};

export const sharesAPI = {
  create: (orderId, recipientName, recipientEmail) =>
    api.post('/data-room-shares', { orderId, recipientName, recipientEmail }),
  readiness: (orderId, matrixKey) =>
    api.get(`/data-room-share-readiness/${orderId}`, { params: matrixKey ? { matrixKey } : {} }),
  accept: (token) =>
    api.post(`/data-room-shares/${token}/accept`),
  list: (orderId) =>
    api.get(`/data-room-shares/${orderId}`),
  getSharedDataRoom: (token) =>
    api.get(`/shared-data-room/${token}`)
};

export const otorganteAPI = {
  pipeline: () =>
    api.get('/otorgante/pipeline'),
  recordInterest: (orderId, payload = {}) =>
    api.post('/otorgante/interests', { orderId, ...payload }),
  requestContact: (orderId, payload = {}) =>
    api.post('/otorgante/contact-requests', { orderId, ...payload }),
  listContactRequests: (orderId) =>
    api.get(`/otorgante/contact-requests/${orderId}`),
  updateContactRequest: (requestId, payload = {}) =>
    api.patch(`/otorgante/contact-requests/${requestId}`, payload)
};

export const informationRequestsAPI = {
  list: (orderId) =>
    api.get(`/information-requests/${orderId}`),
  create: (payload = {}) =>
    api.post('/information-requests', payload),
  update: (requestId, payload = {}) =>
    api.patch(`/information-requests/${requestId}`, payload),
  evidenceUrl: (requestId) =>
    api.get(`/information-requests/${requestId}/evidence-url`)
};

export const auditAPI = {
  list: (orderId) =>
    api.get(`/audit-logs/${orderId}`),
  summary: (orderId) =>
    api.get(`/audit-logs/${orderId}/summary`),
  exportMarkdown: (orderId) =>
    api.get(`/audit-logs/${orderId}/export.md`, { responseType: 'blob' }),
  exportCsv: (orderId) =>
    api.get(`/audit-logs/${orderId}/export.csv`, { responseType: 'blob' })
};

// Rol Administrador (sección 8.1 del plan): gestión de usuarios/roles,
// catálogo de fuentes, rúbricas (solo lectura) y bitácora global. Todas
// gateadas server-side por requireAdmin — si quien las llama no es
// profile_type='administrador' real, el backend responde 403 sin importar
// qué modo de UI tenga seleccionado.
export const adminAPI = {
  listUsers: (params = {}) =>
    api.get('/admin/users', { params }),
  updateUserRole: (userId, profileType) =>
    api.patch(`/admin/users/${userId}/role`, { profileType }),
  listReferenceSources: (params = {}) =>
    api.get('/admin/reference-sources', { params }),
  createReferenceSource: (payload) =>
    api.post('/admin/reference-sources', payload),
  updateReferenceSource: (id, payload) =>
    api.put(`/admin/reference-sources/${id}`, payload),
  deactivateReferenceSource: (id) =>
    api.delete(`/admin/reference-sources/${id}`),
  listAuditLogs: (params = {}) =>
    api.get('/admin/audit-logs', { params }),
  getRubrics: () =>
    api.get('/admin/rubrics'),
  listHumanReviewQueue: (params = {}) =>
    api.get('/admin/human-review-queue', { params }),
  getReadinessMetrics: () =>
    api.get('/admin/readiness-metrics')
};

// Plantillas descargables (sección 31 del plan) — contenido genérico, no
// atado a ningún expediente, solo requiere sesión iniciada.
export const readinessTemplatesAPI = {
  list: () =>
    api.get('/readiness-templates'),
  download: (code) =>
    api.get(`/readiness-templates/${code}`, { responseType: 'blob' })
};

// Las rutas /ai-agents/* nunca existieron en el backend (confirmado por
// grep) — estas 4 funciones apuntan ahora a los endpoints reales que ya
// hacen lo mismo bajo otro nombre, en vez de a rutas inexistentes.
export const aiAgentsAPI = {
  forensicAnalyze: (orderId) =>
    api.get(`/orders/${orderId}/scoring/risk-score`),
  documentTriage: (orderId) =>
    api.get(`/intel/expediente/${orderId}/summary`),
  riskMemo: (orderId) =>
    api.get(`/orders/${orderId}/scoring/institutional-memo`),
  orchestrationStatus: (orderId) =>
    api.get(`/orders/${orderId}/scoring`)
};

export const checklistAPI = {
  getChecklist: (orderId) =>
    api.get(`/orders/${orderId}/checklist`)
};

export const nuxeraWorkspaceStateAPI = {
  getOrderState: (orderId) =>
    api.get(`/nuxera/orders/${orderId}/state`)
};
export const apiKeysAPI = {
  list: () =>
    api.get('/api-keys'),
  create: (payload) =>
    api.post('/api-keys', payload),
  revoke: (id) =>
    api.patch(`/api-keys/${id}/revoke`),
  delete: (id) =>
    api.delete(`/api-keys/${id}`)
};

export const complianceAPI = {
  getMonitor: (orderId) =>
    api.get(`/orders/${orderId}/compliance-monitor`),
  updateCovenants: (orderId, covenants) =>
    api.patch(`/orders/${orderId}/compliance-covenants`, { covenants }),
  updateSchedule: (orderId, schedule) =>
    api.patch(`/orders/${orderId}/compliance-schedule`, schedule)
};

export const screeningAPI = {
  check: (name) =>
    api.post('/screening/check', { name }),
  status: () =>
    api.get('/screening/status'),
  checkFull: (name, country) =>
    api.post('/screening/check-full', { name, country }),
  statusFull: () =>
    api.get('/screening/status-full'),
  sat69b: (rfc, razonSocial) =>
    api.post('/screening/sat69b', { rfc, razonSocial }),
  sat69bStatus: () =>
    api.get('/screening/sat69b/status')
};

export const intelAPI = {
  getDocumentTypes: () => api.get('/intel/reference/document-types'),
  getValidationRules: (type) => api.get('/intel/reference/validation-rules', { params: type ? { type } : {} }),
  getBenchmarks: (sector) => api.get(`/intel/reference/benchmarks/${sector}`),
  getFraudPatterns: () => api.get('/intel/reference/fraud-patterns'),
  classify: (documentId) => api.post(`/intel/documents/${documentId}/classify`),
  extract: (documentId, textContent) => api.post(`/intel/documents/${documentId}/extract`, { textContent }),
  validate: (documentId) => api.post(`/intel/documents/${documentId}/validate`),
  getScore: (documentId) => api.get(`/intel/documents/${documentId}/score`),
  getExtraction: (documentId) => api.get(`/intel/documents/${documentId}/extraction`),
  saveScore: (documentId, payload) => api.post(`/intel/documents/${documentId}/score`, payload),
  getVerifications: (documentId) => api.get(`/intel/documents/${documentId}/verifications`),
  getDocRedFlags: (documentId) => api.get(`/intel/documents/${documentId}/red-flags`),
  getSummary: (expedienteId) => api.get(`/intel/expediente/${expedienteId}/summary`),
  getCrossReferences: (expedienteId) => api.get(`/intel/expediente/${expedienteId}/cross-references`),
  getExpedienteRedFlags: (expedienteId) => api.get(`/intel/expediente/${expedienteId}/red-flags`),
  processAll: (expedienteId) => api.post(`/intel/expediente/${expedienteId}/process-all`),
  validateAll: (expedienteId) => api.post(`/intel/expediente/${expedienteId}/validate-all`),
  chat: (expedienteId, message) => api.post(`/intel/expediente/${expedienteId}/chat`, { message })
};

export const requisitosMinimosAPI = {
  review: (items, language) =>
    api.post('/requisitos-minimos/review', { items, language })
};

export const readinessChecklistAPI = {
  get: (orderId) =>
    api.get(`/orders/${orderId}/readiness-checklist`),
  downloadMemo: (orderId) =>
    api.get(`/orders/${orderId}/readiness-checklist/memo.md`, { responseType: 'blob' }),
  downloadMemoPdf: (orderId) =>
    api.get(`/orders/${orderId}/readiness-checklist/memo.pdf`, { responseType: 'blob' }),
  downloadTechnicalMemo: (orderId) =>
    api.get(`/orders/${orderId}/readiness-checklist/technical-memo.md`, { responseType: 'blob' }),
  downloadTechnicalMemoPdf: (orderId) =>
    api.get(`/orders/${orderId}/readiness-checklist/technical-memo.pdf`, { responseType: 'blob' }),
  crossCheck: (orderId) =>
    api.post(`/orders/${orderId}/readiness-checklist/cross-check`),
  // Solo para roles internos (analista/auditor/administrador) — el backend
  // responde 403 para solicitante/otorgante.
  downloadAuditReport: (orderId) =>
    api.get(`/orders/${orderId}/readiness-checklist/audit-report.md`, { responseType: 'blob' }),
  // Modo de anonimización para revisión externa (sección 29.1 del plan) —
  // sin nombre de proyecto/expediente ni texto libre generado por IA.
  downloadAnonymizedSummary: (orderId) =>
    api.get(`/orders/${orderId}/readiness-checklist/anonymized-summary.md`, { responseType: 'blob' })
};

export const reviewNotesAPI = {
  list: (orderId, documentId) =>
    api.get(`/orders/${orderId}/documents/${documentId}/review-notes`),
  add: (orderId, documentId, decision, comment) =>
    api.post(`/orders/${orderId}/documents/${documentId}/review-notes`, { decision, comment })
};

export const messagingAPI = {
  list: (orderId) =>
    api.get(`/orders/${orderId}/messages`),
  send: (orderId, body) =>
    api.post(`/orders/${orderId}/messages`, { body }),
  markRead: (orderId) =>
    api.patch(`/orders/${orderId}/messages/read`),
  unreadCount: () =>
    api.get('/messages/unread-count')
};

export const activitySummaryAPI = {
  get: () =>
    api.get('/me/activity-summary')
};

export const nagmarAPI = {
  screen: (name, country) =>
    api.post('/nagmar/screen', { name, country }),
  getCases: (params = {}) =>
    api.get('/nagmar/cases', { params }),
  getCase: (id) =>
    api.get(`/nagmar/cases/${id}`),
  addAction: (id, payload) =>
    api.post(`/nagmar/cases/${id}/actions`, payload),
  updateCase: (id, payload) =>
    api.patch(`/nagmar/cases/${id}`, payload)
};

export default api;
