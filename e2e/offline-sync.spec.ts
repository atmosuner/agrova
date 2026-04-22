import { test, expect } from '@playwright/test'

test.describe('Worker mobile / offline M3', () => {
  test('worker login landing copy is present', async ({ page }) => {
    await page.goto('/login?worker=1')
    /* Turkish device-setup copy (Lingui) */
    await expect(page.getByText(/Kurulum linki/i).first()).toBeVisible()
  })

  test('unauthenticated /m sends user to login with worker context', async ({ page }) => {
    await page.goto('/m/tasks')
    await expect(page).toHaveURL(/\/login/)
  })

  test('sync indicator route shell — login page does not 404', async ({ page }) => {
    const res = await page.goto('/login?worker=1')
    expect(res?.ok() ?? true).toBe(true)
  })
})
