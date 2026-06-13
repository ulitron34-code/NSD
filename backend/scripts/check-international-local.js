import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const frontendRoot = 'E:\\CODEX\\ulitron34-code-nsd-https-github-com';
const codexRoot = 'E:\\CODEX';

const checks = [
  {
    name: 'Implementation2 i18n guide reviewed',
    file: resolve(codexRoot, '_revision_imlementacion2\\35_GUIA_IMPLEMENTACION_i18n.md'),
    patterns: ['Checklist', 'public/locales', 'Testing']
  },
  {
    name: 'Local international formatter exists',
    file: resolve(frontendRoot, 'src/utils/localization.js'),
    patterns: ['SUPPORTED_MARKETS', 'formatMarketCurrency', 'formatMarketDate', 'buildInternationalReadiness', 'buildInternationalLaunchPlan']
  },
  {
    name: 'Public international page exists',
    file: resolve(frontendRoot, 'src/pages/InternationalPage.jsx'),
    patterns: ['NSD IF internacional', 'Mexico + USA', 'Mercados preparados localmente', 'Matriz de control transfronterizo', 'Checklist antes de publicar internacional']
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
  },
  {
    name: 'International local brief exists',
    file: resolve(codexRoot, 'implementacion_internacional_local_010626.md'),
    patterns: ['Mexico + USA', 'No se copio', 'i18n', 'formatos por mercado']
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
