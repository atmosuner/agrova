import js from '@eslint/js'
import globals from 'globals'
import pluginLingui from 'eslint-plugin-lingui'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist',
    'src/types/db.ts',
    'src/routeTree.gen.ts',
    'src/locales/**/messages.ts',
    'supabase/functions/**',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  /* TanStack file routes export `Route` + a component — not "components only" */
  {
    files: ['src/routes/**/*.{ts,tsx}'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  pluginLingui.configs['flat/recommended'],
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      'src/components/ui/**',
      'src/locales/**',
      'src/routeTree.gen.ts',
      '**/*.test.ts',
      '**/*.test.tsx',
    ],
    rules: {
      'lingui/no-unlocalized-strings': [
        'error',
        {
          /* Route paths, DOM ids, locale codes, and HTML-ish noise */
          ignore: ['^/', '^root$', '^(tr|en)$', '^#'],
          /* Tailwind, router, and other non-UI string props */
          ignoreNames: [
            'className',
            'to',
            'key',
            'id',
            'activeProps',
            'inactiveProps',
          ],
          ignoreFunctions: [
            'createFileRoute',
            'createRootRoute',
            'createRouter',
            'createRoot',
            'redirect',
            'getElementById',
            'Error',
            'i18n.load',
            'i18n.loadAndActivate',
            'i18n.activate',
          ],
        },
      ],
    },
  },
])
