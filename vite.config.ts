import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { lingui } from '@lingui/vite-plugin'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

/**
 * Project GitHub Pages: `https://<user>.github.io/<repo>/` needs Vite `base` set to
 * `/<repo>/`. User/organization site repos (`<user>.github.io`) publish at the root — use
 * `base: '/'` (set `AGROVA_GITHUB_PAGES=1` only for project pages deploys, not in CI’s
 * default `pnpm build` which must stay at `/` so checks match local dev).
 */
function resolveGhpViteBase(): string {
  const repo = process.env['GITHUB_REPOSITORY']?.split('/')[1] ?? ''
  const useGhpBase =
    process.env['AGROVA_GITHUB_PAGES'] === '1' && repo.length > 0 && !repo.endsWith('.github.io')
  if (!useGhpBase) return '/'
  return `/${repo}/`
}

// https://vite.dev/config/
export default defineConfig(() => {
  const base = resolveGhpViteBase()
  const navigateFallback =
    base === '/' ? 'index.html' : `${base.replace(/\/$/, '')}/index.html`

  return {
  test: {
    maxWorkers: 1,
    environment: 'node',
    passWithNoTests: false,
    setupFiles: [path.join(projectRoot, 'src/vitest-setup.ts')],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    /** Run explicitly: `pnpm vitest run src/integration` (requires real Supabase env). */
    exclude: ['**/node_modules/**', '**/dist/**', 'src/integration/**'],
    coverage: {
      provider: 'v8' as const,
      reporter: ['text', 'html'],
      include: [
        'src/features/people/**/*.ts',
        'src/features/fields/**/*.ts',
        'src/features/equipment/**/*.ts',
        'src/features/issues/**/*.ts',
        'src/features/tasks/**/*.ts',
        'src/lib/invoke-web-push-fanout.ts',
      ],
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/types/**',
        /** Hook-only module; covered indirectly via UI / integration. */
        'src/features/people/useMyPersonQuery.ts',
        /** Supabase `functions.invoke` + `auth` session; error mappers covered in `*.test.ts` imports. */
        'src/features/people/create-team-person.ts',
        'src/features/people/set-worker-password.ts',
        'src/features/people/team-person-email.ts',
        'src/features/people/device-login-email.ts',
        'src/features/issues/use-open-issue-count.ts',
        'src/features/equipment/useActiveEquipmentQuery.ts',
        'src/features/equipment/useEquipmentUsage.ts',
        'src/features/fields/useFieldChemicalApplicationsQuery.ts',
        'src/features/dashboard/use-dashboard-stats.ts',
        'src/features/dashboard/use-activity-feed.ts',
        'src/features/dashboard/use-todays-board-tasks.ts',
        'src/features/dashboard/use-all-fields-for-map.ts',
        'src/features/weather/use-weather.ts',
        'src/features/notifications/use-notifications-inbox.ts',
        'src/features/tasks/use*.ts',
        /** Re-exports; covered via worker-mutations + tests. */
        'src/features/tasks/complete-task.ts',
        'src/features/tasks/transition-task.ts',
      ],
      thresholds: {
        lines: 100,
        statements: 100,
        branches: 100,
        functions: 100,
      },
    },
  },
  base,
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react({ babel: { plugins: ['@lingui/babel-plugin-lingui-macro'] } }),
    lingui(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'generateSW',
      manifestFilename: 'manifest.webmanifest',
      includeAssets: ['favicon.svg', 'icons/pwa-192.png', 'icons/pwa-512.png', 'icons/pwa-512-maskable.png'],
      manifest: {
        name: 'Agrova',
        short_name: 'Agrova',
        description: 'Orchard operations: tasks, fields, and crew in one PWA.',
        theme_color: '#3F8B4E',
        background_color: '#FAFAF7',
        display: 'standalone',
        start_url: base,
        scope: base,
        lang: 'tr',
        dir: 'ltr',
        icons: [
          { src: `${base}icons/pwa-192.png`, sizes: '192x192', type: 'image/png' },
          { src: `${base}icons/pwa-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: `${base}icons/pwa-512-maskable.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback,
        // M6-04: push notification click (see public/notification-sw.js)
        importScripts: ['notification-sw.js'],
        // Offline IndexedDB / API: later milestones; shell precache only for now
        runtimeCaching: [],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(projectRoot, 'src'),
    },
  },
  }
})
