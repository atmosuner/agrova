import { test, expect } from '@playwright/test'

/**
 * M8-10: seven deterministic smoke checks (HTTP + shell) — no authenticated session.
 * Full “field-create → …” flows need storageState / staging creds (see nightly + README).
 * Maps to spec §11 entry points: catalog, tasks, worker mobile, issue, offline, install, login.
 */
const criticalEntrypoints: { name: string; path: string }[] = [
  { name: 'field-create (owner /fields gate)', path: '/fields' },
  { name: 'task planning (/tasks gate)', path: '/tasks' },
  { name: 'worker today (/m/tasks gate)', path: '/m/tasks' },
  { name: 'issue report (/m/report-issue gate)', path: '/m/report-issue' },
  { name: 'offline help (/offline)', path: '/offline' },
  { name: 'install guide (/how-to-install)', path: '/how-to-install' },
  { name: 'auth shell (/login)', path: '/login' },
]

for (const { name, path: urlPath } of criticalEntrypoints) {
  test(`M8-10 smoke: ${name}`, async ({ page }) => {
    const res = await page.goto(urlPath, { waitUntil: 'domcontentloaded' })
    expect(res, `no response for ${urlPath}`).toBeTruthy()
    expect(
      res!.status() < 500,
      `expected no 5xx for ${urlPath}, got ${res!.status()}`,
    ).toBe(true)
    await expect(page.locator('body')).toBeVisible()
  })
}
