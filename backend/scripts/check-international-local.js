import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const frontendRoot = resolve(process.cwd(), '..');

const checks = [
  {
    name: 'Local international formatter exists',
    file: resolve(frontendRoot, 'src/utils/localization.js'),
    patterns: ['SUPPORTED_MARKETS', 'formatMarketCurrency', 'formatMarketDate', 'buildInternationalReadiness', 'buildInternationalLaunchPlan']
  },
  {
    name: 'Public international page exists',
    file: resolve(frontendRoot, 'src/pages/InternationalPage.jsx'),
    patterns: ['internationalPage.launchPlan', 'internationalPage.crossBorder', 'internationalPage.checklist', 'SUPPORTED_MARKETS']
  },
  {
    name: 'International route wired',
    file: resolve(frontendRoot, 'src/App.jsx'),
    patterns: ['InternationalPage', 'path="/international"']
  },
  {
    name: 'Otorgante pipeline uses country fields',
    file: resolve(frontendRoot, 'src/data/demoServiceOrders.js'),
    patterns: ['country: "MX"', 'country: "US"', 'structure', 'targetEntity']
  }
];

let failures = 0;

for (const check of checks) {
  if (!existsSync(check.file)) {
    failures += 1;
    console.error(`ERROR - ${check.name}: missing ${check.file}`);
    continue;
  }

  const content = readFileSync(check.file, 'utf8');
  const missing = check.patterns.filter((pattern) => !content.includes(pattern));
  if (missing.length) {
    failures += 1;
    console.error(`ERROR - ${check.name}: missing ${missing.join(', ')}`);
    continue;
  }

  console.log(`OK - ${check.name}`);
}

if (failures > 0) {
  console.error(`\nInternational local check failed: ${failures} issue(s).`);
  process.exit(1);
}

console.log('\nInternational local package passed.');
