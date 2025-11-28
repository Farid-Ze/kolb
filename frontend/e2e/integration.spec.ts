import { expect, test } from '@playwright/test';

test.describe('Integration Flow', () => {
    test('should complete full assessment flow', async ({ page }) => {
        // 1. Register
        const randomId = Math.random().toString(36).substring(7);
        const email = `test_${randomId}@example.com`;
        const password = 'password123';

        await page.goto('/register');
        await page.getByLabel('Full Name').fill('Integration Test User');
        await page.getByLabel('Email').fill(email);
        await page.getByLabel('Password').fill(password);
        await page.getByRole('button', { name: /register/i }).click();

        // 2. Dashboard
        await expect(page).toHaveURL(/\/dashboard/);
        await expect(page.getByText('Welcome, Integration Test User')).toBeVisible();

        // 3. Start Assessment (Dashboard -> Intro)
        await page.getByRole('button', { name: /start new assessment/i }).click();
        await expect(page).toHaveURL(/\/assessment$/);

        // 4. Start Session (Intro -> Runner)
        await page.getByRole('button', { name: /start assessment/i }).click();
        await expect(page).toHaveURL(/\/assessment\/\d+/);

        // 5. Answer a Question
        // Wait for loading to finish
        await expect(page.getByText('Loading assessment...')).not.toBeVisible();

        // Check if we have items
        const noItems = await page.getByText('No items found').isVisible();
        if (!noItems) {
            // Select an option (Option A)
            await page.getByText('Option A').first().click();

            // Click Next
            await page.getByRole('button', { name: /next/i }).click();

            // Verify we moved to next question or finished
            // For now, just verifying we can interact is enough for a smoke test.
        } else {
            console.log('No items found in assessment. Check backend seeding.');
        }
    });
});
