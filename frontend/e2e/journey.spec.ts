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
          email: 'test@example.com',
          name: 'Test User',
          role: 'STUDENT',
          created_at: new Date().toISOString(),
        }),
      });
    });

    // Seed LocalStorage
    await page.addInitScript(() => {
      localStorage.setItem('accessToken', 'mock-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'STUDENT',
        created_at: new Date().toISOString(),
      }));
    });

    await page.route(`**/api/engine/sessions/${mockSessionId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: mockSessionId,
          user_id: 'user-1',
          instrument_id: 'S-KLSI-4',
          status: 'Started',
          started_at: new Date().toISOString(),
          progress: 0,
          current_item_index: 0,
          total_items: 1,
        }),
      });
    });

    await page.route(`**/api/engine/sessions/${mockSessionId}/items`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          delivery: {
            items: [
              {
                id: '1',
                stem: 'When I learn:',
                options: [
                  { id: '1', option_code: 'CE', text: 'Feeling' },
                  { id: '2', option_code: 'RO', text: 'Watching' },
                  { id: '3', option_code: 'AC', text: 'Thinking' },
                  { id: '4', option_code: 'AE', text: 'Doing' },
                ],
              },
            ],
          },
          total_items: 1,
        }),
      });
    });
  });

  test('should navigate from start page to assessment with cinematic transition', async ({ page }) => {
    // 1. Go to Assessment Start Page
    await page.goto(`/assessment/${mockSessionId}/start`);

    // Wait for auth check
    await expect(page.getByText('Memverifikasi autentikasi...')).toBeHidden({ timeout: 10000 });

    // 2. Verify Initial State (Cinematic Intro)
    // Check attachment first to rule out rendering issues
    await expect(page.getByText(/Apa yang akan Anda lakukan/i)).toBeAttached({ timeout: 10000 });
    await expect(page.getByText(/Apa yang akan Anda lakukan/i)).toBeVisible({ timeout: 10000 });

    // 3. Click "Begin Journey"
    const startButton = page.getByRole('button', { name: /Mulai Asesmen/i });
    await expect(startButton).toBeVisible();
    await startButton.click();

    // 4. Verify Navigation to Assessment Page
    await expect(page).toHaveURL(`/assessment/${mockSessionId}`);
    
    // Wait for loading to complete
    await expect(page.getByText('Memuat asesmen...')).toBeHidden({ timeout: 10000 });
    
    // 5. Verify Assessment Page Elements
    // Wait for the prompt text which is the main content
    await expect(page.getByText('When I learn:')).toBeVisible({ timeout: 10000 });
    
    // Then verify pagination
    await expect(page.getByText(/Item 1 \//)).toBeVisible();
  });
});
