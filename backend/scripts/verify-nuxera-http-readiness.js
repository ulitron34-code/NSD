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

function resolvedPath(check) {
  return check.order ? check.path.replace(':orderId', process.env[check.order] || ':orderId') : check.path;
}

function printPlan() {
  console.log('# NUXERA HTTP readiness plan (GET-only)');
  console.log('No requests were sent and no credentials were read.');
  for (const check of checks) console.log(`- ${check.role}: GET ${check.path}`);
}

async function execute() {
  const required = new Set(['NUXERA_HTTP_BASE_URL']);
  for (const check of checks) {
    required.add(check.token);
    if (check.order) required.add(check.order);
  }
  const missing = [...required].filter((name) => !process.env[name]);
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(', ')}`);

  console.log('# NUXERA HTTP readiness verification (GET-only)');
  const results = [];
  for (const check of checks) {
    const path = resolvedPath(check);
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${process.env[check.token]}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(15000)
      });
      const contentType = response.headers.get('content-type') || '';
      const body = contentType.includes('application/json') ? await response.json() : await response.text();
      const hasPayload = body !== null && body !== undefined && body !== '';
      results.push({ role: check.role, path, ok: response.ok && hasPayload, status: response.status });
    } catch (error) {
      results.push({ role: check.role, path, ok: false, status: error.name || 'REQUEST_ERROR' });
    }
  }

  for (const result of results) {
    console.log(`- ${result.ok ? 'GO' : 'NO-GO'} | ${result.role} | GET ${result.path} | ${result.status}`);
  }
  if (results.some((result) => !result.ok)) process.exitCode = 1;
}

if (planMode) {
  printPlan();
} else {
  execute().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
