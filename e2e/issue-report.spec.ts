import { test, expect } from '@playwright/test'

test.describe('Issue reporting routes', () => {
  test('unauthenticated /m/report-issue redirects to login', async ({ page }) => {
    await page.goto('/m/report-issue')
    await expect(page).toHaveURL(/\/login/)
  })

  test('owner /issues route requires login', async ({ page }) => {
    await page.goto('/issues')
    await expect(page).toHaveURL(/\/login/)
  })
})
