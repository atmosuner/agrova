import { msg, t } from '@lingui/macro'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
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
import { supabase } from '@/lib/supabase'
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

export const Route = createFileRoute('/_owner/people')({
  component: PeoplePage,
})

function PeoplePage() {
  const [rows, setRows] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
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
  const dialogRef = useRef<HTMLDialogElement>(null)
  const resetPwdRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descId = useId()
  const resetPwdTitleId = useId()
  const resetPwdDescId = useId()

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

  async function archive(p: Person) {
    if (p.role === 'OWNER') {
      return
    }
    if (!window.confirm(i18n._(msg`Archive this person? They can be shown again with “show archived”.`))) {
      return
    }
    setSaving(true)
    const { error } = await supabase.from('people').update({ active: false }).eq('id', p.id)
    setSaving(false)
    if (error) {
      setLoadError(error.message)
      return
    }
    await load()
  }

  const isModalOpen = modalMode !== null

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">{t`Team`}</h1>
          <p className="mt-2 text-fg-secondary">
            {t`Crew and roles. New people get a device login e-mail (@device) and a password you set; the e-mail is copied when saved. Turkish mobile +90; no SMS in MVP.`}
          </p>
        </div>
        <span className="inline-flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => downloadPeopleCsv(rows)} disabled={loading}>
            {t`Download CSV`}
          </Button>
          <Button type="button" onClick={openAdd} disabled={saving || loading}>
            {t`New person`}
          </Button>
        </span>
      </div>
      {loadError ? <p className="mt-4 text-sm text-harvest-500">{loadError}</p> : null}
      {setupCopyMsg ? (
        <p className="mt-2 text-sm text-orchard-700" role="status">
          {setupCopyMsg}
        </p>
      ) : null}
      <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-fg-secondary">
        <input
          type="checkbox"
          checked={showArchived}
          onChange={(e) => setShowArchived(e.target.checked)}
          className="size-4 rounded border-border"
        />
        {t`Show archived`}
      </label>
      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        {loading ? (
          <p className="p-4 text-fg-secondary">{t`Loading…`}</p>
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border bg-surface-1 text-fg-secondary">
              <tr>
                <th className="px-3 py-2 font-medium">{t`Name`}</th>
                <th className="px-3 py-2 font-medium">{t`Phone`}</th>
                <th className="px-3 py-2 font-medium">{t`Role`}</th>
                <th className="px-3 py-2 font-medium">{t`Status`}</th>
                <th className="w-px px-3 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-fg-secondary">
                    {t`No people match.`}
                  </td>
                </tr>
              ) : (
                rows.map((p) => {
                  const isOwner = p.role === 'OWNER'
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-border last:border-0 odd:bg-canvas even:bg-surface-0/50"
                    >
                      <td className="px-3 py-2 font-medium text-fg">{p.full_name}</td>
                      <td className="px-3 py-2 text-fg-secondary">{p.phone}</td>
                      <td className="px-3 py-2">{roleLabel(p.role)}</td>
                      <td className="px-3 py-2">
                        {p.active ? t`Active` : t`Archived`}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {!isOwner && p.active ? (
                          <span className="inline-flex flex-wrap justify-end gap-2">
                            {p.auth_user_id ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => openResetPassword(p)}
                                disabled={saving}
                              >
                                {t`Set password`}
                              </Button>
                            ) : null}
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => openEdit(p)}
                              disabled={saving}
                            >
                              {t`Edit`}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => void archive(p)}
                              disabled={saving}
                            >
                              {t`Archive`}
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
      <dialog
        ref={dialogRef}
        className="fixed left-1/2 top-1/2 w-[min(100%-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface-0 p-0 backdrop:bg-[rgba(12,18,16,0.55)]"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClose={() => setModalMode(null)}
      >
        {isModalOpen ? (
          <form onSubmit={onSubmitCrew} className="flex flex-col gap-4 p-4">
            <h2 id={titleId} className="text-lg font-semibold text-fg">
              {modalMode.type === 'add' ? t`New person` : t`Edit person`}
            </h2>
            <p id={descId} className="text-sm text-fg-secondary">
              {modalMode.type === 'add'
                ? t`E.164 mobile (+90 5…). Set a sign-in password for the worker; device login e-mail is copied after save. Roles: foreman, agronomist, worker.`
                : modalMode.person.auth_user_id
                  ? t`E.164 mobile (+90 5…). Update name, phone, role, and sign-in e-mail. Use a real address if the worker should receive password reset links.`
                  : t`E.164 mobile (+90 5…). Update name, phone, or role (no sign-in e-mail on file yet).`}
            </p>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-fg" htmlFor="p-name">
                {t`Name`}
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
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-fg" htmlFor="p-phone">
                {t`Phone (TR)`}
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
              <span className="text-sm font-medium text-fg">{t`Role`}</span>
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
            {modalMode.type === 'edit' && modalMode.person.auth_user_id ? (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-fg" htmlFor="p-signin-email">
                  {t`Sign-in e-mail (login)`}
                </label>
                <input
                  id="p-signin-email"
                  type="email"
                  className={formFieldClassName}
                  autoComplete="off"
                  value={form.loginEmail}
                  onChange={(e) => setForm((f) => ({ ...f, loginEmail: e.target.value }))}
                  disabled={editEmailLoading}
                  placeholder={i18n._(msg`e.g. name@mail.com`)}
                  required
                />
                {editEmailLoading ? (
                  <p className="text-xs text-fg-secondary">{t`Loading sign-in e-mail…`}</p>
                ) : null}
              </div>
            ) : null}
            {modalMode.type === 'add' ? (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-fg" htmlFor="p-password">
                    {t`Sign-in password`}
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
                  <label className="text-sm font-medium text-fg" htmlFor="p-password-2">
                    {t`Confirm password`}
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
              </>
            ) : null}
            {formError ? <p className="text-sm text-harvest-500">{formError}</p> : null}
            <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-2">
              <Button type="button" variant="outline" onClick={closeModal} disabled={saving}>
                {t`Cancel`}
              </Button>
              <Button
                type="submit"
                disabled={
                  saving ||
                  (modalMode.type === 'edit' && Boolean(modalMode.person.auth_user_id) && editEmailLoading)
                }
              >
                {saving ? t`Saving…` : t`Save`}
              </Button>
            </div>
          </form>
        ) : null}
      </dialog>
      <dialog
        ref={resetPwdRef}
        className="fixed left-1/2 top-1/2 w-[min(100%-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface-0 p-0 backdrop:bg-[rgba(12,18,16,0.55)]"
        aria-labelledby={resetPwdTitleId}
        aria-describedby={resetPwdDescId}
        onClose={() => {
          setResetPwdFor(null)
        }}
      >
        {resetPwdFor ? (
          <form onSubmit={onSubmitCrewReset} className="flex flex-col gap-4 p-4">
            <h2 id={resetPwdTitleId} className="text-lg font-semibold text-fg">
              {t`Set password`}
            </h2>
            <p id={resetPwdDescId} className="text-sm text-fg-secondary">
              {t`Set a new sign-in password. They keep the same device e-mail; tell them the new password in person or by phone.`}
            </p>
            <p className="text-sm font-medium text-fg">{resetPwdFor.full_name}</p>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-fg" htmlFor="cpw1">
                {t`New password`}
              </label>
              <input
                id="cpw1"
                type="password"
                autoComplete="new-password"
                className={formFieldClassName}
                value={crewNewPw}
                onChange={(e) => setCrewNewPw(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-fg" htmlFor="cpw2">
                {t`Confirm new password`}
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
            <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-2">
              <Button type="button" variant="outline" onClick={closeResetPwd} disabled={saving}>
                {t`Cancel`}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? t`Saving…` : t`Save`}
              </Button>
            </div>
          </form>
        ) : null}
      </dialog>
    </div>
  )
}
