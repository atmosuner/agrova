import { msg, t } from '@lingui/macro'
import { X } from 'lucide-react'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { newPasswordPairValuesSchema } from '@/features/auth/validation'
import { createTeamPersonWithAuth } from '@/features/people/create-team-person'
import { mapPeopleMutationError } from '@/features/people/map-people-mutation-error'
import { deviceLoginEmailFromPersonId } from '@/features/people/device-login-email'
import { setWorkerPasswordByOwner } from '@/features/people/set-worker-password'
import { getTeamPersonLoginEmail, setTeamPersonLoginEmailByOwner } from '@/features/people/team-person-email'
import { downloadPeopleCsv } from '@/features/people/csv'
import {
  teamPersonAddSchema,
  teamPersonEditFormSchema,
  teamPersonFormSchema,
  type TeamPersonAddFormValues,
  type TeamPersonFormValues,
} from '@/features/people/validation'
import { formFieldClassName } from '@/lib/form-field-class'
import { i18n } from '@/lib/i18n'
import { useOnClickOutside } from '@/lib/use-on-click-outside'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import type { Tables } from '@/types/db'

type Person = Tables<'people'>

type CrewFormState = TeamPersonAddFormValues & { loginEmail: string }

const emptyCrewForm: CrewFormState = {
  fullName: '',
  phone: '',
  role: 'WORKER',
  password: '',
  passwordConfirm: '',
  loginEmail: '',
}

function roleLabel(role: Person['role']): string {
  const map = {
    OWNER: msg`Owner`,
    FOREMAN: msg`Foreman`,
    AGRONOMIST: msg`Agronomist`,
    WORKER: msg`Worker`,
  } as const
  return i18n._(map[role])
}

function crewLabel(role: TeamPersonFormValues['role']): string {
  const map = {
    FOREMAN: msg`Foreman`,
    AGRONOMIST: msg`Agronomist`,
    WORKER: msg`Worker`,
  } as const
  return i18n._(map[role])
}

const AVATAR_COLORS = [
  'rgb(34 197 94)',
  'rgb(59 130 246)',
  'rgb(249 115 22)',
  'rgb(168 85 247)',
  'rgb(236 72 153)',
  'rgb(14 165 233)',
  'rgb(245 158 11)',
]

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase()
  return (parts[0]?.[0] ?? '?').toUpperCase()
}

function avatarColor(name: string): string {
  let h = 0
  for (const c of name) h = (h + c.charCodeAt(0)) & 0xffff
  return AVATAR_COLORS[h % AVATAR_COLORS.length]!
}

function roleColorClass(role: Person['role']): string {
  switch (role) {
    case 'OWNER':
      return 'font-medium text-orchard-600'
    case 'FOREMAN':
      return 'font-medium text-orchard-600'
    case 'AGRONOMIST':
      return 'font-medium text-orchard-600'
    case 'WORKER':
      return 'text-fg-secondary'
  }
}

export const Route = createFileRoute('/_owner/people')({
  component: PeoplePage,
})

/* eslint-disable lingui/no-unlocalized-strings */
const ROLE_OPTIONS: { value: Person['role']; label: string }[] = [
  { value: 'OWNER', label: 'Sahip' },
  { value: 'FOREMAN', label: 'Kahya' },
  { value: 'AGRONOMIST', label: 'Ziraat Müh.' },
  { value: 'WORKER', label: 'İşçi' },
]
/* eslint-enable lingui/no-unlocalized-strings */

function PeoplePage() {
  const [rows, setRows] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [roleFilter, setRoleFilter] = useState<Person['role'] | null>(null)
  const [roleOpen, setRoleOpen] = useState(false)
  const roleRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(roleRef, () => setRoleOpen(false))
  const [modalMode, setModalMode] = useState<null | { type: 'add' } | { type: 'edit'; person: Person }>(null)
  const [form, setForm] = useState<CrewFormState>(emptyCrewForm)
  const [editEmailLoading, setEditEmailLoading] = useState(false)
  const editInitialLoginEmail = useRef('')
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [setupCopyMsg, setSetupCopyMsg] = useState<string | null>(null)
  const [resetPwdFor, setResetPwdFor] = useState<Person | null>(null)
  const [crewNewPw, setCrewNewPw] = useState('')
  const [crewNewPw2, setCrewNewPw2] = useState('')
  const [crewPwdErr, setCrewPwdErr] = useState<string | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<Person | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const resetPwdRef = useRef<HTMLDialogElement>(null)
  const archiveRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descId = useId()
  const resetPwdTitleId = useId()
  const resetPwdDescId = useId()
  const archiveTitleId = useId()

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    let q = supabase.from('people').select('*').order('full_name', { ascending: true })
    if (!showArchived) {
      q = q.eq('active', true)
    }
    const { data, error } = await q
    setLoading(false)
    if (error) {
      setLoadError(error.message)
      return
    }
    setRows(data ?? [])
  }, [showArchived])

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(id)
  }, [load])

  const filteredRows = useMemo(
    () => (roleFilter ? rows.filter((r) => r.role === roleFilter) : rows),
    [rows, roleFilter],
  )

  useEffect(() => {
    if (modalMode?.type !== 'edit') {
      return
    }
    const person = modalMode.person
    if (!person.auth_user_id) {
      return
    }
    let cancelled = false
    void (async () => {
      setEditEmailLoading(true)
      const r = await getTeamPersonLoginEmail({ personId: person.id })
      if (cancelled) {
        return
      }
      const email = r.ok ? r.value.email : deviceLoginEmailFromPersonId(person.id)
      editInitialLoginEmail.current = email
      setForm((f) => ({ ...f, loginEmail: email }))
      setEditEmailLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [modalMode])

  function openAdd() {
    setForm(emptyCrewForm)
    setFormError(null)
    setModalMode({ type: 'add' })
    requestAnimationFrame(() => dialogRef.current?.showModal())
  }

  function openEdit(p: Person) {
    if (p.role === 'OWNER') {
      return
    }
    setForm({
      fullName: p.full_name,
      phone: p.phone,
      role: p.role as TeamPersonFormValues['role'],
      password: '',
      passwordConfirm: '',
      loginEmail: '',
    })
    setFormError(null)
    editInitialLoginEmail.current = ''
    if (p.auth_user_id) {
      setEditEmailLoading(true)
    } else {
      setEditEmailLoading(false)
    }
    setModalMode({ type: 'edit', person: p })
    requestAnimationFrame(() => dialogRef.current?.showModal())
  }

  function closeModal() {
    dialogRef.current?.close()
    setModalMode(null)
  }

  function openResetPassword(p: Person) {
    if (p.role === 'OWNER' || !p.auth_user_id) {
      return
    }
    setResetPwdFor(p)
    setCrewNewPw('')
    setCrewNewPw2('')
    setCrewPwdErr(null)
    requestAnimationFrame(() => resetPwdRef.current?.showModal())
  }

  function closeResetPwd() {
    resetPwdRef.current?.close()
    setResetPwdFor(null)
  }

  async function onSubmitCrewReset(e: React.FormEvent) {
    e.preventDefault()
    setCrewPwdErr(null)
    if (!resetPwdFor) {
      return
    }
    const parsed = newPasswordPairValuesSchema.safeParse({
      newPassword: crewNewPw,
      newPasswordConfirm: crewNewPw2,
    })
    if (!parsed.success) {
      setCrewPwdErr(parsed.error.issues[0]?.message ?? t`Formu kontrol edin.`)
      return
    }
    setSaving(true)
    const r = await setWorkerPasswordByOwner({ personId: resetPwdFor.id, newPassword: parsed.data.newPassword })
    setSaving(false)
    if (!r.ok) {
      setCrewPwdErr(r.message)
      return
    }
    closeResetPwd()
    setSetupCopyMsg(
      t`Worker password was updated. They sign in with the same device e-mail and the new password.`,
    )
  }

  async function onSubmitCrew(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (modalMode?.type === 'add') {
      const addParsed = teamPersonAddSchema.safeParse(form)
      if (!addParsed.success) {
        setFormError(addParsed.error.issues[0]?.message ?? t`Formu kontrol edin.`)
        return
      }
      setSaving(true)
      const created = await createTeamPersonWithAuth(addParsed.data)
      setSaving(false)
      if (!created.ok) {
        setFormError(created.message)
        return
      }
      try {
        await navigator.clipboard.writeText(created.value.loginEmail)
        setSetupCopyMsg(
          t`Giriş e-postası (cihaz hesabı) panoya kopyalandı. Çalışan bu adres ve sizin belirlediğiniz şifre ile uygulamaya girer; şifre sunucuda saklanmaz, tekrar gösterilmez.`,
        )
      } catch {
        setLoadError(created.value.loginEmail)
      }
      closeModal()
      await load()
      return
    }
    if (modalMode?.type === 'edit') {
      const person = modalMode.person
      const withAuth = Boolean(person.auth_user_id)
      if (withAuth) {
        if (editEmailLoading) {
          return
        }
        const parsed = teamPersonEditFormSchema.safeParse({
          fullName: form.fullName,
          phone: form.phone,
          role: form.role,
          loginEmail: form.loginEmail,
        })
        if (!parsed.success) {
          setFormError(parsed.error.issues[0]?.message ?? t`Formu kontrol edin.`)
          return
        }
        setSaving(true)
        const e0 = editInitialLoginEmail.current.trim().toLowerCase()
        const e1 = parsed.data.loginEmail.trim().toLowerCase()
        if (e0 !== e1) {
          const em = await setTeamPersonLoginEmailByOwner({
            personId: person.id,
            email: parsed.data.loginEmail,
          })
          if (!em.ok) {
            setSaving(false)
            setFormError(em.message)
            return
          }
          editInitialLoginEmail.current = em.value.email
        }
        const { error } = await supabase
          .from('people')
          .update({
            full_name: parsed.data.fullName,
            phone: parsed.data.phone,
            role: parsed.data.role,
          })
          .eq('id', person.id)
        setSaving(false)
        if (error) {
          setFormError(mapPeopleMutationError(error.message, error.code))
          return
        }
        closeModal()
        await load()
        return
      }
      const parsed = teamPersonFormSchema.safeParse({
        fullName: form.fullName,
        phone: form.phone,
        role: form.role,
      })
      if (!parsed.success) {
        setFormError(parsed.error.issues[0]?.message ?? t`Formu kontrol edin.`)
        return
      }
      setSaving(true)
      const { error } = await supabase
        .from('people')
        .update({
          full_name: parsed.data.fullName,
          phone: parsed.data.phone,
          role: parsed.data.role,
        })
        .eq('id', person.id)
      setSaving(false)
      if (error) {
        setFormError(mapPeopleMutationError(error.message, error.code))
        return
      }
      closeModal()
      await load()
    }
  }

  function openArchive(p: Person) {
    if (p.role === 'OWNER') return
    setArchiveTarget(p)
    requestAnimationFrame(() => archiveRef.current?.showModal())
  }

  function closeArchive() {
    archiveRef.current?.close()
    setArchiveTarget(null)
  }

  async function confirmArchive() {
    if (!archiveTarget) return
    setSaving(true)
    const { error } = await supabase.from('people').update({ active: false }).eq('id', archiveTarget.id)
    setSaving(false)
    if (error) {
      setLoadError(error.message)
      return
    }
    closeArchive()
    await load()
  }

  const isModalOpen = modalMode !== null

  return (
    <div className="space-y-4">
      {/* Filter bar — matches Tasks/Issues/Equipment pattern */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {/* Role filter */}
        {roleFilter ? (
          <button
            type="button"
            onClick={() => setRoleFilter(null)}
            className="inline-flex h-[30px] items-center gap-1 rounded-[7px] border border-orchard-500/30 bg-orchard-50 px-2.5 text-[12px] font-medium text-orchard-700 transition-colors hover:bg-orchard-100"
          >
            {ROLE_OPTIONS.find((r) => r.value === roleFilter)?.label}
            <X className="h-3 w-3" />
          </button>
        ) : (
          <div ref={roleRef} className="relative">
            <button
              type="button"
              onClick={() => setRoleOpen((o) => !o)}
              className="inline-flex h-[30px] items-center rounded-[7px] border border-border bg-surface-0 px-2.5 text-[12px] font-medium text-fg-secondary transition-colors hover:border-border-strong hover:text-fg"
            >
              {t`+ Rol`}
            </button>
            {roleOpen && (
              <div className="absolute left-0 top-full z-30 mt-1 min-w-[140px] rounded-lg border border-border bg-surface-0 py-1 shadow-lg">
                {ROLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setRoleFilter(opt.value)
                      setRoleOpen(false)
                    }}
                    className="flex w-full items-center px-3 py-1.5 text-left text-[12px] text-fg-secondary transition-colors hover:bg-surface-1 hover:text-fg"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mx-0.5 h-5 w-px bg-border-strong" />

        {/* Archived toggle */}
        <button
          type="button"
          onClick={() => setShowArchived((v) => !v)}
          className={cn(
            'inline-flex h-[30px] items-center rounded-[7px] border px-2.5 text-[12px] font-medium transition-colors',
            showArchived
              ? 'border-orchard-500/30 bg-orchard-50 text-orchard-700 hover:bg-orchard-100'
              : 'border-border bg-surface-0 text-fg-secondary hover:border-border-strong hover:text-fg',
          )}
        >
          {t`Arşivlenenler`}
          {showArchived && <X className="ml-1 h-3 w-3" />}
        </button>

        <div className="ml-auto flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => downloadPeopleCsv(filteredRows)} disabled={loading}>
            {t`CSV`}
          </Button>
          <Button type="button" size="sm" onClick={openAdd} disabled={saving || loading}>
            {t`+ Yeni kişi`}
          </Button>
        </div>
      </div>

      {loadError ? <p className="text-sm text-harvest-500">{loadError}</p> : null}
      {setupCopyMsg ? (
        <p className="text-sm text-orchard-700" role="status">
          {setupCopyMsg}
        </p>
      ) : null}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-fg-secondary">{t`Yükleniyor…`}</p>
        ) : (
          <table className="w-full min-w-[720px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-border bg-surface-1">
                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-fg-secondary">
                  {t`Ad Soyad`}
                </th>
                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-fg-secondary">
                  {t`Telefon`}
                </th>
                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-fg-secondary">
                  {t`Rol`}
                </th>
                <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-fg-secondary">
                  {t`Durum`}
                </th>
                <th className="w-px px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-fg-secondary">
                    {t`Gösterilecek kişi yok.`}
                  </td>
                </tr>
              ) : (
                filteredRows.map((p) => {
                  const isOwner = p.role === 'OWNER'
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-border bg-surface-0 last:border-0 hover:bg-surface-1/50"
                    >
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                            style={{ backgroundColor: avatarColor(p.full_name) }}
                          >
                            {initialsOf(p.full_name)}
                          </span>
                          <span className="font-medium text-fg">{p.full_name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 tabular-nums text-fg-secondary">{p.phone}</td>
                      <td className="px-3 py-2.5">
                        <span className={roleColorClass(p.role)}>{roleLabel(p.role)}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        {p.active ? (
                          <span className="inline-flex items-center gap-1.5 text-status-done">
                            <span className="h-2 w-2 rounded-full bg-status-done" />
                            {t`Aktif`}
                          </span>
                        ) : (
                          <span className="text-fg-muted">{t`Arşivlendi`}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {!isOwner && p.active ? (
                          <span className="inline-flex items-center gap-1.5">
                            {p.auth_user_id ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => openResetPassword(p)}
                                disabled={saving}
                              >
                                {t`Şifre`}
                              </Button>
                            ) : null}
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => openEdit(p)}
                              disabled={saving}
                            >
                              {t`Düzenle`}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => openArchive(p)}
                              disabled={saving}
                            >
                              {t`Arşivle`}
                            </Button>
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        )}
      </div>
      {/* ── Add / Edit person dialog ── */}
      <dialog
        ref={dialogRef}
        className="fixed left-1/2 top-1/2 w-[min(100%-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface-0 p-0 backdrop:bg-[rgba(12,18,16,0.55)]"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClose={() => setModalMode(null)}
      >
        {isModalOpen ? (
          <form onSubmit={onSubmitCrew} className="flex flex-col gap-4 p-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 id={titleId} className="text-lg font-semibold text-fg">
                  {modalMode.type === 'add' ? t`Yeni kişi` : t`Kişiyi düzenle`}
                </h2>
                <p id={descId} className="mt-0.5 text-[13px] text-fg-secondary">
                  {t`İşçi, ustabaşı veya agronomi uzmanı`}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-surface-1 hover:text-fg"
                aria-label={t`Kapat`}
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium text-fg" htmlFor="p-name">
                {t`Ad Soyad`}
              </label>
              <input
                id="p-name"
                className={formFieldClassName}
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-medium text-fg" htmlFor="p-phone">
                  {t`Telefon`}
                </label>
                <input
                  id="p-phone"
                  type="tel"
                  className={formFieldClassName}
                  placeholder="+905551234567"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[13px] font-medium text-fg">{t`Rol`}</span>
                <select
                  className={formFieldClassName}
                  value={form.role}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      role: e.target.value as TeamPersonAddFormValues['role'],
                    }))
                  }
                >
                  {(['FOREMAN', 'AGRONOMIST', 'WORKER'] as const).map((r) => (
                    <option key={r} value={r}>
                      {crewLabel(r)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {modalMode.type === 'edit' && modalMode.person.auth_user_id ? (
              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-medium text-fg" htmlFor="p-signin-email">
                  {t`Giriş e-postası`}
                </label>
                <input
                  id="p-signin-email"
                  type="email"
                  className={formFieldClassName}
                  autoComplete="off"
                  value={form.loginEmail}
                  onChange={(e) => setForm((f) => ({ ...f, loginEmail: e.target.value }))}
                  disabled={editEmailLoading}
                  placeholder={i18n._(msg`ornek@mail.com`)}
                  required
                />
                {editEmailLoading ? (
                  <p className="text-xs text-fg-secondary">{t`Giriş e-postası yükleniyor…`}</p>
                ) : null}
              </div>
            ) : null}

            {modalMode.type === 'add' ? (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-medium text-fg" htmlFor="p-password">
                    {t`Giriş şifresi`}
                  </label>
                  <input
                    id="p-password"
                    type="password"
                    autoComplete="new-password"
                    className={formFieldClassName}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-medium text-fg" htmlFor="p-password-2">
                    {t`Şifre tekrar`}
                  </label>
                  <input
                    id="p-password-2"
                    type="password"
                    autoComplete="new-password"
                    className={formFieldClassName}
                    value={form.passwordConfirm}
                    onChange={(e) => setForm((f) => ({ ...f, passwordConfirm: e.target.value }))}
                    required
                  />
                </div>
                <div className="flex items-start gap-2 rounded-lg bg-surface-1 px-3 py-2.5 text-[12px] text-fg-secondary">
                  <span className="mt-0.5 shrink-0 text-orchard-500">{'\u24D8'}</span>
                  {t`Kayıt sonrası cihaz giriş e-postası panoya kopyalanır. Şifre bir daha gösterilmez.`}
                </div>
              </>
            ) : null}

            {formError ? <p className="text-sm text-harvest-500">{formError}</p> : null}

            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Button type="button" variant="outline" onClick={closeModal} disabled={saving}>
                {t`İptal`}
              </Button>
              <Button
                type="submit"
                disabled={
                  saving ||
                  (modalMode.type === 'edit' && Boolean(modalMode.person.auth_user_id) && editEmailLoading)
                }
              >
                {saving ? t`Kaydediliyor…` : t`Kaydet`}
              </Button>
            </div>
          </form>
        ) : null}
      </dialog>

      {/* ── Archive confirmation dialog ── */}
      <dialog
        ref={archiveRef}
        className="fixed left-1/2 top-1/2 w-[min(100%-2rem,26rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface-0 p-0 backdrop:bg-[rgba(12,18,16,0.55)]"
        aria-labelledby={archiveTitleId}
        onClose={() => setArchiveTarget(null)}
      >
        {archiveTarget ? (
          <div className="flex flex-col gap-4 p-5">
            <div className="flex items-start justify-between">
              <h2 id={archiveTitleId} className="text-lg font-semibold text-fg">
                {t`Kişiyi arşivle`}
              </h2>
              <button
                type="button"
                onClick={closeArchive}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-surface-1 hover:text-fg"
                aria-label={t`Kapat`}
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: avatarColor(archiveTarget.full_name) }}
              >
                {initialsOf(archiveTarget.full_name)}
              </span>
              <div>
                <p className="font-medium text-fg">{archiveTarget.full_name}</p>
                <p className="text-[13px] text-fg-secondary">
                  {roleLabel(archiveTarget.role)} {'\u00B7'} {archiveTarget.phone}
                </p>
              </div>
            </div>

            <p className="text-[13px] text-fg-secondary">
              {t`Bu kişi arşivlenecek ve uygulamaya girişi engellenecek. Geçmiş görevler ve kayıtlar korunur. "Arşivlenenleri göster" seçeneğiyle tekrar görüntülenebilir.`}
            </p>

            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Button type="button" variant="outline" onClick={closeArchive} disabled={saving}>
                {t`İptal`}
              </Button>
              <Button type="button" onClick={() => void confirmArchive()} disabled={saving}>
                {saving ? t`Kaydediliyor…` : t`Arşivle`}
              </Button>
            </div>
          </div>
        ) : null}
      </dialog>

      {/* ── Password reset dialog ── */}
      <dialog
        ref={resetPwdRef}
        className="fixed left-1/2 top-1/2 w-[min(100%-2rem,26rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface-0 p-0 backdrop:bg-[rgba(12,18,16,0.55)]"
        aria-labelledby={resetPwdTitleId}
        aria-describedby={resetPwdDescId}
        onClose={() => setResetPwdFor(null)}
      >
        {resetPwdFor ? (
          <form onSubmit={onSubmitCrewReset} className="flex flex-col gap-4 p-5">
            <div>
              <h2 id={resetPwdTitleId} className="text-lg font-semibold text-fg">
                {t`Şifre belirle`}
              </h2>
              <p className="mt-0.5 text-[13px] text-fg-secondary">
                {resetPwdFor.full_name} {t`için yeni giriş şifresi`}
              </p>
            </div>

            <p id={resetPwdDescId} className="text-[13px] text-fg-secondary">
              {t`Yeni şifreyi çalışana yüz yüze veya telefonla bildirin. Şifre sunucuda şifrelenerek saklanır, tekrar görüntülenemez.`}
            </p>

            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium text-fg" htmlFor="cpw1">
                {t`Yeni şifre`}
              </label>
              <input
                id="cpw1"
                type="password"
                autoComplete="new-password"
                className={formFieldClassName}
                placeholder={i18n._(msg`En az 8 karakter`)}
                value={crewNewPw}
                onChange={(e) => setCrewNewPw(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium text-fg" htmlFor="cpw2">
                {t`Tekrar`}
              </label>
              <input
                id="cpw2"
                type="password"
                autoComplete="new-password"
                className={formFieldClassName}
                value={crewNewPw2}
                onChange={(e) => setCrewNewPw2(e.target.value)}
                required
              />
            </div>

            {crewPwdErr ? <p className="text-sm text-harvest-500">{crewPwdErr}</p> : null}

            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Button type="button" variant="outline" onClick={closeResetPwd} disabled={saving}>
                {t`İptal`}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? t`Kaydediliyor…` : t`Kaydet`}
              </Button>
            </div>
          </form>
        ) : null}
      </dialog>
    </div>
  )
}
