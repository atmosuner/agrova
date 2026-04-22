import { defineConfig, devices } from '@playwright/test'

const e2eAuth = !!process.env['E2E_OWNER_EMAIL'] && !!process.env['E2E_OWNER_PASSWORD']

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: e2eAuth
    ? [
        {
          name: 'chromium',
          use: { ...devices['Pixel 5'] },
          testIgnore: ['**/auth.owner.setup.ts', '**/*.authed.spec.ts'],
        },
        { name: 'setup', testMatch: '**/auth.owner.setup.ts' },
        {
          name: 'chromium-authed',
          use: { ...devices['Pixel 5'], storageState: 'e2e/.auth/owner.json' },
          dependencies: ['setup'],
          testMatch: '**/*.authed.spec.ts',
        },
      ]
    : [
        {
          name: 'chromium',
          use: { ...devices['Pixel 5'] },
          testIgnore: ['**/auth.owner.setup.ts', '**/*.authed.spec.ts'],
        },
      ],
  /** Start `pnpm dev` in another shell; Playwright will hit `baseURL` (or set `PLAYWRIGHT_BASE_URL`). */
})
