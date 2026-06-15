import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const codexRoot = 'E:\\CODEX';

const checks = [
  {
    name: 'Fase 16 source exists',
    file: resolve(codexRoot, 'REESTRUCTURACIONNSDIF\\FASE 16\\NSD_Fase_16_Backup_Plataforma_y_Corrida_APIs_IA.docx'),
    patterns: []
  },
  {
    name: 'Local phase 16 brief exists',
    file: resolve(codexRoot, 'fase16_backup_apis_ia_local_010626.md'),
    patterns: [
      'Respaldo integral',
      'Protocolo anti-desastre',
      'Control de gasto IA',
      'DeepSeek',
      'Claude'
    ]
  },
  {
    name: 'Go/No-Go includes local checks before deploy',
    file: resolve(process.cwd(), 'scripts/go-nogo-local.js'),
    patterns: [
      'Frontend production build',
      'Supabase pending SQL package',
      'Fase 15 local'
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
  console.error(`\nFase 16 local check failed: ${failures} issue(s).`);
  process.exit(1);
}

console.log('\nFase 16 local check passed.');
