import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const codexRoot = 'E:\\CODEX';

const checks = [
  {
    name: 'Fase 15 investor memo source exists',
    file: resolve(codexRoot, 'REESTRUCTURACIONNSDIF\\FASE 15\\NSD_International_Finance_Fase_15_Version_Ejecutiva_Socios_Inversionistas.docx'),
    patterns: []
  },
  {
    name: 'Local investor memo exists',
    file: resolve(codexRoot, 'fase15_memo_socios_inversionistas_local_010626.md'),
    patterns: [
      'Tesis ejecutiva',
      'Problema de mercado',
      'Solucion NSD',
      'Modelo de ingresos',
      'Riesgos y mitigantes'
    ]
  },
  {
    name: 'Main progress file tracks phase 15',
    file: resolve(codexRoot, 'avancensdfi280526.md'),
    patterns: [
      'Fase 15',
      'socios e inversionistas'
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
  console.error(`\nFase 15 local check failed: ${failures} issue(s).`);
  process.exit(1);
}

console.log('\nFase 15 local check passed.');
