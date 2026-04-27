import { msg, t } from '@lingui/macro'
import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ChevronRight, Lock, LogOut, Phone, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { changeAccountPassword } from '@/features/auth/change-account-password'
import { changePasswordFormValuesSchema } from '@/features/auth/validation'
import { signOutAndClearLocalData } from '@/features/auth/logout'
import { useMyPersonQuery } from '@/features/people/useMyPersonQuery'
import { formFieldClassName } from '@/lib/form-field-class'
import { i18n } from '@/lib/i18n'

export const Route = createFileRoute('/m/profile')({
  component: ProfilePage,
})

function initialsOf(name: string | undefined | null): string {
  if (!name) return '—'
  const parts = name.trim().split(/\s+/)
  const a = parts[0]?.[0] ?? ''
  const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (a + b).toUpperCase().slice(0, 2)
}

function roleLabel(role: string): string {
  const map: Record<string, ReturnType<typeof msg>> = {
    OWNER: msg`Sahibi`,
    FOREMAN: msg`Ustabaşı`,
    AGRONOMIST: msg`Ziraat müh.`,
    WORKER: msg`İşçi`,
  }
  return map[role] ? i18n._(map[role]) : role
}

function ProfilePage() {
  const { data: me, isLoading } = useMyPersonQuery()
  const [pwOpen, setPwOpen] = useState(false)
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwNew2, setPwNew2] = useState('')
  const [pwErr, setPwErr] = useState<string | null>(null)
  const [pwOk, setPwOk] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const navigate = useNavigate()

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwErr(null)
    setPwOk(false)
    const parsed = changePasswordFormValuesSchema.safeParse({
      currentPassword: pwCurrent,
      newPassword: pwNew,
      newPasswordConfirm: pwNew2,
    })
    if (!parsed.success) {
      setPwErr(parsed.error.issues[0]?.message ?? t`Formu kontrol edin.`)
      return
    }
    setPwSaving(true)
    const r = await changeAccountPassword(parsed.data.currentPassword, parsed.data.newPassword)
    setPwSaving(false)
    if (!r.ok) {
      setPwErr(r.message)
      return
    }
    setPwOk(true)
    setPwCurrent('')
    setPwNew('')
    setPwNew2('')
  }

  async function onLogout() {
    await signOutAndClearLocalData()
    void navigate({ to: '/login', search: { redirect: undefined } })
  }

  if (isLoading) {
    return (
      <div className="px-4 pt-6">
        <p className="text-sm text-fg-secondary">{t`Yükleniyor…`}</p>
      </div>
    )
  }

  if (!me) {
    return (
      <div className="px-4 pt-6">
        <p className="text-fg-secondary">{t`Profil yüklenemedi.`}</p>
      </div>
    )
  }

  return (
    <div className="pb-8">
      <div className="flex flex-col items-center gap-3 px-4 pb-5 pt-8">
        <span
          className="inline-flex h-20 w-20 items-center justify-center rounded-full border-2 border-orchard-500 bg-orchard-50 text-[28px] font-semibold text-orchard-700"
          aria-hidden
        >
          {initialsOf(me.full_name)}
        </span>
        <p className="text-[22px] font-semibold text-fg">{me.full_name}</p>
        <span className="inline-flex items-center rounded-full border border-orchard-500/20 bg-orchard-50 px-3 py-1 text-[13px] font-medium text-orchard-700">
          {roleLabel(me.role)}
        </span>
      </div>

      <Section label={i18n._(msg`Bilgiler`)}>
        <Row>
          <Phone className="h-5 w-5 shrink-0 text-fg-muted" strokeWidth={1.75} aria-hidden />
          <div className="flex-1">
            <p className="text-[12px] text-fg-muted">{t`Telefon`}</p>
            <p className="text-[15px] font-medium text-fg">{me.phone}</p>
          </div>
        </Row>
        <Divider />
        <Row>
          <Smartphone className="h-5 w-5 shrink-0 text-fg-muted" strokeWidth={1.75} aria-hidden />
          <div className="flex-1">
            <p className="text-[12px] text-fg-muted">{t`Rol`}</p>
            <p className="text-[15px] font-medium text-fg">{roleLabel(me.role)}</p>
          </div>
        </Row>
      </Section>

      <Section label={i18n._(msg`Hesap`)}>
        <button
          type="button"
          onClick={() => setPwOpen((o) => !o)}
          className="flex w-full items-center gap-3 px-4 py-[15px] text-left transition hover:bg-surface-1"
        >
          <Lock className="h-5 w-5 shrink-0 text-fg-muted" strokeWidth={1.75} aria-hidden />
          <span className="flex-1 text-[15px] font-medium text-fg">{t`Şifre Değiştir`}</span>
          <ChevronRight
            className={`h-4 w-4 text-fg-faint transition-transform ${pwOpen ? 'rotate-90' : ''}`}
            strokeWidth={2}
            aria-hidden
          />
        </button>
        {pwOpen ? (
          <form onSubmit={onChangePassword} className="border-t border-border px-4 py-4">
            <p className="mb-3 text-xs text-fg-muted">
              {t`Cihaz e-postanız ve mevcut şifreniz. E-posta ile sıfırlama cihaz hesaplarında yok.`}
            </p>
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-fg-secondary" htmlFor="mp0">
                  {t`Mevcut şifre`}
                </label>
                <input
                  id="mp0"
                  type="password"
                  autoComplete="current-password"
                  className={formFieldClassName}
                  value={pwCurrent}
                  onChange={(e) => setPwCurrent(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-fg-secondary" htmlFor="mp1">
                  {t`Yeni şifre`}
                </label>
                <input
                  id="mp1"
                  type="password"
                  autoComplete="new-password"
                  className={formFieldClassName}
                  value={pwNew}
                  onChange={(e) => setPwNew(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-fg-secondary" htmlFor="mp2">
                  {t`Şifre tekrar`}
                </label>
                <input
                  id="mp2"
                  type="password"
                  autoComplete="new-password"
                  className={formFieldClassName}
                  value={pwNew2}
                  onChange={(e) => setPwNew2(e.target.value)}
                />
              </div>
            </div>
            {pwErr ? <p className="mt-2 text-sm text-status-blocked">{pwErr}</p> : null}
            {pwOk ? (
              <p className="mt-2 text-sm text-orchard-700" role="status">
                {t`Şifre güncellendi.`}
              </p>
            ) : null}
            <Button type="submit" className="mt-3 w-full" disabled={pwSaving}>
              {pwSaving ? t`Kaydediliyor…` : t`Şifreyi güncelle`}
            </Button>
          </form>
        ) : null}
        <Divider />
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 px-4 py-[15px] text-left text-status-blocked transition hover:bg-status-blocked/[0.04]"
        >
          <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
          <span className="flex-1 text-[15px] font-medium">{t`Çıkış Yap`}</span>
        </button>
      </Section>

      <p className="px-4 pt-6 text-center text-[12px] text-fg-faint">
        {t`Şifrenizi unuttuysanız işletme sahibinden (Ekip) yeni şifre isteyin.`}
      </p>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-2 px-4">
      <p className="mb-1.5 px-1 text-[11px] font-medium uppercase tracking-[0.5px] text-fg-faint">{label}</p>
      <div className="overflow-hidden rounded-xl border border-border bg-surface-0">{children}</div>
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-3 px-4 py-[15px]">{children}</div>
}

function Divider() {
  return <span aria-hidden className="block h-px w-full bg-border" />
}
