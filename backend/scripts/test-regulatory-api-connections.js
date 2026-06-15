import 'dotenv/config';

const optional = (name) => process.env[name]?.trim();

const config = {
  companiesHouseApiKey: optional('COMPANIES_HOUSE_API_KEY'),
  mexicoRfcApiUrl: optional('MEXICO_RFC_API_URL'),
  mexicoRfcApiKey: optional('MEXICO_RFC_API_KEY'),
  mexicoUifApiUrl: optional('MEXICO_UIF_API_URL'),
  mexicoUifApiKey: optional('MEXICO_UIF_API_KEY'),
  ofacApiUrl: optional('OFAC_API_URL'),
  ofacApiKey: optional('OFAC_API_KEY'),
  equifaxApiUrl: optional('EQUIFAX_API_URL'),
  equifaxApiKey: optional('EQUIFAX_API_KEY'),
  dubaiEmiratesIdApiUrl: optional('DUBAI_EMIRATES_ID_API_URL'),
  dubaiEmiratesIdApiKey: optional('DUBAI_EMIRATES_ID_API_KEY'),
  dubaiTradeLicenseApiUrl: optional('DUBAI_TRADE_LICENSE_API_URL'),
  dubaiTradeLicenseApiKey: optional('DUBAI_TRADE_LICENSE_API_KEY')
};

const results = [];

function addResult({ name, status, detail = '', required = false }) {
  results.push({ name, status, detail, required });
  const prefix = status === 'pass' ? 'PASS' : status === 'skip' ? 'SKIP' : 'FAIL';
  console.log(`${prefix} - ${name}${detail ? `: ${detail}` : ''}`);
}

function assertPattern(name, value, pattern) {
  const ok = pattern.test(value);
  addResult({
    name,
    status: ok ? 'pass' : 'fail',
    detail: ok ? value : `invalid format: ${value}`,
    required: true
  });
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${data?.error || data?.message || text}`);
  }

  return data;
}

async function testOptionalPost({ name, url, apiKey, body }) {
  if (!url) {
    addResult({ name, status: 'skip', detail: 'API URL not configured' });
    return;
  }

  try {
    await fetchJson(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
      },
      body: JSON.stringify(body)
    });
    addResult({ name, status: 'pass', detail: 'connection ok' });
  } catch (error) {
    addResult({ name, status: 'fail', detail: error.message });
  }
}

async function testCompaniesHouse() {
  const name = 'UK Companies House company lookup';

  if (!config.companiesHouseApiKey) {
    addResult({ name, status: 'skip', detail: 'COMPANIES_HOUSE_API_KEY not configured' });
    return;
  }

  try {
    const auth = Buffer.from(`${config.companiesHouseApiKey}:`).toString('base64');
    const data = await fetchJson('https://api.company-information.service.gov.uk/company/04489646', {
      headers: { Authorization: `Basic ${auth}` }
    });

    addResult({
      name,
      status: data?.company_name ? 'pass' : 'fail',
      detail: data?.company_name || 'no company_name returned'
    });
  } catch (error) {
    addResult({ name, status: 'fail', detail: error.message });
  }
}

async function run() {
  console.log('NSD regulatory API connection tests');
  console.log(`Started: ${new Date().toISOString()}\n`);

  assertPattern('Mexico RFC format validation', 'ABC123456XYZ', /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/);
  assertPattern('USA EIN format validation', '12-3456789', /^\d{2}-\d{7}$/);
  assertPattern('Dubai Emirates ID format validation', '784-1234-5678901-1', /^784-\d{4}-\d{7}-\d$/);
  assertPattern('UK company number format validation', '04489646', /^[A-Z0-9]{8}$/);

  await testOptionalPost({
    name: 'Mexico RFC external API',
    url: config.mexicoRfcApiUrl,
    apiKey: config.mexicoRfcApiKey,
    body: { rfc: 'ABC123456XYZ' }
  });

  await testOptionalPost({
    name: 'Mexico UIF sanctions API',
    url: config.mexicoUifApiUrl,
    apiKey: config.mexicoUifApiKey,
    body: { name: 'Juan Perez Lopez' }
  });

  await testOptionalPost({
    name: 'USA OFAC screening API',
    url: config.ofacApiUrl,
    apiKey: config.ofacApiKey,
    body: { name: 'John Doe' }
  });

  await testOptionalPost({
    name: 'USA Equifax credit API',
    url: config.equifaxApiUrl,
    apiKey: config.equifaxApiKey,
    body: { ssn: '123-45-6789' }
  });

  await testOptionalPost({
    name: 'Dubai Emirates ID API',
    url: config.dubaiEmiratesIdApiUrl,
    apiKey: config.dubaiEmiratesIdApiKey,
    body: { emiratesId: '784-1234-5678901-1' }
  });

  await testOptionalPost({
    name: 'Dubai Trade License API',
    url: config.dubaiTradeLicenseApiUrl,
    apiKey: config.dubaiTradeLicenseApiKey,
    body: { tradeLicense: '12345678' }
  });

  await testCompaniesHouse();

  const pass = results.filter((item) => item.status === 'pass').length;
  const fail = results.filter((item) => item.status === 'fail').length;
  const skip = results.filter((item) => item.status === 'skip').length;
  const requiredFailures = results.filter((item) => item.required && item.status === 'fail').length;

  console.log('\nSummary');
  console.log(`PASS: ${pass}`);
  console.log(`FAIL: ${fail}`);
  console.log(`SKIP: ${skip}`);

  if (requiredFailures > 0) {
    process.exit(1);
  }

  if (fail > 0) {
    console.log('\nOne or more optional external API checks failed. Verify credentials before enabling that integration in production.');
    return;
  }

  console.log('\nRegulatory API test suite completed.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
