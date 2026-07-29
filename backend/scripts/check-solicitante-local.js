import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const frontendRoot = resolve(process.cwd(), '..');

const checks = [
  {
    name: 'Solicitante profile readiness',
    file: resolve(frontendRoot, 'src/components/Dashboard/Solicitante/MiPerfilTab.jsx'),
    patterns: ['Brechas antes de compartir', 'Plan de subsanación', 'readinessPlan', 'remediationSteps']
  },
  {
    name: 'Solicitante project share readiness',
    file: resolve(frontendRoot, 'src/components/Dashboard/Solicitante/SubirProyectoTab.jsx'),
    patterns: ['Antes de compartir con otorgantes', 'Checklist de preparacion institucional', 'shareReadiness', 'Diagnostico de estructura', 'Preguntas esperadas', 'Plan de subsanacion sugerido']
  },
  {
    name: 'Solicitante funder matches explain criteria',
    file: resolve(frontendRoot, 'src/components/Dashboard/Solicitante/MatchesTab.jsx'),
    patterns: ['Como se calcula el match', 'Criterios que explican el match', 'Siguiente paso', 'Paquete de presentacion', 'Antes de abrir contacto']
  }
];

let failures = 0;

for (const check of checks) {
  if (!existsSync(check.file)) {
    failures += 1;
    console.error(`ERROR - ${check.name}: missing ${check.file}`);
    continue;
  }
  const content = readFileSync(check.file, 'utf8');
  const missing = check.patterns.filter((pattern) => !content.includes(pattern));
  if (missing.length) {
    failures += 1;
    console.error(`ERROR - ${check.name}: missing ${missing.join(', ')}`);
    continue;
  }
  console.log(`OK - ${check.name}`);
}

if (failures) {
  console.error(`\nSolicitante local check failed: ${failures} issue(s).`);
  process.exit(1);
}

console.log('\nSolicitante local package passed.');
