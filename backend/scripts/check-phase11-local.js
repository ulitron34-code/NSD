import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const codexRoot = 'E:\\CODEX';

const checks = [
  {
    name: 'Fase 11 source kit exists',
    file: resolve(codexRoot, 'REESTRUCTURACIONNSDIF\\FASE 11\\NSD_International_Finance_Fase_11_Kit_Operacion_Piloto.docx'),
    patterns: []
  },
  {
    name: 'Local pilot kit exists',
    file: resolve(codexRoot, 'kit_piloto_nsd_fase11_310526.md'),
    patterns: [
      'Seleccion de proyectos piloto',
      'Flujo piloto',
      'KPIs piloto',
      'Bitacora de incidencias',
      'Feedback otorgante',
      'Criterios Go/No-Go'
    ]
  },
  {
    name: 'Audit exports support pilot evidence',
    file: resolve(process.cwd(), 'src/routes/audit.js'),
    patterns: [
      'export.md',
      'export.csv',
      'Paquete de auditoria NSD'
    ]
  },
  {
    name: 'Local Go/No-Go report exists',
    file: resolve(codexRoot, 'go_nogo_local_nsd_310526.md'),
    patterns: [
      'GO local',
      'No significa todavia'
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
  console.error(`\nFase 11 local check failed: ${failures} issue(s).`);
  process.exit(1);
}

console.log('\nFase 11 local check passed.');
