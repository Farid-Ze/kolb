/**
 * VISUAL AUDIT SCRIPT
 * 
 * Takes screenshots of all key pages and saves them for review.
 */

import { chromium } from 'playwright'
import * as fs from 'fs'
import * as path from 'path'

const BASE_URL = 'http://localhost:5175'
const OUTPUT_DIR = './screenshots'

const PAGES = [
  { name: 'landing-hero', path: '/', waitFor: 2000 },
  { name: 'landing-scroll-25', path: '/', scroll: 0.25, waitFor: 1000 },
  { name: 'landing-scroll-50', path: '/', scroll: 0.50, waitFor: 1000 },
  { name: 'landing-scroll-75', path: '/', scroll: 0.75, waitFor: 1000 },
  { name: 'sphere', path: '/sphere', waitFor: 3000 },
  { name: 'futures', path: '/futures', waitFor: 3000 },
]

async function takeScreenshots() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  })

  console.log('Starting visual audit...\n')

  for (const pageConfig of PAGES) {
    const page = await context.newPage()
    
    try {
      console.log(`📸 Capturing: ${pageConfig.name}`)
      
      await page.goto(`${BASE_URL}${pageConfig.path}`, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      })
      
      // Wait for animations/3D to load
      await page.waitForTimeout(pageConfig.waitFor)
      
      // Scroll if needed
      if (pageConfig.scroll) {
        const scrollHeight = await page.evaluate(() => document.body.scrollHeight)
        await page.evaluate((y) => window.scrollTo(0, y), scrollHeight * pageConfig.scroll)
        await page.waitForTimeout(1000)
      }
      
      const screenshotPath = path.join(OUTPUT_DIR, `${pageConfig.name}.png`)
      await page.screenshot({ path: screenshotPath, fullPage: false })
      
      console.log(`   ✅ Saved: ${screenshotPath}`)
    } catch (error) {
      console.log(`   ❌ Failed: ${error}`)
    }
    
    await page.close()
  }

  await browser.close()
  console.log('\n✨ Visual audit complete!')
  console.log(`Screenshots saved to: ${OUTPUT_DIR}/`)
}

takeScreenshots().catch(console.error)
