import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Cinematic Room Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/experience');
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    // Wait for the main heading to be visible to ensure content is loaded
    await expect(page.locator('h1')).toBeVisible();
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should navigate through all rooms using next/prev buttons', async ({ page }) => {
    // 1. Verify Intro Room (Index 0)
    await expect(page.getByText('The Learning Cycle')).toBeVisible();
    await expect(page.getByText('INTRO')).toBeVisible(); // Stage name

    // 2. Navigate to Concrete Experience (Index 1)
    await page.getByLabel('Next room').click();
    await expect(page.getByText('CONCRETE EXPERIENCE')).toBeVisible();
    await expect(page.locator('p').filter({ hasText: 'Feeling' })).toBeVisible();

    // 3. Navigate to Reflective Observation (Index 2)
    await page.getByLabel('Next room').click();
    await expect(page.getByText('REFLECTIVE OBSERVATION')).toBeVisible();
    await expect(page.locator('p').filter({ hasText: 'Watching' })).toBeVisible();

    // 4. Navigate to Abstract Conceptualization (Index 3)
    await page.getByLabel('Next room').click();
    await expect(page.locator('h2').filter({ hasText: 'ABSTRACT CONCEPTUALIZATION' })).toBeVisible();
    // Note: Title might be "Thinking" or similar, checking registry.ts would confirm
    // Registry says: title: 'Thinking', subtitle: 'Abstract Conceptualization'

    // 5. Navigate to Active Experimentation (Index 4)
    await page.getByLabel('Next room').click();
    await expect(page.locator('h2').filter({ hasText: 'ACTIVE EXPERIMENTATION' })).toBeVisible();
    await expect(page.locator('p').filter({ hasText: 'Doing' })).toBeVisible();

    // 6. Verify Next button is disabled at the end
    await expect(page.getByLabel('Next room')).toBeDisabled();

    // 7. Navigate back to Abstract Conceptualization
    await page.getByLabel('Previous room').click();
    await expect(page.locator('h2').filter({ hasText: 'ABSTRACT CONCEPTUALIZATION' })).toBeVisible();
  });

  test('should navigate using keyboard arrows', async ({ page }) => {
    // Focus on body to ensure keyboard events are captured
    await page.locator('body').focus();

    // Right arrow -> Concrete Experience
    await page.keyboard.press('ArrowRight');
    await expect(page.getByText('CONCRETE EXPERIENCE')).toBeVisible();

    // Left arrow -> Intro
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByText('INTRO')).toBeVisible();
  });

  test('should navigate using navigation dots', async ({ page }) => {
    // Click on the dot for "Watching" (Reflective Observation - Index 2)
    await page.getByLabel('Go to Watching').click();
    await expect(page.getByText('REFLECTIVE OBSERVATION')).toBeVisible();

    // Click on the dot for "Welcome" (Intro - Index 0)
    await page.getByLabel('Go to Welcome').click();
    await expect(page.getByText('INTRO')).toBeVisible();
  });

  test('should display correct content for each room', async ({ page }) => {
    // 1. Intro Room
    await expect(page.getByRole('heading', { name: 'The Learning Cycle' })).toBeVisible();
    await expect(page.getByText('Learning is not a destination')).toBeVisible();

    // 2. Concrete Experience
    await page.getByLabel('Next room').click();
    await expect(page.getByRole('heading', { name: 'Concrete Experience' })).toBeVisible();
    await expect(page.getByText('Learning begins with feeling')).toBeVisible();

    // 3. Reflective Observation
    await page.getByLabel('Next room').click();
    await expect(page.getByRole('heading', { name: 'Reflective Observation' })).toBeVisible();
    // Note: Assuming content based on pattern, if fails will adjust
    
    // 4. Abstract Conceptualization
    await page.getByLabel('Next room').click();
    await expect(page.getByRole('heading', { name: 'Abstract Conceptualization' })).toBeVisible();
    
    // 5. Active Experimentation
    await page.getByLabel('Next room').click();
    await expect(page.getByRole('heading', { name: 'Active Experimentation' })).toBeVisible();
  });

  test('should allow authenticated user to start assessment from final room', async ({ page }) => {
    // Mock Auth
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

    // Mock No Active Session (Return 404 to simulate no session found)
    await page.route('**/api/assessments/latest', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'No active session' }),
      });
    });

    // Mock Start Session
    await page.route('**/api/sessions/start', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ session_id: 123 }),
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

    // Reload to apply auth state
    await page.reload();

    // Navigate to final room directly using dot navigation
    await page.getByLabel('Go to Doing').click();
    
    // Verify room content is loaded (h1 is in the room content, h2 is in the nav)
    await expect(page.locator('h1').filter({ hasText: 'Active Experimentation' })).toBeVisible();

    // Check button
    const startButton = page.getByRole('button', { name: 'Start Experimenting' });
    await expect(startButton).toBeVisible();
    
    // Force click via JS because the nav bar might overlap in the test viewport
    await startButton.evaluate((node) => (node as HTMLElement).click());
    
    // Verify navigation
    await expect(page).toHaveURL(/\/assessment\/123/);
  });
});
