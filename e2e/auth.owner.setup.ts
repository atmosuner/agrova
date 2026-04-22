import { test as setup, expect } from '@playwright/test'

/**
 * When `E2E_OWNER_EMAIL` and `E2E_OWNER_PASSWORD` are set, logs in and saves session.
 * `pnpm i18n:compile` with Turkish: button is "Giriş yap" (or English if locale en).
 */
setup('owner session', async ({ page }) => {
  const email = process.env['E2E_OWNER_EMAIL'] ?? ''
  const password = process.env['E2E_OWNER_PASSWORD'] ?? ''
  if (!email || !password) {
    throw new Error('E2E_OWNER_EMAIL and E2E_OWNER_PASSWORD must be set for this project (see .env.example)')
  }
  await page.goto('/login')
  await page.locator('#lo-email').fill(email)
  await page.locator('#lo-pass').fill(password)
  await page.getByRole('button', { name: /Giriş|Sign in/ }).click()
  await expect(page).toHaveURL(/\/(today|tasks|fields)/, { timeout: 30_000 })
  await page.context().storageState({ path: 'e2e/.auth/owner.json' })
})
