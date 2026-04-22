// @ts-check
/** @type {import("@lingui/conf").LinguiConfig} */
import { defineConfig } from '@lingui/cli'

export default defineConfig({
  sourceLocale: 'en',
  locales: ['tr', 'en'],
  catalogs: [
    {
      path: '<rootDir>/src/locales/{locale}/messages',
      include: ['src'],
    },
  ],
})
