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
  { cat: 'VEHICLE', label: msg`Araçlar` },
  { cat: 'TOOL', label: msg`Aletler` },
  { cat: 'CHEMICAL', label: msg`Kimyasallar` },
  { cat: 'CRATE', label: msg`Kasalar` },
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
    if (!window.confirm(i18n._(msg`Bu öğeyi arşivlemek istediğinize emin misiniz?`))) {
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
      <h1 className="text-2xl font-semibold tracking-tight text-fg">{t`Ekipman`}</h1>
      <p className="mt-1 text-fg-secondary">{t`Araçlar, aletler, kimyasallar ve kasalar.`}</p>

      <div className="mt-4 flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <Link
            key={tab.cat}
            to="/equipment"
            search={{ cat: tab.cat } as { cat: Category }}
            className={clsx(
              'px-3 py-2 text-[13px] font-medium transition-colors',
              tab.cat === cat
                ? 'border-b-2 border-orchard-500 text-fg'
                : 'text-fg-muted hover:text-fg',
            )}
          >
            {i18n._(tab.label)}
          </Link>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button type={b.btn} onClick={() => void exportAllEquipment()} disabled={saving || loading} variant={b.out}>
          {t`CSV indir`}
        </Button>
        <Button type={b.btn} onClick={openAdd} disabled={saving || loading} variant={b.def}>
          {t`Ekle`}
        </Button>
        <label className="inline-flex items-center gap-2 text-sm text-fg-secondary">
          <input
            type="checkbox"
            className="rounded border-border"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          {t`Arşivlenenleri göster`}
        </label>
      </div>
      {err ? <p className="mt-2 text-sm text-harvest-600">{err}</p> : null}
      {loading ? <p className="mt-2 text-sm text-fg-secondary">{t`Yükleniyor…`}</p> : null}

      <ul className="mt-3 divide-y divide-border">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5 text-sm">
            <button
              type="button"
              className="min-w-0 flex-1 cursor-pointer rounded text-left"
              onClick={() => setUsageFor(r)}
            >
              <span className="font-medium text-fg">{r.name}</span>
              {r.notes ? <p className="text-[12px] text-fg-muted">{r.notes}</p> : null}
              {showArchived && !r.active ? (
                <span className="text-[11px] text-fg-muted">{t`arşivlenmiş`}</span>
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
                    {t`Düzenle`}
                  </Button>
                  <Button
                    type={b.btn}
                    size={b.sm}
                    variant={b.out}
                    onClick={() => void archiveRow(r)}
                    disabled={saving}
                  >
                    {t`Arşivle`}
                  </Button>
                </>
              ) : null}
            </span>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        className="m-auto max-w-md rounded-2xl border border-border bg-surface-0 p-0 backdrop:bg-[rgba(12,18,16,0.55)]"
        aria-labelledby={titleId}
        aria-describedby={descId}
        aria-modal="true"
        onKeyDown={(e) => (e.key === 'Escape' ? closeModal() : null)}
        onClick={(e) => (e.target === e.currentTarget ? closeModal() : null)}
      >
        <form
          onSubmit={(e) => void onSubmit(e)}
          className="space-y-3 p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 id={titleId} className="text-[18px] font-semibold text-fg">
            {modal?.type === 'add' ? t`Yeni ekipman` : t`Ekipmanı düzenle`}
          </h2>
          <p id={descId} className="text-[13px] text-fg-secondary">
            {i18n._((TABS.find((x) => x.cat === cat) ?? TABS[0]!).label)}
          </p>
          <label className="block text-[12px] font-medium text-fg-muted">
            {t`Ad`} *
            <input
              className={clsx(formFieldClassName, 'mt-0.5')}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </label>
          <label className="block text-[12px] font-medium text-fg-muted">
            {t`Notlar`}
            <textarea
              className={clsx(formFieldClassName, 'mt-0.5 min-h-[3rem]')}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </label>
          {formError ? <p className="text-sm text-harvest-600">{formError}</p> : null}
          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <Button type={b.btn} variant={b.out} onClick={closeModal} disabled={saving}>
              {t`İptal`}
            </Button>
            <Button type={b.sub} disabled={saving}>
              {t`Kaydet`}
            </Button>
          </div>
        </form>
      </dialog>
      {usageFor ? <EquipmentUsageSheet equipment={usageFor} onClose={() => setUsageFor(null)} /> : null}
    </div>
  )
}
