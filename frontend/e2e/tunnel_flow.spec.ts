import { test, expect } from '@playwright/test';

test.describe('Tunnel Assessment Flow', () => {
  test('should complete a full assessment session', async ({ page, request }) => {
    page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
    page.on('pageerror', exception => console.log(`BROWSER ERROR: ${exception}`));
    page.on('requestfailed', request => console.log(`REQUEST FAILED: ${request.url()} ${request.failure()?.errorText}`));

    // Check main.tsx availability
    try {
      const mainRes = await request.get('http://localhost:5174/src/main.tsx');
      console.log(`main.tsx status: ${mainRes.status()}`);
      console.log(`main.tsx Content-Type: ${mainRes.headers()['content-type']}`);
      console.log(`main.tsx body start: ${(await mainRes.text()).substring(0, 200)}`);
    } catch (e) {
      console.log('Failed to fetch main.tsx directly:', e);
    }
    
    // 1. Go to Landing Page first
    console.log('Navigating to /');
    await page.goto('/');
    // console.log('Page content at /:', await page.content());

    // 2. Register a new user
    const randomId = Math.random().toString(36).substring(7);
    const email = `tunnel_test_${randomId}@student.university.ac.id`;
    const password = 'password123';
    // Generate a random 8-digit NIM to avoid unique constraint violations
    const randomNim = Math.floor(10000000 + Math.random() * 90000000).toString();

    await test.step('Register', async () => {
      console.log('Navigating to /auth');
      await page.goto('/auth');
      
      console.log('Checking for Access Zenotika text');
      try {
        await expect(page.getByText('Access Zenotika')).toBeVisible({ timeout: 10000 });
      } catch (e) {
        console.log('Page content at /auth:', await page.content());
        throw e;
      }

      console.log('Clicking Register tab');
      await page.getByRole('button', { name: 'Register' }).click();
      
      console.log('Filling form');
      await page.getByLabel('Full Name').fill('Tunnel Tester');
      await page.getByLabel('Email').fill(email);
      await page.getByLabel('Password').fill(password);
      await page.getByLabel('NIM').fill(randomNim);
      await page.getByLabel('Class (IF-XX)').fill('IF-01');
      await page.getByLabel('Enrollment Year').fill('2023');
      
      console.log('Submitting');
      await page.getByRole('button', { name: 'Create Account' }).click();
      
      console.log('Waiting for dashboard');
      await expect(page).toHaveURL(/\/future\/dashboard/, { timeout: 15000 });
    });

    // 2. Start Session
    await test.step('Start Session', async () => {
      await page.goto('/future/tunnel');
      await expect(page.getByText('Start a session to unlock')).toBeVisible();
      await page.getByRole('button', { name: 'Start Session' }).click();
      
      // Wait a bit for potential error
      await page.waitForTimeout(1000);
      
      // Check for error message
      const errorMsg = await page.locator('.text-rose-300').textContent().catch(() => null);
      if (errorMsg) {
        console.log('Start Session Error:', errorMsg);
      }

      await expect(page.getByText('Forced-choice items', { exact: true })).toBeVisible();
      await expect(page.getByText('Item #1')).toBeVisible();
    });

    // 3. Rank Item #1
    await test.step('Rank Item #1', async () => {
      const item1Card = page.locator('article').filter({ hasText: 'Item #1' });
      await expect(item1Card).toBeVisible();

      // Find all selects in this card
      const selects = item1Card.locator('select');
      await expect(selects).toHaveCount(4);

      // Select 1, 2, 3, 4 for the 4 options
      await selects.nth(0).selectOption('1');
      await selects.nth(1).selectOption('2');
      await selects.nth(2).selectOption('3');
      await selects.nth(3).selectOption('4');

      // Verify progress bar updated (optional, but good check)
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
      await expect(finalizeBtn).toBeDisabled(); // Should be disabled because not all items are ranked
    });
  });
});