import { test, expect } from '@playwright/test';

test('smoke test: loads homepage', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/KLSI 4.0/);
  await expect(page.getByText('Kolb Learning Style Inventory')).toBeVisible();
});
