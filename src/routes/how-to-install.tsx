import { msg, t } from '@lingui/macro'
import { createFileRoute, Link } from '@tanstack/react-router'
import { i18n } from '@/lib/i18n'

export const Route = createFileRoute('/how-to-install')({
  component: HowToInstallPage,
})

function HowToInstallPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-10">
      <h1 className="text-2xl font-semibold text-fg">{i18n._(msg`Uygulamayı ana ekrana ekleyin`)}</h1>
      <p className="text-fg-secondary">{t`Aşağıdaki adımlar çoğu telefonda Agrova’yı uygulama gibi açmanızı sağlar.`}</p>
      <section>
        <h2 className="text-lg font-medium text-orchard-800">{i18n._(msg`Android (Chrome)`)}</h2>
        <ol className="mt-2 list-decimal pl-5 text-sm text-fg">
          <li>{t`Chrome’da agrova.app adresini açın.`}</li>
          <li>{t`Menü (⋮) → “Uygulamayı yükle” veya “Ana ekrana ekle”.`}</li>
        </ol>
        <p className="mt-2 text-xs text-fg-muted">{i18n._(msg`Ekran görüntüleri: Yakında`)}</p>
      </section>
      <section>
        <h2 className="text-lg font-medium text-orchard-800">{i18n._(msg`iPhone (Safari)`)}</h2>
        <ol className="mt-2 list-decimal pl-5 text-sm text-fg">
          <li>{t`Paylaş düğmesine basın`}</li>
          <li>{t`“Ana Ekrana Ekle”yi seçin.`}</li>
        </ol>
        <p className="mt-2 text-xs text-fg-muted">{i18n._(msg`Ekran görüntüleri: Yakında`)}</p>
      </section>
      <p className="text-sm text-fg-secondary">
        <Link to="/privacy" className="text-orchard-600 hover:underline">
          {t`Gizlilik`}
        </Link>
      </p>
    </div>
  )
}
