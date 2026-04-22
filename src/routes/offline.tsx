import { msg, t } from '@lingui/macro'
import { createFileRoute, Link } from '@tanstack/react-router'
import { i18n } from '@/lib/i18n'

export const Route = createFileRoute('/offline')({
  component: OfflinePage,
})

function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-2xl font-semibold text-fg">{i18n._(msg`Çevrimdışı`)}</h1>
      <p className="max-w-sm text-fg-secondary">{t`Ağ yok. Bağlantı sağlandığında tekrar deneyin; Agrova çevrimdışı önbelleğe dönüştüğü verileri eşitleyecektir.`}</p>
      <Link to="/" className="text-sm font-medium text-orchard-600 hover:underline">
        {t`Ana sayfa`}
      </Link>
    </div>
  )
}
