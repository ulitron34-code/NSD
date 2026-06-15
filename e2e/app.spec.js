import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the landing page', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/NSD/);
    
    // Check main elements are visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    // Click on Services link
    await page.getByRole('link', { name: /servicios/i }).first().click();
    await expect(page).toHaveURL(/\/services/);
  });

  test('should have working login link', async ({ page }) => {
    await page.getByRole('link', { name: /iniciar sesión/i }).first().click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('should have working signup link', async ({ page }) => {
    await page.getByRole('link', { name: /registro|crear cuenta/i }).first().click();
    await expect(page).toHaveURL(/\/signup/);
  });

  test('should show contact form', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /mensaje/i })).toBeVisible();
  });
});

test.describe('Authentication Flow', () => {
  test('should show login form', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/contraseña/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /entrar|iniciar sesión/i })).toBeVisible();
  });

  test('should show signup form', async ({ page }) => {
    await page.goto('/signup');
    
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/contraseña/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /registrar|crear cuenta/i })).toBeVisible();
  });

  test('should validate empty email on login', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit without email
    await page.getByRole('button', { name: /entrar|iniciar sesión/i }).click();
    
    // Should show validation error
    await expect(page.getByText(/requerido|obligatorio/i)).toBeVisible();
  });
});

test.describe('Page Transitions', () => {
  test('should scroll to top on navigation', async ({ page }) => {
    await page.goto('/');
    
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));
    
    // Navigate
    await page.goto('/services');
    
    // Check scroll position
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBe(0);
  });

  test('should have smooth page transitions', async ({ page }) => {
    await page.goto('/');
    
    // Start navigation
    await page.getByRole('link', { name: /servicios/i }).first().click();
    
    // Check that transition class is applied
    await expect(page.locator('.page-transition')).toBeVisible();
  });
});

test.describe('404 Page', () => {
  test('should show 404 page for unknown routes', async ({ page }) => {
    await page.goto('/this-does-not-exist');
    
    await expect(page.getByText(/404|página no encontrada/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /inicio/i })).toBeVisible();
  });

  test('should navigate home from 404', async ({ page }) => {
    await page.goto('/this-does-not-exist');
    
    await page.getByRole('link', { name: /inicio/i }).click();
    await expect(page).toHaveURL('/');
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Menu should be visible or accessible
    await expect(page.locator('body')).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('should work on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    await expect(page.locator('body')).toBeVisible();
  });
});