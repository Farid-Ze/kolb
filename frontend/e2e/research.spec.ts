import { test, expect } from '@playwright/test';

test.describe('Research Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Auth as Researcher
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'researcher-1',
          email: 'researcher@example.com',
          name: 'Dr. Kolb',
          role: 'MEDIATOR',
          created_at: new Date().toISOString(),
        }),
      });
    });

    // Seed LocalStorage to bypass login
    await page.addInitScript(() => {
      localStorage.setItem('accessToken', 'mock-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'researcher-1',
        email: 'researcher@example.com',
        name: 'Dr. Kolb',
        role: 'MEDIATOR',
        created_at: new Date().toISOString(),
      }));
    });

    // Mock Studies List
    await page.route('**/api/research/studies', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            title: 'Learning Styles in Engineering',
            description: 'A longitudinal study.',
            started_at: '2025-01-01T00:00:00Z',
            completed_at: null,
          },
          {
            id: 2,
            title: 'Medical Students 2025',
            description: 'Cohort analysis.',
            started_at: null,
            completed_at: null,
          },
        ]),
      });
    });
  });

  test('should display list of studies', async ({ page }) => {
    await page.goto('/research');
    
    // Wait for loading
    await expect(page.getByText('Memuat studi penelitian...')).toBeHidden({ timeout: 10000 });

    // Verify Header
    await expect(page.getByRole('heading', { name: 'Dashboard Penelitian' })).toBeVisible();

    // Verify Study Cards
    await expect(page.getByText('Learning Styles in Engineering')).toBeVisible();
    await expect(page.getByText('Medical Students 2025')).toBeVisible();
    
    // Verify Status Badges
    await expect(page.getByRole('button', { name: 'Aktif', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Draft', exact: true })).toBeVisible();
  });

  test('should filter studies', async ({ page }) => {
    await page.goto('/research');

    // Search
    const searchInput = page.getByPlaceholder(/Cari studi/i);
    await searchInput.fill('Engineering');
    
    await expect(page.getByText('Learning Styles in Engineering')).toBeVisible();
    await expect(page.getByText('Medical Students 2025')).not.toBeVisible();
  });

  test('should open create study modal', async ({ page }) => {
    await page.goto('/research');

    // Click Create Button
    await page.getByRole('button', { name: /Buat Studi/i }).first().click();

    // Verify Modal
    await expect(page.getByText('Buat Studi Baru')).toBeVisible();
    await expect(page.getByLabel(/Judul Studi/i)).toBeVisible();
  });

  test('should display empty state when no studies exist', async ({ page }) => {
    // Override mock to return empty array
    await page.route('**/api/research/studies', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/research');
    
    // Wait for loading
    await expect(page.getByText('Memuat studi penelitian...')).toBeHidden({ timeout: 10000 });

    // Verify Empty State
    await expect(page.getByRole('heading', { name: 'Belum Ada Studi Penelitian' })).toBeVisible();
    await expect(page.getByText('Buat studi pertama Anda untuk mulai mengumpulkan data penelitian')).toBeVisible();
    
    // Verify Create Button in Empty State
    // Note: There are two "Buat Studi" buttons (one in header, one in empty state)
    const createButtons = page.getByRole('button', { name: 'Buat Studi' });
    await expect(createButtons).toHaveCount(2);
  });
});
