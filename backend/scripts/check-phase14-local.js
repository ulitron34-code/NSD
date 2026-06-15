import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const codexRoot = 'E:\\CODEX';

const checks = [
  {
    name: 'Fase 14 master index source exists',
    file: resolve(codexRoot, 'REESTRUCTURACIONNSDIF\\FASE 14\\NSD_International_Finance_Fase_14_Indice_Maestro_Ejecutivo_Implementacion.docx'),
    patterns: []
  },
  {
    name: 'Local master implementation index exists',
    file: resolve(codexRoot, 'fase14_indice_maestro_local_010626.md'),
    patterns: [
      'Inventario maestro',
      'Orden recomendado',
      'Gates de decision',
      'Handoff operativo',
      'Control documental'
    ]
  },
  {
    name: 'Main progress file tracks phase 14',
    file: resolve(codexRoot, 'avancensdfi280526.md'),
    patterns: [
      'Fase 14',
      'Indice maestro'
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
  console.error(`\nFase 14 local check failed: ${failures} issue(s).`);
  process.exit(1);
}

console.log('\nFase 14 local check passed.');
