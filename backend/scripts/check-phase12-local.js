import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const codexRoot = 'E:\\CODEX';
const frontendRoot = 'E:\\CODEX\\ulitron34-code-nsd-https-github-com';

const checks = [
  {
    name: 'Fase 12 security source exists',
    file: resolve(codexRoot, 'REESTRUCTURACIONNSDIF\\FASE 12\\NSD_International_Finance_Fase_12_Manual_Tecnico_Seguridad_Continuidad.docx'),
    patterns: []
  },
  {
    name: 'Local phase 12 operating brief exists',
    file: resolve(codexRoot, 'fase12_seguridad_continuidad_local_010626.md'),
    patterns: [
      'BCP',
      'DRP',
      'Respuesta a incidentes',
      'Accesos criticos',
      'Respaldos',
      'Control de cambios'
    ]
  },
  {
    name: 'Backend production proxy is configured',
    file: resolve(process.cwd(), 'src/server.js'),
    patterns: [
      "app.set('trust proxy', 1)",
      'helmet',
      'rateLimit',
      'CORS_ORIGIN'
    ]
  },
  {
    name: 'Public security page exists',
    file: resolve(frontendRoot, 'src/pages/SecurityTraceabilityPage.jsx'),
    patterns: [
      'Seguridad, privacidad y trazabilidad',
      'Permisos por rol',
      'Bitacora auditable',
      'Continuidad operativa'
    ]
  },
  {
    name: 'Security route is wired',
    file: resolve(frontendRoot, 'src/App.jsx'),
    patterns: [
      'SecurityTraceabilityPage',
      'path="/security"'
    ]
  }
];

let failures = 0;

for (const check of checks) {
  if (!existsSync(check.file)) {
    failures += 1;
    console.error(`ERROR - ${check.name}: missing ${check.file}`);
    continue;
  }

  if (check.patterns.length) {
    const content = readFileSync(check.file, 'utf8');
    const missing = check.patterns.filter((pattern) => !content.includes(pattern));
    if (missing.length) {
      failures += 1;
      console.error(`ERROR - ${check.name}: missing ${missing.join(', ')}`);
      continue;
    }
  }

  console.log(`OK - ${check.name}`);
}

if (failures > 0) {
  console.error(`\nFase 12 local check failed: ${failures} issue(s).`);
  process.exit(1);
}

console.log('\nFase 12 local check passed.');
