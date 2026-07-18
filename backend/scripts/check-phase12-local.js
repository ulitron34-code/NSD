import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const frontendRoot = resolve(process.cwd(), '..');

const checks = [
  {
    name: 'Backend production proxy is configured',
    file: resolve(process.cwd(), 'src/server.js'),
    patterns: [
      "app.set('trust proxy', 1)",
      'helmet',
      'rateLimit',
      'CORS_ORIGIN'
    ]
  },
  {
    name: 'Public security page exists',
    file: resolve(frontendRoot, 'src/pages/SecurityTraceabilityPage.jsx'),
    patterns: [
      'securityPage.controls',
      'securityPage.principles',
      'securityPage.minimumTitle',
      'securityPage.minimumText'
    ]
  },
  {
    name: 'Security route is wired',
    file: resolve(frontendRoot, 'src/App.jsx'),
    patterns: [
      'SecurityTraceabilityPage',
      'path="/security"'
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
  console.error(`\nFase 12 local check failed: ${failures} issue(s).`);
  process.exit(1);
}

console.log('\nFase 12 local check passed.');
