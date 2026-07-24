const planMode = process.argv.includes('--plan');

const baseUrl = String(process.env.NUXERA_HTTP_BASE_URL || '').replace(/\/$/, '');

const checks = [
  { role: 'solicitante', token: 'NUXERA_APPLICANT_TOKEN', path: '/api/orders' },
  { role: 'solicitante', token: 'NUXERA_APPLICANT_TOKEN', order: 'NUXERA_APPLICANT_ORDER_ID', path: '/api/nuxera/orders/:orderId/evidence' },
  { role: 'otorgante', token: 'NUXERA_GRANTOR_TOKEN', path: '/api/otorgante/pipeline' },
  { role: 'otorgante', token: 'NUXERA_GRANTOR_TOKEN', order: 'NUXERA_GRANTOR_ORDER_ID', path: '/api/nuxera/orders/:orderId/grantor-evidence' },
  { role: 'administrador', token: 'NUXERA_ADMIN_TOKEN', path: '/api/admin/users' },
  { role: 'administrador', token: 'NUXERA_ADMIN_TOKEN', path: '/api/admin/audit-logs' },
  { role: 'administrador', token: 'NUXERA_ADMIN_TOKEN', path: '/api/admin/human-review-queue' },
  { role: 'administrador', token: 'NUXERA_ADMIN_TOKEN', path: '/api/admin/readiness-metrics' },
  { role: 'administrador', token: 'NUXERA_ADMIN_TOKEN', path: '/api/nuxera/admin/readiness' }
];

// Negative/mustDeny scenarios from the controlled RLS/endpoint verification plan
// (backend/scripts/check-nuxera-controlled-verification-plan.js scenarios
// 'different-applicant', 'authorized-grantor', 'admin-internal'). Each entry
// documents the identity used, the endpoint attempted and the status code
// that proves the access is correctly denied -- 404 for ownership/data-room
// checks (see sendNuxeraError in src/routes/nuxera.js, which intentionally
// returns 404 instead of 403 for "no encontrado|sin permisos" to avoid
// leaking whether a foreign order exists), 403 for role/permission checks
// (requirePermission in src/middleware/auth.js).
const denyChecks = [
  {
    role: 'solicitante (ajeno)',
    token: 'NUXERA_APPLICANT_TOKEN',
    order: 'NUXERA_FOREIGN_ORDER_ID',
    path: '/api/nuxera/orders/:orderId/state',
    method: 'GET',
    expectedStatus: [404],
    reason: 'a different applicant must not read another applicant order state'
  },
  {
    role: 'solicitante (ajeno)',
    token: 'NUXERA_APPLICANT_TOKEN',
    order: 'NUXERA_FOREIGN_ORDER_ID',
    path: '/api/nuxera/orders/:orderId/evidence',
    method: 'GET',
    expectedStatus: [404],
    reason: 'a different applicant must not read another applicant order evidence'
  },
  {
    role: 'solicitante (ajeno)',
    token: 'NUXERA_APPLICANT_TOKEN',
    order: 'NUXERA_FOREIGN_ORDER_ID',
    path: '/api/nuxera/orders/:orderId/state/checklist',
    method: 'PATCH',
    body: { status: 'in_progress', payload: {} },
    expectedStatus: [404],
    reason: 'a different applicant must not write another applicant order checklist'
  },
  {
    role: 'otorgante (no autorizado)',
    token: 'NUXERA_GRANTOR_TOKEN',
    order: 'NUXERA_FOREIGN_ORDER_ID',
    path: '/api/nuxera/orders/:orderId/grantor-evidence',
    method: 'GET',
    expectedStatus: [404],
    reason: 'a grantor without an accepted data-room share must not read case evidence'
  },
  {
    role: 'solicitante (sin admin)',
    token: 'NUXERA_APPLICANT_TOKEN',
    path: '/api/nuxera/admin/readiness',
    method: 'GET',
    expectedStatus: [403],
    reason: 'a non-admin role must not read admin readiness'
  },
  {
    role: 'solicitante (sin admin)',
    token: 'NUXERA_APPLICANT_TOKEN',
    path: '/api/nuxera/admin/controls',
    method: 'GET',
    expectedStatus: [403],
    reason: 'a non-admin role must not read admin controls'
  },
  {
    role: 'otorgante (sin admin)',
    token: 'NUXERA_GRANTOR_TOKEN',
    path: '/api/nuxera/admin/readiness',
    method: 'GET',
    expectedStatus: [403],
    reason: 'a non-admin role must not read admin readiness'
  },
  {
    role: 'otorgante (sin admin)',
    token: 'NUXERA_GRANTOR_TOKEN',
    path: '/api/nuxera/admin/controls',
    method: 'GET',
    expectedStatus: [403],
    reason: 'a non-admin role must not read admin controls'
  }
];

function resolvedPath(check) {
  return check.order ? check.path.replace(':orderId', process.env[check.order] || ':orderId') : check.path;
}

function printPlan() {
  console.log('# NUXERA HTTP readiness plan (mustAllow, GET-only)');
  console.log('No requests were sent and no credentials were read.');
  for (const check of checks) console.log(`- ${check.role}: GET ${check.path}`);

  console.log('');
  console.log('# NUXERA HTTP readiness plan (mustDeny)');
  console.log('No requests were sent and no credentials were read.');
  for (const check of denyChecks) {
    console.log(`- ${check.role}: ${check.method} ${check.path} -> expect ${check.expectedStatus.join('/')} (${check.reason})`);
  }
}

async function runCheck(check) {
  const path = resolvedPath(check);
  const method = check.method || 'GET';
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${process.env[check.token]}`,
        Accept: 'application/json',
        ...(check.body ? { 'Content-Type': 'application/json' } : {})
      },
      body: check.body ? JSON.stringify(check.body) : undefined,
      signal: AbortSignal.timeout(15000)
    });
    return { path, method, status: response.status };
  } catch (error) {
    return { path, method, status: error.name || 'REQUEST_ERROR' };
  }
}

async function execute() {
  const required = new Set(['NUXERA_HTTP_BASE_URL']);
  for (const check of [...checks, ...denyChecks]) {
    required.add(check.token);
    if (check.order) required.add(check.order);
  }
  const missing = [...required].filter((name) => !process.env[name]);
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(', ')}`);

  console.log('# NUXERA HTTP readiness verification (mustAllow, GET-only)');
  const allowResults = [];
  for (const check of checks) {
    const { path, status } = await runCheck(check);
    const contentType = String(status);
    const ok = typeof status === 'number' && status >= 200 && status < 300;
    allowResults.push({ role: check.role, path, ok, status });
  }
  for (const result of allowResults) {
    console.log(`- ${result.ok ? 'GO' : 'NO-GO'} | ${result.role} | GET ${result.path} | ${result.status}`);
  }

  console.log('');
  console.log('# NUXERA HTTP readiness verification (mustDeny)');
  const denyResults = [];
  for (const check of denyChecks) {
    const { path, method, status } = await runCheck(check);
    const ok = typeof status === 'number' && check.expectedStatus.includes(status);
    denyResults.push({ role: check.role, path, method, ok, status, reason: check.reason });
  }
  for (const result of denyResults) {
    console.log(`- ${result.ok ? 'GO' : 'NO-GO'} | ${result.role} | ${result.method} ${result.path} | ${result.status} | ${result.reason}`);
  }

  if (allowResults.some((result) => !result.ok) || denyResults.some((result) => !result.ok)) {
    process.exitCode = 1;
  }
}

if (planMode) {
  printPlan();
} else {
  execute().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
