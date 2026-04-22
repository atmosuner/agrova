import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { lingui } from '@lingui/vite-plugin'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react({ babel: { plugins: ['@lingui/babel-plugin-lingui-macro'] } }),
    lingui(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(projectRoot, 'src'),
    },
  },
})
