import { I18nProvider } from '@lingui/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from '@/routeTree.gen'
import '@/index.css'
import { i18n } from '@/lib/i18n'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('Root element #root not found')
}

createRoot(rootEl).render(
  <StrictMode>
    <I18nProvider i18n={i18n}>
      <RouterProvider router={router} />
    </I18nProvider>
  </StrictMode>,
)
