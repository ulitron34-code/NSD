import 'dotenv/config';
import { supabaseAdmin } from '../src/config/supabase.js';

const API = process.env.API_URL || 'http://localhost:3001/api';
const ROOT = API.replace(/\/api\/?$/, '');
const email = `nsd.smoke.${Date.now()}@gmail.com`;
const lenderEmail = `nsd.lender.${Date.now()}@gmail.com`;
const password = 'NsdTest123!';

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(`${response.status} ${path}: ${data?.error || data?.message || text}`);
  }

  return data;
}

async function rootRequest(path) {
  const response = await fetch(`${ROOT}${path}`);
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(`${response.status} ${path}: ${data?.error || text}`);
  }

  return data;
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForReviewCompletion(orderId, token, attempts = 8) {
  for (let index = 0; index < attempts; index += 1) {
    const currentReviews = await request(`/documents/${orderId}/reviews`, {
      headers: authHeaders(token),
    });
    const completedReview = currentReviews.find((item) => item.status !== 'processing');

    if (completedReview || index === attempts - 1) {
      return currentReviews;
    }

    await wait(1500);
  }

  return [];
}

const health = await rootRequest('/health');

const { data: createdUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (createUserError) {
  throw new Error(`admin create user failed: ${createUserError.message}`);
}

const { data: createdLenderUser, error: createLenderUserError } = await supabaseAdmin.auth.admin.createUser({
  email: lenderEmail,
  password,
  email_confirm: true,
});

if (createLenderUserError) {
  throw new Error(`admin create lender user failed: ${createLenderUserError.message}`);
}

const login = await request('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});
const token = login.token;

if (!token) {
  throw new Error('No token returned from signup/login');
}

const me = await request('/auth/me', {
  headers: authHeaders(token),
});

const order = await request('/orders', {
  method: 'POST',
  headers: authHeaders(token),
  body: JSON.stringify({
    serviceType: 'business-plan',
    amount: 499,
    metadata: {
      projectName: 'Smoke Test Project',
      description: 'End-to-end verification before deploy',
      sector: 'Manufacturero',
      investmentRequired: '125000',
      hasDocuments: 'yes',
      email,
      phone: '+52 55 0000 0000',
      companyName: 'NSD Smoke Test',
      serviceName: 'Business Plan Profesional',
      country: 'MX',
      rfc: 'ABC123456XYZ'
    }
  }),
});

const orders = await request('/orders', {
  headers: authHeaders(token),
});

const fetchedOrder = await request(`/orders/${order.id}`, {
  headers: authHeaders(token),
});

const scoringBeforeDocs = await request(`/orders/${order.id}/scoring`, {
  headers: authHeaders(token),
});

const pdfBody = new TextEncoder().encode('%PDF-1.4\n% NSD smoke test document\n%%EOF');
const uploadResponse = await fetch(`${API}/documents/${order.id}/upload`, {
  method: 'POST',
  headers: {
    ...authHeaders(token),
    'Content-Type': 'application/octet-stream',
    'X-Filename': 'Acta constitutiva.pdf',
    'X-Content-Type': 'application/pdf'
  },
  body: pdfBody
});

const uploadedDocument = await uploadResponse.json();
if (!uploadResponse.ok) {
  throw new Error(`${uploadResponse.status} document upload: ${uploadedDocument?.error || JSON.stringify(uploadedDocument)}`);
}

const documents = await request(`/documents/${order.id}`, {
  headers: authHeaders(token),
});

const review = await request(`/documents/${order.id}/${uploadedDocument.id}/review`, {
  method: 'POST',
  headers: authHeaders(token),
});

const reviews = await waitForReviewCompletion(order.id, token);
const latestReview = reviews[0];

const scoringAfterDocs = await request(`/orders/${order.id}/scoring`, {
  headers: authHeaders(token),
});

const regulatoryValidation = await request('/regulatory/validate', {
  method: 'POST',
  headers: authHeaders(token),
  body: JSON.stringify({
    country: 'MX',
    applicant: {
      companyName: 'NSD Smoke Test',
      rfc: 'ABC123456XYZ'
    },
    order
  }),
});

const executiveReport = await request(`/orders/${order.id}/scoring/executive-report`, {
  headers: authHeaders(token),
});

const share = await request('/data-room-shares', {
  method: 'POST',
  headers: authHeaders(token),
  body: JSON.stringify({
    orderId: order.id,
    recipientName: 'Banco Smoke',
    recipientEmail: lenderEmail
  }),
});

const shares = await request(`/data-room-shares/${order.id}`, {
  headers: authHeaders(token),
});

const lenderLogin = await request('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email: lenderEmail, password }),
});

const lenderPipelineBeforeAccept = await request('/otorgante/pipeline', {
  headers: authHeaders(lenderLogin.token),
});

const acceptedShare = await request(`/data-room-shares/${share.access_token}/accept`, {
  method: 'POST',
  headers: authHeaders(lenderLogin.token),
});

const lenderPipeline = await request('/otorgante/pipeline', {
  headers: authHeaders(lenderLogin.token),
});

const auditLogs = await request(`/audit-logs/${order.id}`, {
  headers: authHeaders(token),
});

let paymentIntent = null;
try {
  paymentIntent = await request('/create-payment-intent', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ orderId: order.id }),
  });
} catch (error) {
  paymentIntent = { skippedOrFailed: error.message };
}

console.log(JSON.stringify({
  api: API,
  health,
  email,
  lenderEmail,
  userId: createdUser.user?.id || me.user?.id,
  lenderUserId: createdLenderUser.user?.id,
  orderId: order.id,
  orderStatus: order.status,
  orderMetadataProject: fetchedOrder.metadata?.projectName,
  ordersCount: orders.length,
  documentsCount: documents.length,
  reviewStatus: latestReview?.status || review.review?.status,
  initialReviewStatus: review.review?.status,
  reviewsCount: reviews.length,
  scoreBeforeDocs: scoringBeforeDocs.finalScore,
  scoreAfterDocs: scoringAfterDocs.finalScore,
  scoringRegulatoryStatus: scoringAfterDocs.regulatoryValidation?.status,
  regulatoryRouteStatus: regulatoryValidation.status,
  regulatoryRouteSkipped: regulatoryValidation.summary?.skipped,
  reportRecommendation: executiveReport.decisionRecommendation,
  reportRegulatoryStatus: executiveReport.regulatoryValidation?.status,
  sharesCount: shares.length,
  acceptedShareStatus: acceptedShare.status,
  lenderPipelineBeforeAcceptCount: lenderPipelineBeforeAccept.length,
  lenderPipelineCount: lenderPipeline.length,
  lenderPipelineOrderId: lenderPipeline[0]?.order?.id,
  shareUrl: share.shareUrl,
  auditLogsCount: auditLogs.length,
  paymentIntent: paymentIntent?.clientSecret ? 'created' : paymentIntent,
}, null, 2));
