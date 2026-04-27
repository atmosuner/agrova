import { msg } from '@lingui/macro'
import { useMemo } from 'react'
import { scorePassword } from '@/components/ui/password-strength'
import { i18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export function PasswordStrengthBar({ value, className }: { value: string; className?: string }) {
  const score = useMemo(() => scorePassword(value), [value])

  const segments = [0, 1, 2, 3] as const

  const fillForIdx = (idx: number) => {
    if (idx >= score) return 'bg-border-strong'
    if (score <= 1) return 'bg-status-blocked'
    if (score === 2) return 'bg-harvest-500'
    return 'bg-orchard-500'
  }

  const labelMsg =
    value.length === 0
      ? msg`Şifre giriniz.`
      : score <= 1
        ? msg`Şifre gücü: Zayıf — Daha uzun ve karışık karakterler kullanın.`
        : score === 2
          ? msg`Şifre gücü: Orta — Büyük harf ve sembol ekleyin.`
          : score === 3
            ? msg`Şifre gücü: İyi.`
            : msg`Şifre gücü: Güçlü.`

  return (
    <div className={className}>
      <div className="flex gap-1" aria-hidden>
        {segments.map((idx) => (
          <div key={idx} className={cn('h-[3px] flex-1 rounded-[2px] transition-colors', fillForIdx(idx))} />
        ))}
      </div>
      <p className="mt-1.5 text-xs text-fg-muted" role="status" aria-live="polite">
        {i18n._(labelMsg)}
      </p>
    </div>
  )
}
