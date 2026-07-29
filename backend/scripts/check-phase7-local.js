import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const backendRoot = process.cwd();
const frontendRoot = resolve(backendRoot, '..');

const checks = [];

function readRequired(filePath) {
  if (!existsSync(filePath)) {
    return null;
  }
  return readFileSync(filePath, 'utf8');
}

function addCheck(name, ok, detail = '') {
  checks.push({ name, ok, detail });
  console.log(`${ok ? 'OK' : 'ERROR'} - ${name}${detail ? `: ${detail}` : ''}`);
}

function checkContains(name, filePath, patterns) {
  const content = readRequired(filePath);
  if (!content) {
    addCheck(name, false, `missing file ${filePath}`);
    return;
  }

  const missing = patterns.filter((pattern) => !content.includes(pattern));
  addCheck(name, missing.length === 0, missing.length ? `missing ${missing.join(', ')}` : '');
}

checkContains(
  'Backend otorgante Fase 7 routes',
  resolve(backendRoot, 'src', 'routes', 'otorgante.js'),
  [
    "router.get('/otorgante/pipeline'",
    "router.post('/otorgante/interests'",
    "router.post('/otorgante/contact-requests'",
    "router.get('/otorgante/contact-requests/:orderId'",
    "router.patch('/otorgante/contact-requests/:requestId'",
    "funder_contact_requested",
    "funder_contact_request_decided"
  ]
);

checkContains(
  'Backend information requests routes',
  resolve(backendRoot, 'src', 'routes', 'informationRequests.js'),
  [
    "router.get('/information-requests/:orderId'",
    "router.post('/information-requests'",
    "router.patch('/information-requests/:requestId'",
    "evidence-url",
    "information_request_events"
  ]
);

checkContains(
  'Frontend API Fase 7',
  resolve(frontendRoot, 'src', 'services', 'api.js'),
  [
    'otorganteAPI',
    'requestContact',
    'listContactRequests',
    'updateContactRequest',
    'informationRequestsAPI'
  ]
);

checkContains(
  'Frontend otorgante dashboard Fase 7',
  resolve(frontendRoot, 'src', 'components', 'Dashboard', 'Otorgante', 'PipelineTab.jsx'),
  [
    'Perfil de apetito institucional',
    'Cierre local Fase 7',
    'Memo de comite',
    'Mesa institucional',
    'buildDecisionBoard',
    'Gates de acceso Fase 7',
    'Solicitar contacto autorizado',
    'buildPhase7Checklist',
    'buildGateStatus',
    'Term sheet readiness',
    'buildTermSheetReadiness'
  ]
);

checkContains(
  'Frontend otorgante analytics actionable',
  resolve(frontendRoot, 'src', 'components', 'Dashboard', 'Otorgante', 'AnalyticsTab.jsx'),
  [
    'Cola de Accion Institucional',
    'Preguntas para Comite',
    'actionQueue',
    'committeeQuestions'
  ]
);

checkContains(
  'Frontend solicitante contact decision',
  resolve(frontendRoot, 'src', 'components', 'Services', 'ServiceOrderDetailPanel.jsx'),
  [
    'Contacto autorizado',
    'loadContactRequests',
    'updateContactRequest',
    'Autorizar contacto',
    'Rechazar'
  ]
);

const failed = checks.filter((check) => !check.ok);

console.log('\nSummary');
console.log(`OK: ${checks.length - failed.length}`);
console.log(`ERROR: ${failed.length}`);

if (failed.length) {
  console.log('\nFase 7 local is not complete yet. Review ERROR items above.');
  process.exit(1);
}

console.log('\nFase 7 local package is structurally ready. Real Supabase verification remains required before production closure.');
