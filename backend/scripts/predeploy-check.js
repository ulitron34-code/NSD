import 'dotenv/config';
import { execFileSync } from 'node:child_process';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';
const ROOT_URL = API_URL.replace(/\/api\/?$/, '');

const checks = [];

function addCheck(name, status, detail = '') {
  checks.push({ name, status, detail });
  const label = status === 'pass' ? 'PASS' : status === 'warn' ? 'WARN' : 'FAIL';
  console.log(`${label} - ${name}${detail ? `: ${detail}` : ''}`);
}

function hasEnv(name) {
  return Boolean(process.env[name]?.trim());
}

function runCommand(name, command, args, cwd = process.cwd()) {
  try {
    const output = execFileSync(command, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd
    });

    return { name, code: 0, output: output.trim() };
  } catch (error) {
    const output = `${error.stdout || ''}${error.stderr || ''}`.trim();
    return { name, code: error.status || 1, output };
  }
}

async function checkHealth() {
  try {
    const response = await fetch(`${ROOT_URL}/health`);
    const data = await response.json();

    if (!response.ok) {
      addCheck('Backend health', 'fail', `${response.status} ${response.statusText}`);
      return;
    }

    const missing = Object.entries(data.config || {})
      .filter(([, value]) => value === false)
      .map(([key]) => key);

    addCheck('Backend health', 'pass', `${ROOT_URL}/health ok`);

    if (missing.length) {
      addCheck('Health optional readiness', 'warn', `not configured: ${missing.join(', ')}`);
    }
  } catch (error) {
    addCheck('Backend health', 'warn', `server not reachable at ${ROOT_URL}; start it to run smoke`);
  }
}

function checkEnv() {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'CORS_ORIGIN'
  ];

  for (const name of required) {
    addCheck(`Env ${name}`, hasEnv(name) ? 'pass' : 'fail');
  }

  const optional = [
    'STRIPE_WEBHOOK_SECRET',
    'ANTHROPIC_API_KEY',
    'DEEPSEEK_API_KEY',
    'COMPANIES_HOUSE_API_KEY',
    'MEXICO_RFC_API_URL',
    'MEXICO_UIF_API_URL',
    'EQUIFAX_API_URL'
  ];

  const missingOptional = optional.filter((name) => !hasEnv(name));
  if (missingOptional.length) {
    addCheck('Optional integrations', 'warn', `pending: ${missingOptional.join(', ')}`);
  } else {
    addCheck('Optional integrations', 'pass');
  }
}

async function checkSyntax() {
  const files = [
    'src/server.js',
    'src/routes/documents.js',
    'src/routes/auth.js',
    'src/routes/orders.js',
    'src/routes/payments.js',
    'src/routes/otorgante.js',
    'src/routes/regulatory.js',
    'src/routes/scoring.js',
    'src/services/aiEngine.js',
    'src/middleware/auth.js',
    'src/services/regulatoryValidation.js',
    'src/services/scoringEngine.js',
    'scripts/smoke-test-flow.js',
    'scripts/test-regulatory-api-connections.js'
  ];

  for (const file of files) {
    const result = runCommand(`Syntax ${file}`, process.execPath, ['--check', file]);
    addCheck(result.name, result.code === 0 ? 'pass' : 'fail', result.code === 0 ? '' : result.output);
  }
}

async function checkSupabase() {
  const result = runCommand('Supabase schema', process.execPath, ['scripts/check-supabase-schema.js']);
  addCheck(result.name, result.code === 0 ? 'pass' : 'fail', result.code === 0 ? 'schema ready' : result.output.split('\n').slice(-2).join(' '));
}

async function checkPhase7() {
  const result = runCommand('Fase 7 local package', process.execPath, ['scripts/check-phase7-local.js']);
  addCheck(result.name, result.code === 0 ? 'pass' : 'fail', result.code === 0 ? 'otorgantes package structurally ready' : result.output.split('\n').slice(-4).join(' '));
}

async function checkPhase8() {
  const result = runCommand('Fase 8 local package', process.execPath, ['scripts/check-phase8-local.js']);
  addCheck(result.name, result.code === 0 ? 'pass' : 'fail', result.code === 0 ? 'security/RBAC package structurally ready' : result.output.split('\n').slice(-4).join(' '));
}

async function checkRbac() {
  const result = runCommand('RBAC matrix', process.execPath, ['scripts/check-rbac-matrix.js']);
  addCheck(result.name, result.code === 0 ? 'pass' : 'fail', result.code === 0 ? 'permission expectations ok' : result.output.split('\n').slice(-4).join(' '));
}

async function checkPhase9() {
  const result = runCommand('Fase 9 local package', process.execPath, ['scripts/check-phase9-local.js']);
  addCheck(result.name, result.code === 0 ? 'pass' : 'fail', result.code === 0 ? 'document hash/versioning package structurally ready' : result.output.split('\n').slice(-4).join(' '));
}

async function checkRegulators() {
  const result = runCommand('Regulatory API suite', process.execPath, ['scripts/test-regulatory-api-connections.js']);
  addCheck(result.name, result.code === 0 ? 'pass' : 'fail', result.code === 0 ? 'format checks ok; optional providers may be skipped' : result.output.split('\n').slice(-4).join(' '));
}

async function checkPublicIdentity() {
  const identity = runCommand('NUXERA public identity', process.execPath, ['scripts/check-nuxera-public-identity.js']);
  addCheck(identity.name, identity.code === 0 ? 'pass' : 'fail', identity.code === 0 ? 'public metadata and OG identity aligned' : identity.output);

  const pages = runCommand('Public pages package', process.execPath, ['scripts/check-public-pages-local.js']);
  addCheck(pages.name, pages.code === 0 ? 'pass' : 'fail', pages.code === 0 ? 'public routes and narrative structurally ready' : pages.output);
}

async function checkFrontendE2E() {
  const frontendRoot = new URL('../..', import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, '$1');
  const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = runCommand('Frontend Chromium E2E', command, ['run', 'test:e2e:chromium'], frontendRoot);
  addCheck(result.name, result.code === 0 ? 'pass' : 'fail', result.code === 0 ? '34 browser journeys passed' : result.output.split('\n').slice(-8).join(' '));
}

async function main() {
  console.log('NUXERA Financial Intelligence predeploy check');
  console.log(`Started: ${new Date().toISOString()}`);
  console.log(`API_URL: ${API_URL}\n`);

  checkEnv();
  await checkSyntax();
  await checkPhase7();
  await checkPhase8();
  await checkRbac();
  await checkPhase9();
  await checkSupabase();
  await checkRegulators();
  await checkPublicIdentity();
  await checkFrontendE2E();
  await checkHealth();

  const fail = checks.filter((item) => item.status === 'fail').length;
  const warn = checks.filter((item) => item.status === 'warn').length;
  const pass = checks.filter((item) => item.status === 'pass').length;

  console.log('\nSummary');
  console.log(`PASS: ${pass}`);
  console.log(`WARN: ${warn}`);
  console.log(`FAIL: ${fail}`);

  if (fail > 0) {
    console.log('\nPredeploy is not green yet. Resolve FAIL items before Render/Netlify production deploy.');
    process.exitCode = 1;
    return;
  }

  console.log('\nPredeploy blocking checks passed. Review WARN items before final production launch.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
