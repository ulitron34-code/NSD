import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = String(process.env.NUXERA_PUBLIC_BASE_URL || 'https://nsd-pi.vercel.app').replace(/\/$/, '');
const outDir = process.env.NUXERA_ENGLISH_QA_OUT || path.join('artifacts', 'nuxera-english-qa');
const scenarios = [
  { id: 'public-home', path: '/', user: null, expected: ['NUXERA Financial Intelligence'] },
  { id: 'applicant-dashboard-en', path: '/dashboard', profile: 'solicitante', user: { id: 'qa-applicant-en', role: 'solicitante', demo: true, email: 'applicant.qa@nuxera.local' }, expected: ['NUXERA Financial Intelligence', 'Applicant'] },
  { id: 'grantor-workspace-en', path: '/dashboard/nuxera/cases', profile: 'otorgante', user: { id: 'qa-grantor-en', role: 'otorgante', demo: true, email: 'grantor.qa@nuxera.local' }, expected: ['NUXERA Financial Intelligence', 'Grantor'] },
  { id: 'admin-operations-en', path: '/dashboard/nuxera/operations', profile: 'administrador', user: { id: 'qa-admin-en', role: 'administrador', demo: false, email: 'admin.qa@nuxera.local' }, expected: ['NUXERA Financial Intelligence', 'Admin'] }
];

async function seedNuxeraEnglish(page, scenario) {
  await page.addInitScript(({ user, profile }) => {
    localStorage.setItem('nsd_ui_view', 'nuxera');
    localStorage.setItem('nuxera_language', 'en');
    localStorage.setItem('i18nextLng', 'en');
    if (user) {
      localStorage.setItem('auth_token', 'qa-local-token');
      localStorage.setItem('user', JSON.stringify(user));
    }
    if (profile) localStorage.setItem('nsd_demo_profile', profile);
  }, { user: scenario.user, profile: scenario.profile });
}

async function run() {
  await fs.mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  const results = [];

  for (const scenario of scenarios) {
    await seedNuxeraEnglish(page, scenario);
    const url = `${baseUrl}${scenario.path}`;
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    const title = await page.title();
    const bodyText = await page.locator('body').innerText({ timeout: 10000 }).catch(() => '');
    const screenshot = path.join(outDir, `${scenario.id}.png`);
    await page.screenshot({ path: screenshot, fullPage: true });
    const missing = scenario.expected.filter((needle) => !`${title}\n${bodyText}`.includes(needle));
    results.push({ ...scenario, url, title, screenshot, passed: missing.length === 0, missing });
    await page.evaluate(() => localStorage.clear());
  }

  await browser.close();
  const evidence = {
    id: 'nuxera-english-qa-evidence',
    baseUrl,
    generatedAt: new Date().toISOString(),
    summary: {
      total: results.length,
      passed: results.filter((result) => result.passed).length,
      failed: results.filter((result) => !result.passed).length
    },
    results
  };
  await fs.writeFile(path.join(outDir, 'english-qa-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(evidence.summary, null, 2));
  if (evidence.summary.failed) process.exitCode = 1;
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
