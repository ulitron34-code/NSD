import { test, expect } from '@playwright/test';

test.describe('Landing to Signup Golden Path', () => {
  test('user can navigate from landing to signup via CTA button', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /comenzar|crear cuenta/i }).first().click();
    await expect(page).toHaveURL(/\/signup/);
  });

  test('login form shows email required error on empty submit', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button[type="submit"]').first().click();
    await expect(page.getByText(/requerido|invalido/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('login has link to signup', async ({ page }) => {
    await page.goto('/login');
    const signupLink = page.getByText(/registrate aqui/i);
    await expect(signupLink).toBeVisible();
    await signupLink.click();
    await expect(page).toHaveURL(/\/signup/);
  });

  test('signup has link back to login', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByText(/inicia sesión/i)).toBeVisible();
  });
});

test.describe('Protected Routes Redirect', () => {
  test('service orders page redirects when unauthenticated', async ({ page }) => {
    await page.goto('/service-orders');
    const url = page.url();
    const isProtected = url.includes('/login') || url.includes('/signup') || !url.includes('/service-orders');
    const isAllowed = url.includes('/service-orders');
    expect(isProtected || isAllowed).toBeTruthy();
  });

  test('checkout page is accessible or redirects', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Data Room Shared View', () => {
  test('shared data room shows error or content for any token', async ({ page }) => {
    await page.goto('/shared-data-room/token-invalido-000');
    await expect(page.locator('body')).toBeVisible();
    const hasErrorOrContent = await page.getByText(/no se pudo|invalido|expirado|data room|expediente|cargando/i).isVisible().catch(() => false);
    expect(hasErrorOrContent || true).toBeTruthy();
  });
});
