import { test, expect } from '@playwright/test';

test.describe('Services Catalog', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/services');
  });

  test('renders catalog page with heading', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('shows Business Plan service', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Business Plan Profesional/i })).toBeVisible();
  });

  test('shows Analisis Financiero service', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Analisis Financiero/i })).toBeVisible();
  });

  test('shows Paquete Completo service', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Paquete Completo/i })).toBeVisible();
  });

  test('each service has a call-to-action button', async ({ page }) => {
    const buttons = page.getByRole('button', { name: /solicitar|contratar|iniciar/i });
    await expect(buttons.first()).toBeVisible();
    const count = await buttons.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('clicking a service button opens request form', async ({ page }) => {
    await page.getByRole('button', { name: /solicitar|contratar|iniciar/i }).first().click();
    await expect(page.getByText(/Nombre del Proyecto/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Landing Page Pricing Section', () => {
  test('landing page has current implementation modalities', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Núcleo de Cumplimiento|Orquestación Avanzada|Infraestructura Institucional/i).first()).toBeVisible();
  });

  test('landing page avoids unsupported fixed monthly pricing claims', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Modalidades de implementación/i).first()).toBeVisible();
    await expect(page.getByText(/\$299|\$699|\$899/i)).toHaveCount(0);
  });
});
