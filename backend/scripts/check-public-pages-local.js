import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const frontendRoot = resolve(process.cwd(), '..');

const checks = [
  {
    name: 'For applicants page',
    file: resolve(frontendRoot, 'src/pages/ForApplicantsPage.jsx'),
    patterns: ['useTranslation', 'forApplicants.eyebrow', 'forApplicants.steps', 'forApplicants.deliverables', 'navigate("/services")']
  },
  {
    name: 'For funders page',
    file: resolve(frontendRoot, 'src/pages/ForFundersPage.jsx'),
    patterns: ['useTranslation', 'forFunders.eyebrow', 'forFunders.controls', 'forFunders.flow', 'navigate("/dashboard")']
  },
  {
    name: 'Routes wired',
    file: resolve(frontendRoot, 'src/App.jsx'),
    patterns: ['ForApplicantsPage', 'ForFundersPage', 'path="/for-applicants"', 'path="/for-funders"']
  },
  {
    name: 'Footer public links',
    file: resolve(frontendRoot, 'src/components/Landing/Footer.jsx'),
    patterns: ['/for-applicants', '/for-funders', '/international', '/security']
  },
  {
    name: 'Landing operating model',
    file: resolve(frontendRoot, 'src/components/Landing/OperatingModelSection.jsx'),
    patterns: ['Modelo operativo NEXUS', 'De solicitud dispersa', 'Data room', 'No aprueba creditos']
  },
  {
    name: 'Landing operating model wired',
    file: resolve(frontendRoot, 'src/pages/LandingPage.jsx'),
    patterns: ['OperatingModelSection']
  },
  {
    name: 'Landing final CTA paths',
    file: resolve(frontendRoot, 'src/components/Landing/CTASection.jsx'),
    patterns: ['navigate("/signup")', 'navigate("/contact")', 'cta.cta1', 'cta.cta2']
  },
  {
    name: 'i18n public page resources',
    file: resolve(frontendRoot, 'src/utils/i18n.js'),
    patterns: ['resources', 'initReactI18next', 'fallbackLng', 'localStorage.getItem("language")']
  },
  {
    name: 'i18n loaded at entrypoint',
    file: resolve(frontendRoot, 'src/main.jsx'),
    patterns: ["./utils/i18n"]
  },
  {
    name: 'Brand config exists',
    file: resolve(frontendRoot, 'src/config/brand.js'),
    patterns: ['BRAND', 'productName', 'contactEmail', 'logoAlt']
  },
  {
    name: 'Brand config wired',
    file: resolve(frontendRoot, 'src/components/Layout/Header.jsx'),
    patterns: ['BRAND', 'BRAND.logoAlt']
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

if (failures) {
  console.error(`\nPublic pages local check failed: ${failures} issue(s).`);
  process.exit(1);
}

console.log('\nPublic pages local package passed.');
