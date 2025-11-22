import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should redirect STUDENT to home after login', async ({ page }) => {
    // Mock Login API
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-token',
          user: { id: 'u1', role: 'STUDENT', username: 'student' },
        }),
      });
    });

    // Mock Me API (called after login)
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'u1', role: 'STUDENT', username: 'student' }),
      });
    });

    await page.goto('/auth/login');
    await page.getByLabel(/Email/i).fill('student@example.com');
    await page.getByPlaceholder(/demo123/i).fill('password');
    await page.getByRole('button', { name: /Masuk/i }).click();

    await expect(page).toHaveURL('/');
  });

  test('should redirect MEDIATOR to dashboard after login', async ({ page }) => {
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-token',
          user: { id: 'u2', role: 'MEDIATOR', username: 'mediator' },
        }),
      });
    });

    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'u2', role: 'MEDIATOR', username: 'mediator' }),
      });
    });

    await page.goto('/auth/login');
    await page.getByLabel(/Email/i).fill('mediator@example.com');
    await page.getByPlaceholder(/demo123/i).fill('password');
    await page.getByRole('button', { name: /Masuk/i }).click();

    await expect(page).toHaveURL('/mediator');
  });
});
