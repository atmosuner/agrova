import { test, expect } from '@playwright/test'

test.describe('Owner /today (logged-in state)', () => {
  test('redirect on /login avoided; /today app shell', async ({ page }) => {
    await page.goto('/today')
    await expect(page).not.toHaveURL(/\/login$/)
    await expect(page.locator('body')).toBeVisible()
  })
})
