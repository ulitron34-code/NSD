import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const frontendRoot = resolve(process.cwd(), '..');

const checks = [
  {
    name: 'Landing includes responsible AI disclaimers',
    file: resolve(frontendRoot, 'src/components/Landing/ResponsibleAISection.jsx'),
    patterns: [
      'Decision humana',
      'no aprueba credito',
      'ni reemplaza'
    ]
  },
  {
    name: 'Footer exposes public trust routes',
    file: resolve(frontendRoot, 'src/components/Landing/Footer.jsx'),
    patterns: [
      '/security',
      '/international',
      '/for-applicants',
      '/for-funders'
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
