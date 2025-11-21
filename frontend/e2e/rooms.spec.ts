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
});
