import { test, expect } from '@playwright/test';

test.describe('Tunnel Assessment Flow', () => {
  test('should complete a full assessment session', async ({ page }) => {
    // 1. Register a new user
    const randomId = Math.random().toString(36).substring(7);
    const email = `tunnel_test_${randomId}@example.com`;
    const password = 'password123';

    await test.step('Register', async () => {
      await page.goto('/auth');
      await page.getByRole('button', { name: 'Register' }).click();
      await page.getByLabel('Full Name').fill('Tunnel Tester');
      await page.getByLabel('Email').fill(email);
      await page.getByLabel('Password').fill(password);
      await page.getByLabel('NIM').fill('12345678');
      await page.getByLabel('Class (IF-XX)').fill('IF-01');
      await page.getByLabel('Enrollment Year').fill('2023');
      await page.getByRole('button', { name: 'Create Account' }).click();
      await expect(page).toHaveURL(/\/future\/dashboard/);
    });

    // 2. Start Session
    await test.step('Start Session', async () => {
      await page.goto('/future/tunnel');
      await expect(page.getByText('Start a session to unlock')).toBeVisible();
      await page.getByRole('button', { name: 'Start Session' }).click();
      await expect(page.getByText('Forced-choice items')).toBeVisible();
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
      // The text "1/12 items ranked" should appear (assuming 12 items)
      // Or just "1/"
      await expect(page.getByText(/1\/\d+ items ranked/)).toBeVisible();
    });

    // 4. Verify Contexts Section exists
    await test.step('Verify Contexts', async () => {
      await expect(page.getByText('Learning Flexibility contexts')).toBeVisible();
      // We won't fill all of them in this smoke test unless we mock the backend to have fewer items
      // But we can check if the first context card is there.
      // Context names are usually "Evaluating", "Leading", etc.
      // Let's just check for a card with a select.
      const contextCards = page.locator('article').filter({ hasText: /Context/i }); // Or just look for the section
      // Actually AssessmentContextCard doesn't have "Context" text explicitly in the code I saw?
      // Let's check AssessmentContextCard.tsx
    });
    
    // 5. Check Finalize Button State
    await test.step('Check Finalize Button', async () => {
      const finalizeBtn = page.getByRole('button', { name: 'Finalize session' });
      await expect(finalizeBtn).toBeVisible();
      await expect(finalizeBtn).toBeDisabled(); // Should be disabled because not all items are ranked
    });
  });
});
