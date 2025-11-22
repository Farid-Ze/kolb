import { test, expect } from '@playwright/test';

test.describe('Assessment Journey Flow', () => {
  const mockSessionId = '123';

  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'user-1',
          username: 'testuser',
          role: 'STUDENT',
        }),
      });
    });

    await page.route(`**/api/engine/sessions/${mockSessionId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          session_id: mockSessionId,
          status: 'ACTIVE',
          current_item_index: 0,
          total_items: 12,
        }),
      });
    });

    await page.route(`**/api/engine/sessions/${mockSessionId}/items`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              item_id: 1,
              prompt: 'When I learn:',
              options: [
                { id: '1', option_code: 'CE', text: 'Feeling' },
                { id: '2', option_code: 'RO', text: 'Watching' },
                { id: '3', option_code: 'AC', text: 'Thinking' },
                { id: '4', option_code: 'AE', text: 'Doing' },
              ],
            },
          ],
          total_items: 1,
        }),
      });
    });
  });

  test('should navigate from start page to assessment with cinematic transition', async ({ page }) => {
    // 1. Go to Assessment Start Page
    await page.goto(`/assessment/${mockSessionId}/start`);

    // 2. Verify Initial State (Cinematic Intro)
    await expect(page.getByText('Kolb Learning Style Inventory 4.0')).toBeVisible();
    await expect(page.getByText('Discover your unique learning potential')).toBeVisible();

    // 3. Click "Begin Journey"
    const startButton = page.getByRole('button', { name: /Mulai Asesmen|Begin Journey/i });
    await expect(startButton).toBeVisible();
    await startButton.click();

    // 4. Verify Navigation to Assessment Page
    await expect(page).toHaveURL(`/assessment/${mockSessionId}`);
    
    // 5. Verify Assessment Page Elements
    await expect(page.getByText('Item 1 / 1')).toBeVisible();
    await expect(page.getByText('When I learn:')).toBeVisible();
  });
});
