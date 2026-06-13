import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const codexRoot = 'E:\\CODEX';
const frontendRoot = 'E:\\CODEX\\ulitron34-code-nsd-https-github-com';

const checks = [
  {
    name: 'Fase 17 source exists',
    file: resolve(codexRoot, 'REESTRUCTURACIONNSDIF\\FASE 17\\NSD_Fase_17_v2_Costos_Operativos_con_Biometricos.docx'),
    patterns: []
  },
  {
    name: 'Local phase 17 brief exists',
    file: resolve(codexRoot, 'fase17_costos_biometricos_local_010626.md'),
    patterns: [
      'Biometricos',
      'Piloto',
      'Operacion inicial',
      'Escalamiento',
      'consentimiento'
    ]
  },
  {
    name: 'Biometrics module includes cost gates',
    file: resolve(frontendRoot, 'src/components/Dashboard/BiometricosTab.jsx'),
    patterns: [
      'Control de costos',
      'Activacion progresiva',
      'Piloto',
      'Escalamiento'
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
  console.error(`\nFase 17 local check failed: ${failures} issue(s).`);
  process.exit(1);
}

console.log('\nFase 17 local check passed.');
