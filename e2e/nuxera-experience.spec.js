import { expect, test } from '@playwright/test';

async function seedSession(page, user, demoProfile = null) {
  await page.addInitScript(({ seededUser, profile }) => {
    localStorage.setItem('auth_token', 'e2e-local-token');
    localStorage.setItem('user', JSON.stringify(seededUser));
    localStorage.setItem('nsd_ui_view', 'nuxera');
    if (profile) localStorage.setItem('nsd_demo_profile', profile);
  }, { seededUser: user, profile: demoProfile });
}

test.describe('NUXERA controlled experience', () => {
  test('public metadata and social identity are NUXERA', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/NUXERA Financial Intelligence/);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'NUXERA Financial Intelligence');
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', '/social-preview.png');
  });

  test('demo applicant opens the NUXERA applicant workspace', async ({ page }) => {
    await seedSession(page, { id: 'demo-applicant', role: 'solicitante', demo: true }, 'solicitante');
    await page.goto('/dashboard');
    await expect(page.getByText('NUXERA Financial Intelligence / Solicitante')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Preparar solicitud de financiamiento' })).toBeVisible();
  });

  test('authenticated admin role is not overridden by the demo profile selector', async ({ page }) => {
    await seedSession(page, { id: 'admin-e2e', role: 'administrador', demo: false }, 'solicitante');
    await page.goto('/dashboard/nuxera/system');
    await expect(page.getByRole('heading', { name: 'Sistema y despliegue' })).toBeVisible();
    await expect(page.locator('.nuxera-breadcrumb')).toContainText('Administrador');
  });

  test('unknown NUXERA section remains inside the role workspace', async ({ page }) => {
    await seedSession(page, { id: 'demo-grantor', role: 'otorgante', demo: true }, 'otorgante');
    await page.goto('/dashboard/nuxera/queue');
    await expect(page.getByText('NUXERA Financial Intelligence / Otorgante')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Cola de casos priorizada' })).toBeVisible();
  });

  test('mobile shell exposes keyboard-friendly navigation and language control', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seedSession(page, { id: 'demo-mobile', role: 'solicitante', demo: true, email: 'mobile@nuxera.test' }, 'solicitante');
    await page.goto('/dashboard');
    const menu = page.getByRole('button', { name: 'Menú', exact: true });
    await expect(menu).toBeVisible();
    await menu.focus();
    await page.keyboard.press('Enter');
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#nuxera-mobile-navigation')).toBeVisible();
    await page.locator('#nuxera-mobile-navigation').getByRole('link', { name: 'Inicio' }).click();
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await page.getByRole('button', { name: 'Switch language to English' }).click();
    await expect(page.getByRole('link', { name: 'Help' })).toBeVisible();
  });
});
