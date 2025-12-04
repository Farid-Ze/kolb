import { test, expect } from '@playwright/test';

test.describe('Tunnel Assessment Flow', () => {
  test.setTimeout(90000); // Increase timeout to 90s

  test('should complete a full assessment session', async ({ page }) => {
    // 1. Go to Landing Page first
    await page.goto('/');

    // 2. Register a new user
    const randomId = Math.random().toString(36).substring(7);
    const email = `tunnel_test_${randomId}@student.university.ac.id`;
    const password = 'password123';
    const randomNim = Math.floor(10000000 + Math.random() * 90000000).toString();

    await test.step('Register', async () => {
      await page.goto('/auth');
      await expect(page.getByText('Access Zenotika')).toBeVisible({ timeout: 10000 });

      await page.getByRole('button', { name: 'Register' }).click();
      
      await page.getByLabel('Full Name').fill('Tunnel Tester');
      await page.getByLabel('Email').fill(email);
      await page.getByLabel('Password').fill(password);
      await page.getByLabel('NIM').fill(randomNim);
      await page.getByLabel('Class (IF-XX)').fill('IF-01');
      await page.getByLabel('Enrollment Year').fill('2023');
      
      await page.getByRole('button', { name: 'Create Account' }).click();
      
      await expect(page).toHaveURL(/\/future\/dashboard/, { timeout: 20000 });
    });

    // 2. Start Session
    await test.step('Start Session', async () => {
      await page.goto('/future/tunnel');
      await expect(page.getByText('Start a session to unlock')).toBeVisible();
      await page.getByRole('button', { name: 'Start Session' }).click();
      
      // Wait for session to activate
      await expect(page.getByText(/Session ID:/)).toBeVisible({ timeout: 15000 });

      // Check for Forced-choice items text
      // We use exact match to avoid ambiguity with the footer text
      await expect(page.getByText('Forced-choice items', { exact: true })).toBeVisible({ timeout: 15000 });

      // Check for Item #1
      await expect(page.getByText('Item #1', { exact: true })).toBeVisible({ timeout: 15000 });
    });

    // 3. Rank Item #1
    await test.step('Rank Item #1', async () => {
      // Use exact match for the item number text to find the correct card
      const item1Card = page.locator('article').filter({ has: page.getByText('Item #1', { exact: true }) });
      await expect(item1Card).toBeVisible();

      // Find all selects in this card
      const selects = item1Card.locator('select');
      await expect(selects).toHaveCount(4);

      // Select 1, 2, 3, 4 for the 4 options
      await selects.nth(0).selectOption('1');
      await selects.nth(1).selectOption('2');
      await selects.nth(2).selectOption('3');
      await selects.nth(3).selectOption('4');

      // Verify progress bar updated
      await expect(page.getByText(/1\/\d+ items ranked/)).toBeVisible();
    });

    // 4. Verify Contexts Section exists
    await test.step('Verify Contexts', async () => {
      await expect(page.getByText('Learning Flexibility contexts')).toBeVisible();
    });
    
    // 5. Check Finalize Button State
    await test.step('Check Finalize Button', async () => {
      const finalizeBtn = page.getByRole('button', { name: 'Finalize session' });
      await expect(finalizeBtn).toBeVisible();
      await expect(finalizeBtn).toBeDisabled(); 
    });
  });
});