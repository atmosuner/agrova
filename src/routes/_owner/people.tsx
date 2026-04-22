import { msg, t } from '@lingui/macro'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { createTeamPersonWithAuth } from '@/features/people/create-team-person'
import { buildSetupPageUrl, generateUrlSafeToken32 } from '@/features/people/generate-setup-token'
import { mapPeopleMutationError } from '@/features/people/map-people-mutation-error'
import { downloadPeopleCsv } from '@/features/people/csv'
import { teamPersonFormSchema, type TeamPersonFormValues } from '@/features/people/validation'
import { formFieldClassName } from '@/lib/form-field-class'
import { i18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/db'

type Person = Tables<'people'>

const emptyCrewForm: TeamPersonFormValues = {
  fullName: '',
  phone: '',
  role: 'WORKER',
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
  const [form, setForm] = useState<TeamPersonFormValues>(emptyCrewForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [setupCopyMsg, setSetupCopyMsg] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descId = useId()

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
    })
    setFormError(null)
    setModalMode({ type: 'edit', person: p })
    requestAnimationFrame(() => dialogRef.current?.showModal())
  }

  function closeModal() {
    dialogRef.current?.close()
    setModalMode(null)
  }

  async function onSubmitCrew(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    const parsed = teamPersonFormSchema.safeParse(form)
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? t`Formu kontrol edin.`)
      return
    }
    setSaving(true)
    if (modalMode?.type === 'add') {
      const created = await createTeamPersonWithAuth(parsed.data)
      setSaving(false)
      if (!created.ok) {
        setFormError(created.message)
        return
      }
      try {
        await navigator.clipboard.writeText(created.value.setupUrl)
        setSetupCopyMsg(t`Cihaz kurulum linki panoya kopyalandı. Çalışan telefonda açın.`)
      } catch {
        setLoadError(created.value.setupUrl)
      }
      closeModal()
      await load()
      return
    } else if (modalMode?.type === 'edit') {
      const { error } = await supabase
        .from('people')
        .update({
          full_name: parsed.data.fullName,
          phone: parsed.data.phone,
          role: parsed.data.role,
        })
        .eq('id', modalMode.person.id)
      setSaving(false)
      if (error) {
        setFormError(mapPeopleMutationError(error.message, error.code))
        return
      }
    } else {
      setSaving(false)
      return
    }
    closeModal()
    await load()
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

  async function createSetupLink(p: Person) {
    if (p.role === 'OWNER' || !p.active) {
      return
    }
    setSaving(true)
    setSetupCopyMsg(null)
    const token = generateUrlSafeToken32()
    const t0 = new Date()
    const expires = new Date(t0.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const { error } = await supabase
      .from('people')
      .update({ setup_token: token, setup_token_expires_at: expires })
      .eq('id', p.id)
    setSaving(false)
    if (error) {
      setLoadError(error.message)
      return
    }
    const url = buildSetupPageUrl(token)
    try {
      await navigator.clipboard.writeText(url)
      setSetupCopyMsg(t`Setup link copied to clipboard.`)
    } catch {
      setLoadError(url)
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
            {t`Crew and roles. Adding someone creates their PWA sign-in and copies a one-time setup link; no e‑mail or password reset. Turkish mobile +90; no SMS in MVP.`}
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
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => void createSetupLink(p)}
                              disabled={saving}
                            >
                              {t`Create setup link`}
                            </Button>
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
        className="fixed left-1/2 top-1/2 w-[min(100%-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface-0 p-0 shadow-lg backdrop:bg-black/50"
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
              {t`E.164 mobile (+90 5…). Yeni ekip üyesi: hesap anında açılır, kurulum linki panoya kopyalanır. Roller: foreman, agronomist, worker.`}
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
                    role: e.target.value as TeamPersonFormValues['role'],
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
            {formError ? <p className="text-sm text-harvest-500">{formError}</p> : null}
            <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-2">
              <Button type="button" variant="outline" onClick={closeModal} disabled={saving}>
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
