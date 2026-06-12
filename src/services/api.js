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
    api.post(`/orders/${orderId}/executive-report`)
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
    })
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
  createPaymentIntent: (orderId) =>
    api.post('/create-payment-intent', { orderId }),
  confirmPayment: (orderId, paymentIntentId) =>
    api.post('/confirm-payment', { orderId, paymentIntentId })
};

// Documents
export const documentsAPI = {
  getSignedUploadUrl: (orderId, filename) =>
    api.post('/signed-upload-url', { orderId, filename }),
  upload: (orderId, file) =>
    api.post(`/documents/${orderId}/upload`, file, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-Filename': file.name,
        'X-Content-Type': file.type || 'application/octet-stream'
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

export const aiAgentsAPI = {
  forensicAnalyze: (orderId, payload = {}) =>
    api.post(`/ai-agents/forensic/${orderId}/analyze`, payload),
  documentTriage: (orderId, payload = {}) =>
    api.post(`/ai-agents/documents/${orderId}/triage`, payload),
  riskMemo: (orderId, payload = {}) =>
    api.post(`/ai-agents/risk/${orderId}/memo`, payload),
  orchestrationStatus: (orderId) =>
    api.get(`/ai-agents/orchestration/${orderId}`)
};

export default api;
