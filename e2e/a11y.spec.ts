import AxeBuilder from '@axe-core/playwright'
import { test, expect } from '@playwright/test'

const BAD = new Set(['serious', 'critical'])

async function expectNoSeriousA11y(page: import('@playwright/test').Page, path: string) {
  await page.goto(path)
  const { violations } = await new AxeBuilder({ page })
    .disableRules(['color-contrast'])
    .analyze()
  const bad = violations.filter((v) => v.impact && BAD.has(v.impact))
  expect(bad, JSON.stringify(bad, null, 2)).toEqual([])
}

test.describe('M8-01 a11y (axe)', () => {
  test('login', async ({ page }) => {
    await expectNoSeriousA11y(page, '/login')
  })
  test('offline', async ({ page }) => {
    await expectNoSeriousA11y(page, '/offline')
  })
  test('privacy', async ({ page }) => {
    await expectNoSeriousA11y(page, '/privacy')
  })
  test('how-to-install', async ({ page }) => {
    await expectNoSeriousA11y(page, '/how-to-install')
  })
})
