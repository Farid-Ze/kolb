import { test } from '@playwright/test'

const BASE_URL = 'http://localhost:5176'

test('Visual Audit - Landing Page Hero', async ({ page }) => {
  await page.goto(BASE_URL)
  await page.waitForTimeout(3000)
  await page.screenshot({ path: './screenshots/landing-hero.png' })
})

test('Visual Audit - Landing Page Scroll 50%', async ({ page }) => {
  await page.goto(BASE_URL)
  await page.waitForTimeout(2000)
  const scrollHeight = await page.evaluate(() => document.body.scrollHeight)
  await page.evaluate((y) => window.scrollTo(0, y), scrollHeight * 0.5)
  await page.waitForTimeout(1500)
  await page.screenshot({ path: './screenshots/landing-50.png' })
})

test('Visual Audit - Sphere Page', async ({ page }) => {
  await page.goto(`${BASE_URL}/sphere`)
  await page.waitForTimeout(4000)
  await page.screenshot({ path: './screenshots/sphere.png' })
})

test('Visual Audit - Futures Tunnel', async ({ page }) => {
  await page.goto(`${BASE_URL}/futures`)
  await page.waitForTimeout(4000)
  await page.screenshot({ path: './screenshots/futures.png' })
})
