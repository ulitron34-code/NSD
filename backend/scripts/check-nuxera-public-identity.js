import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const frontendRoot = resolve(process.cwd(), '..');
const checks = [
  {
    label: 'HTML metadata',
    file: resolve(frontendRoot, 'index.html'),
    required: ['NUXERA Financial Intelligence', 'Evidencia para decisiones financieras', '/og-image.svg'],
    forbidden: ['NEXUS Secure Due-Diligence Unit', 'nsd-pi.vercel.app']
  },
  {
    label: 'Open Graph image',
    file: resolve(frontendRoot, 'public/og-image.svg'),
    required: ['NUXERA', 'FINANCIAL INTELLIGENCE', 'Evidencia Trazable.', 'Decisiones Claras.'],
    forbidden: ['NEXUS', 'SECURE DUE-DILIGENCE UNIT', 'nsd.com']
  }
];

let failures = 0;
for (const check of checks) {
  const content = readFileSync(check.file, 'utf8');
  const missing = check.required.filter((value) => !content.includes(value));
  const forbidden = check.forbidden.filter((value) => content.includes(value));
  if (missing.length || forbidden.length) {
    failures += 1;
    console.error(`ERROR - ${check.label}: missing [${missing.join(', ')}], forbidden [${forbidden.join(', ')}]`);
  } else {
    console.log(`OK - ${check.label}`);
  }
}

if (failures) {
  console.error(`\nNUXERA public identity check failed: ${failures} issue(s).`);
  process.exit(1);
}

console.log('\nNUXERA public identity check passed.');
