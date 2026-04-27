/* eslint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  captureBeforeInstall,
  isInstallPromptDismissed,
  isLikelyIOSSafari,
  isStandaloneDisplay,
  markIOSInstallHintSeen,
  setInstallPromptDismissed,
  shouldShowIOSInstallHint,
  triggerInstallFromDeferred,
} from '@/lib/pwa'
import { cn } from '@/lib/utils'

type Props = {
  onInstalled?: () => void
  className?: string
}

export function InstallPrompt({ onInstalled, className }: Props) {
  const [androidOffer, setAndroidOffer] = useState(false)
  const [iosHint, setIOSHint] = useState(
    () => !isStandaloneDisplay() && isLikelyIOSSafari() && shouldShowIOSInstallHint(),
  )

  useEffect(() => {
    if (isStandaloneDisplay()) {
      onInstalled?.()
    }
  }, [onInstalled])

  useEffect(() => {
    if (isStandaloneDisplay() || isLikelyIOSSafari() || isInstallPromptDismissed()) {
      return
    }
    const h = (e: Event) => {
      const p = captureBeforeInstall(e, {
        isDismissed: isInstallPromptDismissed,
        isStandalone: isStandaloneDisplay,
      })
      if (p) {
        setAndroidOffer(true)
      }
    }
    globalThis.addEventListener('beforeinstallprompt', h)
    return () => globalThis.removeEventListener('beforeinstallprompt', h)
  }, [])

  if (isStandaloneDisplay()) {
    return null
  }

  if (iosHint) {
    return (
      <div
        className={cn(
          'fixed bottom-24 left-3 right-3 z-40 flex flex-col gap-3 rounded-xl border border-border bg-surface-0 p-4 ring-[3px] ring-[rgba(12,18,16,0.04)] md:left-auto md:right-4 md:w-96',
          className,
        )}
        role="status"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-fg-secondary">
            {t`iPhone: Safari’de Paylaş (□↑) → “Ana ekrana ekle” ile Agrova’yı aç ve ana ekrana ekle.`}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label={t`Kapat`}
            onClick={() => {
              markIOSInstallHintSeen()
              setIOSHint(false)
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-fg-faint">
          {t`Bu pencere bir kez kapatıldıktan sonra tekrar göstermek için cihaz ayarlarınızdan tarayıcı verilerini temizleyin.`}
        </p>
      </div>
    )
  }

  if (!androidOffer) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed bottom-24 left-3 right-3 z-40 flex flex-col gap-3 rounded-xl border border-border bg-surface-0 p-4 ring-[3px] ring-[rgba(12,18,16,0.04)] md:left-auto md:right-4 md:w-96',
        className,
      )}
    >
      <p className="text-sm text-fg-secondary">{t`Ana ekrana ekleyerek tek dokunuşta açın.`}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="min-h-[2.5rem] flex-1 rounded-full"
          onClick={async () => {
            const o = await triggerInstallFromDeferred()
            if (o === 'accepted') {
              setInstallPromptDismissed()
              onInstalled?.()
            }
          }}
        >
          {t`Ana ekrana ekle`}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setInstallPromptDismissed()
            setAndroidOffer(false)
          }}
        >
          {t`Şimdi değil`}
        </Button>
      </div>
    </div>
  )
}
