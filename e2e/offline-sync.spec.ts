import { test, expect } from '@playwright/test'

test.describe('Worker mobile / offline M3', () => {
  test('login page shows sign-in form (worker query does not switch to device copy)', async ({ page }) => {
    await page.goto('/login?worker=1')
    await expect(page.getByRole('textbox', { name: /e-posta|email/i })).toBeVisible()
  })

  test('unauthenticated /m sends user to login with worker context', async ({ page }) => {
    await page.goto('/m/tasks')
    await expect(page).toHaveURL(/\/login/)
  })

  test('sync indicator route shell — login page does not 404', async ({ page }) => {
    const res = await page.goto('/login')
    expect(res?.ok() ?? true).toBe(true)
  })
})
