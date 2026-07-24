import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const frontendRoot = resolve(process.cwd(), '..');
const checks = [
  {
    label: 'HTML metadata',
    file: resolve(frontendRoot, 'index.html'),
    required: ['NUXERA Financial Intelligence', 'Evidencia para decisiones financieras', '/social-preview.png'],
    forbidden: ['NEXUS Secure Due-Diligence Unit', 'nsd-pi.vercel.app']
  },
  {
    label: 'Open Graph image source',
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

// Social crawlers (Facebook, LinkedIn, X, WhatsApp) do not render SVG for og:image/twitter:image,
// so a rasterized export of og-image.svg must exist alongside it.
const socialPreviewPath = resolve(frontendRoot, 'public/social-preview.png');
try {
  const stats = statSync(socialPreviewPath);
  if (!stats.isFile() || stats.size < 1024) {
    failures += 1;
    console.error('ERROR - Social preview PNG: file missing or too small at public/social-preview.png');
  } else {
    console.log('OK - Social preview PNG');
  }
} catch {
  failures += 1;
  console.error('ERROR - Social preview PNG: public/social-preview.png not found');
}

if (failures) {
  console.error(`\nNUXERA public identity check failed: ${failures} issue(s).`);
  process.exit(1);
}

console.log('\nNUXERA public identity check passed.');
