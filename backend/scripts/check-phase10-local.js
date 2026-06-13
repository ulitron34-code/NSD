import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const codexRoot = 'E:\\CODEX';

const checks = [
  {
    name: 'Fase 10 source package exists',
    file: resolve(codexRoot, 'REESTRUCTURACIONNSDIF\\FASE 10\\NSD_International_Finance_Fase_10_Paquete_Implementacion_Comercial.docx'),
    patterns: []
  },
  {
    name: 'Fase 10 pricing source exists',
    file: resolve(codexRoot, 'REESTRUCTURACIONNSDIF\\FASE 10\\NSD_International_Finance_Fase_10_Pipeline_Comercial_Pricing.xlsx'),
    patterns: []
  },
  {
    name: 'Local commercial package exists',
    file: resolve(codexRoot, 'paquete_comercial_nsd_fase10_310526.md'),
    patterns: [
      'Pricing sugerido',
      'Pipeline comercial minimo',
      'Onboarding otorgantes',
      'Onboarding solicitantes',
      'Disclaimers comerciales'
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
  console.error(`\nFase 10 local check failed: ${failures} issue(s).`);
  process.exit(1);
}

console.log('\nFase 10 local check passed.');
