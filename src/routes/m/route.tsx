import { defaultStringifySearch, createFileRoute, redirect } from '@tanstack/react-router'
import { MobileShell } from '@/components/layout/MobileShell'
import { supabase } from '@/lib/supabase'

/* Worker PWA shell — URL prefix /m to avoid clashing with owner /tasks, /profile, etc. */
export const Route = createFileRoute('/m')({
  beforeLoad: async ({ location }) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      const returnTo = `${location.pathname}${defaultStringifySearch(location.search)}`
      throw redirect({
        to: '/login',
        search: { redirect: returnTo, worker: true },
      })
    }
  },
  component: MobileShell,
})
