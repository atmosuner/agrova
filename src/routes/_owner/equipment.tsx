import { msg, t } from '@lingui/macro'
import { clsx } from 'clsx'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { downloadEquipmentCsv } from '@/features/equipment/csv'
import { EquipmentUsageSheet } from '@/features/equipment/EquipmentUsageSheet'
import {
  equipmentFormSchema,
  parseEquipmentSearch,
  type EquipmentCategory,
  type EquipmentFormValues,
} from '@/features/equipment/validation'
import { formFieldClassName } from '@/lib/form-field-class'
import { i18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import type { Enums, Tables } from '@/types/db'

type Category = Enums<'equipment_category'>
type Row = Tables<'equipment'>

/* eslint-disable lingui/no-unlocalized-strings -- DB enum + msg keys */
const TABS: { cat: EquipmentCategory; label: ReturnType<typeof msg> }[] = [
  { cat: 'VEHICLE', label: msg`Vehicles` },
  { cat: 'TOOL', label: msg`Tools` },
  { cat: 'CHEMICAL', label: msg`Chemicals` },
  { cat: 'CRATE', label: msg`Crates` },
]
/* eslint-enable lingui/no-unlocalized-strings */

const emptyForm = (): EquipmentFormValues => ({
  name: '',
  notes: '',
})

/* eslint-disable lingui/no-unlocalized-strings -- shadcn & HTML tokens, not copy */
const b = { sm: 'sm', out: 'outline', btn: 'button', def: 'default', sub: 'submit' } as const
/* eslint-enable lingui/no-unlocalized-strings */

export const Route = createFileRoute('/_owner/equipment')({
  validateSearch: (search) => parseEquipmentSearch(search as Record<string, unknown>),
  component: EquipmentPage,
})

function EquipmentPage() {
  const { cat: catFromUrl } = Route.useSearch()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [modal, setModal] = useState<null | { type: 'add' } | { type: 'edit'; row: Row }>(null)
  const [usageFor, setUsageFor] = useState<Row | null>(null)
  const [form, setForm] = useState<EquipmentFormValues>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descId = useId()
  const cat: Category = catFromUrl

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    /* eslint-disable lingui/no-unlocalized-strings -- PostgREST */
    let q = supabase.from('equipment').select('*').eq('category', cat).order('name', { ascending: true })
    if (!showArchived) {
      q = q.eq('active', true)
    }
    /* eslint-enable lingui/no-unlocalized-strings */
    const { data, error } = await q
    setLoading(false)
    if (error) {
      setErr(error.message)
      return
    }
    setRows(data ?? [])
  }, [cat, showArchived])

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      void load()
    })
    return () => cancelAnimationFrame(raf)
  }, [load])

  const isModalOpen = modal != null

  useEffect(() => {
    if (!isModalOpen) {
      return
    }
    const d = dialogRef.current
    if (!d?.open) {
      return
    }
    const onClose = () => setModal(null)
    /* eslint-disable-next-line lingui/no-unlocalized-strings -- DOM event */
    d.addEventListener('close', onClose, { once: true })
    /* eslint-disable-next-line lingui/no-unlocalized-strings -- DOM event */
    return () => d.removeEventListener('close', onClose)
  }, [isModalOpen])

  function openAdd() {
    setForm(emptyForm())
    setFormError(null)
    setModal({ type: 'add' })
    requestAnimationFrame(() => dialogRef.current?.showModal())
  }

  function openEdit(r: Row) {
    setForm({
      name: r.name,
      notes: r.notes ?? '',
    })
    setFormError(null)
    setModal({ type: 'edit', row: r })
    requestAnimationFrame(() => dialogRef.current?.showModal())
  }

  function closeModal() {
    dialogRef.current?.close()
    setModal(null)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    const parsed = equipmentFormSchema.safeParse(form)
    if (!parsed.success) {
      setFormError(i18n._(msg`Formu kontrol edin.`))
      return
    }
    setSaving(true)
    if (modal?.type === 'add') {
      /* eslint-disable lingui/no-unlocalized-strings -- PostgREST */
      const { error } = await supabase.from('equipment').insert({
        name: parsed.data.name,
        notes: parsed.data.notes.trim() || null,
        category: cat,
        active: true,
      })
      /* eslint-enable lingui/no-unlocalized-strings */
      setSaving(false)
      if (error) {
        setFormError(error.message)
        return
      }
    } else if (modal?.type === 'edit') {
      /* eslint-disable lingui/no-unlocalized-strings -- PostgREST */
      const { error } = await supabase
        .from('equipment')
        .update({
          name: parsed.data.name,
          notes: parsed.data.notes.trim() || null,
        })
        .eq('id', modal.row.id)
      /* eslint-enable lingui/no-unlocalized-strings */
      setSaving(false)
      if (error) {
        setFormError(error.message)
        return
      }
    } else {
      setSaving(false)
      return
    }
    closeModal()
    await load()
  }

  async function exportAllEquipment() {
    setErr(null)
    /* eslint-disable lingui/no-unlocalized-strings -- PostgREST */
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true })
    /* eslint-enable lingui/no-unlocalized-strings */
    if (error) {
      setErr(error.message)
      return
    }
    downloadEquipmentCsv(data ?? [])
  }

  async function archiveRow(r: Row) {
    if (!window.confirm(i18n._(msg`Archive this item?`))) {
      return
    }
    setSaving(true)
    /* eslint-disable lingui/no-unlocalized-strings -- PostgREST */
    const { error } = await supabase.from('equipment').update({ active: false }).eq('id', r.id)
    /* eslint-enable lingui/no-unlocalized-strings */
    setSaving(false)
    if (error) {
      setErr(error.message)
      return
    }
    await load()
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-fg">{t`Equipment`}</h1>
      <p className="mt-1 text-fg-secondary">{t`Vehicles, tools, chemicals, and crates.`}</p>

      <div className="mt-4 flex flex-wrap gap-1 border-b border-orchard-200 pb-2">
        {TABS.map((tab) => (
          <Link
            key={tab.cat}
            to="/equipment"
            search={{ cat: tab.cat } as { cat: Category }}
            className={clsx(
              'rounded-t px-3 py-2 text-sm font-medium',
              tab.cat === cat
                ? 'bg-orchard-100 text-fg'
                : 'text-fg-secondary hover:bg-orchard-50/80'
            )}
          >
            {i18n._(tab.label)}
          </Link>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button type={b.btn} onClick={() => void exportAllEquipment()} disabled={saving || loading} variant={b.out}>
          {t`Download CSV`}
        </Button>
        <Button type={b.btn} onClick={openAdd} disabled={saving || loading} variant={b.def}>
          {t`Add`}
        </Button>
        <label className="inline-flex items-center gap-2 text-sm text-fg-secondary">
          <input
            type="checkbox"
            className="rounded border-orchard-200"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          {t`Show archived`}
        </label>
      </div>
      {err ? <p className="mt-2 text-sm text-harvest-600">{err}</p> : null}
      {loading ? <p className="mt-2 text-sm text-fg-secondary">{t`Loading…`}</p> : null}

      <ul className="mt-3 divide-y divide-orchard-100">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm">
            <button
              type="button"
              className="min-w-0 flex-1 cursor-pointer rounded text-left"
              onClick={() => setUsageFor(r)}
            >
              <span className="font-medium text-fg">{r.name}</span>
              {r.notes ? <p className="text-fg-secondary">{r.notes}</p> : null}
              {showArchived && !r.active ? (
                <span className="text-xs text-fg-secondary">{t`archived`}</span>
              ) : null}
            </button>
            <span className="inline-flex flex-wrap justify-end gap-2">
              {r.active ? (
                <>
                  <Button
                    type={b.btn}
                    size={b.sm}
                    variant={b.out}
                    onClick={() => openEdit(r)}
                    disabled={saving}
                  >
                    {t`Edit`}
                  </Button>
                  <Button
                    type={b.btn}
                    size={b.sm}
                    variant={b.out}
                    onClick={() => void archiveRow(r)}
                    disabled={saving}
                  >
                    {t`Archive`}
                  </Button>
                </>
              ) : null}
            </span>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        className="max-w-md rounded-md border border-border bg-surface-0 p-0 shadow-lg backdrop:bg-black/20"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onKeyDown={(e) => (e.key === 'Escape' ? closeModal() : null)}
        onClick={(e) => (e.target === e.currentTarget ? closeModal() : null)}
      >
        <form
          onSubmit={(e) => void onSubmit(e)}
          className="space-y-3 p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 id={titleId} className="text-lg font-semibold text-fg">
            {modal?.type === 'add' ? t`New equipment` : t`Edit equipment`}
          </h2>
          <p id={descId} className="text-sm text-fg-secondary">
            {i18n._((TABS.find((x) => x.cat === cat) ?? TABS[0]!).label)}
          </p>
          <label className="block text-sm text-fg">
            {t`Name`} *
            <input
              className={clsx(formFieldClassName, 'mt-0.5')}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </label>
          <label className="block text-sm text-fg">
            {t`Notes`}
            <textarea
              className={clsx(formFieldClassName, 'mt-0.5 min-h-[3rem]')}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </label>
          {formError ? <p className="text-sm text-harvest-600">{formError}</p> : null}
          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <Button type={b.btn} variant={b.out} onClick={closeModal} disabled={saving}>
              {t`Cancel`}
            </Button>
            <Button type={b.sub} disabled={saving}>
              {t`Save`}
            </Button>
          </div>
        </form>
      </dialog>
      {usageFor ? <EquipmentUsageSheet equipment={usageFor} onClose={() => setUsageFor(null)} /> : null}
    </div>
  )
}
