import { expect, test } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should allow user to login', async ({ page }) => {
    // Mock the login API
    await page.route(/.*\/auth\/login/, async (route) => {
      console.log('Intercepted login request');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'fake-jwt-token',
          tokenType: 'bearer',
          expiresIn: 3600,
          user: {
            id: 1,
            email: 'test@example.com',
            fullName: 'Test User',
            role: 'MAHASISWA',
          },
        }),
      })
    })

    // Mock the user profile API (called after login)
    await page.route(/.*\/users\/me/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          email: 'test@example.com',
          full_name: 'Test User',
          role: 'MAHASISWA',
        }),
      })
    })

    await page.goto('/auth')

    // Fill the login form
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Expect to be redirected to dashboard or home
    // Depending on the app logic, it might go to /future/dashboard or /
    await expect(page).toHaveURL(/.*(\/|\/future\/dashboard)/)
    
    // Check if token is in local storage (optional, but good verification)
    const token = await page.evaluate(() => localStorage.getItem('zenotika_token'))
    expect(token).toBe('fake-jwt-token')
  })
})
