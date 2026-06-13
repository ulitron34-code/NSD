import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const codexRoot = 'E:\\CODEX';
const frontendRoot = 'E:\\CODEX\\ulitron34-code-nsd-https-github-com';

const checks = [
  {
    name: 'Fase 13 copy source exists',
    file: resolve(codexRoot, 'REESTRUCTURACIONNSDIF\\FASE 13\\NSD_Fase_13_Copy_Web_Publica.md'),
    patterns: [
      'Financiamiento empresarial mejor preparado',
      'Solicitantes',
      'Otorgantes'
    ]
  },
  {
    name: 'Local phase 13 web brief exists',
    file: resolve(codexRoot, 'fase13_web_publica_copy_local_010626.md'),
    patterns: [
      'Home page',
      'Solicitantes',
      'Otorgantes',
      'Seguridad',
      'Disclaimers'
    ]
  },
  {
    name: 'Landing FAQ includes institutional disclaimers',
    file: resolve(frontendRoot, 'src/components/Landing/FAQSection.jsx'),
    patterns: [
      'NSD IF',
      'revision con IA',
      'La plataforma reemplaza al oficial de cumplimiento?'
    ]
  },
  {
    name: 'Header exposes security route',
    file: resolve(frontendRoot, 'src/components/Layout/Header.jsx'),
    patterns: [
      'Seguridad',
      '/security'
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
  console.error(`\nFase 13 local check failed: ${failures} issue(s).`);
  process.exit(1);
}

console.log('\nFase 13 local check passed.');
